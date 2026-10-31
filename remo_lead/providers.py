"""Optional network adapters. Fixed HTTPS provider hosts, bounded bodies/timeouts.

Search never turns a snippet into a verified company or a guessed email.
Gmail sending is opt-in; any ambiguous send outcome stays UNKNOWN, never retried.
"""
import base64
import json
import os
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta
from email.message import EmailMessage
from email.policy import SMTP

from .core import UTC, clean_email, now

MAX_BYTES = 2_000_000


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def api(method, url, token, payload=None, brave=False):
    expected = "api.search.brave.com" if brave else "gmail.googleapis.com"
    p = urllib.parse.urlsplit(url)
    if p.scheme != "https" or p.hostname != expected or p.port not in (None, 443):
        raise ValueError("Unexpected provider endpoint")
    if not token or any(x in token for x in "\r\n"):
        raise ValueError("Required runtime credential missing or invalid")
    headers = {"Accept": "application/json"}
    headers["X-Subscription-Token" if brave else "Authorization"] = token if brave else "Bearer " + token
    data = None
    if payload is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    opener = urllib.request.build_opener(NoRedirect())
    try:
        with opener.open(req, timeout=15) as response:
            raw = response.read(MAX_BYTES + 1)
        if len(raw) > MAX_BYTES:
            raise ValueError("Provider response too large")
        return json.loads(raw)
    except urllib.error.HTTPError as exc:
        # Never print a request, authorization header or provider response body.
        raise RuntimeError(f"Provider HTTP {exc.code}") from None
    except (urllib.error.URLError, TimeoutError, OSError):
        raise RuntimeError("Provider network error") from None


def discover(store, cfg, request=api):
    token = os.environ.get("BRAVE_SEARCH_API_KEY", "")
    if not token:
        raise ValueError("BRAVE_SEARCH_API_KEY is not configured")
    queries = [q for q in store.plan(cfg) if q["due"]][:cfg["max_search_requests"]]
    results = []
    for q in queries:
        # Reserve a query atomically before a request, including zero-result queries.
        store.db.execute("BEGIN IMMEDIATE")
        eligible = store.rows("SELECT id FROM queries WHERE id=? AND (next_at IS NULL OR next_at<=?)", (q["id"], now()))
        if not eligible:
            store.db.execute("COMMIT")
            continue
        store.db.execute("UPDATE queries SET attempts=attempts+1,next_at=? WHERE id=?", ((datetime.now(UTC) + timedelta(hours=24)).isoformat(), q["id"]))
        store.db.execute("COMMIT")
        try:
            url = "https://api.search.brave.com/res/v1/web/search?" + urllib.parse.urlencode({"q": q["query"], "count": 20})
            response = request("GET", url, token, brave=True)
            items = response.get("web", {}).get("results", [])[:cfg["max_jobs"]]
            added = 0
            from .core import domain
            for r in items:
                try:
                    domain(r["url"])
                except (KeyError, ValueError, UnicodeError):
                    continue
                cursor = store.db.execute("INSERT OR IGNORE INTO candidates(query_id,url,title,excerpt,observed_at) VALUES(?,?,?,?,?)", (q["id"], r["url"], r.get("title", "")[:500], r.get("description", "")[:4000], now()))
                added += cursor.rowcount
            store.db.execute("UPDATE queries SET failures=0 WHERE id=?", (q["id"],))
            store.audit("discover", {"query_id": q["id"], "added": added})
            results.append({"query_id": q["id"], "added": added})
        except Exception:
            failure = q["failures"] + 1
            store.db.execute("UPDATE queries SET failures=?,next_at=? WHERE id=?", (failure, (datetime.now(UTC) + timedelta(minutes=min(360, 5 * 2 ** min(failure - 1, 7)))).isoformat(), q["id"]))
            store.audit("search_failed", {"query_id": q["id"], "failure_count": failure})
            results.append({"query_id": q["id"], "error": "search_failed; check provider access and credentials"})
    return results


def dispatch(store, cfg, draft_id, live=False, request=api):
    checks = store.blockers(draft_id, cfg)
    if not live:
        return {"mode": "dry_run", "draft_id": draft_id, "blockers": checks, "sent": False}
    if cfg.get("live_enabled") is not True:
        raise ValueError("live_enabled must explicitly be true")
    if checks:
        return {"mode": "live", "draft_id": draft_id, "blockers": checks, "sent": False}
    token = os.environ.get("GMAIL_ACCESS_TOKEN", "")
    if not token:
        raise ValueError("GMAIL_ACCESS_TOKEN is not configured")
    profile = request("GET", "https://gmail.googleapis.com/gmail/v1/users/me/profile", token)
    if clean_email(profile.get("emailAddress", "")) != clean_email(cfg["sender_email"]):
        raise ValueError("Authenticated Gmail identity does not match sender_email; aliases unsupported")
    d = store.one("SELECT * FROM drafts WHERE id=?", (draft_id,))
    snap = json.loads(d["snapshot"])
    from email.headerregistry import Address
    message = EmailMessage(policy=SMTP)
    message["From"] = Address(display_name=snap["sender_name"], addr_spec=snap["from"])
    message["To"] = snap["to"]
    message["Subject"] = snap["subject"]
    message["Message-ID"] = f"<remo-{d['sha256']}@{snap['from'].split('@')[1]}>"
    message.set_content(snap["body"])
    payload = {"raw": base64.urlsafe_b64encode(message.as_bytes()).decode()}
    # Only one worker can reserve the recipient. Recheck all guards under this lock.
    store.db.execute("BEGIN IMMEDIATE")
    try:
        checks = store.blockers(draft_id, cfg)
        if checks:
            store.db.execute("ROLLBACK")
            return {"mode": "live", "blockers": checks, "sent": False}
        store.db.execute("INSERT INTO deliveries(draft_id,campaign,recipient,state,created_at) VALUES(?,?,?,?,?)", (draft_id, cfg["campaign"], snap["to"], "SENDING", now()))
        store.audit("send_reserved", {"draft_id": draft_id, "sha256": d["sha256"]})
        store.db.execute("COMMIT")
    except Exception:
        if store.db.in_transaction:
            store.db.execute("ROLLBACK")
        raise
    try:
        response = request("POST", "https://gmail.googleapis.com/gmail/v1/users/me/messages/send", token, payload)
        if not response.get("id"):
            raise ValueError("Missing provider receipt")
        store.db.execute("UPDATE deliveries SET state='ACCEPTED',provider_id=?,thread_id=? WHERE draft_id=?", (response["id"], response.get("threadId"), draft_id))
        store.db.execute("UPDATE opportunities SET status='CONTACTED' WHERE id=?", (d["opportunity_id"],))
        store.audit("send_accepted", {"draft_id": draft_id, "provider_id": response["id"]})
        return {"state": "ACCEPTED", "provider_id": response["id"], "sent": True}
    except Exception:
        store.db.execute("UPDATE deliveries SET state='UNKNOWN' WHERE draft_id=?", (draft_id,))
        store.audit("send_unknown", {"draft_id": draft_id})
        return {"state": "UNKNOWN", "sent": False, "action": "Inspect Gmail Sent using stable Message-ID. Do not retry."}

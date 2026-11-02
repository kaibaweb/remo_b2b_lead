"""Persistent, bounded harness. All external text is data, never instructions."""
from __future__ import annotations

import csv
import hashlib
import html
import ipaddress
import json
import re
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlsplit

UTC = timezone.utc
EMAIL = re.compile(r"[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+\Z")
OUTCOMES = {"positive", "meeting", "rfq", "not_now", "negative", "unsubscribe", "bounce"}


def now():
    return datetime.now(UTC).isoformat()


def stamp(value):
    result = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if result.tzinfo is None:
        raise ValueError("Timezone required")
    return result.astimezone(UTC)


def digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True).encode()).hexdigest()


def domain(url):
    p = urlsplit(url)
    if p.scheme != "https" or not p.hostname or p.username or p.password or p.port not in (None, 443):
        raise ValueError("A public HTTPS URL without credentials is required")
    host = p.hostname.lower().encode("idna").decode("ascii").removeprefix("www.")
    if "." not in host or host.endswith((".local", ".localhost", ".internal", ".test")):
        raise ValueError("Public hostname required")
    try:
        address = ipaddress.ip_address(host)
    except ValueError:
        address = None
    if address is not None and not address.is_global:
        raise ValueError("Private addresses are not allowed")
    return host


def clean_email(value):
    value = value.strip().lower()
    if not EMAIL.fullmatch(value) or "\r" in value or "\n" in value:
        raise ValueError("Invalid email")
    return value


def load_config(path):
    cfg = json.loads(Path(path).read_text(encoding="utf-8-sig"))
    for key, maximum in (("max_jobs", 100), ("max_search_requests", 20), ("max_daily_sends", 100), ("evidence_max_days", 90)):
        if type(cfg.get(key)) is not int or not 1 <= cfg[key] <= maximum:
            raise ValueError(f"{key} must be between 1 and {maximum}")
    if type(cfg.get("min_score")) is not int or not 0 <= cfg["min_score"] <= 100:
        raise ValueError("Invalid min_score")
    if not cfg.get("campaign") or not cfg.get("tracks"):
        raise ValueError("campaign and tracks required")
    for key in ("sender_name", "sender_email", "sender_address"):
        if any(c in cfg.get(key, "") for c in "\r\n"):
            raise ValueError(f"Invalid {key}")
    return cfg


SCHEMA = """
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS companies (
 id INTEGER PRIMARY KEY, domain TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
 website TEXT NOT NULL, country TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS evidence (
 id INTEGER PRIMARY KEY, company_id INTEGER REFERENCES companies(id), url TEXT NOT NULL,
 excerpt TEXT NOT NULL, observed_at TEXT NOT NULL, sha256 TEXT NOT NULL,
 verified_by TEXT NOT NULL DEFAULT '', UNIQUE(company_id,url,sha256));
CREATE TABLE IF NOT EXISTS contacts (
 id INTEGER PRIMARY KEY, company_id INTEGER REFERENCES companies(id), email TEXT UNIQUE NOT NULL,
 source_url TEXT NOT NULL, verified_by TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS opportunities (
 id INTEGER PRIMARY KEY, company_id INTEGER REFERENCES companies(id), track TEXT NOT NULL,
 campaign TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'DISCOVERED', score INTEGER NOT NULL DEFAULT 0,
 reasons TEXT NOT NULL DEFAULT '[]', UNIQUE(company_id,track,campaign));
CREATE TABLE IF NOT EXISTS queries (
 id INTEGER PRIMARY KEY, campaign TEXT NOT NULL, track TEXT NOT NULL, query TEXT NOT NULL,
 attempts INTEGER NOT NULL DEFAULT 0, failures INTEGER NOT NULL DEFAULT 0,
 next_at TEXT, positives INTEGER NOT NULL DEFAULT 0, negatives INTEGER NOT NULL DEFAULT 0,
 UNIQUE(campaign,track,query));
CREATE TABLE IF NOT EXISTS candidates (
 id INTEGER PRIMARY KEY, query_id INTEGER REFERENCES queries(id), url TEXT NOT NULL,
 title TEXT NOT NULL, excerpt TEXT NOT NULL, observed_at TEXT NOT NULL,
 UNIQUE(query_id,url));
CREATE TABLE IF NOT EXISTS drafts (
 id INTEGER PRIMARY KEY, opportunity_id INTEGER REFERENCES opportunities(id), contact_id INTEGER REFERENCES contacts(id),
 snapshot TEXT NOT NULL, sha256 TEXT NOT NULL, created_at TEXT NOT NULL,
 UNIQUE(opportunity_id,contact_id,sha256));
CREATE TABLE IF NOT EXISTS permissions (
 id INTEGER PRIMARY KEY, contact_id INTEGER REFERENCES contacts(id), campaign TEXT NOT NULL,
 sender_email TEXT NOT NULL, basis TEXT NOT NULL, evidence TEXT NOT NULL,
 obtained_at TEXT NOT NULL, expires_at TEXT NOT NULL, recorded_by TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS approvals (
 draft_id INTEGER PRIMARY KEY REFERENCES drafts(id), sha256 TEXT NOT NULL,
 approved_by TEXT NOT NULL, expires_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS deliveries (
 id INTEGER PRIMARY KEY, draft_id INTEGER UNIQUE REFERENCES drafts(id), campaign TEXT NOT NULL,
 recipient TEXT NOT NULL, state TEXT NOT NULL, provider_id TEXT, thread_id TEXT,
 created_at TEXT NOT NULL, UNIQUE(campaign,recipient));
CREATE TABLE IF NOT EXISTS replies (
 provider_id TEXT PRIMARY KEY, opportunity_id INTEGER REFERENCES opportunities(id),
 contact_id INTEGER REFERENCES contacts(id), outcome TEXT NOT NULL, note TEXT NOT NULL,
 received_at TEXT NOT NULL, query_id INTEGER REFERENCES queries(id));
CREATE TABLE IF NOT EXISTS suppression (email TEXT PRIMARY KEY, reason TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS audit (id INTEGER PRIMARY KEY, action TEXT NOT NULL, payload TEXT NOT NULL, created_at TEXT NOT NULL);
"""


class Store:
    def __init__(self, path):
        if str(path) != ":memory:":
            Path(path).parent.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(path, isolation_level=None, timeout=10)
        self.db.row_factory = sqlite3.Row
        self.db.executescript(SCHEMA)
        self.db.execute("PRAGMA busy_timeout=10000")

    def rows(self, sql, args=()):
        return [dict(r) for r in self.db.execute(sql, args)]

    def one(self, sql, args=()):
        rows = self.rows(sql, args)
        if not rows:
            raise ValueError("Record not found")
        return rows[0]

    def audit(self, action, payload):
        self.db.execute("INSERT INTO audit(action,payload,created_at) VALUES(?,?,?)", (action, json.dumps(payload, ensure_ascii=False), now()))

    def import_records(self, records, cfg):
        if not isinstance(records, list) or len(records) > cfg["max_jobs"]:
            raise ValueError("Import must be a JSON array within max_jobs; split larger files")
        self.db.execute("BEGIN IMMEDIATE")
        try:
            ids = []
            for r in records:
                host = domain(r["website"])
                if not r.get("company", "").strip():
                    raise ValueError("Company name required")
                self.db.execute("INSERT OR IGNORE INTO companies(domain,name,website,country,created_at) VALUES(?,?,?,?,?)", (host, r["company"].strip(), r["website"], r.get("country", "unknown"), now()))
                cid = self.one("SELECT id FROM companies WHERE domain=?", (host,))["id"]
                ids.append(cid)
                if len(r.get("evidence", [])) > 10 or len(r.get("contacts", [])) > 5:
                    raise ValueError("Per company: at most 10 evidence records and 5 contacts")
                for e in r.get("evidence", []):
                    domain(e["url"])
                    observed = stamp(e["observed_at"])
                    if observed > datetime.now(UTC) + timedelta(minutes=5) or not e["excerpt"].strip():
                        raise ValueError("Evidence must have a nonempty excerpt and nonfuture timestamp")
                    # Imports are unverified, regardless of a source-supplied verified_by field.
                    self.db.execute("INSERT INTO evidence(company_id,url,excerpt,observed_at,sha256) VALUES(?,?,?,?,?) ON CONFLICT(company_id,url,sha256) DO UPDATE SET observed_at=excluded.observed_at,verified_by='' WHERE excluded.observed_at>evidence.observed_at", (cid, e["url"], e["excerpt"][:8000], observed.isoformat(), digest(e["excerpt"][:8000])))
                for c in r.get("contacts", []):
                    email = clean_email(c["email"])
                    domain(c["source_url"])
                    existing = self.rows("SELECT company_id FROM contacts WHERE email=?", (email,))
                    if existing and existing[0]["company_id"] != cid:
                        raise ValueError("Contact already belongs to another company; review manually")
                    self.db.execute("INSERT OR IGNORE INTO contacts(company_id,email,source_url) VALUES(?,?,?)", (cid, email, c["source_url"]))
                for track in r.get("tracks", cfg["tracks"].keys()):
                    if track not in cfg["tracks"]:
                        raise ValueError(f"Unknown track: {track}")
                    self.db.execute("INSERT OR IGNORE INTO opportunities(company_id,track,campaign) VALUES(?,?,?)", (cid, track, cfg["campaign"]))
            self.audit("import", {"records": len(records), "company_ids": ids})
            self.db.execute("COMMIT")
            return ids
        except Exception:
            self.db.execute("ROLLBACK")
            raise

    def verify(self, kind, record_id, operator):
        if not operator.strip() or kind not in ("evidence", "contacts"):
            raise ValueError("Trusted reviewer and evidence/contacts kind required")
        row = self.one(f"SELECT * FROM {kind} WHERE id=?", (record_id,))
        if kind == "contacts":
            evidence = self.rows("SELECT id FROM evidence WHERE company_id=? AND url=? AND verified_by<>''", (row["company_id"], row["source_url"]))
            if not evidence:
                raise ValueError("Verify the exact contact source evidence first")
        self.db.execute(f"UPDATE {kind} SET verified_by=? WHERE id=?", (operator, record_id))
        self.audit("verify", {"kind": kind, "id": record_id, "operator": operator})

    def evidence_for(self, company_id, cfg):
        cutoff = datetime.now(UTC) - timedelta(days=cfg["evidence_max_days"])
        return [e for e in self.rows("SELECT * FROM evidence WHERE company_id=? AND verified_by<>'' ORDER BY id", (company_id,)) if cutoff <= stamp(e["observed_at"]) <= datetime.now(UTC) + timedelta(minutes=5)]

    def rank(self, cfg):
        results = []
        for o in self.rows("SELECT * FROM opportunities WHERE campaign=?", (cfg["campaign"],)):
            e = self.evidence_for(o["company_id"], cfg)
            text = " ".join(x["excerpt"].lower() for x in e)
            terms = [t for t in cfg["tracks"][o["track"]]["terms"] if t.lower() in text]
            reasons = [f"verified evidence: {len(e)}", "matched terms: " + ", ".join(terms)]
            score = min(100, (30 + min(40, len(terms) * 20) + min(20, len(e) * 10)) if terms else 0)
            stage = "QUALIFIED" if score >= cfg["min_score"] and e and terms else "DISCOVERED"
            # Never move downstream opportunities backwards during reranking.
            if o["status"] not in ("DISCOVERED", "QUALIFIED"):
                stage = o["status"]
            self.db.execute("UPDATE opportunities SET score=?,reasons=?,status=? WHERE id=?", (score, json.dumps(reasons, ensure_ascii=False), stage, o["id"]))
            results.append({"id": o["id"], "track": o["track"], "score": score, "status": stage, "reasons": reasons})
        return results

    def fingerprint(self, o, c, cfg):
        return digest({"evidence": self.evidence_for(o["company_id"], cfg), "contact": c,
                       "sender": {k: cfg.get(k, "") for k in ("sender_email", "sender_name", "sender_address", "landing_url", "wechat_id")},
                       "track": cfg["tracks"][o["track"]], "campaign": cfg["campaign"]})

    def draft(self, opportunity_id, contact_id, cfg):
        self.rank(cfg)
        o = self.one("SELECT * FROM opportunities WHERE id=? AND campaign=?", (opportunity_id, cfg["campaign"]))
        c = self.one("SELECT * FROM contacts WHERE id=? AND company_id=?", (contact_id, o["company_id"]))
        if o["score"] < cfg["min_score"] or not c["verified_by"]:
            raise ValueError("Qualified opportunity and verified contact required")
        ev = self.evidence_for(o["company_id"], cfg)
        if not any(e["url"] == c["source_url"] and c["email"] in e["excerpt"].lower() for e in ev):
            raise ValueError("Current contact evidence must contain the exact email")
        company = self.one("SELECT * FROM companies WHERE id=?", (o["company_id"],))
        track = cfg["tracks"][o["track"]]
        subject = f"合作交流｜{track['subject_zh']}｜{company['name']}"
        body = (f"{company['name']}团队，您好：\n\n我们希望{track['offer_zh']}。\n"
                f"这是一封初步需求沟通邮件，具体范围与交付条件需要双方进一步确认。\n\n{track['cta_zh']}\n")
        if cfg.get("landing_url"):
            domain(cfg["landing_url"])
            body += f"\n合作信息：{cfg['landing_url']}\n"
        if cfg.get("wechat_id"):
            body += f"微信：{cfg['wechat_id']}\n"
        body += f"\n{cfg['sender_name']}\n{cfg['sender_email']}\n{cfg['sender_address']}\n如不希望再收到联系，请回复“退订”。\n"
        snap = {"to": c["email"], "from": cfg["sender_email"], "sender_name": cfg["sender_name"], "subject": subject,
                "body": body, "fingerprint": self.fingerprint(o, c, cfg), "evidence_urls": [x["url"] for x in ev]}
        sha = digest(snap)
        self.db.execute("INSERT OR IGNORE INTO drafts(opportunity_id,contact_id,snapshot,sha256,created_at) VALUES(?,?,?,?,?)", (o["id"], c["id"], json.dumps(snap, ensure_ascii=False), sha, now()))
        d = self.one("SELECT * FROM drafts WHERE opportunity_id=? AND contact_id=? AND sha256=?", (o["id"], c["id"], sha))
        self.audit("draft", {"id": d["id"], "sha256": sha})
        return {"id": d["id"], **snap, "sha256": sha}

    def permit(self, record, cfg):
        c = self.one("SELECT * FROM contacts WHERE id=?", (record["contact_id"],))
        if not c["verified_by"] or record["basis"] != "explicit_consent" or not record["evidence"].strip() or not record["recorded_by"].strip():
            raise ValueError("Verified contact and documented explicit consent required")
        if clean_email(record["sender_email"]) != clean_email(cfg["sender_email"]):
            raise ValueError("Consent sender mismatch")
        if not stamp(record["obtained_at"]) <= datetime.now(UTC) < stamp(record["expires_at"]):
            raise ValueError("Consent dates invalid")
        self.db.execute("INSERT INTO permissions(contact_id,campaign,sender_email,basis,evidence,obtained_at,expires_at,recorded_by) VALUES(?,?,?,?,?,?,?,?)", (c["id"], cfg["campaign"], record["sender_email"].lower(), record["basis"], record["evidence"], record["obtained_at"], record["expires_at"], record["recorded_by"]))
        self.audit("permission", {"contact_id": c["id"], "operator": record["recorded_by"]})

    def approve(self, draft_id, sha, operator, hours=24):
        d = self.one("SELECT * FROM drafts WHERE id=?", (draft_id,))
        if sha != d["sha256"] or not operator.strip() or not 1 <= hours <= 168:
            raise ValueError("Exact reviewed SHA, operator and 1..168 hours required")
        self.db.execute("INSERT OR REPLACE INTO approvals VALUES(?,?,?,?)", (draft_id, sha, operator, (datetime.now(UTC) + timedelta(hours=hours)).isoformat()))
        self.audit("approve", {"draft_id": draft_id, "sha256": sha, "operator": operator})

    def blockers(self, draft_id, cfg):
        d = self.one("SELECT * FROM drafts WHERE id=?", (draft_id,))
        o = self.one("SELECT * FROM opportunities WHERE id=?", (d["opportunity_id"],))
        c = self.one("SELECT * FROM contacts WHERE id=?", (d["contact_id"],))
        snap = json.loads(d["snapshot"])
        blocks = []
        if o["campaign"] != cfg["campaign"]:
            blocks.append("campaign_mismatch")
        if self.fingerprint(o, c, cfg) != snap["fingerprint"] or digest(snap) != d["sha256"]:
            blocks.append("snapshot_changed")
        if not cfg.get("sender_name") or not cfg.get("sender_email") or not cfg.get("sender_address"):
            blocks.append("sender_incomplete")
        if not c["verified_by"] or not self.evidence_for(o["company_id"], cfg):
            blocks.append("verification_missing_or_stale")
        if self.rows("SELECT 1 FROM suppression WHERE email=?", (c["email"],)):
            blocks.append("suppressed")
        if self.rows("SELECT 1 FROM replies WHERE contact_id=?", (c["id"],)):
            blocks.append("reply_exists")
        permissions = self.rows("SELECT * FROM permissions WHERE contact_id=? AND campaign=? AND sender_email=?", (c["id"], cfg["campaign"], cfg["sender_email"].lower()))
        if not any(stamp(x["obtained_at"]) <= datetime.now(UTC) < stamp(x["expires_at"]) for x in permissions):
            blocks.append("permission_missing_or_expired")
        a = self.rows("SELECT * FROM approvals WHERE draft_id=?", (draft_id,))
        if not a or a[0]["sha256"] != d["sha256"] or stamp(a[0]["expires_at"]) <= datetime.now(UTC):
            blocks.append("approval_missing_or_expired")
        if self.rows("SELECT 1 FROM deliveries WHERE campaign=? AND recipient=?", (cfg["campaign"], c["email"])):
            blocks.append("delivery_already_reserved")
        day = datetime.now(UTC).date().isoformat()
        count = self.one("SELECT COUNT(*) n FROM deliveries WHERE substr(created_at,1,10)=?", (day,))["n"]
        if count >= cfg["max_daily_sends"]:
            blocks.append("daily_limit")
        return blocks

    def suppress(self, email, reason):
        email = clean_email(email)
        self.db.execute("INSERT OR REPLACE INTO suppression VALUES(?,?,?)", (email, reason, now()))
        self.audit("suppress", {"email": email, "reason": reason})

    def reply(self, r, cfg):
        if r["outcome"] not in OUTCOMES or not r["provider_id"].strip():
            raise ValueError("Explicit outcome and unique provider_id required")
        o = self.one("SELECT * FROM opportunities WHERE id=? AND campaign=?", (r["opportunity_id"], cfg["campaign"]))
        c = self.one("SELECT * FROM contacts WHERE id=? AND company_id=?", (r["contact_id"], o["company_id"]))
        if clean_email(r["sender_email"]) != c["email"]:
            raise ValueError("Reply sender mismatch")
        if stamp(r["received_at"]) > datetime.now(UTC) + timedelta(minutes=5):
            raise ValueError("Reply received_at cannot be in the future")
        qid = r.get("query_id")
        if qid:
            self.one("SELECT * FROM queries WHERE id=? AND campaign=? AND track=?", (qid, cfg["campaign"], o["track"]))
        self.db.execute("BEGIN IMMEDIATE")
        try:
            existing = self.rows("SELECT * FROM replies WHERE provider_id=?", (r["provider_id"],))
            if existing:
                if existing[0]["contact_id"] != c["id"] or existing[0]["opportunity_id"] != o["id"]:
                    raise ValueError("Reply id collision")
                self.db.execute("COMMIT")
                return {"duplicate": True}
            self.db.execute("INSERT INTO replies VALUES(?,?,?,?,?,?,?)", (r["provider_id"], o["id"], c["id"], r["outcome"], r.get("note", "")[:4000], r["received_at"], qid))
            state = {"meeting": "MEETING", "rfq": "RFQ", "negative": "LOST", "bounce": "BOUNCED", "unsubscribe": "SUPPRESSED"}.get(r["outcome"], "REPLIED")
            self.db.execute("UPDATE opportunities SET status=? WHERE id=?", (state, o["id"]))
            if r["outcome"] in ("unsubscribe", "bounce", "negative"):
                self.suppress(c["email"], r["outcome"])
            if qid and r["outcome"] != "not_now":
                col = "positives" if r["outcome"] in ("positive", "meeting", "rfq") else "negatives"
                self.db.execute(f"UPDATE queries SET {col}={col}+1 WHERE id=?", (qid,))
            self.audit("reply", {"id": r["provider_id"], "outcome": r["outcome"]})
            self.db.execute("COMMIT")
            return {"status": state}
        except Exception:
            self.db.execute("ROLLBACK")
            raise

    def plan(self, cfg):
        for track, spec in cfg["tracks"].items():
            for query in spec["queries"]:
                self.db.execute("INSERT OR IGNORE INTO queries(campaign,track,query) VALUES(?,?,?)", (cfg["campaign"], track, query))
        rows = self.rows("SELECT * FROM queries WHERE campaign=?", (cfg["campaign"],))
        for q in rows:
            # Smoothed response yield plus exploration; never claims autonomous model training.
            q["priority"] = round((q["positives"] + 1) / (q["positives"] + q["negatives"] + 2) + 1 / (q["attempts"] + 1), 4)
            q["due"] = not q["next_at"] or stamp(q["next_at"]) <= datetime.now(UTC)
        return sorted(rows, key=lambda q: (-q["priority"], q["id"]))

    def report(self, cfg, output):
        tables = {name: self.rows(f"SELECT * FROM {name}") for name in ("companies", "contacts", "opportunities", "drafts", "deliveries", "replies", "candidates", "evidence")}
        tables["campaign"] = cfg["campaign"]
        tables["generated_at"] = now()
        tables["draft_checks"] = [{"draft_id": d["id"], "blockers": self.blockers(d["id"], cfg)} for d in tables["drafts"]]
        path = Path(output)
        path.mkdir(parents=True, exist_ok=True)
        (path / "report.json").write_text(json.dumps(tables, ensure_ascii=False, indent=2))
        esc = lambda x: html.escape(str(x))
        sections = []
        for name in ("companies", "opportunities", "contacts", "evidence", "candidates", "deliveries", "replies", "draft_checks"):
            rows = tables[name]
            if not rows:
                sections.append(f"<h2>{name}</h2><p>0 records</p>")
                continue
            keys = list(rows[0])
            sections.append(f"<h2>{name}</h2><div class='scroll'><table><tr>" + "".join(f"<th>{esc(k)}</th>" for k in keys) + "</tr>" + "".join("<tr>" + "".join(f"<td>{esc(r[k])}</td>" for k in keys) + "</tr>" for r in rows) + "</table></div>")
        for d in tables["drafts"]:
            s = json.loads(d["snapshot"])
            sections.append(f"<h2>Draft {d['id']} · {esc(s['to'])}</h2><p>{esc(s['subject'])}</p><pre>{esc(s['body'])}</pre><small>SHA-256 {esc(d['sha256'])}</small>")
        page = "<!doctype html><html lang='ko'><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><meta http-equiv='Content-Security-Policy' content=\"default-src 'none'; style-src 'unsafe-inline'\"><title>REMO Lead Operations</title><style>body{font:15px system-ui;background:#f3f6fa;color:#172338;max-width:1200px;margin:40px auto;padding:0 20px}h1{font-size:34px}h2{margin-top:38px}table{border-collapse:collapse;background:white;width:100%}th,td{padding:12px;text-align:left;border-bottom:1px solid #dde3eb;vertical-align:top;max-width:380px;overflow-wrap:anywhere}th{background:#153c53;color:white}pre{white-space:pre-wrap;background:white;padding:24px;border-radius:10px}.scroll{overflow:auto}small{overflow-wrap:anywhere}</style><h1>REMO · China B2B Lead Operations</h1><p>" + esc(cfg["campaign"]) + " · " + esc(tables["generated_at"]) + "</p><p>검색 후보 / 검증 리드 / 초안 / 실제 발송·회신은 별도 집계됩니다. ACCEPTED는 Gmail 접수이며 도착·열람·구매를 뜻하지 않습니다.</p>" + "".join(sections) + "</html>"
        (path / "report.html").write_text(page)
        with (path / "opportunities.csv").open("w", newline="", encoding="utf-8-sig") as f:
            keys = ["id", "company_id", "track", "campaign", "status", "score", "reasons"]
            w = csv.DictWriter(f, fieldnames=keys)
            w.writeheader()
            # Prevent spreadsheet formula execution in exported cells.
            for row in tables["opportunities"]:
                w.writerow({k: ("'" + str(v) if str(v).startswith(("=", "+", "-", "@")) else v) for k, v in row.items()})
        return {"report": str(path / "report.html"), "counts": {k: len(v) for k, v in tables.items() if isinstance(v, list)}}

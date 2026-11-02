import argparse
import json
import os
import sys
from pathlib import Path

from .core import Store, load_config, now
from .providers import discover, dispatch


def read_json(path):
    p = Path(path)
    if p.stat().st_size > 2_000_000:
        raise ValueError("Input must be at most 2 MB")
    return json.loads(p.read_text(encoding="utf-8-sig"))


def demo(cfg):
    # Isolated fixture store, not the configured operational database.
    s = Store(":memory:")
    cfg = {**cfg, "sender_email": "operator@example.org", "sender_address": "DEMO ADDRESS", "live_enabled": False}
    fixture = [{"company": "DEMO Robotics · fictitious", "website": "https://demo.example.org", "country": "CN", "tracks": ["physical_ai_data", "korea_entry"], "evidence": [{"url": "https://demo.example.org/contact", "excerpt": "DEMO 机器人 humanoid international 渠道 合作 buyer@demo.example.org", "observed_at": now()}], "contacts": [{"email": "buyer@demo.example.org", "source_url": "https://demo.example.org/contact"}]}]
    s.import_records(fixture, cfg)
    s.verify("evidence", 1, "demo-reviewer")
    s.verify("contacts", 1, "demo-reviewer")
    s.rank(cfg)
    drafts = [s.draft(i, 1, cfg) for i in (1, 2)]
    return {"fixture_only": True, "network_calls": 0, "drafts": drafts,
            "dispatch": dispatch(s, cfg, drafts[0]["id"]), "companies": 1, "opportunities": 2}


def main():
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass
    if hasattr(sys.stderr, "reconfigure"):
        try:
            sys.stderr.reconfigure(encoding="utf-8")
        except Exception:
            pass
    parser = argparse.ArgumentParser(description="REMO China B2B sourcing and outreach harness")
    parser.add_argument("--config", default="config.local.json")
    parser.add_argument("--db", default=".state/remo.sqlite3")
    sub = parser.add_subparsers(dest="command", required=True)
    for name in ("doctor", "init", "plan", "discover", "rank", "status", "demo"):
        sub.add_parser(name)
    p = sub.add_parser("import"); p.add_argument("file")
    p = sub.add_parser("list"); p.add_argument("kind", choices=["companies", "contacts", "evidence", "opportunities", "candidates", "drafts", "deliveries", "replies", "audit"])
    p = sub.add_parser("verify"); p.add_argument("kind", choices=["evidence", "contacts"]); p.add_argument("id", type=int); p.add_argument("--operator", required=True)
    p = sub.add_parser("draft"); p.add_argument("opportunity", type=int); p.add_argument("contact", type=int)
    p = sub.add_parser("permit"); p.add_argument("file")
    p = sub.add_parser("approve"); p.add_argument("draft", type=int); p.add_argument("--sha256", required=True); p.add_argument("--operator", required=True)
    p = sub.add_parser("dispatch"); p.add_argument("draft", type=int); p.add_argument("--live", action="store_true")
    p = sub.add_parser("reply"); p.add_argument("file")
    p = sub.add_parser("suppress"); p.add_argument("email"); p.add_argument("--reason", required=True)
    p = sub.add_parser("report"); p.add_argument("--output", default="reports/latest")
    p = sub.add_parser("cycle"); p.add_argument("--search", action="store_true"); p.add_argument("--output", default="reports/latest")
    args = parser.parse_args()
    try:
        cfg = load_config(args.config)
        if args.command == "demo":
            result = demo(cfg)
        else:
            s = Store(args.db)
            command = args.command
            if command == "doctor":
                result = {"database": "ready", "search_configured": bool(os.environ.get("BRAVE_SEARCH_API_KEY")), "gmail_token_present": bool(os.environ.get("GMAIL_ACCESS_TOKEN")), "sender_complete": all(cfg.get(k) for k in ("sender_name", "sender_email", "sender_address")), "live_enabled": cfg.get("live_enabled") is True, "scheduler": "not installed by this CLI", "credentials_verified": False}
            elif command == "init":
                result = {"database": args.db, "queries": len(s.plan(cfg))}
            elif command == "plan":
                result = s.plan(cfg)
            elif command == "discover":
                result = discover(s, cfg)
            elif command == "import":
                result = {"company_ids": s.import_records(read_json(args.file), cfg)}
            elif command == "list":
                result = s.rows(f"SELECT * FROM {args.kind} ORDER BY rowid DESC LIMIT ?", (cfg["max_jobs"],))
            elif command == "verify":
                s.verify(args.kind, args.id, args.operator); result = {"verified": args.id, "kind": args.kind}
            elif command == "rank":
                result = s.rank(cfg)
            elif command == "draft":
                result = s.draft(args.opportunity, args.contact, cfg)
            elif command == "permit":
                s.permit(read_json(args.file), cfg); result = {"permission_recorded": True}
            elif command == "approve":
                s.approve(args.draft, args.sha256, args.operator); result = {"approved_draft": args.draft}
            elif command == "dispatch":
                result = dispatch(s, cfg, args.draft, args.live)
            elif command == "reply":
                result = s.reply(read_json(args.file), cfg)
            elif command == "suppress":
                s.suppress(args.email, args.reason); result = {"suppressed": True}
            elif command in ("report", "cycle"):
                if command == "cycle":
                    search = discover(s, cfg) if args.search else {"skipped": "use --search to enable bounded search requests"}
                    ranked = s.rank(cfg)
                    result = {"search": search, "ranked": len(ranked)}
                    # Produce drafts only for explicitly verified contacts. No approvals or sends.
                    made = []
                    jobs = s.rows("SELECT o.id oid,c.id cid FROM opportunities o JOIN contacts c ON c.company_id=o.company_id WHERE o.campaign=? AND o.status='QUALIFIED' AND c.verified_by<>'' ORDER BY o.score DESC LIMIT ?", (cfg["campaign"], cfg["max_jobs"]))
                    for job in jobs:
                        try:
                            made.append(s.draft(job["oid"], job["cid"], cfg)["id"])
                        except ValueError:
                            pass
                    result["draft_ids"] = made
                    result["report"] = s.report(cfg, args.output)
                else:
                    result = s.report(cfg, args.output)
            else:
                result = {name: s.one(f"SELECT COUNT(*) n FROM {name}")["n"] for name in ("companies", "candidates", "opportunities", "drafts", "deliveries", "replies")}
        print(json.dumps(result, ensure_ascii=False, indent=2))
    except (ValueError, KeyError, TypeError, OSError, RuntimeError, json.JSONDecodeError) as exc:
        # Operator data validation errors only; adapters sanitize network errors separately.
        print(json.dumps({"error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())

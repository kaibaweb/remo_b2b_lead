import base64
import copy
import json
import os
import tempfile
import unittest
from datetime import datetime, timedelta
from email import policy
from email.parser import BytesParser
from pathlib import Path
from unittest.mock import patch
from remo_lead.core import Store, UTC, domain, load_config, now
from remo_lead.providers import discover, dispatch
ROOT = Path(__file__).resolve().parents[1]

class HarnessTest(unittest.TestCase):
    def setUp(self):
        self.cfg = load_config(ROOT / 'config.example.json')
        self.cfg.update(sender_email='operator@example.org', sender_address='Demo address', live_enabled=True)
        self.s = Store(':memory:')
        self.records = [{'company':'DEMO Robotics','website':'https://demo.example.org','country':'CN','tracks':['physical_ai_data','korea_entry'],'evidence':[{'url':'https://demo.example.org/contact','excerpt':'humanoid robot 机器人 overseas 渠道 buyer@demo.example.org','observed_at':now(),'verified_by':'untrusted'}],'contacts':[{'email':'buyer@demo.example.org','source_url':'https://demo.example.org/contact','verified_by':'untrusted'}]}]
    def tearDown(self):
        self.s.db.close()
    def ready(self):
        self.s.import_records(self.records,self.cfg)
        self.s.verify('evidence',1,'reviewer'); self.s.verify('contacts',1,'reviewer')
        self.d = self.s.draft(1,1,self.cfg)
        self.s.permit({'contact_id':1,'sender_email':self.cfg['sender_email'],'basis':'explicit_consent','evidence':'fixture-consent','recorded_by':'operator','obtained_at':(datetime.now(UTC)-timedelta(days=1)).isoformat(),'expires_at':(datetime.now(UTC)+timedelta(days=10)).isoformat()},self.cfg)
        self.s.approve(self.d['id'],self.d['sha256'],'operator')
    def test_dedupe_and_untrusted_import(self):
        self.s.import_records(self.records,self.cfg)
        again=copy.deepcopy(self.records); again[0]['website']='https://www.demo.example.org/about'
        self.s.import_records(again,self.cfg)
        for table,n in [('companies',1),('contacts',1),('opportunities',2),('evidence',1)]:
            self.assertEqual(self.s.one(f'SELECT COUNT(*) n FROM {table}')['n'],n)
        self.assertEqual(self.s.one('SELECT * FROM evidence')['verified_by'],'')
        self.assertEqual(self.s.one('SELECT * FROM contacts')['verified_by'],'')
    def test_atomic_bounded_import(self):
        bad=copy.deepcopy(self.records[0]); bad['website']='http://bad.local'
        with self.assertRaises(ValueError): self.s.import_records(self.records+[bad],self.cfg)
        self.assertEqual(self.s.one('SELECT COUNT(*) n FROM companies')['n'],0)
        with self.assertRaises(ValueError): self.s.import_records(self.records*21,self.cfg)
    def test_cross_company_contact_rejected(self):
        self.s.import_records(self.records,self.cfg)
        other=copy.deepcopy(self.records); other[0]['website']='https://other.example.org'
        with self.assertRaises(ValueError): self.s.import_records(other,self.cfg)
    def test_unverified_and_stale_evidence(self):
        self.s.import_records(self.records,self.cfg)
        self.assertEqual(self.s.rank(self.cfg)[0]['score'],0)
        with self.assertRaises(ValueError): self.s.verify('contacts',1,'reviewer')
        self.s.verify('evidence',1,'reviewer')
        self.s.db.execute('UPDATE evidence SET observed_at=?',((datetime.now(UTC)-timedelta(days=31)).isoformat(),))
        self.assertEqual(self.s.rank(self.cfg)[0]['score'],0)
    def test_no_email_guessing(self):
        self.records[0]['evidence'][0]['excerpt']='humanoid robot 机器人 渠道'
        self.s.import_records(self.records,self.cfg)
        self.s.verify('evidence',1,'reviewer'); self.s.verify('contacts',1,'reviewer')
        with self.assertRaisesRegex(ValueError,'exact email'): self.s.draft(1,1,self.cfg)
    def test_reobserved_identical_evidence_requires_review(self):
        old=copy.deepcopy(self.records)
        old[0]['evidence'][0]['observed_at']=(datetime.now(UTC)-timedelta(days=31)).isoformat()
        self.s.import_records(old,self.cfg); self.s.verify('evidence',1,'reviewer')
        self.assertEqual(self.s.rank(self.cfg)[0]['score'],0)
        self.s.import_records(self.records,self.cfg)
        self.assertEqual(self.s.one('SELECT * FROM evidence')['verified_by'],'')
        self.s.verify('evidence',1,'reviewer')
        self.assertGreater(self.s.rank(self.cfg)[0]['score'],0)
    def test_future_evidence_rejected(self):
        self.records[0]['evidence'][0]['observed_at']=(datetime.now(UTC)+timedelta(days=1)).isoformat()
        with self.assertRaises(ValueError): self.s.import_records(self.records,self.cfg)
    def test_idempotent_draft_and_network_free_dry_run(self):
        self.ready(); self.assertEqual(self.d['id'],self.s.draft(1,1,self.cfg)['id'])
        def forbidden(*a,**k): self.fail('dry run used network')
        out=dispatch(self.s,self.cfg,1,request=forbidden)
        self.assertEqual(out['blockers'],[]); self.assertFalse(out['sent'])
        self.assertEqual(self.s.one('SELECT COUNT(*) n FROM deliveries')['n'],0)
    def test_sender_and_evidence_changes_invalidate(self):
        self.ready(); self.cfg['sender_address']='New address'
        self.assertIn('snapshot_changed',self.s.blockers(1,self.cfg))
        self.cfg['sender_address']='Demo address'; self.s.db.execute("UPDATE evidence SET verified_by='' WHERE id=1")
        self.assertIn('snapshot_changed',self.s.blockers(1,self.cfg))
    def test_exact_approval_hash(self):
        self.ready()
        with self.assertRaises(ValueError): self.s.approve(1,'changed','operator')
    def test_expired_permission(self):
        self.ready(); self.s.db.execute('UPDATE permissions SET expires_at=?',((datetime.now(UTC)-timedelta(seconds=1)).isoformat(),))
        self.assertIn('permission_missing_or_expired',self.s.blockers(1,self.cfg))
    def test_send_once_unicode_and_stage(self):
        self.ready(); calls=[]
        def request(method,url,token,payload=None):
            calls.append(method)
            if method=='GET': return {'emailAddress':'operator@example.org'}
            msg=BytesParser(policy=policy.default).parsebytes(base64.urlsafe_b64decode(payload['raw']))
            self.assertEqual(str(msg['To']),'buyer@demo.example.org')
            self.assertIn('合作交流',str(msg['Subject'])); self.assertIn('退订',msg.get_content())
            return {'id':'message-1','threadId':'thread-1'}
        with patch.dict(os.environ,{'GMAIL_ACCESS_TOKEN':'fixture'}):
            self.assertEqual(dispatch(self.s,self.cfg,1,True,request)['state'],'ACCEPTED')
            self.assertIn('delivery_already_reserved',dispatch(self.s,self.cfg,1,True,request)['blockers'])
        self.assertEqual(calls,['GET','POST']); self.s.rank(self.cfg)
        self.assertEqual(self.s.one('SELECT status FROM opportunities WHERE id=1')['status'],'CONTACTED')
    def test_unknown_not_retried(self):
        self.ready(); calls=[]
        def request(method,*a):
            calls.append(method)
            if method=='GET': return {'emailAddress':'operator@example.org'}
            raise TimeoutError('ambiguous')
        with patch.dict(os.environ,{'GMAIL_ACCESS_TOKEN':'fixture'}):
            self.assertEqual(dispatch(self.s,self.cfg,1,True,request)['state'],'UNKNOWN')
            self.assertFalse(dispatch(self.s,self.cfg,1,True,request)['sent'])
        self.assertEqual(calls,['GET','POST'])
    def test_wrong_sender_never_reserves(self):
        self.ready()
        with patch.dict(os.environ,{'GMAIL_ACCESS_TOKEN':'fixture'}):
            with self.assertRaisesRegex(ValueError,'identity'):
                dispatch(self.s,self.cfg,1,True,lambda *a:{'emailAddress':'wrong@example.org'})
        self.assertEqual(self.s.one('SELECT COUNT(*) n FROM deliveries')['n'],0)
    def test_contact_limit_across_tracks(self):
        self.ready(); d2=self.s.draft(2,1,self.cfg); self.s.approve(d2['id'],d2['sha256'],'operator')
        self.s.db.execute('INSERT INTO deliveries(draft_id,campaign,recipient,state,created_at) VALUES(?,?,?,?,?)',(1,self.cfg['campaign'],'buyer@demo.example.org','SENDING',now()))
        self.assertIn('delivery_already_reserved',self.s.blockers(d2['id'],self.cfg))
    def test_daily_cap_and_suppression(self):
        self.ready(); self.cfg['max_daily_sends']=1
        self.s.db.execute('INSERT INTO deliveries(campaign,recipient,state,created_at) VALUES(?,?,?,?)',('other','other@example.org','UNKNOWN',now()))
        self.assertIn('daily_limit',self.s.blockers(1,self.cfg))
        self.s.suppress('buyer@demo.example.org','opt out'); self.assertIn('suppressed',self.s.blockers(1,self.cfg))
    def test_reply_idempotence_learning_and_optout(self):
        self.ready(); qid=next(q['id'] for q in self.s.plan(self.cfg) if q['track']=='physical_ai_data')
        r={'provider_id':'reply-1','opportunity_id':1,'contact_id':1,'sender_email':'buyer@demo.example.org','outcome':'unsubscribe','note':'退订','received_at':now(),'query_id':qid}
        self.assertEqual(self.s.reply(r,self.cfg)['status'],'SUPPRESSED')
        self.assertTrue(self.s.reply(r,self.cfg)['duplicate'])
        self.assertEqual(self.s.one('SELECT negatives FROM queries WHERE id=?',(qid,))['negatives'],1)
        for block in ('suppressed','reply_exists'): self.assertIn(block,self.s.blockers(1,self.cfg))
    def test_reply_sender_match(self):
        self.ready()
        with self.assertRaisesRegex(ValueError,'sender mismatch'):
            self.s.reply({'provider_id':'reply-2','opportunity_id':1,'contact_id':1,'sender_email':'other@example.org','outcome':'positive','received_at':now()},self.cfg)
    def test_discover_bounded_candidate_only(self):
        self.cfg['max_search_requests']=2; calls=[]
        def request(*a,**k):
            calls.append(a[1]); return {'web':{'results':[{'url':'https://candidate.example.org','title':'Robot','description':'untrusted'}]}}
        with patch.dict(os.environ,{'BRAVE_SEARCH_API_KEY':'fixture'}): out=discover(self.s,self.cfg,request)
        self.assertEqual(len(calls),2); self.assertEqual(len(out),2)
        self.assertEqual(self.s.one('SELECT COUNT(*) n FROM candidates')['n'],2)
        self.assertEqual(self.s.one('SELECT COUNT(*) n FROM companies')['n'],0)
        self.assertEqual(sum(q['attempts'] for q in self.s.plan(self.cfg)),2)
    def test_failed_search_backoff(self):
        self.cfg['max_search_requests']=1
        def fail(*a,**k): raise TimeoutError()
        with patch.dict(os.environ,{'BRAVE_SEARCH_API_KEY':'fixture'}): out=discover(self.s,self.cfg,fail)
        q=self.s.one('SELECT * FROM queries WHERE id=?',(out[0]['query_id'],))
        self.assertEqual(q['failures'],1); self.assertIsNotNone(q['next_at'])
    def test_escaped_report(self):
        self.records[0]['company']='<script>alert(1)</script>'; self.s.import_records(self.records,self.cfg)
        with tempfile.TemporaryDirectory() as td:
            self.s.report(self.cfg,td); page=(Path(td)/'report.html').read_text()
            self.assertNotIn('<script>alert',page); self.assertIn('&lt;script&gt;',page)
    def test_unsafe_urls(self):
        for u in ('http://example.org','https://localhost','https://127.0.0.1','https://x.local','https://user:pass@example.org','https://example.org:8080'):
            with self.assertRaises(ValueError,msg=u): domain(u)
    def test_persistence(self):
        with tempfile.TemporaryDirectory() as td:
            path=Path(td)/'store.sqlite'; a=Store(path); a.import_records(self.records,self.cfg); a.db.close()
            b=Store(path); self.assertEqual(b.one('SELECT COUNT(*) n FROM companies')['n'],1); b.db.close()

if __name__=='__main__': unittest.main()

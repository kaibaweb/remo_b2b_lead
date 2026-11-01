import test from 'node:test';
import assert from 'node:assert/strict';

test('business CTAs use the exact operator-supplied contact channels',async()=>{
  const { businessContacts }=await import('../../src/lib/business-contact.mjs');
  assert.equal(businessContacts.email,'remo@boam.tech');
  assert.equal(businessContacts.wechat,'zeeeeyul');
  assert.equal(businessContacts.linkedin,'https://www.linkedin.com/in/zeeyulkim/');
  assert.equal(businessContacts.remo,'https://www.remo.re.kr/');
  assert.equal(businessContacts.boam,'https://boam.tech/');
});

test('localized meeting email content cannot inject extra recipients or parameters',async()=>{
  const { businessEmailHref }=await import('../../src/lib/business-contact.mjs');
  const subject='CHTF 深圳 & collaboration?bcc=someone@example.invalid';
  const body='Company: Test\nUse case: Motion & robotics';
  const href=businessEmailHref(subject,body);
  const url=new URL(href);
  assert.equal(url.protocol,'mailto:');
  assert.equal(url.pathname,'remo@boam.tech');
  assert.equal(url.searchParams.get('subject'),subject);
  assert.equal(url.searchParams.get('body'),body);
  assert.deepEqual([...url.searchParams.keys()],['subject','body']);
});

test('meeting links select only known offers and preserve legacy mailing tracks',async()=>{
  const { meetingInterestFromHref }=await import('../../src/lib/business-contact.mjs');
  assert.equal(meetingInterestFromHref('/zh-CN?interest=data&utm_source=mail'),'data');
  assert.equal(meetingInterestFromHref('/?interest=korea&track=finefit'),'korea');
  assert.equal(meetingInterestFromHref('/?interest=distribution'),'distribution');
  assert.equal(meetingInterestFromHref('/?track=physical_ai_data'),'data');
  assert.equal(meetingInterestFromHref('/?track=korea_entry'),'korea');
  assert.equal(meetingInterestFromHref('/?track=finefit'),'distribution');
  assert.equal(meetingInterestFromHref('/?interest=unknown'),'');
  assert.equal(meetingInterestFromHref('/'),'');
  for(const value of ['constructor','toString','__proto__']) assert.equal(meetingInterestFromHref(`/?track=${value}`),'');
});

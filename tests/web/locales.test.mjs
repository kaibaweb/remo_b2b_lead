import test from 'node:test';
import assert from 'node:assert/strict';
import { localizedPath } from '../../src/lib/locales.mjs';

test('language changes retain public page, query and fragment',()=>{
  assert.equal(localizedPath('/contact?track=finefit&utm_source=test#lead-form','ko'),'/ko/contact?track=finefit&utm_source=test#lead-form');
  assert.equal(localizedPath('/ko/privacy','zh'),'/privacy');
  assert.equal(localizedPath('/ko?track=korea_entry#lead-form','zh'),'/?track=korea_entry#lead-form');
  assert.equal(localizedPath('/#opportunities','ko'),'/ko#opportunities');
  assert.equal(localizedPath('/ko/contact','ko'),'/ko/contact');
});

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

test('20 locale paths replace existing locale prefixes and preserve attribution', async () => {
  const { supportedLocales } = await import('../../src/lib/locales.mjs');
  assert.equal(supportedLocales.length,20);
  for (const { id } of supportedLocales) {
    assert.equal(localizedPath('/fr/contact?track=physical_ai_data&utm_source=mail#lead-form',id),`/${id}/contact?track=physical_ai_data&utm_source=mail#lead-form`);
  }
  assert.equal(localizedPath('/zh-TW/privacy','en'),'/en/privacy');
  assert.equal(localizedPath('/en/contact','zh-CN'),'/zh-CN/contact');
  assert.equal(localizedPath('/korea-entry','en'),'/en/korea-entry');
});

test('browser language negotiation respects quality, scripts and regional dialects', async () => {
  const { negotiateLocale } = await import('../../src/lib/locales.mjs');
  for(const [header,expected] of [
    [undefined,'zh-CN'],['','zh-CN'],['en-US,en;q=0.9','en'],['fr-CA,ja;q=0.8','fr'],
    ['zh-Hant-HK,zh;q=0.8','zh-TW'],['zh-Hans-SG','zh-CN'],['zh-HK','zh-TW'],['zh','zh-CN'],
    ['ja;q=0.4,ko;q=0.9','ko'],['xx-YY,ru;q=0.8','ru'],['xx-YY','en'],['*','en'],
    ['ja;q=0,en;q=0.2','en'],['ko;q=0.5,ja;q=0.5','ko'],['pt-BR','pt'],['ar-EG','ar'],
    ['de;q=bad,en;q=0.8','en'],['ko;q=0','en'],['ja;q=1.5,fr;q=0.5','fr'],
  ]) assert.equal(negotiateLocale(header),expected,header);
});

test('explicit locale selection wins and unsupported preference cookies are ignored',async()=>{
  const { resolveLocale }=await import('../../src/lib/locales.mjs');
  assert.equal(resolveLocale('/fr/privacy','ko','ja'),'fr');
  assert.equal(resolveLocale('/contact','ko','ja'),'ko');
  assert.equal(resolveLocale('/','bogus','ja'),'ja');
  assert.equal(resolveLocale('/',null,'da-DK'),'en');
  assert.equal(resolveLocale('/',null,null),'zh-CN');
});

test('catalog verification rejects a missing consent sentence and a stale translation',async()=>{
  const { validateCatalogs } = await import('../../scripts/check-locales.mjs');
  const { mkdtemp, cp, readFile, writeFile, rm } = await import('node:fs/promises');
  const { pathToFileURL } = await import('node:url');
  const directory = await mkdtemp('/tmp/remo-catalog-test-');
  try {
    await cp(new URL('../../src/lib/messages/',import.meta.url),directory,{recursive:true});
    const target = `${directory}/fr.json`;
    const french = JSON.parse(await readFile(target,'utf8'));
    delete french['为处理本次合作咨询，我已阅读并同意'];
    french['obsolete sentence'] = 'Obsolete';
    await writeFile(target,JSON.stringify(french));
    const errors = await validateCatalogs(pathToFileURL(`${directory}/`));
    assert.ok(errors.some(error=>error.includes('fr.json: missing/empty 为处理本次合作咨询，我已阅读并同意')));
    assert.ok(errors.some(error=>error.includes('fr.json: stale key obsolete sentence')));
  } finally { await rm(directory,{recursive:true,force:true}); }
});

test('all shipped public catalogs are complete',async()=>{
  const { validateCatalogs }=await import('../../scripts/check-locales.mjs');
  assert.deepEqual(await validateCatalogs(),[]);
});

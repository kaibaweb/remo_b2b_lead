/* Optional integration check: requires Playwright plus Chromium and a running build. */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
// createRequire also supports tool environments exposing Playwright via NODE_PATH.
const { chromium, request } = createRequire(import.meta.url)('playwright');

(async () => {
  const { supportedLocales } = await import('../src/lib/locales.mjs');
  const baseURL = process.argv[2] || 'http://127.0.0.1:3002';
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: ['--no-sandbox'],
  });
  const failures = [];
  try {
    const api = await request.newContext({ baseURL });
    for (const [language, cookie, target] of [
      ['', '', null], ['fr-CA', '', '/fr'], ['zh-HK', '', '/zh-TW'],
      ['da-DK', '', '/en'], ['ja;q=0.4,ko;q=0.9', '', '/ko'],
      ['ja', 'remo_locale=ru', '/ru'], ['ja', 'remo_locale=invalid', '/ja'],
    ]) {
      const response = await api.get('/?track=finefit&utm_source=check', { maxRedirects: 0, headers: { 'Accept-Language': language, Cookie: cookie } });
      assert.equal(response.status(), target ? 307 : 200, language);
      if (target) assert.equal(new URL(response.headers().location, baseURL).pathname, target);
      assert.ok(response.headers()['cache-control'].includes('no-store'));
    }
    for (const route of ['/api/shorts', '/admin/login', '/no-such-route']) {
      const response = await api.get(route, { maxRedirects: 0, headers: { 'Accept-Language': 'ja' } });
      assert.notEqual(response.status(), 307, `Unexpected negotiation: ${route}`);
    }
    assert.equal((await api.get('/fr/privacy', {maxRedirects:0, headers:{'Accept-Language':'ko',Cookie:'remo_locale=ja'}})).status(),200);
    assert.equal((await api.get('/xx/privacy', {maxRedirects:0})).status(),404);
    await api.dispose();

    for (const { id, dir } of supportedLocales) {
      const catalog = JSON.parse(readFileSync(new URL(`../src/lib/messages/${id}.json`, import.meta.url), 'utf8'));
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
      const errors=[];
      page.on('pageerror', error => errors.push(error.message));
      for (const suffix of ['', '/contact', '/privacy']) {
        const response = await page.goto(`${baseURL}/${id}${suffix}`, {waitUntil:'load'});
        assert.equal(response.status(),200,`${id}${suffix}`);
        assert.equal(await page.locator('html').getAttribute('lang'),id);
        assert.equal(await page.locator('html').getAttribute('dir'),dir);
        assert.equal(new URL(await page.locator('link[rel="canonical"]').getAttribute('href')).pathname,`/${id}${suffix}`);
        assert.equal(await page.locator('link[rel="alternate"][hreflang]').count(),21);
        assert.ok((await page.title()).includes(catalog[suffix==='/privacy'?'咨询信息与隐私说明':suffix==='/contact'?'合作咨询':'连接中国企业与韩国市场。']));
        if(suffix==='/privacy') assert.ok((await page.locator('main').innerText()).includes(catalog['收集的信息']));
        for(const width of [320,390,768,1440]) {
          await page.setViewportSize({width,height:844});
          const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
          if(overflow) failures.push(`${id}${suffix||'/'} overflows ${width}px`);
        }
      }
      await page.setViewportSize({width:390,height:844});
      await page.goto(`${baseURL}/${id}/contact`);
      const submit=page.locator('form button[type="submit"]');
      await submit.click();
      assert.ok((await page.locator('form').innerText()).includes(catalog['请输入公司或机构名称。']));
      await page.getByLabel(catalog['公司 / 机构'],{exact:false}).fill('Fixture company');
      await page.getByLabel(catalog['联系人'],{exact:false}).fill('Fixture person');
      await page.locator('input[type="tel"]').fill('+821012345678');
      await page.locator('input[type="email"]').fill('fixture@example.invalid');
      await page.locator('#privacy-consent').check();
      let payload;
      await page.route('**/api/leads',async route=>{
        payload=route.request().postDataJSON();
        await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'DO NOT DISPLAY RAW SERVER CHINESE'})});
      });
      await submit.click();
      await page.getByRole('alert').filter({hasText:catalog['咨询通道暂未开放，请稍后再试。']}).waitFor();
      assert.equal(payload.locale,id);
      assert.equal(payload.privacyConsent,true);
      await page.unroute('**/api/leads');
      await page.route('**/api/leads',route=>route.fulfill({status:201,contentType:'application/json',body:'{"success":true}'}));
      await submit.click();
      await page.getByRole('status').filter({hasText:catalog['合作咨询已收到！']}).waitFor();
      assert.deepEqual(errors,[],id);
      await page.close();
      console.log(`${id}: 3 pages, 4 widths, metadata, validation, mocked failure/success OK`);
    }
    const page=await browser.newPage({viewport:{width:390,height:844},locale:'ja'});
    await page.goto(`${baseURL}/en/contact?track=finefit&utm_source=fixture#lead-form`);
    await Promise.all([page.waitForURL('**/ar/contact?track=finefit&utm_source=fixture#lead-form'),page.locator('select[aria-label]').selectOption('ar')]);
    assert.equal(await page.locator('html').getAttribute('dir'),'rtl');
    await page.goto(baseURL);
    assert.equal(new URL(page.url()).pathname,'/ar');
    await page.close();
    assert.deepEqual(failures,[]);
    console.log('Routing priorities, selection persistence, query/hash and RTL checks OK. No real inquiries sent.');
  } finally { await browser.close(); }
})().catch(error=>{ console.error(error); process.exitCode=1; });

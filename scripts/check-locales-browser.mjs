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
      await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
        writeText: async value => { window.__copiedWechat = value; },
      } }));
      page.on('pageerror', error => errors.push(error.message));
      for (const suffix of ['', '/contact', '/privacy']) {
        const response = await page.goto(`${baseURL}/${id}${suffix}`, {waitUntil:'load'});
        assert.equal(response.status(),200,`${id}${suffix}`);
        assert.equal(await page.locator('html').getAttribute('lang'),id);
        assert.equal(await page.locator('html').getAttribute('dir'),dir);
        assert.equal(new URL(await page.locator('link[rel="canonical"]').getAttribute('href')).pathname,`/${id}${suffix}`);
        assert.equal(await page.locator('link[rel="alternate"][hreflang]').count(),21);
        assert.ok((await page.title()).includes(catalog[suffix==='/privacy'?'咨询信息与隐私说明':suffix==='/contact'?'合作咨询':'深圳会面｜数据、韩国市场与产品分销']));
        if (suffix === '') {
          assert.deepEqual(await page.locator('main > section').evaluateAll(nodes => nodes.map(node => node.id)),
            ['hero','solutions','lead-form']);
          assert.equal(await page.locator('#about-remo').count(),0);
          assert.equal(await page.locator('#hero a').count(),1);
          assert.equal(await page.locator('#hero a').getAttribute('href'),'#solutions');
          assert.equal(await page.locator('#hero .partner-track-links').count(),0);
          assert.equal(await page.locator('.meeting-offer-who').count(),0);
          assert.ok((await page.locator('.hero-company-intro').innerText()).includes(catalog['REMO 是一家分析体态、步态与体育动作的韩国 AI 企业。 我们以动作分析技术、健康解决方案和韩国业务经验为基础，探讨合作可能。'].split('\n')[0]));
          assert.equal(await page.locator('.partner-proof-wall > a').count(),9);
          assert.ok((await page.locator('#company-evidence').innerText()).includes(catalog['与不同客户，在真实现场积累经验。']));
          assert.equal(await page.locator('.partner-photo-grid').count(),0);
          assert.equal(await page.locator('#gallery-title').count(),0);
          assert.equal(await page.locator('.exhibition-group').first().locator('a').count(),6);
          assert.equal(await page.locator('.exhibition-group[aria-hidden="true"] a:not([tabindex="-1"])').count(),0);
          assert.equal(await page.locator('#global-presence .exhibition-photo').count(),12);
          await page.locator('.exhibition-motion-button').click();
          assert.equal(await page.locator('.exhibition-motion-button').getAttribute('aria-pressed'),'true');
          await page.locator('.exhibition-group').first().locator('a').first().focus();
          assert.equal(await page.locator('.exhibition-track').evaluate(node=>getComputedStyle(node).transform),'none');
          assert.equal(await page.locator('#solutions .meeting-offer img').count(),0);
          assert.equal(await page.locator('#lead-form input, #lead-form select').count(),0);
          for (const href of await page.locator('#company-evidence a').evaluateAll(nodes=>nodes.map(node=>node.href))) assert.ok(href.startsWith('https://'));
          assert.equal(await page.locator('.partner-wechat-cta').getAttribute('href'),'weixin://dl/chat?zeeeeeyul');
          const email = new URL(await page.locator('#lead-form .meeting-email-address').getAttribute('href'));
          assert.equal(email.protocol,'mailto:');
          assert.equal(email.pathname,'remo@boam.tech');
          assert.equal(email.searchParams.get('subject'),catalog['CHTF 2026 深圳会议咨询']);
          assert.equal(await page.locator('#lead-form .business-secondary-button').getAttribute('href'),'https://www.linkedin.com/in/zeeyulkim/');
          await page.locator('[data-interest="korea"] a').click();
          const korea=page.locator('.partner-topics button').nth(1);
          assert.equal(await korea.getAttribute('aria-pressed'),'true');
          const requestEmail = new URL(await page.locator('.meeting-email-address').getAttribute('href'));
          assert.ok(requestEmail.searchParams.get('subject').includes(catalog['韩国市场合作']));
          await korea.click();
          assert.equal(await korea.getAttribute('aria-pressed'),'false');
          assert.ok((await page.locator('#chtf').innerText()).includes(catalog['2026年11月26–28日']));
          const beforeCopy=page.url();
          await page.locator('.business-copy-button').click();
          assert.equal(await page.evaluate(()=>window.__copiedWechat),'zeeeeeyul');
          assert.equal(page.url(),beforeCopy);
          await page.locator('.business-copy-status').filter({hasText:catalog['微信号已复制']}).waitFor();
          await page.evaluate(()=>{ navigator.clipboard.writeText=async()=>{throw new Error('denied')}; });
          await page.locator('.business-copy-button').click();
          await page.locator('.business-copy-status').filter({hasText:catalog['复制失败，请手动复制微信号。']}).waitFor();
        }
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

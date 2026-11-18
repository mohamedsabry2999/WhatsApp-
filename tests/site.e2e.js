// بيفحص الموقع: كل الصفحات بتفتح من غير أخطاء، الروابط والتحميلات موجودة، والأدوات الأونلاين شغالة.
// Run: (serve site/ on :8790) then  node tests/site.e2e.js
const { chromium } = require('playwright');
const fs = require('fs');
const os = require('os');
const path = require('path');
const BASE = process.env.SITE || 'http://localhost:8790/';
const SHOTS = process.env.SHOTS || path.join(os.tmpdir(), 'mt-site');
fs.mkdirSync(SHOTS, { recursive: true });
const results = [];
const check = (n, ok, x = '') => { results.push(ok); console.log(ok ? 'PASS' : 'FAIL', n, x); };

(async () => {
  const b = await chromium.launch();
  const errors = [];
  const pages = ['index.html', 'install.html', 'privacy.html', ...fs.readdirSync(path.resolve(__dirname, '../site/tools')).map((f) => 'tools/' + f)];
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const links = new Set();
  for (const p of pages) {
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(p + ': ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(p + ': ' + m.text()); });
    page.on('requestfailed', (r) => errors.push(p + ': failed ' + r.url()));
    page.on('response', (r) => { if (r.status() >= 400) errors.push(p + ': ' + r.status() + ' ' + r.url()); });
    await page.goto(BASE + p, { waitUntil: 'networkidle' });
    (await page.$$eval('a[href]', (as) => as.map((a) => a.href))).forEach((h) => links.add(h));
    check(`page ${p}`, !!(await page.title()));
    await page.close();
  }
  // كل الروابط الداخلية والتحميلات موجودة
  const internal = [...links].filter((h) => h.startsWith(BASE));
  const bad = [];
  for (const h of internal) {
    const res = await ctx.request.get(h.split('#')[0]);
    if (res.status() !== 200) bad.push(res.status() + ' ' + h);
  }
  check(`all ${internal.length} internal links/downloads resolve`, bad.length === 0, bad.join(' | '));

  // الصفحة الرئيسية: سكرين كاملة (desktop + mobile)
  const home = await ctx.newPage();
  await home.goto(BASE + 'index.html', { waitUntil: 'networkidle' });
  for (let y = 0; y < 9000; y += 600) { await home.evaluate((y) => window.scrollTo(0, y), y); await home.waitForTimeout(120); }
  await home.waitForTimeout(800);
  await home.evaluate(() => window.scrollTo(0, 0));
  await home.screenshot({ path: path.join(SHOTS, 'home-full.png'), fullPage: true });
  await home.screenshot({ path: path.join(SHOTS, 'home-top.png') });
  // فلترة الأدوات
  await home.click('.chip[data-f="web"]');
  const visible = await home.$$eval('#tools .tool-card', (cs) => cs.filter((c) => !c.hidden).length);
  check('tools filter "تشتغل أونلاين" shows 4', visible === 4, String(visible));

  // الدليل التفاعلي
  const g = await ctx.newPage();
  await g.goto(BASE + 'install.html?tool=inspect', { waitUntil: 'networkidle' });
  await g.locator('.browser').scrollIntoViewIfNeeded();
  await g.waitForTimeout(1500);
  check('guide personalized to PixelScope', (await g.textContent('.g-step.on')).includes('PixelScope'));
  for (let i = 0; i < 5; i++) {
    await g.click(`.g-step >> nth=${i}`);
    await g.waitForTimeout(i === 3 ? 6500 : 4200);
    await g.locator('.guide').screenshot({ path: path.join(SHOTS, `guide-${i + 1}.png`) });
  }
  check('guide step 4 shows the extension card', await g.$eval('.ext-card', (e) => e.classList.contains('on')));
  check('guide step 5 pins the extension', await g.$eval('.browser', (e) => e.classList.contains('pinned')));

  // الأدوات الأونلاين بتشتغل
  const u = await ctx.newPage();
  u.on('pageerror', (e) => errors.push('utm demo: ' + e.message));
  await u.goto(BASE + 'tools/utm.html?url=' + encodeURIComponent('https://example.com/a') + '#try', { waitUntil: 'networkidle' });
  await u.fill('#u-source', 'facebook'); await u.fill('#u-medium', 'paid_social'); await u.fill('#u-campaign', 'Test Campaign'); await u.click('#u-content');
  check('UTM demo works on site', (await u.textContent('#out')) === 'https://example.com/a?utm_source=facebook&utm_medium=paid_social&utm_campaign=test-campaign');
  await u.locator('#try').screenshot({ path: path.join(SHOTS, 'demo-utm.png') });
  const w = await ctx.newPage();
  await w.goto(BASE + 'tools/walink.html', { waitUntil: 'networkidle' });
  await w.fill('#phone', '01012345678');
  check('QR demo works on site', (await w.$('#qr svg path')) !== null && (await w.textContent('#out')).startsWith('https://wa.me/201012345678'));
  const c = await ctx.newPage();
  await c.goto(BASE + 'tools/calc.html', { waitUntil: 'networkidle' });
  await c.fill('#spend', '1000'); await c.fill('#leads', '20');
  check('Calc demo works on site', (await c.textContent('#kpis')).includes('50 ج.م'));
  const tp = await ctx.newPage();
  await tp.goto(BASE + 'tools/crm.html', { waitUntil: 'networkidle' });
  for (let y = 0; y < 4000; y += 500) { await tp.evaluate((y) => window.scrollTo(0, y), y); await tp.waitForTimeout(100); }
  await tp.evaluate(() => window.scrollTo(0, 0)); await tp.waitForTimeout(500);
  await tp.screenshot({ path: path.join(SHOTS, 'tool-crm-full.png'), fullPage: true });

  // موبايل
  const m = await b.newContext({ ...require('playwright').devices['iPhone 13'] });
  const mp = await m.newPage();
  await mp.goto(BASE + 'index.html', { waitUntil: 'networkidle' });
  const overflow = await mp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check('mobile: no horizontal scroll', overflow <= 0, String(overflow));
  for (let y = 0; y < 14000; y += 500) { await mp.evaluate((y) => window.scrollTo(0, y), y); await mp.waitForTimeout(80); }
  await mp.evaluate(() => window.scrollTo(0, 0)); await mp.waitForTimeout(600);
  await mp.screenshot({ path: path.join(SHOTS, 'home-mobile.png'), fullPage: true });
  await mp.click('.menu-btn');
  check('mobile menu opens', await mp.$eval('.nav .links', (e) => getComputedStyle(e).display !== 'none'));
  for (const p of ['install.html', 'tools/post.html']) {
    await mp.goto(BASE + p, { waitUntil: 'networkidle' });
    const o = await mp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(`mobile ${p}: no horizontal scroll`, o <= 0, String(o));
  }

  check('no console/page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
  await b.close();
  const f = results.filter((x) => !x).length;
  console.log(`\n${results.length - f}/${results.length} passed`);
  process.exit(f ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });

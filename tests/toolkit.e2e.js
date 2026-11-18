// End-to-end test of Marketer's Toolkit in a real Chromium with the unpacked extension.
// Run: PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS=1 node tests/toolkit.e2e.js
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const OUT = process.env.SHOTS || require('os').tmpdir() + '/mt-shots';
fs.mkdirSync(OUT, { recursive: true });
const ext = path.resolve(__dirname, '../toolkit');
const results = [];
const check = (name, ok, extra = '') => { results.push([ok ? 'PASS' : 'FAIL', name, extra]); console.log(ok ? 'PASS' : 'FAIL', name, extra); };

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAMgAAACWCAIAAAAUvlBOAAAAyklEQVR42u3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPwYJfgAAesJN0kAAAAASUVORK5CYII=', 'base64');

const WA_HTML = `<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>WhatsApp</title>
<style>body{margin:0;font-family:sans-serif;display:flex;height:100vh;background:#efeae2}#pane-side{width:300px;background:#fff;padding:8px}#pane-side div{padding:10px;border-bottom:1px solid #eee}
#main{flex:1;display:flex;flex-direction:column}#main header{background:#f0f2f5;padding:12px}#msgs{flex:1}#main footer{background:#f0f2f5;padding:10px}footer div[contenteditable]{background:#fff;min-height:40px;padding:8px;border-radius:8px;white-space:pre-wrap}</style></head>
<body><div id="pane-side"><div><span dir="auto" title="أحمد محمد">أحمد محمد</span></div><div><span dir="auto" title="سارة علي">سارة علي</span></div><div><span dir="auto" title="+20 100 123 4567">+20 100 123 4567</span></div></div>
<div id="main"><header><span dir="auto" title="أحمد محمد">أحمد محمد</span></header><div id="msgs"></div>
<footer><div contenteditable="true" role="textbox" data-tab="10" id="box"></div></footer></div>
<script>
  window.SENT = 0;
  document.getElementById('box').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); window.SENT++; } });
  // seed IndexedDB like WhatsApp Web
  const rq = indexedDB.open('model-storage', 1);
  rq.onupgradeneeded = () => { const d = rq.result; d.createObjectStore('chat', { keyPath: 'id' }); d.createObjectStore('contact', { keyPath: 'id' }); };
  rq.onsuccess = () => { const tx = rq.result.transaction(['chat','contact'], 'readwrite');
    tx.objectStore('chat').put({ id: '201001234567@c.us', t: 1763400000 });
    tx.objectStore('chat').put({ id: '201112223334@c.us', t: 1763300000 });
    tx.objectStore('contact').put({ id: '201001234567@c.us', name: 'أحمد محمد', isAddressBookContact: true });
    tx.objectStore('contact').put({ id: '201112223334@c.us', pushname: 'سارة علي' });
    tx.oncomplete = () => { window.DB_READY = true; }; };
</script></body></html>`;

const ADS_HTML = `<!doctype html><html><head><meta charset="utf-8"><title>Ad Library</title><style>body{font-family:sans-serif;background:#f0f2f5}.grid{display:grid;grid-template-columns:repeat(3,300px);gap:12px;padding:12px}.ad{background:#fff;border-radius:8px;padding:10px}</style></head><body>
<div class="grid">
 <div class="ad"><div><span>Active</span></div><div><span>Library ID: 1234567890123</span></div><div>Started running on 10 Nov 2026</div>
  <div><a href="https://www.facebook.com/competitorA">Competitor A</a><div>Sponsored</div></div>
  <div>خصم 30% على كل الباقات لحد آخر الشهر. احجز مكانك دلوقتي!</div><img src="https://scontent.xx.fbcdn.net/v/t39/ad1.png" width="280" height="200"><div>See ad details</div></div>
 <div class="ad"><div><span>Inactive</span></div><div><span>Library ID: 9876543210987</span></div><div>Started running on 1 Oct 2026</div>
  <div><a href="https://www.facebook.com/competitorB">Competitor B</a></div><div>أول استشارة مجانًا. ابعتلنا على واتساب.</div><img src="https://scontent.xx.fbcdn.net/v/t39/ad2.png" width="280" height="200"></div>
</div></body></html>`;

const SITE_HTML = `<!doctype html><html lang="ar"><head><meta charset="utf-8"><title>متجر تجريبي | أفضل منتجات العناية بالبشرة في مصر</title>
<meta name="description" content="قصير">
<meta property="og:title" content="متجر تجريبي"><meta name="viewport" content="width=device-width">
<script>!function(){window.fbq=function(){};window.fbq.getState=function(){return{pixels:[{id:'111222333444555'}]}}}();fbq('init','111222333444555');</script>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-ABC123XYZ"></script>
<script>window.dataLayer=[];function gtag(){} gtag('config','G-ABC123XYZ'); gtag('config','AW-987654321');</script>
<script>window.ttq={_i:{'CABCDEFGHIJ1234567':[]}};</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","name":"x"}</script>
</head><body><h1>منتجات العناية</h1><h1>عنوان تاني</h1><img src="data:,"><p>كلام كتير عن المنتجات</p></body></html>`;

(async () => {
  const ctx = await chromium.launchPersistentContext(require('os').tmpdir() + '/mt-profile-' + Date.now(), {
    channel: 'chromium', headless: true, viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1,
    args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
  });
  const errors = [];
  ctx.on('weberror', (e) => errors.push(e.error().message));
  await ctx.route('https://web.whatsapp.com/**', (r) => r.fulfill({ contentType: 'text/html; charset=utf-8', body: WA_HTML }));
  await ctx.route('https://www.facebook.com/ads/library/**', (r) => r.fulfill({ contentType: 'text/html; charset=utf-8', body: ADS_HTML }));
  await ctx.route('https://scontent.xx.fbcdn.net/**', (r) => r.fulfill({ contentType: 'image/png', body: PNG }));
  await ctx.route('https://shop.example.com/**', (r) => r.fulfill({ contentType: 'text/html; charset=utf-8', body: SITE_HTML }));
  let notionCalls = [];
  await ctx.route('https://api.notion.com/**', async (r) => {
    const req = r.request();
    notionCalls.push([req.method(), req.url(), req.postData()]);
    if (req.method() === 'GET') return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ title: [{ plain_text: 'Personal Brand Content System' }], properties: { 'Name': { type: 'title', title: {} }, 'Link': { type: 'url', url: {} }, 'Status': { type: 'select', select: { options: [{ name: 'Idea' }, { name: 'Draft' }] } }, 'Created': { type: 'date', date: {} } } }) });
    return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ object: 'page', url: 'https://www.notion.so/test-page-123' }) });
  });

  let [sw] = ctx.serviceWorkers();
  if (!sw) sw = await ctx.waitForEvent('serviceworker');
  const id = sw.url().split('/')[2];
  const base = `chrome-extension://${id}/`;
  const store = (k) => sw.evaluate((k) => chrome.storage.local.get(k).then((r) => r[k]), k);

  // ============ WhatsApp: quick replies ============
  const wa = await ctx.newPage();
  wa.on('console', (m) => { if (m.type() === 'error') errors.push('wa: ' + m.text()); });
  await wa.goto('https://web.whatsapp.com/');
  await wa.waitForFunction(() => window.DB_READY);
  await wa.waitForSelector('.mt-fab', { timeout: 8000 });
  check('WhatsApp: CRM button injected', true);
  await wa.click('#box');
  await wa.keyboard.type('/سع');
  await wa.waitForSelector('.mt-menu .mt-item', { timeout: 3000 });
  const menuText = await wa.textContent('.mt-menu');
  check('WhatsApp: "/" opens replies menu filtered', menuText.includes('/سعر') && !menuText.includes('/شكرا'), menuText.slice(0, 80));
  await wa.screenshot({ path: OUT + '/wa-menu.png' });
  await wa.keyboard.press('Enter');
  await wa.waitForTimeout(300);
  const boxText = await wa.textContent('#box');
  check('WhatsApp: reply inserted with first name', boxText.includes('أكيد يا أحمد،') && !boxText.includes('/سع'), JSON.stringify(boxText.slice(0, 60)));
  check('WhatsApp: Enter did NOT send the message', (await wa.evaluate(() => window.SENT)) === 0);

  // ============ WhatsApp: CRM panel ============
  await wa.click('.mt-fab');
  await wa.waitForSelector('.mt-panel .mt-tag');
  await wa.click('.mt-tag[data-t="مهتم"]');
  await wa.fill('.mt-note', 'طلب عرض سعر باقة الشهر');
  await wa.click('.mt-quick button[data-q="tom"]');
  await wa.screenshot({ path: OUT + '/wa-crm.png' });
  await wa.click('.mt-save');
  await wa.waitForTimeout(600);
  const crm = await store('crm');
  const e = crm && crm['أحمد محمد'];
  check('CRM: entry saved with tag/note/reminder', !!e && e.tag === 'مهتم' && e.note.includes('عرض سعر') && e.remindAt > Date.now(), JSON.stringify(e || {}).slice(0, 120));
  await wa.waitForTimeout(500);
  const alarms = await sw.evaluate(() => chrome.alarms.getAll());
  check('CRM: reminder alarm scheduled', alarms.some((a) => a.name === 'crm|أحمد محمد'), alarms.map((a) => a.name).join(','));
  const badge = await wa.$eval('#pane-side', (s) => (s.querySelector('.mt-badge') || {}).textContent || '');
  check('CRM: tag badge shown in chat list', badge === 'مهتم', badge);
  await wa.screenshot({ path: OUT + '/wa-badge.png' });

  // ============ ContactHarvest via popup ============
  const pop = await ctx.newPage();
  await pop.goto(base + 'popup.html');
  await pop.evaluate(async () => {
    const [t] = await chrome.tabs.query({ url: 'https://web.whatsapp.com/*' });
    chrome.tabs.query = async () => [t];
  });
  await pop.screenshot({ path: OUT + '/popup-home.png' });
  await pop.click('#qa-harvest');
  const [dl] = await Promise.all([pop.waitForEvent('download'), pop.click('#go')]);
  await dl.saveAs(OUT + '/' + dl.suggestedFilename());
  check('ContactHarvest: xlsx downloaded from popup', /ContactHarvest-.*\.xlsx/.test(dl.suggestedFilename()), (await pop.textContent('#status')).trim());

  // ============ Ad Library ============
  const ads = await ctx.newPage();
  await ads.goto('https://www.facebook.com/ads/library/?q=test');
  await ads.waitForSelector('.mt-save-ad', { timeout: 8000 });
  const nBtns = await ads.$$eval('.mt-save-ad', (b) => b.length);
  check('Ad Library: save button on each ad', nBtns === 2, String(nBtns));
  await ads.click('.mt-save-ad >> nth=0');
  await ads.waitForFunction(() => document.querySelector('.mt-save-ad').classList.contains('mt-done'), null, { timeout: 8000 });
  await ads.screenshot({ path: OUT + '/adlib.png' });
  const savedAds = await store('ads');
  const a0 = savedAds && savedAds[0];
  check('Ad Library: ad saved with id/page/text', !!a0 && a0.id === '1234567890123' && a0.competitor === 'Competitor A' && a0.text.includes('خصم 30%') && a0.active === true, JSON.stringify({ ...a0, image: (a0 && a0.image || '').slice(0, 30) }).slice(0, 200));
  check('Ad Library: image captured', !!(a0 && a0.image && a0.image.startsWith('data:image')), (a0 && a0.image || '').slice(0, 30));

  // ============ Inspector (inject in a real site page, render in popup) ============
  const site = await ctx.newPage();
  await site.goto('https://shop.example.com/');
  await site.addScriptTag({ path: ext + '/tools/inspector.js' });
  const insp = await site.evaluate(() => inspectPage());
  const names = insp.trackers.map((t) => t.name + ':' + t.ids.join('|'));
  check('Inspector: Meta Pixel + id', names.some((n) => n === 'Meta Pixel:111222333444555'), names.join(' ; '));
  check('Inspector: GA4 + Google Ads + TikTok', names.some((n) => n.startsWith('Google Analytics 4:G-ABC123XYZ')) && names.some((n) => n.startsWith('Google Ads:AW-987654321')) && names.some((n) => n.startsWith('TikTok Pixel:CABCDEFGHIJ1234567')));
  const checks = await site.evaluate(() => seoChecks(inspectPage().seo));
  check('Inspector: SEO flags 2×H1, short desc, missing og:image', checks.some(([l, m]) => l === 'warn' && m.includes('2 عناوين H1')) && checks.some(([l, m]) => m.includes('طول الوصف')) && checks.some(([l, m]) => l === 'bad' && m.includes('og:image')));
  // popup rendering of the inspector with a mocked executeScript result
  const pop2 = await ctx.newPage();
  await pop2.goto(base + 'popup.html');
  await pop2.evaluate((d) => {
    chrome.tabs.query = async () => [{ id: 1, url: 'https://shop.example.com/', title: 'x' }];
    chrome.scripting.executeScript = async () => [{ result: d }];
  }, insp);
  await pop2.click('#qa-inspect');
  await pop2.waitForSelector('#copy-report');
  await pop2.setViewportSize({ width: 360, height: 900 });
  await pop2.screenshot({ path: OUT + '/popup-inspect.png', fullPage: true });
  check('Inspector: popup report rendered', (await pop2.textContent('#inspect-out')).includes('Meta Pixel'));

  // ============ Dashboard tabs ============
  const app = await ctx.newPage();
  app.on('pageerror', (e) => errors.push('app: ' + e.message));
  for (const tab of ['replies', 'crm', 'walink', 'post', 'ads', 'notion', 'utm', 'calc']) {
    await app.goto(base + 'app.html#' + tab);
    await app.waitForTimeout(400);
    const h1 = await app.textContent('h1');
    check(`Dashboard tab "${tab}" renders`, !!h1, h1);
  }
  // wa link
  await app.goto(base + 'app.html#walink');
  await app.fill('#phone', '01012345678');
  await app.fill('#code', 'fb-ramadan');
  await app.waitForTimeout(200);
  const waOut = await app.textContent('#out');
  check('WA link: Egyptian number normalized + code appended', waOut.startsWith('https://wa.me/201012345678?text=') && decodeURIComponent(waOut).includes('(كود: fb-ramadan)'), waOut.slice(0, 70));
  check('WA link: QR rendered', await app.$('#qr svg path') !== null);
  await app.click('#save');
  await app.screenshot({ path: OUT + '/app-walink.png', fullPage: true });
  // utm
  await app.goto(base + 'app.html?url=' + encodeURIComponent('https://shop.example.com/offer?ref=1#top') + '#utm');
  await app.fill('#u-source', 'Facebook');
  await app.fill('#u-medium', 'paid_social');
  await app.fill('#u-campaign', 'Ramadan Sale 2026');
  await app.click('#u-content'); // blur normalizes
  await app.waitForTimeout(200);
  const utmOut = await app.textContent('#out');
  check('UTM: built + normalized + keeps existing params/hash', utmOut === 'https://shop.example.com/offer?ref=1&utm_source=facebook&utm_medium=paid_social&utm_campaign=ramadan-sale-2026#top', utmOut);
  await app.click('#meta');
  const metaOut = await app.textContent('#out');
  check('UTM: Meta dynamic params kept raw', metaOut.includes('utm_campaign={{campaign.name}}'), metaOut.slice(0, 140));
  await app.click('#save');
  await app.screenshot({ path: OUT + '/app-utm.png', fullPage: true });
  // post checker
  await app.goto(base + 'app.html#post');
  await app.fill('#cap', 'التسويق مش بوستات وإعلانات وبس، ده نظام كامل بيبدأ من فهم السوق والعميل وبيخلص بالقياس\n\nكلام كتير هنا.\n\n#تسويق #براند #تسويق #مصر #ماركتنج #بيزنس');
  await app.fill('#design', 'التسويق نظام');
  await app.waitForTimeout(300);
  const chk = await app.textContent('#checks');
  check('Post: flags long hook, too many/dup hashtags, no CTA, short design text', chk.includes('الـ Hook طويل') && chk.includes('6 هاشتاج') && chk.includes('متكرر') && chk.includes('مفيش CTA') && chk.includes('النص على التصميم 2 كلمة'), chk.slice(0, 200));
  await app.click('#ctas [data-i="0"]');
  await app.waitForTimeout(200);
  check('Post: CTA insert clears CTA warning', (await app.textContent('#checks')).includes('فيه CTA'));
  const capNow = await app.inputValue('#cap');
  check('Post: CTA inserted before hashtags', capNow.indexOf('ابعتلنا رسالة') < capNow.indexOf('#تسويق') && capNow.trim().endsWith('#بيزنس'), JSON.stringify(capNow.slice(-80)));
  await app.screenshot({ path: OUT + '/app-post.png', fullPage: true });
  // calc
  await app.goto(base + 'app.html#calc');
  for (const [k, v] of [['spend', 10000], ['impressions', 500000], ['clicks', 5000], ['leads', 200], ['customers', 20], ['revenue', 40000], ['targetCustomers', 50], ['cpl', 40], ['closeRate', 10]]) await app.fill('#' + k, String(v));
  await app.waitForTimeout(300);
  const kp = await app.textContent('#kpis');
  const plan = await app.textContent('#plan');
  check('Calc: KPIs (CPM 20, CTR 1%, CPL 50, CAC 500, ROAS 4x, ROI 300%)', ['20 ج.م', '1%', '50 ج.م', '500 ج.م', '4x', '300%'].every((s) => kp.includes(s)), kp.replace(/\s+/g, ' ').slice(0, 220));
  check('Calc: plan (500 leads, 20,000 budget)', plan.includes('500') && plan.includes('20,000 ج.م'), plan.replace(/\s+/g, ' ').slice(0, 160));
  await app.screenshot({ path: OUT + '/app-calc.png', fullPage: true });
  // crm + ads dashboards
  await app.goto(base + 'app.html#crm');
  await app.waitForTimeout(300);
  check('CRM dashboard lists the WhatsApp entry', (await app.textContent('#tbl')).includes('أحمد محمد'));
  await app.screenshot({ path: OUT + '/app-crm.png', fullPage: true });
  await app.goto(base + 'app.html#ads');
  await app.waitForTimeout(300);
  check('Ads dashboard shows saved ad', (await app.$eval('#grid .cp', (i) => i.value)) === 'Competitor A' && (await app.textContent('#grid')).includes('خصم 30%'));
  check('Ads: button text not captured in ad text', !/جاري الحفظ|احفظ في الأرشيف/.test(a0.text), a0.text.slice(0, 60));
  await app.screenshot({ path: OUT + '/app-ads.png', fullPage: true });
  await app.goto(base + 'app.html#replies');
  await app.waitForTimeout(300);
  await app.screenshot({ path: OUT + '/app-replies.png', fullPage: true });

  // ============ Notion (mocked API) ============
  await app.goto(base + 'app.html#notion');
  await app.fill('#token', 'ntn_test_123');
  await app.fill('#db', 'https://www.notion.so/myws/0123456789abcdef0123456789abcdef?v=1');
  await app.click('#test');
  await app.waitForSelector('#map:not([hidden])', { timeout: 8000 }).catch(() => {});
  const ts = await app.textContent('#tstatus');
  check('Notion: connection test reads schema', ts.includes('Personal Brand Content System'), ts.trim());
  await app.selectOption('#extraProp', 'Status');
  await app.fill('#extraValue', 'Idea');
  await app.selectOption('#dateProp', 'Created');
  await app.click('#trial');
  await app.waitForTimeout(1200);
  const post = notionCalls.find((c) => c[0] === 'POST');
  const body = post ? JSON.parse(post[2]) : {};
  check('Notion: page created with title/url/status/date', !!post && body.parent.database_id === '0123456789abcdef0123456789abcdef' && body.properties.Name && body.properties.Link.url && body.properties.Status.select.name === 'Idea' && !!body.properties.Created, post ? post[2].slice(0, 200) : 'no POST');
  await app.screenshot({ path: OUT + '/app-notion.png', fullPage: true });

  // ============ Summary ============
  const nonFatal = errors.filter((x) => !/favicon/.test(x));
  check('No page errors', nonFatal.length === 0, nonFatal.join(' | ').slice(0, 300));
  const failed = results.filter((r) => r[0] === 'FAIL').length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  await ctx.close();
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error('CRASH', e); process.exit(2); });

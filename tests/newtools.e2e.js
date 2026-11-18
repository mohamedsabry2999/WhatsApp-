// اختبار الأدوات الجديدة: DiscountCheck، SocialSizer، BriefBuilder، GrowthScore (على الموقع)
// + حفظ البريف على Notion (من الإضافة، مع Notion API وهمي)
// Run: (serve site/ on :8790) then  PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS=1 node tests/newtools.e2e.js
const { chromium } = require('playwright');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const BASE = process.env.SITE || 'http://localhost:8790/';
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'mt-new-'));
const results = [];
const check = (n, ok, x = '') => { results.push(ok); console.log(ok ? 'PASS' : 'FAIL', n, x); };

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1400, height: 900 }, acceptDownloads: true });
  const errors = [];
  ctx.on('weberror', (e) => errors.push(e.error().message));

  // ===== DiscountCheck =====
  const d = await ctx.newPage();
  await d.goto(BASE + 'tools/discount.html', { waitUntil: 'networkidle' });
  for (const [k, v] of [['price', 500], ['cost', 300], ['units', 100], ['fixed', 10000]]) await d.fill('#d-' + k, String(v));
  await d.click('[data-d="20"]');
  let vt = await d.textContent('#d-verdict');
  check('Discount: 40% margin + 20% off → +100% sales, 200 units', vt.includes('+100%') && vt.includes('200'), vt.replace(/\s+/g, ' ').slice(0, 120));
  const kp = await d.textContent('#d-kpis');
  check('Discount: break-even 50 → 100 units, max discount 40%', kp.includes('50 بيعة') && kp.includes('100 بيعة') && kp.includes('40%'), kp.replace(/\s+/g, ' ').slice(0, 200));
  await d.click('[data-d="50"]');
  vt = await d.textContent('#d-verdict');
  check('Discount: 50% off → loss on every sale', vt.includes('خسارة في كل بيعة'), vt.replace(/\s+/g, ' ').slice(0, 80));
  await d.click('[data-d="10"]');
  vt = await d.textContent('#d-verdict');
  check('Discount: 10% off → +33.3%', vt.includes('+33.3%'), vt.replace(/\s+/g, ' ').slice(0, 80));

  // ===== SocialSizer =====
  const imgPath = path.join(TMP, 'test-photo.png');
  execFileSync('python3', ['-c', `from PIL import Image, ImageDraw
im=Image.new('RGB',(2000,1000),(30,30,30)); dr=ImageDraw.Draw(im)
dr.rectangle((1500,300,1900,700),fill=(199,22,29)); dr.ellipse((200,200,700,700),fill=(240,240,240))
im.save(${JSON.stringify(imgPath)})`]);
  const r = await ctx.newPage();
  await r.goto(BASE + 'tools/resizer.html', { waitUntil: 'networkidle' });
  await r.setInputFiles('#r-file', imgPath);
  await r.waitForSelector('#r-out canvas');
  const dims = await r.$$eval('#r-out canvas', (cs) => cs.map((c) => `${c.width}x${c.height}`));
  check('Resizer: default 6 sizes rendered at exact dimensions', dims.join(',') === '1080x1350,1080x1080,1080x1920,1200x630,1200x627,1600x900', dims.join(','));
  // نقطة التركيز على اليمين (المربع الأحمر) ← القص لازم يجيب الأحمر في نص الـ story
  const box = await r.$('#r-img');
  await box.scrollIntoViewIfNeeded();
  const bb = await box.boundingBox();
  await r.mouse.click(bb.x + bb.width * 0.85, bb.y + bb.height * 0.5);
  await r.waitForTimeout(300);
  const center = await r.$$eval('#r-out canvas', (cs) => { const c = cs[2]; const p = c.getContext('2d').getImageData(c.width / 2, c.height / 2, 1, 1).data; return [p[0], p[1], p[2]]; });
  check('Resizer: focal point moves the crop (story center is the red square)', center[0] > 150 && center[1] < 60, center.join(','));
  await r.check('input[name="r-mode"][value="fit"]');
  await r.click('[data-bg="#FFFFFF"]');
  await r.waitForTimeout(300);
  const corner = await r.$$eval('#r-out canvas', (cs) => { const c = cs[2]; const p = c.getContext('2d').getImageData(5, 5, 1, 1).data; return [p[0], p[1], p[2]]; });
  check('Resizer: fit mode pads with chosen white background', corner.every((v) => v > 245), corner.join(','));
  await r.fill('#r-cw', '640'); await r.fill('#r-ch', '480'); await r.press('#r-ch', 'Tab');
  await r.waitForTimeout(300);
  const n = await r.$$eval('#r-out canvas', (cs) => cs.length);
  check('Resizer: custom size added', n === 7, String(n));
  const [zipDl] = await Promise.all([r.waitForEvent('download'), r.click('#r-zip')]);
  const zipPath = path.join(TMP, 'out.zip'); await zipDl.saveAs(zipPath);
  const zinfo = execFileSync('python3', ['-c', `import zipfile,io
from PIL import Image
z=zipfile.ZipFile(${JSON.stringify(zipPath)})
print(';'.join(f"{n}={Image.open(io.BytesIO(z.read(n))).size}" for n in z.namelist()))`]).toString().trim();
  check('Resizer: ZIP has 7 valid images with right sizes', zinfo.split(';').length === 7 && zinfo.includes('story-1080x1920.jpg=(1080, 1920)') && zinfo.includes('custom-640x480.jpg=(640, 480)'), zinfo.slice(0, 160));
  await r.locator('#try').screenshot({ path: path.join(TMP, 'resizer.png') });

  // ===== BriefBuilder =====
  const br = await ctx.newPage();
  await br.goto(BASE + 'tools/brief.html', { waitUntil: 'networkidle' });
  await br.fill('[data-k="idea"]', 'التسويق مش بوستات، ده منظومة قرارات');
  await br.selectOption('[data-k="axis"]', { index: 7 });
  await br.fill('[data-k="hook"]', 'لو كل شهر بتبدأ من الصفر يبقى عندك أنشطة مش منظومة ومحتاج تراجع كل حاجة من الأول');
  await br.fill('[data-k="designText"]', 'التسويق منظومة قرارات مش أنشطة');
  await br.click('[data-meta="GPS"]');
  await br.fill('[data-k="scene"]', 'GPS بيعيد حساب الطريق مع كل منعطف');
  await br.fill('[data-k="cta"]', 'احفظ البوست ترجعله وقت الخطة');
  await br.waitForTimeout(300);
  const prompt = await br.textContent('#b-prompt');
  check('Brief: prompt follows guide order and keeps exact Arabic text', prompt.startsWith('Role: Senior Creative Director.') && prompt.includes('"التسويق منظومة قرارات مش أنشطة"') && prompt.includes('Creative visual metaphor: GPS') && prompt.indexOf('Strategic message') < prompt.indexOf('Exact Arabic text') && prompt.includes('Output ratio 4:5') && prompt.includes('no company logos'), prompt.slice(0, 120));
  const chk = await br.textContent('#b-checks');
  check('Brief: flags long hook, accepts 5-word design text', chk.includes('الـ Hook') && chk.includes('خليه 12 أو أقل') && chk.includes('نص التصميم 5 كلمة'), chk.slice(0, 160));
  await br.selectOption('[data-k="type"]', 'Reel / Video');
  check('Brief: Reel → 9:16', (await br.textContent('#b-prompt')).includes('9:16'));
  const [md] = await Promise.all([br.waitForEvent('download'), br.click('#b-md')]);
  const mdText = fs.readFileSync(await md.path(), 'utf8');
  const nums = [...mdText.matchAll(/^(\d+)\. \*\*/gm)].map((m) => +m[1]);
  check('Brief: Markdown has all 16 items in order + video rules', nums.join(',') === Array.from({ length: 16 }, (_, i) => i + 1).join(',') && mdText.includes('قواعد الفيديو'), nums.join(','));
  await br.click('#b-save');
  await br.waitForTimeout(300);
  check('Brief: saved to library', (await br.textContent('#b-lib')).includes('التسويق مش بوستات'));
  check('Brief: no Notion button on the website', (await br.$('#b-notion')) === null);
  await br.reload({ waitUntil: 'networkidle' });
  check('Brief: draft restored after reload', (await br.inputValue('[data-k="idea"]')).includes('منظومة قرارات'));

  // ===== GrowthScore =====
  const a = await ctx.newPage();
  await a.goto(BASE + 'tools/audit.html', { waitUntil: 'networkidle' });
  await a.fill('#a-co', 'شركة تجربة');
  // كل حاجة "أيوه" ماعدا مرحلة 4 (لأ) ومرحلة 8 (جزئيًا)
  for (let stage = 0; stage < 8; stage++) {
    const v = stage === 3 ? 0 : stage === 7 ? 1 : 2;
    for (let q = 0; q < 3; q++) { await a.click(`[data-q="${q}"][data-v="${v}"]`); await a.waitForTimeout(60); }
    await a.waitForTimeout(450); // بيتنقل للمرحلة اللي بعدها لوحده
  }
  await a.click('#a-res');
  await a.waitForSelector('#audit-report');
  const rep = await a.textContent('#audit-report');
  // (6×100 + 0 + 50) / 8 = 81.25 → 81
  check('Audit: score 81 → "منظومة ناضجة"', rep.includes('81') && rep.includes('منظومة ناضجة'), rep.replace(/\s+/g, ' ').slice(0, 90));
  const pr = await a.$$eval('#audit-report .pill.red', (ps) => ps.map((p) => p.parentElement.textContent.replace(/\s+/g, ' ').trim()));
  check('Audit: priority #1 = اختيار السوق, #2 = القياس', pr[0].includes('اختيار السوق') && pr[1].includes('القياس'), pr.join(' | '));
  check('Audit: stages at 100/100 are not listed as priorities', pr.length === 2, String(pr.length));
  const links = await a.$$eval('#audit-report a.btn', (as) => as.map((x) => x.getAttribute('href')));
  check('Audit: recommendations link to tool pages', links.includes('utm.html') && links.includes('calc.html'), links.join(','));
  await a.locator('#try').screenshot({ path: path.join(TMP, 'audit.png') });
  const pdf = path.join(TMP, 'audit.pdf');
  await a.evaluate(() => { window.print = () => {}; });
  await a.click('#a-print');
  await a.emulateMedia({ media: 'print' });
  await a.pdf({ path: pdf, printBackground: true, format: 'A4' });
  const pages = execFileSync('pdfinfo', [pdf]).toString().match(/Pages:\s+(\d+)/)[1];
  const pdfText = execFileSync('pdftotext', [pdf, '-']).toString();
  check('Audit: PDF report = 1-2 pages with score + priorities', +pages <= 2 && pdfText.includes('81') && pdfText.includes('GrowthScore'), `pages=${pages}`);
  execFileSync('pdftoppm', ['-r', '60', '-png', '-f', '1', '-l', '1', pdf, path.join(TMP, 'audit-pdf')]);
  await a.emulateMedia({ media: 'screen' });

  check('No page errors', errors.length === 0, errors.slice(0, 4).join(' | '));
  await b.close();

  // ===== BriefBuilder → Notion (الإضافة) =====
  const ext = path.resolve(__dirname, '../toolkit');
  const ectx = await chromium.launchPersistentContext(path.join(TMP, 'profile'), { channel: 'chromium', headless: true, args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`] });
  const calls = [];
  await ectx.route('https://api.notion.com/**', (rt) => { calls.push(rt.request().postData()); rt.fulfill({ contentType: 'application/json', body: JSON.stringify({ url: 'https://www.notion.so/x' }) }); });
  let [sw] = ectx.serviceWorkers(); if (!sw) sw = await ectx.waitForEvent('serviceworker');
  await sw.evaluate(() => chrome.storage.local.set({ notion: { token: 't', dbId: '0123456789abcdef0123456789abcdef', titleProp: 'Name' } }));
  const p = await ectx.newPage();
  await p.goto(`chrome-extension://${sw.url().split('/')[2]}/app.html#brief`);
  await p.fill('[data-k="idea"]', 'فكرة للتجربة');
  await p.fill('[data-k="designText"]', 'نص تصميم من خمس كلمات');
  await p.fill('[data-k="caption"]', 'كابشن للتجربة');
  await p.click('#b-notion');
  await p.waitForTimeout(1200);
  const body = calls[0] ? JSON.parse(calls[0]) : { children: [] };
  const types = body.children.map((c) => c.type);
  check('Brief → Notion: sections as headings + prompt as code block', types.filter((t) => t === 'heading_3').length === 6 && types.includes('code') && body.properties.Name.title[0].text.content === 'فكرة للتجربة', types.join(','));
  await ectx.close();

  const f = results.filter((x) => !x).length;
  console.log(`\n${results.length - f}/${results.length} passed  (shots: ${TMP})`);
  process.exit(f ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });

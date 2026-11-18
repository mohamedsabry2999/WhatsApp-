// بيصوّر الأدوات الحقيقية (الإضافة نفسها) على صفحات تجريبية، عشان صور الموقع.
// Run: PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS=1 node tests/shots.js
const { chromium } = require('playwright');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const ext = path.join(ROOT, 'toolkit');
const OUT = path.join(ROOT, 'site', 'assets', 'shots');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'mt-shots-'));
fs.mkdirSync(OUT, { recursive: true });

const AV = ['#C7161D', '#111', '#6B6B6B', '#9E1018', '#333', '#9A9A9A', '#C7161D', '#444'];
const CHATS = [['أحمد محمد', 'تمام، ابعتلي العرض', '10:42'], ['سارة علي', 'هل فيه باقة شهرية؟', '10:15'], ['شركة النور للتجارة', 'محتاجين ميعاد الأسبوع ده', '09:58'], ['كريم حسن', 'شكرًا جدًا 🙏', 'أمس'], ['+20 112 555 0198', 'السلام عليكم، شفت الإعلان', 'أمس'], ['منى عادل', 'هبعتلك التفاصيل بكرة', 'الأحد'], ['يوسف إبراهيم', 'تمام كده', 'السبت']];
const WA_HTML = `<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>Chat</title><style>
body{margin:0;font:14px "Segoe UI",Tahoma,sans-serif;display:flex;height:100vh;background:#f0f2f5;color:#111}
#pane-side{width:340px;background:#fff;border-left:1px solid #e9edef;overflow:hidden}
.sh{height:60px;background:#f0f2f5;display:flex;align-items:center;padding:0 16px;gap:10px}.sh .av{width:40px;height:40px;border-radius:50%;background:#ccc}
.search{margin:8px 12px;background:#f0f2f5;border-radius:8px;padding:8px 14px;color:#888}
.row{display:flex;gap:12px;padding:10px 14px;align-items:center;border-bottom:1px solid #f2f2f2}.row.on{background:#f0f2f5}
.row .av{width:46px;height:46px;border-radius:50%;flex:none;display:grid;place-items:center;color:#fff;font-weight:700}
.row .tx{flex:1;min-width:0}.row .t1{display:flex;justify-content:space-between}.row .t1 span[title]{font-size:16px}.row .t1 i{font-style:normal;color:#888;font-size:12px}
.row .t2{color:#667781;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#main{flex:1;display:flex;flex-direction:column}
#main header{height:60px;background:#f0f2f5;display:flex;align-items:center;gap:12px;padding:0 16px;border-right:1px solid #e9edef}
#main header .av{width:40px;height:40px;border-radius:50%;background:#C7161D;color:#fff;display:grid;place-items:center;font-weight:700}
#main header small{display:block;color:#667781;font-size:12px}
#msgs{flex:1;background:#efeae2;background-image:radial-gradient(rgba(0,0,0,.035) 1px,transparent 1px);background-size:18px 18px;padding:20px 60px;display:flex;flex-direction:column;gap:8px}
.m{max-width:60%;padding:7px 10px 8px;border-radius:8px;box-shadow:0 1px .5px rgba(0,0,0,.13);font-size:14.5px}.m.in{background:#fff;align-self:flex-start}.m.out{background:#d9fdd3;align-self:flex-end}
.m i{display:block;font-style:normal;text-align:left;color:#667781;font-size:11px;margin-top:2px}
#main footer{background:#f0f2f5;padding:10px 16px;display:flex;gap:12px;align-items:center}#main footer .ic{color:#54656f;font-size:20px}
#box{flex:1;background:#fff;min-height:42px;padding:10px 14px;border-radius:8px;white-space:pre-wrap;outline:none}
</style></head><body>
<div id="pane-side"><div class="sh"><div class="av"></div></div><div class="search">بحث أو بدء محادثة جديدة</div>
${CHATS.map(([n, m, t], i) => `<div class="row${i === 0 ? ' on' : ''}"><div class="av" style="background:${AV[i]}">${n.startsWith('+') ? '#' : n[0]}</div><div class="tx"><div class="t1"><span dir="auto" title="${n}">${n}</span><i>${t}</i></div><div class="t2">${m}</div></div></div>`).join('')}</div>
<div id="main"><header><div class="av">أ</div><div><span dir="auto" title="أحمد محمد">أحمد محمد</span><small>متصل الآن</small></div></header>
<div id="msgs"><div class="m in">السلام عليكم، شفت إعلانكم على فيسبوك<i>10:31</i></div><div class="m in">ممكن أعرف الأسعار والباقات؟<i>10:32</i></div><div class="m out">أهلًا يا أحمد، نورتنا 👋<i>10:35</i></div><div class="m in">تمام، ابعتلي العرض<i>10:42</i></div></div>
<footer><span class="ic">☺</span><span class="ic">＋</span><div contenteditable="true" role="textbox" id="box"></div><span class="ic">🎤</span></footer></div>
<script>const rq=indexedDB.open('model-storage',1);rq.onupgradeneeded=()=>{const d=rq.result;d.createObjectStore('chat',{keyPath:'id'});d.createObjectStore('contact',{keyPath:'id'})};
rq.onsuccess=()=>{const tx=rq.result.transaction(['chat','contact'],'readwrite');const c=tx.objectStore('chat'),k=tx.objectStore('contact');
[['201001234567','أحمد محمد',1],['201112223334','سارة علي',0],['201223334445','شركة النور للتجارة',1],['201098887776','كريم حسن',1],['201125550198','',0],['201067778889','منى عادل',1],['201554443332','يوسف إبراهيم',0]].forEach(([p,n,s],i)=>{c.put({id:p+'@c.us',t:Math.floor(Date.now()/1000)-600-i*5400});k.put(s?{id:p+'@c.us',name:n,isAddressBookContact:true}:{id:p+'@c.us',pushname:n})});tx.oncomplete=()=>{window.DB_READY=true}};</script>
</body></html>`;

const creative = (bg, fg, t1, t2) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="420"><rect width="600" height="420" fill="${bg}"/><circle cx="520" cy="60" r="140" fill="${fg}" opacity=".12"/><text x="300" y="190" font-family="Tahoma" font-size="56" font-weight="700" fill="${fg}" text-anchor="middle">${t1}</text><text x="300" y="260" font-family="Tahoma" font-size="28" fill="${fg}" text-anchor="middle" opacity=".8">${t2}</text></svg>`);
const ADS = [['Competitor A', 'خصم 30% على كل الباقات لحد آخر الشهر. احجز مكانك دلوقتي!', creative('#111', '#fff', 'خصم 30%', 'لحد آخر الشهر'), 'Active', '10 Nov 2026', '1234567890123'],
  ['Brand Studio', 'أول استشارة مجانًا. ابعتلنا على واتساب ونرد عليك في نفس اليوم.', creative('#C7161D', '#fff', 'استشارة مجانية', 'ابعتلنا على واتساب'), 'Active', '2 Nov 2026', '2345678901234'],
  ['Growth Lab', 'كورس التسويق الرقمي: 8 أسابيع، شغل عملي على حملات حقيقية.', creative('#f2f2f2', '#111', 'كورس 8 أسابيع', 'سجّل دلوقتي'), 'Inactive', '1 Oct 2026', '3456789012345']];
const ADS_HTML = `<!doctype html><html><head><meta charset="utf-8"><title>Ad Library</title><style>body{margin:0;font:14px "Segoe UI",Helvetica,Arial,sans-serif;background:#f0f2f5;color:#1c1e21}
.top{background:#fff;height:56px;display:flex;align-items:center;padding:0 20px;gap:16px;box-shadow:0 1px 2px rgba(0,0,0,.1)}.top b{font-size:18px}.top .s{flex:1;max-width:520px;background:#f0f2f5;border-radius:20px;padding:9px 16px;color:#65676b}
.res{padding:18px 24px 4px;color:#65676b}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding:12px 24px 24px}.ad{background:#fff;border-radius:8px;box-shadow:0 1px 2px rgba(0,0,0,.15);padding:14px;font-size:13px}
.st{display:flex;gap:6px;align-items:center;font-weight:600}.st i{width:8px;height:8px;border-radius:50%;background:#31a24c}.st.off i{background:#999}.mt{color:#65676b;margin:4px 0}
.pg{display:flex;gap:8px;align-items:center;margin:12px 0 8px;font-weight:700}.pg .lg{width:32px;height:32px;border-radius:50%;background:#ddd}.pg a{color:#1c1e21;text-decoration:none}.sp{color:#65676b;font-weight:400;font-size:12px}
.body{direction:rtl;text-align:right;margin:6px 0 10px;font-size:14px}.ad img{width:100%;border-radius:4px;display:block}.det{margin-top:10px;border:1px solid #ccd0d5;border-radius:6px;text-align:center;padding:7px;font-weight:600}</style></head><body>
<div class="top"><b>Ad Library</b><div class="s">Search by keyword or advertiser</div></div><div class="res">~36 results</div>
<div class="grid">${ADS.map(([p, t, img, st, d, id]) => `<div class="ad"><div class="st${st === 'Active' ? '' : ' off'}"><i></i><span>${st}</span></div><div class="mt"><span>Library ID: ${id}</span></div><div class="mt">Started running on ${d}</div>
<div class="pg"><span class="lg"></span><div><a href="https://www.facebook.com/${p.replace(/\s/g, '')}">${p}</a><div class="sp">Sponsored</div></div></div><div class="body">${t}</div><img src="https://scontent.xx.fbcdn.net/v/${id}.png" width="600" height="420"><div class="det">See ad details</div></div>`).join('')}</div></body></html>`;

const SITE_HTML = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>متجر نور | منتجات عناية طبيعية</title><meta name="description" content="منتجات عناية بالبشرة طبيعية 100% بتوصيل لكل مصر.">
<meta property="og:title" content="متجر نور"><meta property="og:image" content="https://shop.example.com/og.jpg"><meta name="viewport" content="width=device-width"><link rel="canonical" href="https://shop.example.com/">
<script>window.fbq=function(){};fbq.getState=()=>({pixels:[{id:'482910374651203'}]});</script><script src="https://www.googletagmanager.com/gtm.js?id=GTM-K7P2QX9"></script><script>window.google_tag_manager={'GTM-K7P2QX9':{},'G-4XN8PL2M1Q':{}};gtag=function(){};gtag('config','AW-1029384756');</script><script>window.ttq={_i:{'CQ8M2N4P5R6S7T8U9V0W':[]}};window.clarity=function(){};</script><script type="application/ld+json">{"@type":"Organization"}</script>
<style>body{margin:0;font:16px Tahoma,sans-serif;color:#222;background:#fff}.n{display:flex;justify-content:space-between;align-items:center;padding:18px 40px;border-bottom:1px solid #eee}.n b{font-size:22px}.h{display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:40px;padding:60px 40px;background:#faf7f2}.h h1{font-size:46px;margin:0 0 14px}.h p{color:#666}.h .im{height:320px;border-radius:20px;background:linear-gradient(135deg,#e9dccb,#cdb59a)}.bt{display:inline-block;background:#222;color:#fff;padding:12px 26px;border-radius:30px;margin-top:10px}</style></head>
<body><div class="n"><b>نور</b><span>المنتجات · العروض · تواصل</span></div><div class="h"><div><h1>عناية طبيعية لبشرتك</h1><p>منتجات طبيعية 100% بتوصيل لكل محافظات مصر.</p><span class="bt">تسوّق دلوقتي</span></div><div class="im"></div></div></body></html>`;

(async () => {
  const ctx = await chromium.launchPersistentContext(path.join(TMP, 'profile'), {
    channel: 'chromium', headless: true, viewport: { width: 1280, height: 780 }, deviceScaleFactor: 2,
    args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
  });
  await ctx.route('https://web.whatsapp.com/**', (r) => r.fulfill({ contentType: 'text/html; charset=utf-8', body: WA_HTML }));
  await ctx.route('https://www.facebook.com/ads/library/**', (r) => r.fulfill({ contentType: 'text/html; charset=utf-8', body: ADS_HTML }));
  await ctx.route('https://scontent.xx.fbcdn.net/**', (r) => {
    const id = r.request().url().match(/(\d{13})/)[1];
    const ad = ADS.find((a) => a[5] === id);
    r.fulfill({ contentType: 'image/svg+xml', body: decodeURIComponent(ad[2].split(',')[1]) });
  });
  await ctx.route('https://shop.example.com/**', (r) => r.fulfill({ contentType: 'text/html; charset=utf-8', body: SITE_HTML }));
  await ctx.route('https://www.googletagmanager.com/**', (r) => r.fulfill({ contentType: 'text/javascript', body: '' }));
  let [sw] = ctx.serviceWorkers();
  if (!sw) sw = await ctx.waitForEvent('serviceworker');
  const base = `chrome-extension://${sw.url().split('/')[2]}/`;
  const shot = async (page, name, clip) => { const f = path.join(TMP, name + '.png'); await page.screenshot({ path: f, clip }); return f; };
  const jpg = (src, id) => {
    execFileSync('python3', ['-c', `from PIL import Image
im=Image.open(${JSON.stringify(src)}).convert('RGB')
w=1600
if im.width>w: im=im.resize((w,round(im.height*w/im.width)),Image.LANCZOS)
im.save(${JSON.stringify(path.join(OUT, id + '.jpg'))},quality=84,optimize=True,progressive=True)`]);
    console.log('✔ shots/' + id + '.jpg');
  };

  // بيانات تجريبية: CRM + ردود
  const now = Date.now();
  await sw.evaluate((now) => chrome.storage.local.set({
    crm: {
      'سارة علي': { name: 'سارة علي', key: 'سارة علي', tag: 'مهتم', note: 'عايزة باقة شهرية', remindAt: now + 86400000, updatedAt: now - 3600000 },
      'شركة النور للتجارة': { name: 'شركة النور للتجارة', key: 'شركة النور للتجارة', tag: 'عميل', note: 'عقد سنوي — تجديد في مارس', remindAt: now + 3 * 86400000, updatedAt: now - 7200000 },
      'كريم حسن': { name: 'كريم حسن', key: 'كريم حسن', tag: 'متابعة', note: 'هيرد بعد ما يكلم شريكه', remindAt: now + 2 * 3600000, updatedAt: now - 86400000 },
      '+20 112 555 0198': { name: '+20 112 555 0198', key: '+20 112 555 0198', tag: 'عميل محتمل', note: 'جه من إعلان فيسبوك', updatedAt: now - 90000000 },
      'منى عادل': { name: 'منى عادل', key: 'منى عادل', tag: 'مقفول', note: 'اشترت باقة 3 شهور', updatedAt: now - 180000000 },
    },
  }), now);

  // ===== واتساب: الردود =====
  const wa = await ctx.newPage();
  await wa.goto('https://web.whatsapp.com/');
  await wa.waitForFunction(() => window.DB_READY);
  await wa.waitForSelector('.mt-fab');
  await wa.waitForTimeout(800);
  await wa.click('#box');
  await wa.keyboard.type('/');
  await wa.waitForSelector('.mt-menu .mt-item');
  await wa.waitForTimeout(300);
  jpg(await shot(wa, 'replies'), 'replies');
  await wa.keyboard.press('Escape');
  await wa.keyboard.press('Backspace');
  await wa.keyboard.type('/سعر');
  await wa.waitForTimeout(200);
  await wa.keyboard.press('Enter');
  await wa.waitForTimeout(300);

  // ===== واتساب: CRM =====
  await wa.click('.mt-fab');
  await wa.waitForSelector('.mt-panel .mt-tag');
  await wa.click('.mt-tag[data-t="مهتم"]');
  await wa.fill('.mt-note', 'طلب عرض سعر باقة الشهر — مهتم بالإعلانات');
  await wa.click('.mt-quick button[data-q="tom"]');
  await wa.click('.mt-save');
  await wa.waitForTimeout(900);
  jpg(await shot(wa, 'crm'), 'crm');

  // ===== ContactHarvest: الـ popup + معاينة الشيت =====
  const pop = await ctx.newPage();
  await pop.setViewportSize({ width: 360, height: 520 });
  await pop.goto(base + 'popup.html');
  await pop.evaluate(async () => { const [t] = await chrome.tabs.query({ url: 'https://web.whatsapp.com/*' }); chrome.tabs.query = async () => [t]; });
  await pop.click('#qa-harvest');
  // نفس اللي النسخة المنفصلة بتعمله (popup: 'harvest')
  await pop.evaluate(() => { document.querySelector('#brand').innerHTML = 'Contact<span>Harvest</span>'; document.querySelector('#tagline').textContent = 'كل أرقام واتساب اللي اتراسلت معاها في شيت Excel'; document.querySelectorAll('[data-back]').forEach((b) => { b.hidden = true; }); document.querySelector('#v-harvest h3').hidden = true; });
  const [dl] = await Promise.all([pop.waitForEvent('download'), pop.click('#go')]);
  const xlsx = path.join(TMP, 'harvest.xlsx'); await dl.saveAs(xlsx);
  await pop.waitForTimeout(300);
  const popImg = await shot(pop, 'harvest-popup');
  const rows = JSON.parse(execFileSync('python3', ['-c', `import openpyxl,json;ws=openpyxl.load_workbook(${JSON.stringify(xlsx)}).active;print(json.dumps([[str(c) if c is not None else '' for c in r][:6] for r in ws.iter_rows(values_only=True)],ensure_ascii=False))`]).toString());
  const comp = await ctx.newPage();
  await comp.setViewportSize({ width: 1280, height: 640 });
  await comp.setContent(`<html dir="rtl"><body style="margin:0;height:640px;background:#ececee;display:flex;gap:36px;align-items:center;justify-content:center;font:13px Calibri,'Segoe UI',sans-serif">
    <img src="data:image/png;base64,${fs.readFileSync(popImg).toString('base64')}" style="width:340px;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.25)">
    <div style="background:#fff;border-radius:10px;box-shadow:0 20px 60px rgba(0,0,0,.18);overflow:hidden;width:760px">
      <div style="background:#f3f3f3;padding:8px 14px;border-bottom:1px solid #ddd;direction:ltr;color:#444">ContactHarvest-2026-11-18.xlsx — Excel</div>
      <table style="border-collapse:collapse;width:100%">${rows.slice(0, 9).map((r, i) => `<tr style="height:30px">${r.map((c) => `<td style="unicode-bidi:plaintext;border:1px solid #e1e1e1;padding:4px 8px;${i === 0 ? 'background:#111;color:#fff;font-weight:700;border-bottom:3px solid #C7161D' : ''}">${c}</td>`).join('')}</tr>`).join('')}</table>
    </div></body></html>`);
  jpg(await shot(comp, 'harvest-comp'), 'contactharvest');

  // ===== Ad Library =====
  const ads = await ctx.newPage();
  await ads.goto('https://www.facebook.com/ads/library/?q=marketing');
  await ads.waitForSelector('.mt-save-ad');
  await ads.click('.mt-save-ad >> nth=0');
  await ads.waitForFunction(() => document.querySelector('.mt-save-ad').classList.contains('mt-done'));
  await ads.click('.mt-save-ad >> nth=1');
  await ads.waitForFunction(() => document.querySelectorAll('.mt-save-ad.mt-done').length === 2);
  await ads.waitForTimeout(300);
  jpg(await shot(ads, 'ads'), 'ads');

  // ===== PixelScope: popup فوق موقع =====
  const site = await ctx.newPage();
  await site.goto('https://shop.example.com/');
  await site.addScriptTag({ path: path.join(ext, 'tools', 'inspector.js') });
  const insp = await site.evaluate(() => inspectPage());
  const sitebg = await shot(site, 'site-bg');
  const p2 = await ctx.newPage();
  await p2.setViewportSize({ width: 360, height: 760 });
  await p2.goto(base + 'popup.html');
  await p2.evaluate((d) => { chrome.tabs.query = async () => [{ id: 1, url: d.url, title: 'x' }]; chrome.scripting.executeScript = async () => [{ result: d }]; }, insp);
  await p2.click('#qa-inspect');
  await p2.waitForSelector('#copy-report');
  await p2.evaluate(() => { const og = document.querySelector('.og img'); if (og) og.replaceWith(Object.assign(document.createElement('div'), { style: 'height:120px;background:linear-gradient(135deg,#e9dccb,#cdb59a)' })); });
  const inspImg = await shot(p2, 'inspect-pop');
  const c2 = await ctx.newPage();
  await c2.setViewportSize({ width: 1280, height: 780 });
  await c2.setContent(`<body style="margin:0;position:relative;height:780px;overflow:hidden"><img src="data:image/png;base64,${fs.readFileSync(sitebg).toString('base64')}" style="width:1280px;filter:saturate(.9)">
    <img src="data:image/png;base64,${fs.readFileSync(inspImg).toString('base64')}" style="position:absolute;top:14px;right:60px;width:360px;border-radius:10px;box-shadow:0 24px 70px rgba(0,0,0,.4)"></body>`);
  jpg(await shot(c2, 'inspect'), 'inspect');

  // ===== صفحات الداشبورد =====
  const app = await ctx.newPage();
  await app.setViewportSize({ width: 1280, height: 820 });
  await app.goto(base + 'app.html#walink');
  await app.fill('#phone', '01012345678'); await app.fill('#label', 'بوستر معرض القاهرة'); await app.fill('#code', 'expo-cairo');
  await app.click('#save'); await app.fill('#label', 'إعلان فيسبوك رمضان'); await app.fill('#code', 'fb-ramadan'); await app.click('#save');
  await app.waitForTimeout(400); await app.evaluate(() => document.querySelector('.toast') && document.querySelector('.toast').remove());
  jpg(await shot(app, 'walink'), 'walink');

  await app.goto(base + 'app.html?url=' + encodeURIComponent('https://shop.example.com/offers') + '#utm');
  for (const [k, v] of [['source', 'facebook'], ['medium', 'paid_social'], ['campaign', 'ramadan-2026'], ['content', 'video-hook-1']]) await app.fill('#u-' + k, v);
  await app.click('#save'); await app.fill('#u-content', 'carousel-2'); await app.click('#save');
  await app.waitForTimeout(400); await app.evaluate(() => document.querySelector('.toast') && document.querySelector('.toast').remove());
  jpg(await shot(app, 'utm'), 'utm');

  await app.goto(base + 'app.html#post');
  await app.fill('#cap', 'التسويق مش بوستات وإعلانات.\n\nلو كل شهر بتبدأ من الصفر، يبقى عندك أنشطة مش منظومة. المنظومة بتبدأ بفهم السوق، وبعدين اختيار الشريحة، وبعدين التنفيذ والقياس.\n\nابعتلنا رسالة على واتساب\n\n#تسويق #براند #مصر');
  await app.fill('#design', 'التسويق منظومة قرارات مش أنشطة');
  await app.waitForTimeout(300);
  jpg(await shot(app, 'post'), 'post');

  await app.goto(base + 'app.html#calc');
  for (const [k, v] of [['spend', 25000], ['impressions', 1250000], ['clicks', 14800], ['leads', 420], ['customers', 38], ['revenue', 96000], ['targetCustomers', 60], ['cpl', 55], ['closeRate', 9]]) await app.fill('#' + k, String(v));
  await app.waitForTimeout(300);
  jpg(await shot(app, 'calc'), 'calc');

  // ===== DiscountCheck =====
  await app.goto(base + 'app.html#discount');
  for (const [k, v] of [['price', 850], ['cost', 520], ['units', 240], ['fixed', 30000]]) await app.fill('#d-' + k, String(v));
  await app.click('[data-d="20"]');
  await app.waitForTimeout(300);
  jpg(await shot(app, 'discount'), 'discount');

  // ===== BriefBuilder =====
  await app.goto(base + 'app.html#brief');
  const bf = [['idea', 'التسويق مش بوستات، ده منظومة قرارات'], ['audience', 'أصحاب الشركات'], ['hook', 'لو كل شهر بتبدأ من الصفر، يبقى عندك أنشطة مش منظومة'],
    ['designText', 'التسويق منظومة قرارات مش أنشطة'], ['cta', 'احفظ البوست ترجعله وقت الخطة'], ['scene', 'شاشة GPS بتعيد حساب الطريق، والطريق نفسه مرسوم كخطوات الـ Framework']];
  for (const [k, v] of bf) await app.fill(`[data-k="${k}"]`, v);
  await app.selectOption('[data-k="axis"]', { index: 1 });
  await app.click('[data-meta="GPS"]');
  await app.evaluate(() => window.scrollTo(0, 0));
  await app.waitForTimeout(300);
  jpg(await shot(app, 'brief'), 'brief');

  // ===== SocialSizer =====
  const photo = path.join(TMP, 'photo.png');
  execFileSync('python3', ['-c', `from PIL import Image, ImageDraw, ImageFilter
w,h=2400,1600
im=Image.new('RGB',(w,h)); px=im.load()
for y in range(h):
    for x in range(0,w,4):
        c=(int(20+40*y/h),int(18+20*y/h),int(22+30*y/h))
        for k in range(4): px[x+k,y]=c
d=ImageDraw.Draw(im)
d.ellipse((1500,450,2100,1050),fill=(199,22,29))
d.rectangle((300,900,1300,1300),fill=(240,236,230))
d.rectangle((380,980,1220,1040),fill=(17,17,17)); d.rectangle((380,1080,1000,1120),fill=(120,120,120))
im=im.filter(ImageFilter.GaussianBlur(2)); im.save(${JSON.stringify(photo)})`]);
  await app.goto(base + 'app.html#resizer');
  await app.setInputFiles('#r-file', photo);
  await app.waitForSelector('#r-out canvas');
  await app.evaluate(() => window.scrollTo(0, 0));
  await app.waitForTimeout(300);
  jpg(await shot(app, 'resizer-top'), 'resizer');

  // ===== GrowthScore (النتيجة) =====
  await sw.evaluate(() => chrome.storage.local.set({ audit: { company: 'شركة النور للتجارة', step: 8, answers: { business: [2, 2, 1], intel: [2, 1, 1], diagnosis: [1, 0, 1], choice: [0, 1, 0], value: [2, 1, 0], plan: [1, 1, 0], execution: [2, 1, 1], measure: [1, 0, 0] } } }));
  await app.goto(base + 'app.html#audit');
  await app.waitForSelector('#audit-report');
  await app.waitForTimeout(300);
  jpg(await shot(app, 'audit'), 'audit');

  await sw.evaluate((now) => chrome.storage.local.set({
    notion: { token: 'ntn_demo', dbId: 'https://www.notion.so/Personal-Brand-Content-System-0123456789abcdef0123456789abcdef', titleProp: 'Name', urlProp: 'Link', dateProp: 'Created', extraProp: 'Status', extraType: 'select', extraValue: 'Idea',
      schema: { id: '0123456789abcdef0123456789abcdef', title: 'Personal Brand Content System', props: [{ name: 'Name', type: 'title', options: [] }, { name: 'Link', type: 'url', options: [] }, { name: 'Status', type: 'select', options: ['Idea', 'Draft', 'Published'] }, { name: 'Created', type: 'date', options: [] }] } },
    notionHistory: [{ title: 'إزاي البراندات بتبني منظومة محتوى', url: 'https://example.com/a', page: 'https://www.notion.so/x', at: now - 600000 }, { title: 'إعلان منافس: خصم 30%', url: 'https://example.com/b', page: 'https://www.notion.so/y', at: now - 3600000 }, { title: 'فكرة كاروسيل: التسويق منظومة قرارات', url: 'https://example.com/c', page: 'https://www.notion.so/z', at: now - 86400000 }],
  }), now);
  await app.goto(base + 'app.html#notion');
  await app.waitForTimeout(400);
  jpg(await shot(app, 'notion'), 'notion');

  await ctx.close();

  // ===== صورة المشاركة (og.png) =====
  const b2 = await chromium.launch();
  const og = await b2.newPage({ viewport: { width: 1200, height: 630 } });
  const icons = ['contactharvest', 'replies', 'crm', 'walink', 'post', 'ads', 'inspect', 'utm', 'calc', 'notion'].map((id) => fs.readFileSync(path.join(ROOT, 'site', 'assets', 'icons', id + '.svg'), 'utf8').replace('<svg ', '<svg width="54" height="54" '));
  const font = (f) => 'data:font/woff2;base64,' + fs.readFileSync(path.join(ROOT, 'site', 'assets', 'fonts', f)).toString('base64');
  await og.setContent(`<html dir="rtl" style="overflow:hidden"><head><style>@font-face{font-family:C;font-weight:800;src:url(${font('cairo-arabic-800-normal.woff2')})}@font-face{font-family:C;font-weight:300;src:url(${font('cairo-arabic-300-normal.woff2')})}@font-face{font-family:I;font-weight:800;src:url(${font('inter-latin-800-normal.woff2')})}</style></head>
    <body style="margin:0;width:1200px;height:630px;background:#0E0E0E;color:#fff;font-family:C;position:relative;overflow:hidden">
    <div style="position:absolute;top:-220px;left:-220px;width:620px;height:620px;border-radius:50%;background:radial-gradient(circle,rgba(199, 22, 29,.35),transparent 70%)"></div>
    <div style="position:absolute;top:0;right:0;left:0;height:8px;background:#C7161D"></div>
    <div style="padding:70px 80px 0;position:relative"><img src="data:image/png;base64,${fs.readFileSync(path.join(ROOT, 'site', 'assets', 'logo-white.png')).toString('base64')}" style="height:96px">
    <div style="font-size:84px;font-weight:800;line-height:1.15;margin-top:16px">أدوات تسويق مجانية<span style="color:#C7161D">.</span></div>
    <div style="font-size:52px;font-weight:300;color:rgba(255,255,255,.45);line-height:1.2">بتوفّر يومك.</div></div>
    <div style="position:absolute;bottom:60px;right:80px;left:80px;display:flex;justify-content:space-between;align-items:center"><div style="display:flex;gap:12px">${icons.join('')}</div>
    <div style="font:800 22px I;color:rgba(255,255,255,.6);direction:ltr">tools.mohammedsabry.site</div></div></body></html>`);
  await og.screenshot({ path: path.join(ROOT, 'site', 'assets', 'og.png') });
  console.log('✔ og.png');
  await b2.close();
})().catch((e) => { console.error(e); process.exit(1); });

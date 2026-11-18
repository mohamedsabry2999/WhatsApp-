#!/usr/bin/env node
// بيبني صفحات الموقع من tools.config.js (لازم يتشغّل بعد scripts/build.js)
// التشغيل: node scripts/build.js && node scripts/build-site.js
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const SITE = path.join(ROOT, 'site');
const TK = path.join(ROOT, 'toolkit');
const data = JSON.parse(fs.readFileSync(path.join(SITE, 'assets', 'tools.json'), 'utf8'));
const { tools, bundle, version, siteUrl, contact = {}, analytics = {}, changelog = [] } = data;
const MAIN_SITE = contact.mainSite || 'https://mohammedsabry.site';
const TODAY = new Date().toISOString().slice(0, 10);
// لينكات التواصل (اللي فاضي بيستخبى)
const waLink = (msg) => contact.whatsapp ? `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(msg)}` : '';
function contactLinks(msg = 'أهلًا يا محمد، جاي من موقع الأدوات وحابب نتكلم.') {
  const out = [];
  if (contact.whatsapp) out.push({ k: 'wa', label: 'واتساب', href: waLink(msg) });
  if (contact.linkedin) out.push({ k: 'li', label: 'LinkedIn', href: contact.linkedin });
  if (contact.email) out.push({ k: 'mail', label: 'إيميل', href: `mailto:${contact.email}` });
  out.push({ k: 'site', label: 'الموقع الرئيسي', href: MAIN_SITE });
  return out;
}
const suggestHref = () => contact.whatsapp ? waLink('أهلًا يا محمد، عندي فكرة أداة ممكن تفيد المسوّقين: ')
  : contact.email ? `mailto:${contact.email}?subject=${encodeURIComponent('اقتراح أداة')}` : MAIN_SITE;
const shareRow = (text, url) => {
  const wa = 'https://wa.me/?text=' + encodeURIComponent(text + '\n\n' + url);
  const li = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url);
  const x = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(url);
  return `<div class="share"><span>شارك الأداة:</span><a href="${wa}" target="_blank" rel="noopener">واتساب</a><a href="${li}" target="_blank" rel="noopener">LinkedIn</a><a href="${x}" target="_blank" rel="noopener">X</a><button type="button" data-copy-link="${esc(url)}">نسخ اللينك</button></div>`;
};
const PERSON = { '@type': 'Person', name: 'Mohamed Sabry', alternateName: 'محمد صبري', jobTitle: 'Strategic Marketing & Growth Architect', url: MAIN_SITE, sameAs: [contact.linkedin].filter(Boolean) };

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const kb = (n) => Math.round(n / 1024) + ' KB';
const FW = data.framework;
const stageOf = (t) => FW.find((x) => x.id === t.stage);
const stageLabel = (t) => { const x = stageOf(t); return x ? `0${x.n} · ${x.ar}` : ''; };
const byStage = (a, b2) => ((stageOf(a) || { n: 99 }).n - (stageOf(b2) || { n: 99 }).n);
const extTools = () => tools.filter((t) => t.extension);

// ====== اللوجو (لما يوصل اللوجو الرسمي: حطه في site/assets/logo.svg وغيّر LOGO_IMG لـ true) ======
const LOGO_IMG = fs.existsSync(path.join(SITE, 'assets', 'logo.svg')) || fs.existsSync(path.join(SITE, 'assets', 'logo.png'));
const LOGO_FILE = fs.existsSync(path.join(SITE, 'assets', 'logo.svg')) ? 'logo.svg' : 'logo.png';
const logo = (b) => LOGO_IMG
  ? `<a class="logo" href="${b}index.html" aria-label="محمد صبري — أدوات التسويق"><img class="logo-img" src="${b}assets/${LOGO_FILE}" alt="محمد صبري" width="66" height="46"><span class="logo-sep"></span><span class="logo-sub"><b class="en">TOOLS</b><small>أدوات التسويق</small></span></a>`
  : `<a class="logo" href="${b}index.html" aria-label="محمد صبري — الرئيسية">
      <span class="logo-mark"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="4" height="16" rx="1" fill="#fff"/><rect x="10" y="4" width="4" height="16" rx="1" fill="#fff"/><rect x="17" y="4" width="4" height="16" rx="1" fill="#C7161D"/></svg></span>
      <span class="logo-text"><b>محمد صبري</b><small>Marketing Tools</small></span></a>`;

const PERM = {
  storage: 'بتحفظ إعداداتك وبياناتك على جهازك إنت بس',
  unlimitedStorage: 'بتحفظ صور الإعلانات على جهازك من غير حد للمساحة',
  alarms: 'عشان تفكّرك بمواعيد المتابعة اللي إنت حددتها',
  notifications: 'عشان تبعتلك إشعار التذكير',
  scripting: 'بتقرا الصفحة اللي إنت فاتحها، ولما تدوس الزرار بس',
  activeTab: 'بتوصل للتاب الحالي بس لما تدوس على الأيقونة',
  contextMenus: 'بتضيف اختيار في قايمة كليك يمين',
  'https://web.whatsapp.com/*': 'عشان تشتغل جوه واتساب ويب',
  'https://www.facebook.com/ads/library/*': 'عشان تضيف زرار الحفظ في Meta Ad Library',
  'https://*.fbcdn.net/*': 'عشان تحفظ صورة الإعلان عندك',
  'https://api.notion.com/*': 'عشان تبعت الفكرة لقاعدة بيانات Notion بتاعتك إنت بس',
};

const SHOT_LABEL = { crm: 'ChatCRM', post: 'PostCheck', inspect: 'PixelScope' };
const HERO_POS = { crm: '0% 50%', post: '78% 0%', inspect: '96% 0%' };

function layout({ title, desc, b = '', active = '', body, head = '', scripts = '', path: pagePath = '', og = 'og.png', jsonld = null, noindex = false }) {
  const nav = [['index.html', 'الرئيسية', 'home'], ['index.html#tools', 'الأدوات', 'tools'], ['index.html#web', 'جرّب أونلاين', 'web'], ['install.html', 'طريقة التثبيت', 'install'], ['index.html#contact', 'تواصل', 'contact']];
  const url = `${siteUrl}/${pagePath}`;
  const ld = jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>` : '';
  const cf = analytics.cloudflareToken ? `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='${JSON.stringify({ token: analytics.cloudflareToken })}'></script>` : '';
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="author" content="محمد صبري | Mohamed Sabry">
${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${url}">`}
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${siteUrl}/assets/${og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${url}">
<meta property="og:type" content="website">
<meta property="og:locale" content="ar_EG">
<meta property="og:site_name" content="أدوات محمد صبري">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${siteUrl}/assets/${og}">
${ld}
<meta name="theme-color" content="#C7161D">
<link rel="icon" href="${b}assets/favicon.png">
<link rel="apple-touch-icon" href="${b}assets/apple-touch-icon.png">
<link rel="preload" href="${b}assets/fonts/cairo-arabic-800-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${b}assets/site.css">
${head}
</head>
<body>
<div class="topbar"><div class="wrap">
  <span>أدوات مجانية للمسوّقين · <span class="hide-sm">من غير اشتراكات ولا API</span></span>
  <nav><a href="${b}install.html" class="hide-sm">طريقة التثبيت</a><a href="${b}privacy.html" class="hide-sm">الخصوصية</a><a href="${MAIN_SITE}" class="en">mohammedsabry.site</a></nav>
</div></div>
<header class="nav"><div class="wrap"><div class="bar">
  ${logo(b)}
  <nav class="links">${nav.map(([h, t, k]) => `<a href="${b}${h}"${k === active ? ' class="on"' : ''}>${t}</a>`).join('')}</nav>
  <span class="spacer"></span>
  <a class="btn btn-red btn-sm" href="${b}${bundle.download.zip}" download>حمّل كل الأدوات</a>
  <button class="menu-btn" aria-label="القايمة" aria-expanded="false">☰</button>
</div></div></header>
<main>
${body}
</main>
<footer class="site"><div class="wrap">
  <div class="cols">
    <div class="about">${logo(b)}<p>أدوات مجانية بتشيل الشغل المتكرر من يوم المسوّق، عشان وقته يروح للقرار. البيانات كلها بتفضل على جهازك.</p></div>
    <div><h6>الأدوات</h6><ul>${tools.slice().sort(byStage).slice(0, Math.ceil(tools.length / 2)).map((t) => `<li><a href="${b}tools/${t.id}.html">${t.name}</a></li>`).join('')}</ul></div>
    <div><h6>&nbsp;</h6><ul>${tools.slice().sort(byStage).slice(Math.ceil(tools.length / 2)).map((t) => `<li><a href="${b}tools/${t.id}.html">${t.name}</a></li>`).join('')}</ul></div>
    <div><h6>روابط</h6><ul><li><a href="${b}install.html">طريقة التثبيت</a></li><li><a href="${b}update.html">التحديثات</a></li><li><a href="${b}${bundle.download.zip}" download>Marketer's Toolkit (الكل)</a></li><li><a href="${suggestHref()}" target="_blank" rel="noopener">اقترح أداة</a></li><li><a href="${b}privacy.html">الخصوصية</a></li>${contactLinks().map((c) => `<li><a href="${esc(c.href)}" target="_blank" rel="noopener">${c.label}</a></li>`).join('')}</ul></div>
  </div>
  <p class="disclaimer">الأدوات دي مستقلة، ومش تابعة لـ WhatsApp أو Meta أو Notion أو Google أو أي منصة تانية. وكل العلامات التجارية ملك أصحابها.</p>
  <div class="legal"><span>© ${new Date().getFullYear()} محمد صبري | <span class="en">Mohamed Sabry</span>. كل الأدوات مجانية.</span><span class="en">v${version}</span></div>
</div></footer>
<script>var MT_CONTACT = ${JSON.stringify(contact)};</script>
<script src="${b}assets/site.js"></script>
${scripts}
${cf}
</body>
</html>
`;
}

const toolCard = (t, b, delay = 0) => `
  <a class="panel tool-card reveal" data-delay="${delay}" data-stage="${t.stage}" data-web="${t.web ? 1 : 0}" href="${b}tools/${t.id}.html">
    <img class="ic" src="${b}assets/icons/${t.id}.svg" alt="">
    <h3 class="en" style="text-align:right">${t.nameHtml}</h3>
    <p>${esc(t.tagline)}</p>
    <div class="tags"><span class="tag">${stageLabel(t)}</span>${t.web ? '<span class="tag red">جرّبها أونلاين</span>' : ''}${t.extension ? '<span class="tag">إضافة كروم</span>' : ''}</div>
    <span class="go">التفاصيل والتحميل</span>
  </a>`;

const toolsJson = () => `<script type="application/json" id="tools-data">${JSON.stringify({ version, tools: extTools().map(slim), bundle: slim(bundle) })}</script>`;
const slim = (t) => !t.download ? null : ({ id: t.id, name: t.name, tagline: t.tagline, download: { zip: t.download.zip, folder: t.download.folder } });

function guide(b) {
  const chrome = (svg) => `<span class="b-ico">${svg}</span>`;
  return `
  <div class="tool-pick" role="group" aria-label="اختار الأداة">
    ${[...extTools(), bundle].map((t) => `<button data-id="${t.id}"><img src="${b}assets/icons/${t.id}.svg" alt="">${t.name}</button>`).join('')}
  </div>
  <div class="guide" id="guide">
    <div>
      <div class="g-steps">
        <div class="g-step"><span class="n">1</span><div><b>نزّل الأداة وفك الضغط</b>
          <p>ويندوز: كليك يمين على الملف ← <b>Extract All</b>. ماك: دبل كليك. هيطلعلك فولدر اسمه <span class="en" data-t="folder"></span>.</p>
          <div class="extra"><a class="btn btn-red btn-sm" data-t="dl" href="#" download>تحميل <span class="en" data-t="name"></span></a></div></div></div>
        <div class="g-step"><span class="n">2</span><div><b>افتح صفحة الإضافات</b>
          <p>اكتب العنوان ده في كروم ودوس Enter. أو من القايمة ⋮ ← Extensions ← Manage Extensions.</p>
          <div class="extra"><span class="copy-cmd">chrome://extensions <button data-copy="chrome://extensions">نسخ</button></span></div></div></div>
        <div class="g-step"><span class="n">3</span><div><b>فعّل Developer mode</b>
          <p>الزرار فوق على اليمين في صفحة الإضافات. وده بيفعّل تثبيت الإضافات من فولدر.</p></div></div>
        <div class="g-step"><span class="n">4</span><div><b>دوس Load unpacked واختار الفولدر</b>
          <p>اختار الفولدر <span class="en" data-t="folder"></span> نفسه (اللي جواه manifest.json)، مش ملف الـ zip.</p></div></div>
        <div class="g-step"><span class="n">5</span><div><b>خلاص! ثبّتها في الشريط</b>
          <p>دوس على أيقونة البازل 🧩 ← الدبوس جنب <span class="en" data-t="name"></span>، عشان تفضل قدامك على طول.</p></div></div>
      </div>
      <div class="g-controls">
        <button data-act="prev" aria-label="الخطوة اللي فاتت">→</button>
        <button data-act="play" aria-label="إيقاف">❚❚</button>
        <button data-act="next" aria-label="الخطوة الجاية">←</button>
        <div class="g-progress"><i></i></div>
      </div>
    </div>
    <div class="browser" aria-hidden="true">
      <div class="b-tabs"><div class="b-dots"><i></i><i></i><i></i></div><div class="b-tab"><span class="tab-title">Downloads</span></div></div>
      <div class="b-bar">
        <div class="b-nav"><span>←</span><span>→</span><span>⟳</span></div>
        <div class="b-omni"><span class="omni-text"></span><span class="caret"></span></div>
        <div class="b-tools">
          <span class="b-pinned"><img data-t="icon" alt=""></span>
          ${chrome('<svg class="puzzle" viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 11H19V7a2 2 0 0 0-2-2h-4V3.5a2.5 2.5 0 0 0-5 0V5H4a2 2 0 0 0-2 2v3.8h1.5a2.7 2.7 0 0 1 0 5.4H2V20a2 2 0 0 0 2 2h3.8v-1.5a2.7 2.7 0 0 1 5.4 0V22H17a2 2 0 0 0 2-2v-4h1.5a2.5 2.5 0 0 0 0-5z"/></svg>')}
          ${chrome('<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6z"/></svg>')}
        </div>
      </div>
      <div class="b-view">
        <div class="scene s-unzip">
          <div class="sc-files">
            <div class="file zip"><div class="big">ZIP</div><span data-t="zip"></span></div>
            <div class="arrow">→</div>
            <div class="file folder"><div class="big"><img data-t="icon" alt=""></div><span data-t="folder"></span></div>
          </div>
          <div class="hint">ويندوز: كليك يمين ← Extract All · ماك: دبل كليك</div>
        </div>
        <div class="scene s-ext">
          <div class="ext-page">
            <div class="ext-head"><span class="ttl">Extensions</span><span class="search">Search extensions</span><span class="devmode">Developer mode <span class="toggle"></span></span></div>
            <div class="ext-sub"><span class="load-btn">Load unpacked</span><span>Pack extension</span><span>Update</span></div>
            <div class="ext-body">
              <div class="ext-empty">No extensions installed yet</div>
              <div class="ext-card"><img data-t="icon" alt=""><div><b><span data-t="name"></span><small data-t="ver"></small></b><p data-t="desc"></p></div>
                <div class="row"><span>Details &nbsp; Remove</span><span class="toggle on"></span></div></div>
            </div>
          </div>
          <div class="picker">
            <div class="pt">Select the extension directory</div>
            <div class="side"><div>Desktop</div><div class="on">Downloads</div><div>Documents</div></div>
            <div class="list">
              <div class="it sel-me"><span class="fi"></span><span data-t="folder"></span></div>
              <div class="inside"><div class="mf">manifest.json ✓</div><div>background.js</div><div>popup.html</div><div>icons/</div></div>
              <div class="it dim"><span class="fi"></span><span data-t="zip"></span></div>
            </div>
            <div class="pf"><span>Cancel</span><span class="ok">Select Folder</span></div>
          </div>
        </div>
      </div>
      <div class="puzzle-menu"><div class="h">Extensions</div><div class="it"><img data-t="icon" alt=""><span data-t="name"></span><span class="pin">📌</span></div></div>
      <svg class="cursor" viewBox="0 0 24 24"><path d="M4 2l16 11-7 1.5 4 7.5-3 1.5-4-7.5L4 21z" fill="#111" stroke="#fff" stroke-width="1.5"/></svg>
    </div>
  </div>`;
}

// ================= الرئيسية =================
function home() {
  const b = '';
  const hero = ['crm', 'post', 'inspect'];
  const body = `
<div class="wrap">
  <section class="panel hero" style="padding-top:clamp(36px,6vw,80px)">
    <div class="reveal">
      <p class="eyebrow">أدوات المسوّق اليومية <span class="en">· Marketing Tools</span></p>
      <h1 class="display">أدوات تسويق<br>مجانية<span class="dot">.</span><span class="soft">بتوفّر يومك.</span></h1>
      <p class="lead">${tools.length} أدوات اتعملت من شغل تسويق حقيقي: واتساب، والمحتوى، والإعلانات، والتحليل. كلها مجانية، ومن غير اشتراكات، وبياناتك بتفضل على جهازك.</p>
      <div class="cta"><a class="btn btn-red" href="#tools">تصفّح الأدوات</a><a class="btn btn-light" href="#web">جرّب أونلاين</a></div>
    </div>
    <div class="stack reveal" data-delay="150">
      ${hero.map((id) => `<div class="shot" data-label="${SHOT_LABEL[id]}"><img src="assets/shots/${id}.jpg" alt="${SHOT_LABEL[id]}" loading="eager" style="object-position:${HERO_POS[id]}"></div>`).join('')}
      <span class="label"></span>
      <div class="arrows"><button class="next" aria-label="التالي">‹</button><button class="prev" aria-label="السابق">›</button></div>
      <div class="bars">${hero.map(() => '<i></i>').join('')}</div>
    </div>
  </section>

  <section style="padding-top:28px">
    <div class="stats">
      <div class="glass stat reveal"><div class="num" data-count="${tools.length}">${tools.length}<span class="dot">.</span></div><h5>أدوات</h5><p>على ${FW.filter((x) => tools.some((t) => t.stage === x.id)).length} مراحل من المنظومة</p></div>
      <div class="glass stat reveal" data-delay="80"><div class="num" data-count="0">0<span class="dot">.</span></div><h5>جنيه اشتراكات</h5><p>ولا API مدفوع</p></div>
      <div class="glass stat reveal" data-delay="160"><div class="num" data-count="100" data-suffix="%">100%<span class="dot">.</span></div><h5>بياناتك عندك</h5><p>مفيش سيرفر بيشوف حاجة</p></div>
      <div class="glass stat reveal" data-delay="240"><div class="num" data-count="${tools.filter((t) => t.web).length}">${tools.filter((t) => t.web).length}<span class="dot">.</span></div><h5>تشتغل أونلاين</h5><p>جرّبها من غير تحميل</p></div>
    </div>
  </section>

  <section id="framework">
    <div class="section-head reveal">
      <div><p class="eyebrow">المنظومة <span class="en">· Market-to-Measurement</span></p><h2 class="h2">مش مجرد أدوات<span class="dot">.</span><span class="soft">منظومة من 8 مراحل.</span></h2>
      <p class="lead">كل أداة بتخدم مرحلة من الـ Market-to-Measurement Framework: من ربط التسويق بالبيزنس، لحد القياس والتطوير.</p></div>
    </div>
    <div class="fw-grid">${FW.map((x, i) => { const ts = tools.filter((t) => t.stage === x.id); return `
      <button class="glass fw-card reveal${ts.length ? '' : ' soon'}" data-delay="${(i % 4) * 70}" data-stage="${x.id}"${ts.length ? '' : ' disabled'}>
        <span class="fw-n">0${x.n}<span class="dot">.</span></span>
        <span class="fw-en en">${esc(x.en)}</span>
        <b>${esc(x.ar)}</b>
        <span class="fw-d">${esc(x.desc)}</span>
        <span class="fw-tools">${ts.length ? ts.map((t) => `<img src="assets/icons/${t.id}.svg" alt="${esc(t.name)}" title="${esc(t.name)}">`).join('') + `<i>${ts.length} ${ts.length > 2 ? 'أدوات' : ts.length === 2 ? 'أداتين' : 'أداة'}</i>` : '<i>أدوات قريبًا</i>'}</span>
      </button>`; }).join('')}
    </div>
  </section>

  <section id="tools">
    <div class="section-head reveal">
      <div><p class="eyebrow">الأدوات <span class="en">· The Toolkit</span></p><h2 class="h2">كل أداة لوحدها<span class="dot">.</span><span class="soft">نزّل اللي محتاجه بس.</span></h2></div>
      <div class="filters"><button class="chip on" data-f="all">الكل</button>${FW.filter((x) => tools.some((t) => t.stage === x.id)).map((x) => `<button class="chip" data-f="${x.id}">0${x.n} · ${esc(x.ar)}</button>`).join('')}<button class="chip" data-f="web">تشتغل أونلاين</button></div>
    </div>
    <div class="tools-grid">${tools.slice().sort(byStage).map((t, i) => toolCard(t, b, (i % 3) * 80)).join('')}</div>
  </section>

  <section id="install">
    <div class="dark">
      <div class="section-head reveal" style="position:relative">
        <div><p class="eyebrow">التثبيت <span class="en">· Load unpacked</span></p><h2 class="h2">من غير Store<span class="dot">.</span><span class="soft">5 خطوات وتشتغل.</span></h2>
        <p class="lead">الأدوات بتتثبّت من فولدر على جهازك. اختار الأداة، والدليل هيوريك كل خطوة على شاشة كروم.</p></div>
        <a class="btn btn-ghost-dark" href="install.html">الدليل الكامل + حل المشاكل</a>
      </div>
      ${guide(b)}
    </div>
  </section>

  <section id="web">
    <div class="section-head reveal">
      <div><p class="eyebrow">جرّب أونلاين <span class="en">· No install</span></p><h2 class="h2">جرّبها دلوقتي<span class="dot">.</span><span class="soft">من غير ما تنزّل حاجة.</span></h2></div>
    </div>
    <div class="tools-grid">${tools.filter((t) => t.web).map((t, i) => toolCard({ ...t }, b, i * 80).replace(`href="tools/${t.id}.html"`, `href="tools/${t.id}.html#try"`).replace('التفاصيل والتحميل', 'جرّبها دلوقتي')).join('')}</div>
  </section>

  <section>
    <div class="panel split" style="padding:clamp(28px,5vw,56px)" id="bundle">
      <div class="reveal">
        <img src="assets/icons/toolkit.svg" alt="" style="width:72px;border-radius:20px">
        <p class="eyebrow" style="margin-top:22px">عايز كله؟</p>
        <h2 class="h2 en" style="text-align:right">Marketer's <span class="dot">Toolkit</span></h2>
        <p class="lead">${esc(bundle.description)}</p>
        <div class="cta" style="display:flex;gap:12px;margin-top:26px;flex-wrap:wrap"><a class="btn btn-red" href="${bundle.download.zip}" download>تحميل الكل · ${kb(bundle.download.size)}</a><a class="btn btn-light" href="install.html?tool=toolkit">إزاي أثبّتها؟</a></div>
      </div>
      <div class="principles">
        <div class="glass principle reveal"><i></i><b>مجانية بالكامل</b><span>مفيش اشتراك ولا API مدفوع</span></div>
        <div class="glass principle reveal" data-delay="80"><i></i><b>بياناتك على جهازك</b><span>مفيش سيرفر بيستقبل أي حاجة</span></div>
        <div class="glass principle reveal" data-delay="160"><i></i><b>آمنة على حسابك</b><span>مفيش إرسال تلقائي ولا سحب داتا</span></div>
        <div class="glass principle reveal" data-delay="240"><i></i><b>عربي ومصري</b><span>معمولة للسوق بتاعنا</span></div>
      </div>
    </div>
  </section>

  <section id="about">
    <div class="dark split reveal">
      <div style="position:relative">
        <img src="assets/logo-white.png" alt="محمد صبري" style="height:120px;width:auto;margin-bottom:22px">
        <p class="eyebrow">مين ورا الأدوات <span class="en">· About</span></p>
        <h2 class="h2">محمد صبري<span class="dot">.</span><span class="soft en" style="text-align:right">Strategic Marketing &amp; Growth Architect</span></h2>
      </div>
      <div style="position:relative">
        <p class="lead" style="margin-top:0">التسويق عندي منظومة قرارات، مش مجموعة أنشطة. شغلي إني أحوّل التسويق من أنشطة متفرقة لمنظومة استراتيجية: بتبدأ بفهم السوق، وتنتهي بالتنفيذ والقياس والنمو.</p>
        <p class="lead">والأدوات دي جزء من الفكرة دي: كل أداة بتشيل حتة من الشغل المتكرر، عشان وقتك يروح للقرار.</p>
        <a class="btn btn-red" href="${MAIN_SITE}" style="margin-top:22px">اعرف أكتر عن محمد</a>
      </div>
    </div>
  </section>

  <section id="contact">
    <div class="dark split reveal">
      <div style="position:relative">
        <p class="eyebrow">تواصل <span class="en">· Contact</span></p>
        <h2 class="h2">خلّينا نتكلم<span class="dot">.</span><span class="soft">من فهم السوق إلى نتائج قابلة للقياس.</span></h2>
        <p class="lead">لو محتاج تحوّل التسويق عندك من أنشطة متفرقة لمنظومة واضحة، أو عندك سؤال عن أي أداة، كلّمني.</p>
        <div class="contact-btns">${contactLinks().map((c, i) => `<a class="btn ${i === 0 ? 'btn-red' : 'btn-ghost-dark'}" href="${esc(c.href)}" target="_blank" rel="noopener">${c.label}</a>`).join('')}</div>
      </div>
      <div class="suggest" style="position:relative">
        <span class="fw-n en">+1<span class="dot">.</span></span>
        <b>اقترح أداة</b>
        <p>فيه حاجة بتعملها كل يوم بإيدك وتاخد وقت؟ قولّي عليها، وممكن تبقى الأداة الجاية.</p>
        <a class="btn btn-light" href="${suggestHref()}" target="_blank" rel="noopener">ابعت اقتراحك</a>
      </div>
    </div>
  </section>

  <section class="final reveal">
    <p class="eyebrow" style="justify-content:center">ابدأ دلوقتي</p>
    <h2 class="display">التسويق منظومة قرارات<span class="dot">.</span><span class="soft">مش مجموعة أنشطة.</span></h2>
    <p class="lead" style="margin:18px auto 0">نزّل الأداة اللي محتاجها، أو الكل مرة واحدة.</p>
    <div style="display:flex;gap:12px;justify-content:center;margin-top:30px;flex-wrap:wrap"><a class="btn btn-red" href="#tools">اختار أداة</a><a class="btn btn-light" href="${bundle.download.zip}" download>حمّل الكل</a></div>
  </section>
</div>`;
  return layout({
    title: 'أدوات تسويق مجانية — محمد صبري',
    desc: `${tools.length} أداة مجانية للمسوّقين على المراحل التمانية للـ Market-to-Measurement Framework: واتساب، والمحتوى، والإعلانات، و UTM، والتحليل. من غير اشتراكات، وبياناتك على جهازك.`,
    b, active: 'home', body, path: '',
    jsonld: { '@context': 'https://schema.org', '@graph': [
      { '@type': 'WebSite', name: 'أدوات محمد صبري للمسوّقين', url: siteUrl + '/', inLanguage: 'ar', publisher: PERSON },
      PERSON,
      { '@type': 'ItemList', name: 'أدوات التسويق', itemListElement: tools.map((t, i) => ({ '@type': 'ListItem', position: i + 1, url: `${siteUrl}/tools/${t.id}.html`, name: t.name })) },
    ] },
    head: '<link rel="stylesheet" href="assets/guide.css">',
    scripts: toolsJson() + '\n<script src="assets/guide.js"></script>',
  });
}

// ================= صفحة الأداة =================
function toolPage(t) {
  const b = '../';
  const perms = [...t.permissions, ...t.hosts];
  const others = tools.filter((x) => x.id !== t.id && x.stage === t.stage).concat(tools.filter((x) => x.id !== t.id && x.stage !== t.stage).sort(byStage)).slice(0, 3);
  const st = stageOf(t);
  const isAudit = t.id === 'audit';
  const demo = t.web ? `
  <section id="try">
    <div class="dark">
      <div class="section-head" style="position:relative">
        <div>${isAudit
          ? '<p class="eyebrow">ابدأ التقييم <span class="en">· 5 minutes</span></p><h2 class="h2">جاوب بصراحة<span class="dot">.</span><span class="soft">النتيجة بتفضل على جهازك.</span></h2><p class="lead">24 سؤال، 3 لكل مرحلة. وتقدر ترجع لأي مرحلة وتعدّل إجابتك.</p>'
          : `<p class="eyebrow">جرّبها هنا <span class="en">· Live demo</span></p><h2 class="h2">دي الأداة نفسها<span class="dot">.</span><span class="soft">شغّالة على الموقع.</span></h2>
        <p class="lead">بياناتك بتتحفظ في المتصفح بتاعك بس.${t.extension ? ' ولو عجبتك، نزّلها كإضافة عشان تبقى قدامك على طول.' : ''}</p>`}</div>
      </div>
      <div class="demo-shell" style="position:relative"><div class="demo-bar"><i></i><i></i><i></i><span class="en">${esc(t.name)}</span></div>
        <div class="demo" id="demo-root"><div class="row demo-actions" style="margin-bottom:10px"></div><div class="demo-tool"></div></div></div>
    </div>
  </section>` : '';
  const body = `
<div class="wrap">
  <section class="panel tool-hero">
    <div class="reveal">
      <p class="eyebrow"><a href="../index.html#framework">${st ? `0${st.n} · ${esc(st.en)}` : 'الأدوات'}</a>&nbsp;/ ${st ? esc(st.ar) : ''}</p>
      <img class="ic" src="${b}assets/icons/${t.id}.svg" alt="">
      <h1 class="tname">${t.nameHtml}</h1>
      <p style="font-size:22px;font-weight:800;margin:0">${esc(t.tagline)}</p>
      <p class="lead">${esc(t.description)}</p>
      <div class="bullets">${t.bullets.map((x) => `<div>${esc(x)}</div>`).join('')}</div>
      <div style="display:flex;gap:12px;margin-top:30px;flex-wrap:wrap">
        ${t.extension ? `<a class="btn btn-red" href="${b}${t.download.zip}" download>تحميل ${esc(t.name)}</a>` : `<a class="btn btn-red" href="#try">${isAudit ? 'ابدأ التقييم' : 'جرّبها دلوقتي'}</a>`}
        ${t.web && t.extension ? '<a class="btn btn-dark" href="#try">جرّبها أونلاين</a>' : ''}
        ${t.extension ? `<a class="btn btn-light" href="${b}install.html?tool=${t.id}">إزاي أثبّتها؟</a>` : ''}
      </div>
      ${shareRow(`${t.name}: ${t.tagline}. أداة مجانية من محمد صبري`, `${siteUrl}/tools/${t.id}.html`)}
    </div>
    ${t.extension ? `<aside class="glass dl-card reveal" data-delay="120">
      <b style="font-size:18px">تحميل مجاني</b>
      <div class="meta"><b>النسخة</b><span class="en" style="text-align:right">v${version}</span><b>الحجم</b><span class="en" style="text-align:right">${kb(t.download.size)}</span><b>بتشتغل على</b><span>${esc(t.where)}</span><b>المرحلة</b><span>${st ? esc(st.ar) : ''}</span><b>المتصفح</b><span>Chrome · Edge · Brave</span></div>
      <a class="btn btn-red" href="${b}${t.download.zip}" download>تحميل · ZIP</a>
      <a class="btn btn-light" href="${b}install.html?tool=${t.id}">دليل التثبيت التفاعلي</a>
    </aside>` : `<aside class="glass dl-card reveal" data-delay="120">
      <b style="font-size:18px">مجانية على الموقع</b>
      <p style="color:var(--ink-2);margin:8px 0 0">مش محتاجة تحميل ولا تسجيل. افتحها واشتغل على طول، وبياناتك بتفضل على جهازك.</p>
      <div class="meta"><b>المرحلة</b><span>${st ? esc(st.ar) : ''}</span><b>بتشتغل على</b><span>أي متصفح، كمبيوتر أو موبايل</span></div>
      <a class="btn btn-red" href="#try">${isAudit ? 'ابدأ التقييم' : 'جرّبها دلوقتي'}</a>
    </aside>`}
  </section>

  <section>
    <div class="section-head reveal"><div><p class="eyebrow">شكلها <span class="en">· Preview</span></p><h2 class="h2">كده بتشتغل<span class="dot">.</span></h2></div></div>
    <div class="shot-frame reveal"><img src="${b}assets/shots/${t.id}.jpg" alt="${esc(t.name)}" loading="lazy"></div>
  </section>
  ${demo}
  ${t.extension ? '' : '<!--'}<section>
    <div class="panel reveal" style="padding:clamp(24px,4vw,44px)">
      <p class="eyebrow">الصلاحيات <span class="en">· Permissions</span></p>
      <h2 class="h2" style="font-size:clamp(26px,3vw,36px)">بتطلب إيه وليه<span class="dot">.</span><span class="soft">ولا صلاحية زيادة عن اللزوم.</span></h2>
      <div style="margin-top:18px">${perms.map((p) => `<div class="perm-row"><code>${esc(p.replace('https://', '').replace('/*', ''))}</code><span>${esc(PERM[p] || '')}</span></div>`).join('')}</div>
    </div>
  </section>${t.extension ? '' : '-->'}

  <section>
    <div class="section-head reveal"><div><p class="eyebrow">أدوات تانية</p><h2 class="h2">ممكن تحتاج كمان<span class="dot">.</span></h2></div><a class="btn btn-light" href="../index.html#tools">كل الأدوات</a></div>
    <div class="tools-grid">${others.map((o, i) => toolCard(o, b, i * 80)).join('')}</div>
  </section>
</div>`;
  const demoScripts = t.web ? `
<link rel="stylesheet" href="${b}app/demo.css">
<script src="${b}app/qrcode.js"></script><script src="${b}app/xlsx.js"></script><script src="${b}app/store-web.js"></script><script src="${b}app/ui.js"></script><script src="${b}app/framework.js"></script>
<script src="${b}app/${t.id}.js"></script>
<script>
  (function () {
    var root = document.getElementById('demo-root');
    Tools['${t.id}'].render(root.querySelector('.demo-tool'), { params: new URLSearchParams(location.search), actions: root.querySelector('.demo-actions') });
  })();
</script>` : '';
  const url = `${siteUrl}/tools/${t.id}.html`;
  return layout({
    title: `${t.seo || t.tagline} | ${t.name} — أدوات محمد صبري`,
    desc: t.description,
    b, active: 'tools', body, scripts: demoScripts, path: `tools/${t.id}.html`, og: `og/${t.id}.png`,
    jsonld: { '@context': 'https://schema.org', '@graph': [
      { '@type': t.web && !t.extension ? 'WebApplication' : 'SoftwareApplication', name: t.name, alternateName: t.seo, description: t.description, url,
        image: `${siteUrl}/assets/og/${t.id}.png`, screenshot: `${siteUrl}/assets/shots/${t.id}.jpg`, inLanguage: 'ar',
        applicationCategory: 'BusinessApplication', operatingSystem: t.extension ? 'Chrome, Edge, Brave' : 'Any (Web)', softwareVersion: version,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'EGP' }, author: PERSON, ...(t.download ? { downloadUrl: `${siteUrl}/${t.download.zip}` } : {}) },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'الأدوات', item: siteUrl + '/' },
        { '@type': 'ListItem', position: 2, name: t.name, item: url }] },
    ] },
  });
}

// ================= صفحة التثبيت =================
function install() {
  const b = '';
  const body = `
<div class="wrap">
  <section class="panel hero" style="grid-template-columns:1fr;padding-bottom:40px">
    <div class="reveal">
      <p class="eyebrow">طريقة التثبيت <span class="en">· Load unpacked</span></p>
      <h1 class="display" style="font-size:clamp(38px,5vw,64px)">مرة واحدة<span class="dot">.</span><span class="soft">وبتاخد أقل من دقيقة.</span></h1>
      <p class="lead">الأدوات لسه مش على Chrome Web Store، فبتتثبّت من فولدر على جهازك. اختار الأداة من تحت، والدليل هيمشي معاك خطوة بخطوة.</p>
    </div>
  </section>
  <section>
    <div class="dark">${guide(b)}</div>
  </section>
  <section>
    <div class="section-head reveal"><div><p class="eyebrow">حل المشاكل <span class="en">· FAQ</span></p><h2 class="h2">لو حاجة مشتغلتش<span class="dot">.</span></h2></div></div>
    <div class="reveal">
      <details class="faq" open><summary>ظهرتلي رسالة "Manifest file is missing or unreadable"</summary><div>إنت اخترت فولدر غلط. اختار الفولدر اللي <b>جواه</b> ملف <code>manifest.json</code> على طول. ساعات فك الضغط بيعمل فولدر جوه فولدر بنفس الاسم، فادخل جوه لحد ما تلاقي <code>manifest.json</code>.</div></details>
      <details class="faq"><summary>اخترت ملف الـ zip ومش راضي</summary><div>كروم مش بيقبل ملف zip. لازم تفك الضغط الأول (الخطوة 1)، وبعدين تختار الفولدر اللي طلع.</div></details>
      <details class="faq"><summary>الإضافة اختفت أو بقت "Error" بعد شوية</summary><div>غالبًا الفولدر اتمسح أو اتنقل. كروم بيشغّل الإضافة من الفولدر ده نفسه، فحطه في مكان ثابت (زي <code>Documents/Extensions</code>) ومتمسحوش.</div></details>
      <details class="faq"><summary>إزاي أحدّث لنسخة جديدة؟</summary><div>جوه أي إضافة فيه لينك <b>تحديثات</b> تحت، بيقولّك لو فيه نسخة أحدث (أو افتح <a href="update.html" style="color:var(--red)">صفحة التحديثات</a>). نزّل النسخة الجديدة، وفك ضغطها مكان الفولدر القديم (استبدل الملفات)، وبعدين في <code>chrome://extensions</code> دوس ⟳ على الإضافة. بياناتك هتفضل زي ما هي.</div></details>
      <details class="faq"><summary>بستخدم Edge أو Brave أو Opera</summary><div>نفس الخطوات بالظبط، بس العنوان بيختلف: <code>edge://extensions</code> · <code>brave://extensions</code> · <code>opera://extensions</code>. وفي Edge زرار Developer mode موجود في القايمة الجانبية.</div></details>
      <details class="faq"><summary>هل ده آمن؟</summary><div>أيوه. كل أداة بتطلب أقل صلاحيات ممكنة، ومكتوب في صفحتها كل صلاحية وليه. ومفيش أي أداة بتبعت بياناتك لأي سيرفر، كل حاجة بتفضل على جهازك. والكود مفتوح تقدر تبص عليه جوه الفولدر.</div></details>
      <details class="faq"><summary>هل الأدوات بتشتغل على الموبايل؟</summary><div>الإضافات محتاجة كروم على الكمبيوتر. لكن ChatLink QR و UTM Studio و PostCheck و CampaignMath تقدر تجربهم من الموبايل على الموقع نفسه.</div></details>
    </div>
  </section>
</div>`;
  return layout({ title: 'طريقة تثبيت الأدوات (Load unpacked) — محمد صبري', desc: 'دليل تفاعلي خطوة بخطوة لتثبيت أدوات محمد صبري على كروم من فولدر (Load unpacked).', b, active: 'install', body, path: 'install.html', head: '<link rel="stylesheet" href="assets/guide.css">', scripts: toolsJson() + '\n<script src="assets/guide.js"></script>' });
}

function privacy() {
  const body = `
<div class="wrap">
  <section class="panel" style="margin-top:28px;padding:clamp(28px,5vw,64px);max-width:860px">
    <p class="eyebrow">الخصوصية <span class="en">· Privacy</span></p>
    <h1 class="display" style="font-size:clamp(34px,4vw,52px)">بياناتك بتاعتك<span class="dot">.</span><span class="soft">وبتفضل على جهازك.</span></h1>
    <div class="lead" style="max-width:none">
      <p><b>مفيش جمع بيانات.</b> الأدوات مش بتبعت أي بيانات لأي سيرفر خاص بينا، ومفيهاش تحليلات (Analytics) ولا تتبع.</p>
      <p><b>كل حاجة محلية.</b> الردود، والـ CRM، واللينكات، والإعلانات المحفوظة، والإعدادات بتتحفظ في متصفحك بس (chrome.storage أو localStorage على الموقع). ولو شلت الإضافة، البيانات بتتمسح معاها.</p>
      <p><b>واتساب ويب.</b> ContactHarvest و ReplyKit و ChatCRM بيقروا الصفحة اللي إنت فاتحها على جهازك. مفيش أي إرسال تلقائي للرسايل، وإنت اللي بتدوس إرسال دايمًا.</p>
      <p><b>Notion.</b> IdeaDrop بيبعت الفكرة اللي إنت بتحفظها مباشرة من متصفحك لـ Notion، بالمفتاح بتاعك، ولقاعدة البيانات اللي إنت اخترتها بس.</p>
      <p><b>Meta Ad Library.</b> AdVault بيحفظ الإعلان اللي إنت بتدوس على زرار حفظه بس، ومش بيسحب أي إعلانات لوحده.</p>
      <p><b>الموقع.</b> الموقع ده صفحات ثابتة، ومفيهوش كوكيز تتبع.${analytics.cloudflareToken ? ' بنستخدم Cloudflare Web Analytics عشان نعرف عدد الزيارات والصفحات الأكتر زيارة بس. ده من غير كوكيز، ومن غير ما نعرف إنت مين.' : ''}</p>
      <p style="color:var(--ink-3);font-size:15px">آخر تحديث: ${new Date().toISOString().slice(0, 10)}</p>
    </div>
  </section>
</div>`;
  return layout({ title: 'الخصوصية — أدوات محمد صبري', desc: 'سياسة الخصوصية لأدوات محمد صبري: مفيش جمع بيانات، وكل حاجة على جهازك.', b: '', active: '', body, path: 'privacy.html' });
}

// ================= صفحة التحديثات =================
// الإضافة بتفتحها كده: update.html?tool=<id>&v=<النسخة اللي عند المستخدم>
function update() {
  const all = [...tools.filter((t) => t.extension), bundle].map((t) => ({ id: t.id, name: t.name, zip: t.download.zip, folder: t.download.folder }));
  const body = `
<div class="wrap">
  <section class="panel hero" style="grid-template-columns:1fr">
    <div>
      <p class="eyebrow">التحديثات <span class="en">· Updates</span></p>
      <h1 class="display" style="font-size:clamp(34px,5vw,58px)" id="u-title">آخر نسخة: <span class="en">v${version}</span><span class="dot">.</span><span class="soft" id="u-sub">نزّل آخر نسخة من أي أداة.</span></h1>
      <div id="u-box" style="margin-top:24px"></div>
    </div>
  </section>
  <section>
    <div class="split" style="align-items:start">
      <div class="panel reveal" style="padding:clamp(24px,4vw,40px)">
        <p class="eyebrow">إزاي تحدّث <span class="en">· How to update</span></p>
        <ol class="lead" style="max-width:none;padding-inline-start:20px">
          <li>نزّل النسخة الجديدة من الزرار.</li>
          <li>فك الضغط <b>مكان الفولدر القديم</b> (استبدل الملفات)، عشان كروم بيشغّل الإضافة من نفس الفولدر.</li>
          <li>افتح <span class="kbd">chrome://extensions</span> ودوس ⟳ على الإضافة.</li>
        </ol>
        <p style="color:var(--ink-3)">بياناتك (الردود، والـ CRM، واللينكات...) بتفضل زي ما هي.</p>
      </div>
      <div class="panel reveal" style="padding:clamp(24px,4vw,40px)">
        <p class="eyebrow">الجديد <span class="en">· Changelog</span></p>
        ${changelog.map((c) => `<div style="padding:10px 0;border-bottom:1px solid var(--line)"><b class="en">v${esc(c.version)}</b> <span style="color:var(--ink-3);font-size:14px">${esc(c.date)}</span><ul style="margin:6px 0 0;padding-inline-start:20px;color:var(--ink-2)">${c.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul></div>`).join('')}
      </div>
    </div>
  </section>
</div>`;
  const script = `<script>
(function () {
  var ALL = ${JSON.stringify(all)}, LATEST = ${JSON.stringify(version)};
  var q = new URLSearchParams(location.search), id = q.get('tool'), v = q.get('v');
  var t = ALL.filter(function (x) { return x.id === id; })[0];
  var cmp = function (a, b) { a = String(a).split('.').map(Number); b = String(b).split('.').map(Number); for (var i = 0; i < 3; i++) { if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) - (b[i] || 0); } return 0; };
  var box = document.getElementById('u-box'), sub = document.getElementById('u-sub');
  if (t && v) {
    if (cmp(v, LATEST) >= 0) {
      sub.textContent = 'عندك أحدث نسخة من ' + t.name + ' (v' + v + ').';
      box.innerHTML = '<span class="tag red" style="font-size:15px;padding:6px 16px">✓ مفيش تحديث جديد</span>';
    } else {
      sub.textContent = 'فيه نسخة جديدة من ' + t.name + '. عندك v' + v + '.';
      box.innerHTML = '<a class="btn btn-red" download href="' + t.zip + '">تحميل ' + t.name + ' v' + LATEST + '</a>';
    }
  } else {
    box.innerHTML = '<div class="tools-grid">' + ALL.map(function (x) { return '<a class="panel tool-card" download href="' + x.zip + '"><img class="ic" src="assets/icons/' + x.id + '.svg" alt=""><h3 class="en" style="text-align:right">' + x.name + '</h3><span class="go">تحميل v' + LATEST + '</span></a>'; }).join('') + '</div>';
  }
})();
</script>`;
  return layout({ title: 'التحديثات — أدوات محمد صبري', desc: 'آخر نسخة من أدوات محمد صبري وإزاي تحدّث.', b: '', active: '', body, scripts: script, path: 'update.html', noindex: true });
}

// ================= نسخة الأدوات الأونلاين =================
function demoCss() {
  // brand.css بتاع الإضافة بس محصور جوه .demo عشان ميأثرش على الموقع
  const css = fs.readFileSync(path.join(TK, 'lib', 'brand.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const out = [];
  for (const block of css.split('}')) {
    const i = block.indexOf('{');
    if (i < 0) continue;
    const sel = block.slice(0, i).trim(), rules = block.slice(i + 1).trim();
    if (!sel || sel.startsWith('@font-face') || sel === '.toast') continue;
    const scoped = sel.split(',').map((s) => {
      s = s.trim();
      if (s === ':root' || s === 'html' || s === 'body') return '.demo';
      if (s === '*') return '.demo *';
      return '.demo ' + s;
    });
    out.push(`${Array.from(new Set(scoped)).join(', ')} { ${rules} }`);
  }
  out.push('.demo { background: var(--black); color: var(--text); border-radius: 20px; padding: 18px; font: 14px/1.6 Cairo, Inter, sans-serif; }');
  out.push('.demo h3 { margin: 0 0 10px; }');
  return '/* متولّد من toolkit/lib/brand.css بواسطة scripts/build-site.js */\n' + out.join('\n') + '\n';
}

// ================= كتابة الملفات =================
const write = (p, s) => { fs.mkdirSync(path.dirname(path.join(SITE, p)), { recursive: true }); fs.writeFileSync(path.join(SITE, p), s); console.log('✔ site/' + p); };
write('index.html', home());
write('install.html', install());
write('privacy.html', privacy());
tools.forEach((t) => write(`tools/${t.id}.html`, toolPage(t)));
write('app/demo.css', demoCss());
for (const f of ['qrcode.js', 'xlsx.js', 'ui.js']) fs.copyFileSync(path.join(TK, 'lib', f), path.join(SITE, 'app', f));
for (const t of tools.filter((x) => x.web)) fs.copyFileSync(path.join(TK, 'tools', t.id + '.js'), path.join(SITE, 'app', t.id + '.js'));
fs.copyFileSync(path.join(TK, 'lib', 'framework.js'), path.join(SITE, 'app', 'framework.js'));
console.log('✔ site/app (أدوات أونلاين: ' + tools.filter((x) => x.web).map((x) => x.name).join('، ') + ')');
write('update.html', update());
write('404.html', layout({ title: 'الصفحة مش موجودة — محمد صبري', desc: '', b: '/', noindex: true, body: `<div class="wrap"><section class="panel hero" style="grid-template-columns:1fr;text-align:center"><div><h1 class="display">404<span class="dot">.</span><span class="soft">الصفحة دي مش موجودة.</span></h1><div style="margin-top:28px"><a class="btn btn-red" href="/index.html">ارجع للرئيسية</a></div></div></section></div>` }));
write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`);
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${['', 'install.html', 'privacy.html', ...tools.map((t) => `tools/${t.id}.html`)].map((u) => `  <url><loc>${siteUrl}/${u}</loc><lastmod>${TODAY}</lastmod></url>`).join('\n')}\n</urlset>\n`);

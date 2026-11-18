#!/usr/bin/env node
// بيعمل صورة مشاركة (1200×630) لكل أداة ← site/assets/og/<id>.png
// التشغيل (بعد scripts/build.js): node scripts/og.js   — محتاج Playwright
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const A = path.join(ROOT, 'site', 'assets');
const data = JSON.parse(fs.readFileSync(path.join(A, 'tools.json'), 'utf8'));
const OUT = path.join(A, 'og');
fs.mkdirSync(OUT, { recursive: true });

const b64 = (f) => fs.readFileSync(f).toString('base64');
const font = (f) => `data:font/woff2;base64,${b64(path.join(A, 'fonts', f))}`;
const logo = `data:image/png;base64,${b64(path.join(A, 'logo-white.png'))}`;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function html(t) {
  const st = data.framework.find((x) => x.id === t.stage);
  const icon = fs.readFileSync(path.join(A, 'icons', t.id + '.svg'), 'utf8').replace('<svg ', '<svg width="210" height="210" ');
  const badge = t.extension && t.web ? 'إضافة كروم + أونلاين' : t.extension ? 'إضافة كروم مجانية' : 'مجانية على الموقع';
  return `<html dir="rtl" style="overflow:hidden"><head><style>
    @font-face{font-family:C;font-weight:800;src:url(${font('cairo-arabic-800-normal.woff2')})}
    @font-face{font-family:C;font-weight:400;src:url(${font('cairo-arabic-400-normal.woff2')})}
    @font-face{font-family:I;font-weight:800;src:url(${font('inter-latin-800-normal.woff2')})}
    body{margin:0;width:1200px;height:630px;background:#0E0E0E;color:#fff;font-family:C,I;position:relative;overflow:hidden}
    .glow{position:absolute;top:-240px;left:-200px;width:640px;height:640px;border-radius:50%;background:radial-gradient(circle,rgba(199,22,29,.38),transparent 70%)}
    .bar{position:absolute;top:0;left:0;right:0;height:8px;background:#C7161D}
    .logo{position:absolute;top:46px;right:70px;height:92px}
    .stage{position:absolute;top:70px;left:70px;font:800 18px I;letter-spacing:.2em;color:rgba(255,255,255,.5);direction:ltr}
    .icon{position:absolute;left:90px;top:200px;border-radius:52px;box-shadow:0 30px 80px rgba(0,0,0,.6)}
    .txt{position:absolute;right:70px;top:190px;width:760px}
    .name{font:800 92px/1.05 I;direction:ltr;text-align:right;letter-spacing:-2px}
    .name span{color:#C7161D}
    .tag{font:800 42px/1.35 C,I;margin-top:18px}
    .foot{position:absolute;bottom:52px;right:70px;left:70px;display:flex;justify-content:space-between;align-items:center}
    .pill{background:#C7161D;border-radius:999px;padding:8px 22px;font:800 22px C,I}
    .dom{font:800 22px I;color:rgba(255,255,255,.55);direction:ltr}
  </style></head><body><div class="glow"></div><div class="bar"></div>
    <img class="logo" src="${logo}">
    <div class="stage">${st ? `0${st.n} · ${esc(st.en.toUpperCase())}` : 'MARKETER\'S TOOLKIT'}</div>
    <div class="icon">${icon}</div>
    <div class="txt"><div class="name">${t.nameHtml}</div><div class="tag">${esc(t.tagline)}</div></div>
    <div class="foot"><span class="pill">${badge}</span><span class="dom">${esc(data.siteUrl.replace('https://', ''))}</span></div>
  </body></html>`;
}

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  for (const t of [...data.tools, data.bundle]) {
    await p.setContent(html(t));
    await p.waitForTimeout(80);
    await p.screenshot({ path: path.join(OUT, t.id + '.png') });
    console.log('✔ og/' + t.id + '.png');
  }
  await b.close();
})();

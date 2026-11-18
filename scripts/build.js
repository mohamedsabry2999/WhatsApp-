#!/usr/bin/env node
// بيبني كل أداة كإضافة كروم منفصلة + النسخة المجمّعة، من نفس الكود في toolkit/
// التشغيل: node scripts/build.js
// الناتج: dist/<Name>/ (فولدر الإضافة) + site/downloads/<Name>-v<version>.zip
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { VERSION, AUTHOR, SITE_URL, tools, bundle, ALL_OFF } = require('../tools.config.js');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'toolkit');
const DIST = path.join(ROOT, 'dist');
const DOWNLOADS = path.join(ROOT, 'site', 'downloads');

const folderName = (t) => t.name.replace(/'/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
const CONTENT = {
  whatsapp: { matches: ['https://web.whatsapp.com/*'], js: ['features.js', 'lib/store.js', 'lib/defaults.js', 'content/whatsapp.js'], css: ['content/whatsapp.css'], run_at: 'document_idle' },
  ads: { matches: ['https://www.facebook.com/ads/library/*'], js: ['features.js', 'lib/store.js', 'content/adlibrary.js'], css: ['content/adlibrary.css'], run_at: 'document_idle' },
};

function manifestFor(t) {
  const icons = { 16: 'icons/icon16.png', 32: 'icons/icon32.png', 48: 'icons/icon48.png', 128: 'icons/icon128.png' };
  const desc = `${t.tagline}. تطوير: ${AUTHOR}`;
  if (desc.length > 132) throw new Error(`description too long for ${t.id}: ${desc.length}`);
  const m = {
    manifest_version: 3,
    name: t.name,
    short_name: t.name.slice(0, 12),
    description: desc,
    version: VERSION,
    author: AUTHOR,
    homepage_url: SITE_URL + '/',
    permissions: t.permissions,
  };
  if (t.hosts.length) m.host_permissions = t.hosts;
  m.background = { service_worker: 'background.js' };
  if (t.content.length) m.content_scripts = t.content.map((c) => CONTENT[c]);
  m.action = { default_title: `${t.name} — محمد صبري`, default_icon: icons };
  if (t.popup) m.action.default_popup = 'popup.html';
  m.icons = icons;
  if (t.content.length) {
    m.web_accessible_resources = [{ resources: ['fonts/*', 'icons/*'], matches: t.content.flatMap((c) => CONTENT[c].matches.map((u) => u.replace(/\/ads\/library\/\*$/, '/*'))) }];
  }
  return m;
}

function featuresFor(t) {
  const f = {
    id: t.id, name: t.name, nameHtml: t.nameHtml, tagline: t.tagline,
    tools: t.tools, home: t.home || '', popup: t.popup || 'none', welcome: t.welcome || '',
    ...ALL_OFF, ...t.features,
  };
  return '// متولّد من tools.config.js بواسطة scripts/build.js\nvar MT_FEATURES = ' + JSON.stringify(f, null, 2) + ';\n';
}

function build(t) {
  const name = folderName(t);
  const out = path.join(DIST, name);
  fs.rmSync(out, { recursive: true, force: true });
  fs.cpSync(SRC, out, {
    recursive: true,
    filter: (src) => !src.includes(`${path.sep}icons${path.sep}tools`) && !src.endsWith('README.md'),
  });
  // الأيقونة الخاصة بالأداة
  const ic = path.join(SRC, 'icons', 'tools');
  for (const s of [16, 32, 48, 128]) fs.copyFileSync(path.join(ic, `${t.id}-${s}.png`), path.join(out, 'icons', `icon${s}.png`));
  fs.copyFileSync(path.join(ic, `${t.id}.svg`), path.join(out, 'icons', 'icon.svg'));
  fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifestFor(t), null, 2) + '\n');
  fs.writeFileSync(path.join(out, 'features.js'), featuresFor(t));
  fs.writeFileSync(path.join(out, 'README.txt'),
    `${t.name} v${VERSION}\n${t.tagline}\nتطوير: ${AUTHOR}\n\nالتثبيت:\n1) افتح chrome://extensions\n2) فعّل Developer mode\n3) دوس Load unpacked واختار الفولدر ده (${name})\n\nالشرح الكامل: ${SITE_URL}/install.html\n`);
  // zip فيه فولدر واحد باسم الأداة (عشان المستخدم يختاره على طول)
  fs.mkdirSync(DOWNLOADS, { recursive: true });
  const zip = path.join(DOWNLOADS, `${name}-v${VERSION}.zip`);
  fs.rmSync(zip, { force: true });
  execFileSync('zip', ['-qr', '-X', zip, name], { cwd: DIST });
  const size = fs.statSync(zip).size;
  return { id: t.id, name: t.name, folder: name, zip: path.relative(path.join(ROOT, 'site'), zip), size };
}

// ملف البيانات للموقع
function siteData(built) {
  const pick = (t) => ({
    id: t.id, name: t.name, nameHtml: t.nameHtml, category: t.category, tagline: t.tagline, description: t.description,
    bullets: t.bullets, where: t.where || '', web: !!t.web, permissions: t.permissions, hosts: t.hosts,
    download: built.find((b) => b.id === t.id),
  });
  return { version: VERSION, author: AUTHOR, siteUrl: SITE_URL, tools: tools.map(pick), bundle: pick(bundle) };
}

fs.mkdirSync(DIST, { recursive: true });
const built = [...tools, bundle].map(build);
built.forEach((b) => console.log(`✔ ${b.name.padEnd(20)} ${b.zip}  ${(b.size / 1024).toFixed(0)} KB`));
fs.mkdirSync(path.join(ROOT, 'site', 'assets'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'site', 'assets', 'tools.json'), JSON.stringify(siteData(built), null, 2));
console.log('✔ site/assets/tools.json');

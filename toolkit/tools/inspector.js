// فاحص الصفحة: أكواد التتبع + SEO
// inspectPage بتتحقن جوه الصفحة نفسها (world: MAIN) عشان تقدر تشوف المتغيرات زي fbq و gtag.
// لازم تكون كاملة لوحدها.
function inspectPage() {
  const out = { url: location.href, trackers: [], platform: [], seo: {} };
  const srcs = Array.from(document.scripts).map((s) => s.src || '').filter(Boolean);
  const inline = Array.from(document.scripts).filter((s) => !s.src).map((s) => s.textContent || '').join('\n').slice(0, 3000000);
  const hasSrc = (re) => srcs.some((s) => re.test(s));
  const uniq = (a) => Array.from(new Set(a.filter(Boolean)));
  const matchAll = (re, text) => { const r = []; let m; const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g'); while ((m = g.exec(text))) r.push(m[1] || m[0]); return r; };
  const allText = inline + '\n' + srcs.join('\n');
  const add = (name, present, ids = [], note = '') => { if (present || ids.length) out.trackers.push({ name, ids: uniq(ids), note }); };
  const w = window;

  // Meta Pixel
  let metaIds = [];
  try { const st = w.fbq && w.fbq.getState && w.fbq.getState(); if (st && st.pixels) metaIds = st.pixels.map((p) => p.id); } catch (e) {}
  metaIds = metaIds.concat(matchAll(/fbq\(\s*['"]init['"]\s*,\s*['"](\d{8,20})['"]/, inline));
  add('Meta Pixel', !!w.fbq || hasSrc(/connect\.facebook\.net\/.*fbevents/), metaIds);

  // Google
  const gtm = uniq([].concat(Object.keys(w.google_tag_manager || {}).filter((k) => /^GTM-/.test(k)), matchAll(/\b(GTM-[A-Z0-9]{4,10})\b/, allText)));
  const ga4 = uniq([].concat(Object.keys(w.google_tag_manager || {}).filter((k) => /^G-/.test(k)), matchAll(/\b(G-[A-Z0-9]{6,12})\b/, allText)));
  const ads = uniq([].concat(Object.keys(w.google_tag_manager || {}).filter((k) => /^AW-/.test(k)), matchAll(/\b(AW-\d{6,12})\b/, allText)));
  const ua = uniq(matchAll(/\b(UA-\d{4,10}-\d{1,4})\b/, allText));
  add('Google Tag Manager', gtm.length > 0 || hasSrc(/googletagmanager\.com\/gtm\.js/), gtm);
  add('Google Analytics 4', ga4.length > 0, ga4);
  add('Google Ads', ads.length > 0, ads);
  add('Universal Analytics (قديم ومتوقف)', ua.length > 0, ua, 'جوجل وقفت UA، لازم GA4');

  // TikTok
  let tt = [];
  try { if (w.ttq && w.ttq._i) tt = Object.keys(w.ttq._i); } catch (e) {}
  tt = tt.concat(matchAll(/ttq\.load\(\s*['"]([A-Z0-9]{10,30})['"]/, inline));
  add('TikTok Pixel', !!w.ttq || hasSrc(/analytics\.tiktok\.com/), tt);

  // Snap / X / LinkedIn / Pinterest
  add('Snap Pixel', !!w.snaptr || hasSrc(/sc-static\.net\/scevent/), matchAll(/snaptr\(\s*['"]init['"]\s*,\s*['"]([a-f0-9-]{20,})['"]/, inline));
  add('X (Twitter) Pixel', !!w.twq || hasSrc(/static\.ads-twitter\.com/), matchAll(/twq\(\s*['"](?:init|config)['"]\s*,\s*['"]([a-z0-9]{4,10})['"]/, inline));
  const li = [].concat(w._linkedin_partner_id ? [String(w._linkedin_partner_id)] : [], (w._linkedin_data_partner_ids || []).map(String));
  add('LinkedIn Insight Tag', li.length > 0 || hasSrc(/snap\.licdn\.com/), li);
  add('Pinterest Tag', !!w.pintrk || hasSrc(/s\.pinimg\.com\/ct\/core\.js/), matchAll(/pintrk\(\s*['"]load['"]\s*,\s*['"](\d{8,20})['"]/, inline));

  // تحليل السلوك
  add('Microsoft Clarity', !!w.clarity || hasSrc(/clarity\.ms\/tag/), matchAll(/clarity\.ms\/tag\/([a-z0-9]{6,12})/, allText));
  add('Hotjar', !!w.hj || hasSrc(/static\.hotjar\.com/), w._hjSettings && w._hjSettings.hjid ? [String(w._hjSettings.hjid)] : []);
  add('Yandex Metrica', !!w.ym || hasSrc(/mc\.yandex\.ru\/metrika/), []);

  // المنصة
  const gen = (document.querySelector('meta[name="generator"]') || {}).content || '';
  if (w.Shopify) out.platform.push('Shopify');
  if (w.salla || hasSrc(/salla\./)) out.platform.push('Salla');
  if (hasSrc(/zid\.store|zidcdn/)) out.platform.push('Zid');
  if (w.wixBiSession || /wix/i.test(gen)) out.platform.push('Wix');
  if (/wordpress/i.test(gen) || hasSrc(/\/wp-content\//)) out.platform.push('WordPress');
  if (hasSrc(/woocommerce/) || document.body.classList.contains('woocommerce')) out.platform.push('WooCommerce');
  if (w.__NEXT_DATA__) out.platform.push('Next.js');
  if (gen && !out.platform.length) out.platform.push(gen);

  // SEO
  const meta = (sel) => { const el = document.querySelector(sel); return el ? (el.getAttribute('content') || el.getAttribute('href') || '').trim() : ''; };
  const h1s = Array.from(document.querySelectorAll('h1')).map((h) => h.innerText.trim().replace(/\s+/g, ' ')).filter(Boolean);
  const imgs = Array.from(document.images);
  const types = [];
  document.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
    try {
      const walk = (o) => { if (!o || typeof o !== 'object') return; if (Array.isArray(o)) return o.forEach(walk); if (o['@type']) types.push([].concat(o['@type']).join('/')); if (o['@graph']) walk(o['@graph']); };
      walk(JSON.parse(s.textContent));
    } catch (e) {}
  });
  const text = (document.body && document.body.innerText) || '';
  Object.assign(out.seo, {
    title: document.title.trim(),
    description: meta('meta[name="description"]'),
    canonical: meta('link[rel="canonical"]'),
    robots: meta('meta[name="robots"]'),
    lang: document.documentElement.lang || '',
    viewport: !!document.querySelector('meta[name="viewport"]'),
    h1: h1s.slice(0, 3), h1Count: h1s.length,
    h2Count: document.querySelectorAll('h2').length,
    images: imgs.length, imagesNoAlt: imgs.filter((i) => !i.hasAttribute('alt') || !i.getAttribute('alt').trim()).length,
    hreflang: document.querySelectorAll('link[rel="alternate"][hreflang]').length,
    ogTitle: meta('meta[property="og:title"]'), ogDescription: meta('meta[property="og:description"]'),
    ogImage: meta('meta[property="og:image"]'), twitterCard: meta('meta[name="twitter:card"]'),
    schema: Array.from(new Set(types)),
    words: (text.match(/\S+/g) || []).length,
  });
  return out;
}

// تقييم SEO: كل بند ok / warn / bad
function seoChecks(s) {
  const c = [];
  const tl = s.title.length, dl = s.description.length;
  c.push(!tl ? ['bad', 'مفيش Title'] : tl < 30 || tl > 60 ? ['warn', `طول الـ Title ${tl} حرف (الأفضل 30–60)`] : ['ok', `Title مظبوط (${tl} حرف)`]);
  c.push(!dl ? ['bad', 'مفيش Meta Description'] : dl < 70 || dl > 160 ? ['warn', `طول الوصف ${dl} حرف (الأفضل 70–160)`] : ['ok', `الوصف مظبوط (${dl} حرف)`]);
  c.push(s.h1Count === 1 ? ['ok', 'H1 واحد بس'] : s.h1Count === 0 ? ['bad', 'مفيش H1'] : ['warn', `فيه ${s.h1Count} عناوين H1 (الأفضل واحد)`]);
  c.push(s.canonical ? ['ok', 'فيه Canonical'] : ['warn', 'مفيش Canonical']);
  c.push(s.ogImage ? ['ok', 'فيه صورة مشاركة (og:image)'] : ['bad', 'مفيش og:image، المشاركة على السوشيال هتطلع من غير صورة']);
  c.push(s.viewport ? ['ok', 'متظبطة للموبايل (viewport)'] : ['bad', 'مفيش viewport، الصفحة مش متظبطة للموبايل']);
  c.push(s.imagesNoAlt ? ['warn', `${s.imagesNoAlt} من ${s.images} صورة من غير alt`] : ['ok', 'كل الصور ليها alt']);
  c.push(s.lang ? ['ok', `لغة الصفحة: ${s.lang}`] : ['warn', 'لغة الصفحة مش محددة (lang)']);
  if (/noindex/i.test(s.robots)) c.push(['bad', 'الصفحة عليها noindex، جوجل مش هيأرشفها']);
  c.push(s.schema.length ? ['ok', 'Schema: ' + s.schema.join('، ')] : ['warn', 'مفيش Structured Data (Schema)']);
  return c;
}

function inspectionToText(d) {
  const lines = [`فحص: ${d.url}`, '', 'أكواد التتبع:'];
  if (!d.trackers.length) lines.push('- مفيش أكواد تتبع ظاهرة');
  d.trackers.forEach((t) => lines.push(`- ${t.name}${t.ids.length ? ': ' + t.ids.join(', ') : ''}${t.note ? ' (' + t.note + ')' : ''}`));
  if (d.platform.length) lines.push('', 'المنصة: ' + d.platform.join('، '));
  lines.push('', 'SEO:');
  seoChecks(d.seo).forEach(([lvl, msg]) => lines.push(`${lvl === 'ok' ? '✔' : lvl === 'warn' ? '!' : '✖'} ${msg}`));
  lines.push('', `— Marketer's Toolkit by Mohamed Sabry`);
  return lines.join('\n');
}

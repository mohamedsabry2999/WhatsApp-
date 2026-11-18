try { $('#ver').textContent = chrome.runtime.getManifest().version; } catch (e) {}

function show(view) {
  $$('.view').forEach((v) => v.classList.toggle('on', v.id === 'v-' + view));
}
$$('[data-back]').forEach((b) => b.addEventListener('click', () => show('home')));

function openTool(id, query = '') {
  chrome.tabs.create({ url: chrome.runtime.getURL('app.html') + (query ? '?' + query : '') + '#' + id });
  window.close();
}
$$('[data-open]').forEach((b) => b.addEventListener('click', () => openTool(b.dataset.open)));

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}
const scriptable = (tab) => tab && /^https?:/.test(tab.url || '') && !/^https:\/\/chromewebstore\.google\.com/.test(tab.url);

// ---------- فحص الصفحة ----------
$('#qa-inspect').addEventListener('click', async () => {
  show('inspect');
  const out = $('#inspect-out');
  const tab = await activeTab();
  if (!scriptable(tab)) { out.innerHTML = '<div class="check bad"><span class="i">✖</span>افتح موقع عادي (http/https) الأول. صفحات كروم الداخلية مينفعش تتفحص.</div>'; return; }
  try {
    const [res] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: inspectPage, world: 'MAIN' });
    const d = res.result;
    const s = d.seo;
    let html = `<div class="muted mono" style="font-size:11px;margin-bottom:8px">${esc(d.url)}</div>`;
    html += '<h3>أكواد التتبع</h3>';
    html += d.trackers.length
      ? d.trackers.map((t) => `<div class="check ok"><span class="i">●</span><div><b style="color:var(--white)">${esc(t.name)}</b>${t.ids.length ? `<div class="mono muted" style="font-size:11px">${t.ids.map(esc).join(' · ')}</div>` : ''}${t.note ? `<div style="color:var(--warn);font-size:11px">${esc(t.note)}</div>` : ''}</div></div>`).join('')
      : '<div class="check bad"><span class="i">✖</span>مفيش أي أكواد تتبع ظاهرة على الصفحة دي</div>';
    if (d.platform.length) html += `<div style="margin:6px 0 10px">المنصة: ${d.platform.map((p) => `<span class="pill red">${esc(p)}</span>`).join(' ')}</div>`;
    html += '<h3 style="margin-top:12px">SEO</h3>';
    html += seoChecks(s).map(([lvl, msg]) => `<div class="check ${lvl}"><span class="i">${lvl === 'ok' ? '✔' : lvl === 'warn' ? '!' : '✖'}</span>${esc(msg)}</div>`).join('');
    html += `<div class="kv" style="margin-top:8px"><b>Title</b><span>${esc(s.title) || '—'}</span><b>Description</b><span>${esc(s.description) || '—'}</span><b>H1</b><span>${s.h1.map(esc).join(' / ') || '—'}</span><b>عدد الكلمات</b><span>${s.words}</span></div>`;
    html += '<h3 style="margin-top:12px">شكلها لما تتشارك</h3>';
    html += `<div class="og">${s.ogImage ? `<img src="${esc(s.ogImage)}" alt="">` : '<div class="muted">من غير صورة</div>'}<div><b style="color:var(--white)">${esc(s.ogTitle || s.title)}</b><div class="muted" style="font-size:12px">${esc(s.ogDescription || s.description)}</div></div></div>`;
    html += '<button class="btn" id="copy-report" style="width:100%;margin-top:10px">انسخ التقرير</button>';
    out.innerHTML = html;
    out.classList.remove('muted');
    $('#copy-report').addEventListener('click', () => copyText(inspectionToText(d), 'التقرير اتنسخ ✔'));
  } catch (e) {
    out.innerHTML = `<div class="check bad"><span class="i">✖</span>مقدرتش أفحص الصفحة: ${esc(e.message || e)}</div>`;
  }
});

// ---------- Notion ----------
let notionCtx = {};
$('#qa-notion').addEventListener('click', async () => {
  const settings = await Store.get('notion', {});
  if (!settings.token || !settings.dbId) { openTool('notion'); return; }
  show('notion');
  const tab = await activeTab();
  notionCtx = { url: tab.url, title: tab.title, selection: '' };
  $('#n-title').value = tab.title || '';
  if (scriptable(tab)) {
    try {
      const [r] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => String(window.getSelection()).trim().slice(0, 1800) });
      notionCtx.selection = r.result || '';
    } catch (e) {}
  }
  $('#n-sel').textContent = notionCtx.selection ? 'هيتحفظ كمان النص المحدد: "' + notionCtx.selection.slice(0, 120) + (notionCtx.selection.length > 120 ? '…"' : '"') : '';
});
$('#n-save').addEventListener('click', async () => {
  const btn = $('#n-save'), st = $('#n-status');
  btn.disabled = true; st.className = ''; st.textContent = 'جاري الحفظ...';
  const res = await chrome.runtime.sendMessage({ type: 'notion-save', item: { ...notionCtx, title: $('#n-title').value.trim() || notionCtx.title, note: $('#n-note').value.trim() } });
  btn.disabled = false;
  if (res && res.ok) { st.className = 'ok'; st.id = 'n-status'; st.textContent = 'اتحفظت على Notion ✔'; }
  else { st.className = 'err'; st.textContent = 'مقدرتش أحفظ: ' + ((res && res.error) || 'خطأ غير معروف'); }
  st.style.marginTop = '10px';
});

// ---------- UTM للصفحة الحالية ----------
$('#qa-utm').addEventListener('click', async () => {
  const tab = await activeTab();
  openTool('utm', 'url=' + encodeURIComponent(scriptable(tab) ? tab.url.split('#')[0] : ''));
});

// ---------- ContactHarvest ----------
$('#qa-harvest').addEventListener('click', () => show('harvest'));
$('#go').addEventListener('click', async () => {
  const btn = $('#go'), st = $('#status');
  const set = (t, c = '') => { st.textContent = t; st.className = c; };
  btn.disabled = true; set('جاري القراءة...');
  try {
    const tab = await activeTab();
    if (!tab || !(tab.url || '').startsWith('https://web.whatsapp.com')) { set('افتح web.whatsapp.com في التاب الحالي وسجّل دخول، وبعدين دوس الزرار تاني.', 'err'); return; }
    const [res] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: extractWhatsAppContacts, args: [{ includeAllContacts: $('#includeAll').checked }] });
    const data = res && res.result;
    if (!data) throw new Error('مفيش نتيجة من الصفحة');
    if (data.error) { set(data.error, 'err'); return; }
    if (!data.rows.length) { set('ملقتش أي محادثات. استنى لحد ما واتساب ويب يحمّل المحادثات كلها وجرب تاني.', 'err'); return; }
    const rows = data.rows.map((r, i) => [i + 1, r.name || '(بدون اسم)', r.phone, r.pushName, r.saved ? 'نعم' : 'لا',
      r.chatted ? fmtDateTime(r.lastMessage * 1000) : '(مفيش محادثة)', r.groups.length, r.groups.join('، ')]);
    const headers = ['#', 'الاسم', 'رقم التليفون', 'الاسم على واتساب', 'محفوظ عندي؟', 'آخر محادثة', 'عدد الجروبات المشتركة', 'الجروبات المشتركة'];
    const fmt = document.querySelector('input[name="fmt"]:checked').value;
    if (fmt === 'csv') exportCsv('ContactHarvest', headers, rows);
    else exportXlsx('ContactHarvest', headers, rows, [6, 30, 20, 25, 13, 18, 12, 50]);
    const hidden = data.rows.filter((r) => !r.phone.startsWith('+')).length;
    set(`تم ✔ ${data.rows.length} جهة اتصال اتحفظت في الشيت.` + (hidden ? `\n${hidden} منهم رقمهم مخفي من واتساب.` : ''), 'ok');
  } catch (e) {
    set('حصل خطأ: ' + (e && e.message ? e.message : e), 'err');
  } finally { btn.disabled = false; }
});

// نسخة أداة واحدة: افتح الأداة على طول
const FEAT = (typeof MT_FEATURES !== 'undefined' && MT_FEATURES) || { popup: 'home' };
if (FEAT.popup !== 'home') {
  $('#brand').innerHTML = FEAT.nameHtml;
  if (FEAT.tagline) $('#tagline').textContent = FEAT.tagline;
  $$('[data-back]').forEach((b) => { b.hidden = true; });
  const start = { inspect: '#qa-inspect', notion: '#qa-notion', harvest: '#qa-harvest' }[FEAT.popup];
  if (start) $(start).click();
}

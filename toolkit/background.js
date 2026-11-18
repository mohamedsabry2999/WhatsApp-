// Marketer's Toolkit — background service worker
// تطوير: محمد صبري | Mohamed Sabry
importScripts('features.js', 'lib/store.js');
const F = MT_FEATURES;

const NOTION_VERSION = '2022-06-28';
const CRM_PREFIX = 'crm|';

// ================= Notion =================
function notionId(input) {
  const m = String(input || '').replace(/-/g, '').match(/[0-9a-f]{32}/i);
  return m ? m[0] : '';
}
async function notionFetch(path, token, opts = {}) {
  const r = await fetch('https://api.notion.com/v1' + path, {
    ...opts,
    headers: { Authorization: 'Bearer ' + token, 'Notion-Version': NOTION_VERSION, 'Content-Type': 'application/json' },
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = data.message || r.statusText;
    if (r.status === 401) throw new Error('المفتاح (Token) غلط أو اتلغى.');
    if (r.status === 404) throw new Error('مش لاقي قاعدة البيانات. اتأكد إنك عملت Share/Connect لها مع الـ Integration.');
    throw new Error(msg);
  }
  return data;
}
async function notionSchema(token, dbInput) {
  const id = notionId(dbInput);
  if (!id) throw new Error('رابط أو ID قاعدة البيانات مش مظبوط.');
  const db = await notionFetch('/databases/' + id, token);
  const props = Object.entries(db.properties || {}).map(([name, p]) => ({
    name, type: p.type,
    options: ((p[p.type] && p[p.type].options) || []).map((o) => o.name),
  }));
  const title = (db.title || []).map((t) => t.plain_text).join('') || 'Untitled';
  return { id, title, props };
}
const rt = (s) => [{ type: 'text', text: { content: String(s).slice(0, 1990) } }];
function propValue(type, value) {
  switch (type) {
    case 'select': return { select: { name: value } };
    case 'multi_select': return { multi_select: String(value).split(',').map((v) => ({ name: v.trim() })).filter((v) => v.name) };
    case 'status': return { status: { name: value } };
    case 'rich_text': return { rich_text: rt(value) };
    case 'url': return { url: value };
    case 'date': return { date: { start: value } };
    case 'checkbox': return { checkbox: value === true || value === 'true' };
    default: return null;
  }
}
async function notionSave(item) {
  const s = await Store.get('notion', {});
  if (!s.token || !s.dbId) throw new Error('اربط Notion الأول من صفحة الإعدادات.');
  if (!s.titleProp) throw new Error('افتح إعدادات Notion ودوس "اختبار الاتصال" مرة.');
  const properties = { [s.titleProp]: { title: rt(item.title || item.url || 'فكرة جديدة') } };
  if (s.urlProp && item.url) properties[s.urlProp] = { url: item.url };
  if (s.dateProp) properties[s.dateProp] = { date: { start: new Date().toISOString().slice(0, 10) } };
  if (s.extraProp && s.extraValue) {
    const v = propValue(s.extraType, s.extraValue);
    if (v) properties[s.extraProp] = v;
  }
  const children = [];
  if (item.note) children.push({ object: 'block', type: 'callout', callout: { rich_text: rt(item.note), icon: { emoji: '💡' } } });
  if (item.selection) children.push({ object: 'block', type: 'quote', quote: { rich_text: rt(item.selection) } });
  if (item.image) children.push({ object: 'block', type: 'image', image: { type: 'external', external: { url: item.image } } });
  if (item.url && /^https?:/.test(item.url)) children.push({ object: 'block', type: 'bookmark', bookmark: { url: item.url } });
  // أقسام (زي البريف): [عنوان، نص، 'code' اختياري]. Notion بيقبل 2000 حرف في كل جزء نص، فبنقسّم.
  for (const [heading, text, kind] of item.blocks || []) {
    if (!text) continue;
    children.push({ object: 'block', type: 'heading_3', heading_3: { rich_text: rt(heading) } });
    const parts = String(text).match(/[\s\S]{1,1900}/g) || [];
    if (kind === 'code') children.push({ object: 'block', type: 'code', code: { language: 'plain text', rich_text: parts.map((p) => ({ type: 'text', text: { content: p } })) } });
    else parts.forEach((p) => children.push({ object: 'block', type: 'paragraph', paragraph: { rich_text: rt(p) } }));
  }
  const page = await notionFetch('/pages', s.token, {
    method: 'POST',
    body: JSON.stringify({ parent: { database_id: notionId(s.dbId) }, properties, children }),
  });
  await Store.update('notionHistory', [], (h) => [{ title: item.title, url: item.url, page: page.url, at: Date.now() }, ...h].slice(0, 30));
  return page;
}

// ================= Context menus =================
chrome.runtime.onInstalled.addListener((details) => {
  if (chrome.contextMenus) chrome.contextMenus.removeAll(() => {
    if (F.notion) chrome.contextMenus.create({ id: 'notion', title: 'احفظ على Notion', contexts: ['page', 'selection', 'link', 'image'] });
    if (F.utm) chrome.contextMenus.create({ id: 'utm', title: 'اعمل UTM للينك ده', contexts: ['page', 'link'] });
    if (F.qr) chrome.contextMenus.create({ id: 'qr', title: 'اعمل QR للينك ده', contexts: ['page', 'link'] });
  });
  syncCrmAlarms();
  // أول تثبيت: افتح صفحة الأداة (لو ليها صفحة)
  if (details.reason === 'install' && F.welcome) chrome.tabs.create({ url: chrome.runtime.getURL('app.html') + '#' + F.welcome });
});
chrome.runtime.onStartup.addListener(syncCrmAlarms);

// لو النسخة مالهاش popup: الضغط على الأيقونة بيفتح صفحة الأداة
chrome.action.onClicked.addListener((tab) => {
  const q = F.home === 'utm' && tab && /^https?:/.test(tab.url || '') ? '?url=' + encodeURIComponent(tab.url.split('#')[0]) : '';
  chrome.tabs.create({ url: chrome.runtime.getURL('app.html') + q + '#' + F.home });
});

function notify(id, title, message) {
  if (!chrome.notifications) return;
  chrome.notifications.create(id, { type: 'basic', iconUrl: 'icons/icon128.png', title, message, priority: 2 });
}

if (chrome.contextMenus) chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const link = info.linkUrl || info.pageUrl || (tab && tab.url) || '';
  if (info.menuItemId === 'utm' || info.menuItemId === 'qr') {
    const target = info.menuItemId === 'utm' ? 'utm' : 'walink';
    chrome.tabs.create({ url: chrome.runtime.getURL('app.html') + '?url=' + encodeURIComponent(link) + '&mode=qr#' + target });
    return;
  }
  if (info.menuItemId === 'notion') {
    const item = {
      title: (info.selectionText && info.selectionText.slice(0, 120)) || (tab && tab.title) || link,
      url: info.linkUrl || info.pageUrl || (tab && tab.url),
      selection: info.selectionText || '',
      image: info.mediaType === 'image' ? info.srcUrl : '',
    };
    try { await notionSave(item); notify('notion-ok-' + Date.now(), 'اتحفظت على Notion ✔', item.title || ''); }
    catch (e) { notify('notion-err-' + Date.now(), 'مقدرتش أحفظ على Notion', e.message); }
  }
});

// ================= CRM reminders =================
async function syncCrmAlarms() {
  if (!chrome.alarms || !F.crm) return;
  const crm = await Store.get('crm', {});
  const alarms = await chrome.alarms.getAll();
  const wanted = new Map();
  for (const [key, e] of Object.entries(crm)) {
    if (e.remindAt && !e.reminded && e.remindAt > Date.now() - 60000) wanted.set(CRM_PREFIX + key, e.remindAt);
  }
  for (const a of alarms) {
    if (a.name.startsWith(CRM_PREFIX) && (!wanted.has(a.name) || Math.abs(wanted.get(a.name) - a.scheduledTime) > 1000)) await chrome.alarms.clear(a.name);
  }
  const now = (await chrome.alarms.getAll()).map((a) => a.name);
  for (const [name, when] of wanted) if (!now.includes(name)) chrome.alarms.create(name, { when: Math.max(when, Date.now() + 1000) });
}
chrome.storage.onChanged.addListener((changes, area) => { if (area === 'local' && changes.crm) syncCrmAlarms(); });

if (chrome.alarms) chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (!alarm.name.startsWith(CRM_PREFIX)) return;
  const key = alarm.name.slice(CRM_PREFIX.length);
  const crm = await Store.get('crm', {});
  const e = crm[key];
  if (!e) return;
  notify(alarm.name, 'متابعة: ' + (e.name || key), (e.tag ? '[' + e.tag + '] ' : '') + (e.note || 'افتكر تتابع مع العميل ده.'));
  e.reminded = true;
  crm[key] = e;
  await Store.set('crm', crm);
});

if (chrome.notifications) chrome.notifications.onClicked.addListener(async (id) => {
  chrome.notifications.clear(id);
  if (!id.startsWith(CRM_PREFIX)) return;
  const tabs = await chrome.tabs.query({ url: 'https://web.whatsapp.com/*' });
  if (tabs[0]) { chrome.tabs.update(tabs[0].id, { active: true }); chrome.windows.update(tabs[0].windowId, { focused: true }); }
  else chrome.tabs.create({ url: 'https://web.whatsapp.com/' });
});

// ================= صور الإعلانات =================
function bufToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
async function fetchImageAsDataUrl(url, max = 720) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('image ' + r.status);
  const blob = await r.blob();
  try {
    const bmp = await createImageBitmap(blob);
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = new OffscreenCanvas(Math.round(bmp.width * scale), Math.round(bmp.height * scale));
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    const out = await c.convertToBlob({ type: 'image/jpeg', quality: 0.82 });
    return 'data:image/jpeg;base64,' + bufToBase64(await out.arrayBuffer());
  } catch (e) {
    return 'data:' + (blob.type || 'image/jpeg') + ';base64,' + bufToBase64(await blob.arrayBuffer());
  }
}

// ================= Messages =================
chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  (async () => {
    try {
      if (msg.type === 'notion-save') return reply({ ok: true, page: await notionSave(msg.item) });
      if (msg.type === 'notion-schema') return reply({ ok: true, schema: await notionSchema(msg.token, msg.dbId) });
      if (msg.type === 'fetch-image') return reply({ ok: true, dataUrl: await fetchImageAsDataUrl(msg.url) });
      if (msg.type === 'open-app') { chrome.tabs.create({ url: chrome.runtime.getURL('app.html') + '#' + (msg.tool || '') }); return reply({ ok: true }); }
      reply({ ok: false, error: 'unknown' });
    } catch (e) {
      reply({ ok: false, error: e.message || String(e) });
    }
  })();
  return true;
});

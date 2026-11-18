// Marketer's Toolkit — أدوات جوه واتساب ويب: الردود الجاهزة + CRM
// الإضافة بتكتب في خانة الرسالة بس، وإنت اللي بتدوس إرسال. مفيش أي إرسال تلقائي.
(() => {
  if (window.__mtWhatsApp) return;
  window.__mtWhatsApp = true;

  const F = (typeof MT_FEATURES !== 'undefined' && MT_FEATURES) || { replies: true, crm: true };
  let replies = [];
  let crm = {};
  let tags = DEFAULT_TAGS;

  async function load() {
    replies = await Store.get('replies', null);
    if (!replies) replies = await Store.set('replies', DEFAULT_REPLIES);
    crm = await Store.get('crm', {});
    tags = await Store.get('crmTags', DEFAULT_TAGS);
  }
  Store.onChange('replies', (v) => { replies = v || []; });
  Store.onChange('crm', (v) => { crm = v || {}; badgeChatList(true); if (panel && panel.style.display !== 'none') renderPanel(); });
  Store.onChange('crmTags', (v) => { tags = v || DEFAULT_TAGS; });

  const h = (tag, attrs = {}, html = '') => { const e = document.createElement(tag); Object.assign(e, attrs); if (html) e.innerHTML = html; return e; };
  const escH = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------- قراءة الشات الحالي ----------
  function composeBox() {
    return document.querySelector('#main footer div[contenteditable="true"]') ||
      document.querySelector('footer div[contenteditable="true"][role="textbox"]') ||
      document.querySelector('div[contenteditable="true"][data-tab="10"]');
  }
  function currentChatName() {
    const header = document.querySelector('#main header');
    if (!header) return '';
    const el = header.querySelector('span[dir="auto"][title]') || header.querySelector('span[dir="auto"]') || header.querySelector('[title]');
    return ((el && (el.getAttribute('title') || el.textContent)) || '').trim();
  }

  // ---------- الكتابة في خانة الرسالة ----------
  function insertIntoBox(box, text) {
    box.focus();
    document.execCommand('selectAll', false, null);
    const dt = new DataTransfer();
    dt.setData('text/plain', text);
    box.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
    setTimeout(() => {
      const now = (box.innerText || '').trim();
      const first = text.split('\n')[0].trim().slice(0, 12);
      if (first && !now.includes(first)) {
        // احتياطي لو اللصق ما اشتغلش
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, text);
      }
    }, 80);
  }
  function useReply(r) {
    const box = composeBox();
    if (!box) return;
    insertIntoBox(box, fillTemplate(r.text, currentChatName()));
    closeMenu();
  }

  // ---------- قائمة الردود لما تكتب "/" ----------
  let menu = null, menuItems = [], menuIndex = 0;
  function closeMenu() { if (menu) menu.style.display = 'none'; menuItems = []; }
  function openMenu(query, box) {
    const q = query.toLowerCase();
    menuItems = replies.filter((r) => !q || r.shortcut.toLowerCase().includes(q) || (r.title || '').toLowerCase().includes(q)).slice(0, 8);
    if (!menuItems.length) return closeMenu();
    if (!menu) { menu = h('div', { className: 'mt-menu' }); document.body.appendChild(menu); }
    menuIndex = Math.min(menuIndex, menuItems.length - 1);
    menu.innerHTML = `<div class="mt-menu-head"><b>الردود الجاهزة</b><span>↑↓ للتنقل · Enter للاختيار · Esc للإلغاء</span></div>` +
      menuItems.map((r, i) => `<div class="mt-item ${i === menuIndex ? 'on' : ''}" data-i="${i}"><span class="mt-sc">/${escH(r.shortcut)}</span><b>${escH(r.title || '')}</b><div class="mt-prev">${escH(fillTemplate(r.text, currentChatName())).slice(0, 110)}</div></div>`).join('');
    menu.querySelectorAll('.mt-item').forEach((el) => el.addEventListener('mousedown', (e) => { e.preventDefault(); useReply(menuItems[+el.dataset.i]); }));
    const rect = (box.closest('footer') || box).getBoundingClientRect();
    menu.style.display = 'block';
    menu.style.left = rect.left + 12 + 'px';
    menu.style.width = Math.min(520, rect.width - 24) + 'px';
    menu.style.bottom = window.innerHeight - rect.top + 6 + 'px';
  }
  if (F.replies) document.addEventListener('input', (e) => {
    const box = composeBox();
    if (!box || !box.contains(e.target)) return;
    const text = (box.innerText || '').replace(/\n$/, '');
    const m = text.match(/^\/(\S*)$/);
    if (m) openMenu(m[1], box); else closeMenu();
  }, true);
  if (F.replies) document.addEventListener('keydown', (e) => {
    if (!menu || menu.style.display === 'none' || !menuItems.length) return;
    const box = composeBox();
    if (!box || !box.contains(e.target)) return;
    const stop = () => { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); };
    if (e.key === 'ArrowDown') { stop(); menuIndex = (menuIndex + 1) % menuItems.length; openMenu((box.innerText || '').trim().slice(1), box); }
    else if (e.key === 'ArrowUp') { stop(); menuIndex = (menuIndex - 1 + menuItems.length) % menuItems.length; openMenu((box.innerText || '').trim().slice(1), box); }
    else if (e.key === 'Enter' || e.key === 'Tab') { stop(); useReply(menuItems[menuIndex]); }
    else if (e.key === 'Escape') { stop(); closeMenu(); }
  }, true);

  // ---------- لوحة CRM ----------
  let panel = null, fab = null;
  function ensureUi() {
    if (fab || !F.crm) return;
    fab = h('button', { className: 'mt-fab', title: "Marketer's Toolkit — CRM والردود" }, '<span>CRM</span>');
    fab.addEventListener('click', () => { if (panel.style.display === 'none') { renderPanel(); panel.style.display = 'block'; } else panel.style.display = 'none'; });
    panel = h('div', { className: 'mt-panel' });
    panel.style.display = 'none';
    document.body.append(fab, panel);
  }
  function toLocalInput(ms) {
    const d = new Date(ms - new Date().getTimezoneOffset() * 60000);
    return d.toISOString().slice(0, 16);
  }
  function renderPanel() {
    const name = currentChatName();
    const e = crm[name] || {};
    if (!name) {
      panel.innerHTML = `<div class="mt-p-head"><b>CRM</b><button class="mt-x">✕</button></div><div class="mt-empty">افتح أي شات الأول.</div>`;
    } else {
      panel.innerHTML = `
        <div class="mt-p-head"><b dir="auto">${escH(name)}</b><button class="mt-x">✕</button></div>
        <div class="mt-lbl">التصنيف</div>
        <div class="mt-tags">${tags.map((t) => `<button class="mt-tag ${e.tag === t ? 'on' : ''}" data-t="${escH(t)}" style="--c:${tagColor(t)}">${escH(t)}</button>`).join('')}</div>
        <div class="mt-lbl">ملاحظات</div>
        <textarea class="mt-note" placeholder="مثلًا: مهتم بباقة الشهر، طلب عرض سعر...">${escH(e.note || '')}</textarea>
        <div class="mt-lbl">فكّرني أتابع</div>
        <input type="datetime-local" class="mt-when" value="${e.remindAt && !e.reminded ? toLocalInput(e.remindAt) : ''}">
        <div class="mt-quick"><button data-q="1h">بعد ساعة</button><button data-q="tom">بكرة 10ص</button><button data-q="3d">بعد 3 أيام</button><button data-q="7d">بعد أسبوع</button></div>
        <div class="mt-actions"><button class="mt-save">حفظ</button>${crm[name] ? '<button class="mt-del">حذف</button>' : ''}</div>
        ${F.replies ? `<div class="mt-lbl" style="margin-top:12px">ردود جاهزة <span class="mt-hint">(أو اكتب / في خانة الرسالة)</span></div>
        <div class="mt-replies">${replies.map((r, i) => `<button data-r="${i}" title="${escH(r.text)}">/${escH(r.shortcut)}</button>`).join('')}</div>` : ''}
        <div class="mt-foot"><a href="#" class="mt-open">افتح لوحة CRM كاملة</a><span>محمد صبري</span></div>`;
      let tag = e.tag || '';
      panel.querySelectorAll('.mt-tag').forEach((b) => b.addEventListener('click', () => {
        tag = tag === b.dataset.t ? '' : b.dataset.t;
        panel.querySelectorAll('.mt-tag').forEach((x) => x.classList.toggle('on', x.dataset.t === tag));
      }));
      panel.querySelectorAll('.mt-quick button').forEach((b) => b.addEventListener('click', () => {
        const d = new Date();
        if (b.dataset.q === '1h') d.setHours(d.getHours() + 1);
        if (b.dataset.q === 'tom') { d.setDate(d.getDate() + 1); d.setHours(10, 0, 0, 0); }
        if (b.dataset.q === '3d') d.setDate(d.getDate() + 3);
        if (b.dataset.q === '7d') d.setDate(d.getDate() + 7);
        panel.querySelector('.mt-when').value = toLocalInput(d.getTime());
      }));
      panel.querySelector('.mt-save').addEventListener('click', async () => {
        const when = panel.querySelector('.mt-when').value;
        const entry = {
          ...e, name, key: name, tag,
          note: panel.querySelector('.mt-note').value.trim(),
          remindAt: when ? new Date(when).getTime() : 0,
          reminded: false,
          createdAt: e.createdAt || Date.now(), updatedAt: Date.now(),
        };
        crm = await Store.update('crm', {}, (c) => ({ ...c, [name]: entry }));
        const btn = panel.querySelector('.mt-save');
        if (btn) { btn.textContent = 'اتحفظ ✔'; setTimeout(() => { if (btn) btn.textContent = 'حفظ'; }, 1200); }
      });
      const del = panel.querySelector('.mt-del');
      if (del) del.addEventListener('click', async () => {
        crm = await Store.update('crm', {}, (c) => { const n = { ...c }; delete n[name]; return n; });
        renderPanel();
      });
      panel.querySelectorAll('.mt-replies button').forEach((b) => b.addEventListener('click', () => useReply(replies[+b.dataset.r])));
      panel.querySelector('.mt-open').addEventListener('click', (ev) => { ev.preventDefault(); chrome.runtime.sendMessage({ type: 'open-app', tool: 'crm' }); });
    }
    panel.querySelector('.mt-x').addEventListener('click', () => { panel.style.display = 'none'; });
  }

  // ---------- تاجات جنب الأسماء في قائمة الشاتات ----------
  let badgeTimer = null;
  function badgeChatList(force) {
    if (!F.crm) return;
    clearTimeout(badgeTimer);
    badgeTimer = setTimeout(() => {
      const side = document.querySelector('#pane-side');
      if (!side) return;
      side.querySelectorAll('span[title]').forEach((span) => {
        const name = span.getAttribute('title');
        const e = crm[name];
        let b = span.parentElement && span.parentElement.querySelector(':scope > .mt-badge');
        if (!e || !e.tag) { if (b) b.remove(); return; }
        if (!b) { b = h('span', { className: 'mt-badge' }); span.insertAdjacentElement('afterend', b); }
        if (force || b.textContent !== e.tag) {
          b.textContent = e.tag;
          const c = tagColor(e.tag);
          b.style.setProperty('--c', c);
          b.style.color = /^#(?:6B6B6B|111111|C7161D|9E1018)$/i.test(c) ? '#fff' : '#111';
        }
      });
    }, force ? 0 : 400);
  }

  // تحديث اللوحة لما تغيّر الشات
  let lastChat = '';
  const obs = new MutationObserver(() => {
    ensureUi();
    badgeChatList(false);
    const n = currentChatName();
    if (n !== lastChat) { lastChat = n; closeMenu(); if (panel && panel.style.display !== 'none') renderPanel(); }
  });

  load().then(() => {
    obs.observe(document.body, { childList: true, subtree: true, characterData: false });
    ensureUi();
    badgeChatList(true);
  });
})();

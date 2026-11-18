Tools.crm = {
  title: 'CRM واتساب',
  subtitle: 'كل العملاء اللي صنّفتهم من زرار CRM جوه واتساب ويب، مع الملاحظات ومواعيد المتابعة.',
  async render(el, { actions }) {
    let crm = await Store.get('crm', {});
    let tags = await Store.get('crmTags', DEFAULT_TAGS);
    let filter = '', q = '';

    actions.innerHTML = '<button class="btn" id="tags-btn">تعديل التصنيفات</button><button class="btn primary" id="exp">تصدير Excel</button>';
    el.innerHTML = `
      <div class="grid g3" id="stats" style="margin-bottom:14px"></div>
      <div class="card" id="upcoming" style="margin-bottom:14px"></div>
      <div class="row" style="margin-bottom:10px">
        <input type="search" id="q" placeholder="دوّر بالاسم أو الملاحظة..." style="max-width:320px">
        <div class="row" id="filters"></div>
      </div>
      <div class="card" style="padding:0;overflow:auto"><table class="t" id="tbl"></table></div>`;

    const entries = () => Object.values(crm).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    function draw() {
      const all = entries();
      $('#stats', el).innerHTML = [['الكل', all.length], ...tags.map((t) => [t, all.filter((e) => e.tag === t).length])]
        .map(([t, n]) => `<div class="card" style="padding:10px 14px;border-top:3px solid ${t === 'الكل' ? 'var(--brand)' : tagColor(t)}"><div class="muted" style="font-size:12px">${esc(t)}</div><div style="font:800 22px Inter;color:var(--white)">${n}</div></div>`).join('');

      const up = all.filter((e) => e.remindAt && !e.reminded).sort((a, b) => a.remindAt - b.remindAt);
      $('#upcoming', el).innerHTML = '<h3>المتابعات الجاية</h3>' + (up.length
        ? up.slice(0, 8).map((e) => `<div class="check ${e.remindAt < Date.now() ? 'bad' : 'ok'}"><span class="i">●</span><div><b style="color:var(--white)">${esc(e.name)}</b> <span class="muted">— ${fmtDateTime(e.remindAt)}</span>${e.note ? `<div class="muted" style="font-size:12px">${esc(e.note)}</div>` : ''}</div></div>`).join('')
        : '<div class="muted">مفيش متابعات متحددة. من جوه واتساب: زرار CRM ← "فكّرني أتابع".</div>');

      $('#filters', el).innerHTML = ['', ...tags].map((t) => `<button class="btn sm ${filter === t ? 'primary' : ''}" data-f="${esc(t)}">${t ? esc(t) : 'الكل'}</button>`).join('');
      $$('#filters button', el).forEach((b) => b.addEventListener('click', () => { filter = b.dataset.f; draw(); }));

      const rows = all.filter((e) => (!filter || e.tag === filter) && (!q || (e.name + ' ' + (e.note || '')).toLowerCase().includes(q)));
      $('#tbl', el).innerHTML = '<tr><th>العميل</th><th>التصنيف</th><th>ملاحظات</th><th>المتابعة</th><th>آخر تعديل</th><th></th></tr>' + (rows.length
        ? rows.map((e) => `<tr data-k="${esc(e.key)}">
            <td><b style="color:var(--white)" dir="auto">${esc(e.name)}</b></td>
            <td><select class="tg" style="min-width:120px"><option value="">—</option>${tags.map((t) => `<option ${e.tag === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></td>
            <td><textarea class="nt" rows="2" style="min-height:40px">${esc(e.note || '')}</textarea></td>
            <td style="white-space:nowrap">${e.remindAt ? (e.reminded ? '<span class="muted">✔ ' : '<span>') + fmtDateTime(e.remindAt) + '</span>' : '<span class="muted">—</span>'}</td>
            <td class="muted" style="white-space:nowrap">${fmtDateTime(e.updatedAt)}</td>
            <td><button class="btn ghost sm del">حذف</button></td></tr>`).join('')
        : '<tr><td colspan="6" class="empty">مفيش عملاء هنا لسه. افتح واتساب ويب ودوس زرار CRM الأحمر في أي شات.</td></tr>');

      $$('#tbl tr[data-k]', el).forEach((tr) => {
        const k = tr.dataset.k;
        $('.tg', tr).addEventListener('change', async (ev) => { crm[k].tag = ev.target.value; crm[k].updatedAt = Date.now(); await Store.set('crm', crm); draw(); });
        $('.nt', tr).addEventListener('change', async (ev) => { crm[k].note = ev.target.value; crm[k].updatedAt = Date.now(); await Store.set('crm', crm); });
        $('.del', tr).addEventListener('click', async () => { if (confirm('تحذف ' + crm[k].name + '؟')) { delete crm[k]; await Store.set('crm', crm); draw(); } });
      });
    }
    $('#q', el).addEventListener('input', (e) => { q = e.target.value.trim().toLowerCase(); draw(); });
    $('#exp', actions).addEventListener('click', () => {
      exportXlsx('CRM-WhatsApp', ['العميل', 'التصنيف', 'ملاحظات', 'المتابعة', 'آخر تعديل'],
        entries().map((e) => [e.name, e.tag || '', e.note || '', fmtDateTime(e.remindAt), fmtDateTime(e.updatedAt)]), [28, 14, 50, 18, 18]);
    });
    $('#tags-btn', actions).addEventListener('click', async () => {
      const v = prompt('اكتب التصنيفات مفصولة بفاصلة:', tags.join('، '));
      if (v === null) return;
      tags = v.split(/[،,]/).map((s) => s.trim()).filter(Boolean);
      if (!tags.length) tags = DEFAULT_TAGS;
      await Store.set('crmTags', tags); draw();
    });
    Store.onChange('crm', (v) => { crm = v || {}; if (el.isConnected && !el.contains(document.activeElement)) draw(); });
    draw();
  },
};

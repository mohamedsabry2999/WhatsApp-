Tools.calc = {
  title: 'حاسبة الحملات',
  subtitle: 'حط أرقام الحملة تطلعلك المؤشرات كلها، أو ابدأ من الهدف وهي تقولّك محتاج ميزانية قد إيه.',
  async render(el) {
    const saved = await Store.get('calc', {
      cur: 'ج.م', spend: '', impressions: '', clicks: '', leads: '', customers: '', revenue: '',
      targetCustomers: '', cpl: '', closeRate: '10', split: [['Meta', 50], ['Google', 30], ['TikTok', 20]],
    });
    const F = (id, label, ph = '') => `<label class="f">${label}<input type="number" min="0" step="any" id="${id}" placeholder="${ph}" value="${esc(saved[id] ?? '')}"></label>`;
    el.innerHTML = `
      <div class="row" style="margin-bottom:12px"><span class="muted">العملة:</span>
        <select id="cur" style="width:auto">${['ج.م', 'ر.س', 'د.إ', 'د.ك', '$'].map((c) => `<option ${c === saved.cur ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
      <div class="card">
        <h3>1) نتايج حملة</h3>
        <div class="grid g3">${F('spend', 'المصروف')}${F('impressions', 'الظهور (Impressions)')}${F('clicks', 'الكليكات')}${F('leads', 'العملاء المحتملين (Leads)')}${F('customers', 'العملاء اللي اشتروا')}${F('revenue', 'الإيراد')}</div>
        <div class="grid g3" id="kpis" style="margin-top:14px"></div>
      </div>
      <div class="card" style="margin-top:14px">
        <h3>2) تخطيط الميزانية من الهدف</h3>
        <div class="grid g3">${F('targetCustomers', 'عدد العملاء المطلوب')}${F('cpl', 'تكلفة الـ Lead المتوقعة')}${F('closeRate', 'نسبة التحويل من Lead لعميل %')}</div>
        <div id="plan" style="margin-top:14px"></div>
        <h3 style="margin-top:14px">تقسيم الميزانية على المنصات</h3>
        <div id="split" class="grid" style="gap:6px"></div>
        <button class="btn ghost sm" id="add-plat" style="margin-top:8px">+ منصة</button>
      </div>`;

    const num = (id) => { const v = parseFloat($('#' + id, el).value); return isFinite(v) ? v : 0; };
    const cur = () => $('#cur', el).value;
    const money = (v) => isFinite(v) && v > 0 ? `${v.toLocaleString('en-US', { maximumFractionDigits: v < 10 ? 2 : 0 })} ${cur()}` : '—';
    const pct = (v) => isFinite(v) && v > 0 ? v.toLocaleString('en-US', { maximumFractionDigits: 2 }) + '%' : '—';
    const x = (v) => isFinite(v) && v > 0 ? v.toLocaleString('en-US', { maximumFractionDigits: 2 }) + 'x' : '—';
    const kpi = (name, value, hint) => `<div class="card" style="background:var(--black);padding:10px 14px"><div class="muted" style="font-size:12px">${name}</div><div style="font:800 20px Inter, Cairo;color:var(--white)">${value}</div><div class="muted" style="font-size:11px">${hint}</div></div>`;
    let split = saved.split;
    let saveT;
    function calc() {
      const s = num('spend'), im = num('impressions'), cl = num('clicks'), le = num('leads'), cu = num('customers'), rev = num('revenue');
      const roi = s && rev ? ((rev - s) / s) * 100 : NaN;
      $('#kpis', el).innerHTML = [
        kpi('CPM', money(im ? (s / im) * 1000 : NaN), 'تكلفة الألف ظهور'),
        kpi('CTR', pct(im ? (cl / im) * 100 : NaN), 'نسبة الكليك'),
        kpi('CPC', money(cl ? s / cl : NaN), 'تكلفة الكليك'),
        kpi('CPL', money(le ? s / le : NaN), 'تكلفة العميل المحتمل'),
        kpi('Conversion', pct(cl && le ? (le / cl) * 100 : NaN), 'من كليك لـ Lead'),
        kpi('Close Rate', pct(le && cu ? (cu / le) * 100 : NaN), 'من Lead لعميل'),
        kpi('CAC', money(cu ? s / cu : NaN), 'تكلفة العميل الفعلي'),
        kpi('ROAS', x(s ? rev / s : NaN), 'الإيراد ÷ المصروف'),
        kpi('ROI', isFinite(roi) ? `<span style="color:${roi < 0 ? 'var(--bad)' : 'var(--white)'}">${roi.toLocaleString('en-US', { maximumFractionDigits: 1 })}%</span>` : '—', 'صافي العائد'),
        kpi('AOV', money(cu ? rev / cu : NaN), 'متوسط قيمة البيعة'),
      ].join('');

      const tc = num('targetCustomers'), cpl = num('cpl'), cr = num('closeRate');
      const leadsNeeded = tc && cr ? Math.ceil(tc / (cr / 100)) : 0;
      const budget = leadsNeeded * cpl;
      $('#plan', el).innerHTML = tc && cpl && cr
        ? `<div class="grid g3">${kpi('Leads محتاجها', leadsNeeded.toLocaleString('en-US'), `عشان ${tc} عميل بنسبة ${cr}%`)}${kpi('الميزانية المطلوبة', money(budget), `${leadsNeeded} × ${money(cpl)}`)}${kpi('CAC المتوقع', money(budget / tc), 'تكلفة كل عميل')}</div>`
        : '<div class="muted">املا التلات خانات اللي فوق.</div>';

      const total = split.reduce((a, [, p]) => a + (+p || 0), 0);
      $('#split', el).innerHTML = split.map(([n, p], i) => `<div class="row" style="flex-wrap:nowrap">
          <input type="text" value="${esc(n)}" data-n="${i}" style="max-width:160px">
          <input type="number" min="0" max="100" value="${p}" data-p="${i}" style="max-width:90px"><span class="muted">%</span>
          <div style="flex:1;height:8px;background:var(--black);border-radius:9px;overflow:hidden"><div style="width:${Math.min(100, +p || 0)}%;height:100%;background:var(--brand)"></div></div>
          <b style="min-width:120px;color:var(--white)">${budget ? money((budget * (+p || 0)) / 100) : '—'}</b>
          <button class="btn ghost sm" data-x="${i}">✕</button></div>`).join('') +
        `<div class="muted" style="color:${total === 100 ? 'var(--muted)' : 'var(--warn)'}">المجموع ${total}%${total === 100 ? '' : ' (لازم يبقى 100%)'}</div>`;
      $$('#split [data-n]', el).forEach((i) => i.addEventListener('change', () => { split[+i.dataset.n][0] = i.value; calc(); }));
      $$('#split [data-p]', el).forEach((i) => i.addEventListener('change', () => { split[+i.dataset.p][1] = +i.value || 0; calc(); }));
      $$('#split [data-x]', el).forEach((b) => b.addEventListener('click', () => { split.splice(+b.dataset.x, 1); calc(); }));

      clearTimeout(saveT);
      saveT = setTimeout(() => {
        const o = { cur: cur(), split };
        ['spend', 'impressions', 'clicks', 'leads', 'customers', 'revenue', 'targetCustomers', 'cpl', 'closeRate'].forEach((k) => { o[k] = $('#' + k, el).value; });
        Store.set('calc', o);
      }, 400);
    }
    $$('input[type=number]', el).forEach((i) => i.addEventListener('input', calc));
    $('#cur', el).addEventListener('change', calc);
    $('#add-plat', el).addEventListener('click', () => { split.push(['منصة', 0]); calc(); });
    calc();
  },
};

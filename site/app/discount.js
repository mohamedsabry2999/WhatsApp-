// DiscountCheck — الخصم ده مكسب ولا خسارة؟
// المعادلة: عشان تطلع بنفس إجمالي الربح بعد الخصم
//   الهامش قبل = السعر − التكلفة
//   الهامش بعد  = السعر × (1 − الخصم) − التكلفة
//   المبيعات المطلوبة = المبيعات الحالية × (الهامش قبل ÷ الهامش بعد)
function discountMath({ price, cost, units, discount, fixed }) {
  const m = price - cost;
  const p2 = price * (1 - discount / 100);
  const m2 = p2 - cost;
  const res = { margin: m, marginPct: price ? (m / price) * 100 : 0, newPrice: p2, newMargin: m2, newMarginPct: p2 ? (m2 / p2) * 100 : 0 };
  res.loss = m2 <= 0;
  res.factor = !res.loss && m2 ? m / m2 : Infinity;
  res.extraPct = (res.factor - 1) * 100;
  res.unitsNeeded = units ? Math.ceil(units * res.factor) : 0;
  res.extraUnits = units ? res.unitsNeeded - units : 0;
  res.profitBefore = units * m - (fixed || 0);
  res.profitIfSame = units * m2 - (fixed || 0);
  res.maxDiscount = price ? (m / price) * 100 : 0; // بعده كل بيعة خسارة
  res.breakEvenBefore = fixed && m > 0 ? Math.ceil(fixed / m) : 0;
  res.breakEvenAfter = fixed && m2 > 0 ? Math.ceil(fixed / m2) : 0;
  return res;
}

Tools.discount = {
  title: 'DiscountCheck — الخصم ده مكسب ولا خسارة؟',
  subtitle: 'حط السعر والتكلفة والخصم، وهتعرف لازم تبيع قد إيه زيادة عشان متخسرش.',
  async render(el) {
    const s = await Store.get('discount', { cur: 'ج.م', price: 500, cost: 300, units: 100, discount: 20, fixed: '' });
    const F = (id, label, hint = '') => `<label class="f">${label}<input type="number" min="0" step="any" id="d-${id}" value="${esc(s[id] ?? '')}">${hint ? `<span style="font-size:11px">${hint}</span>` : ''}</label>`;
    el.innerHTML = `
      <div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(0,1.2fr);align-items:start">
        <div class="card">
          <div class="row" style="margin-bottom:10px"><span class="muted">العملة:</span>
            <select id="d-cur" style="width:auto">${['ج.م', 'ر.س', 'د.إ', 'د.ك', '$'].map((c) => `<option ${c === s.cur ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
          <div class="grid g2">
            ${F('price', 'سعر البيع')}
            ${F('cost', 'تكلفة القطعة / الخدمة', 'كل التكاليف المتغيرة: خامات، شحن، عمولة...')}
            ${F('units', 'المبيعات الحالية (في الشهر)')}
            ${F('fixed', 'المصاريف الثابتة (اختياري)', 'إيجار، مرتبات... عشان نقطة التعادل')}
          </div>
          <label class="f" style="margin-top:12px">نسبة الخصم: <b id="d-dv" style="color:var(--white);font:800 18px Inter"></b>
            <input type="range" id="d-discount" min="1" max="80" step="1" value="${esc(s.discount)}" style="accent-color:var(--brand)"></label>
          <div class="row" style="margin-top:6px">${[10, 15, 20, 25, 30, 50].map((d) => `<button class="btn sm" data-d="${d}">${d}%</button>`).join('')}</div>
        </div>
        <div class="grid">
          <div class="card" id="d-verdict"></div>
          <div class="grid g3" id="d-kpis"></div>
        </div>
      </div>
      <div class="card" style="margin-top:14px">
        <h3>كل نسب الخصم</h3>
        <div id="d-table"></div>
        <div class="row" style="margin-top:12px"><button class="btn" id="d-copy">انسخ النتيجة كبوست</button><span class="muted" style="font-size:12px">جاهزة تنزل على LinkedIn أو فيسبوك</span></div>
      </div>`;

    const v = (id) => { const x = parseFloat($('#d-' + id, el).value); return isFinite(x) ? x : 0; };
    const cur = () => $('#d-cur', el).value;
    const money = (x) => `${Math.round(x).toLocaleString('en-US')} ${cur()}`;
    const pct = (x) => `${x.toLocaleString('en-US', { maximumFractionDigits: 1 })}%`;
    const kpi = (name, value, hint, red) => `<div class="card" style="background:var(--black);padding:10px 14px"><div class="muted" style="font-size:12px">${name}</div><div style="font:800 20px Inter, Cairo;color:${red ? 'var(--bad)' : 'var(--white)'}">${value}</div><div class="muted" style="font-size:11px">${hint}</div></div>`;
    let saveT, last;
    function calc() {
      const inp = { price: v('price'), cost: v('cost'), units: v('units'), discount: v('discount'), fixed: v('fixed') };
      $('#d-dv', el).textContent = inp.discount + '%';
      const r = discountMath(inp);
      last = { inp, r };
      const verdict = $('#d-verdict', el);
      if (!inp.price || inp.cost >= inp.price) {
        verdict.innerHTML = `<h3>حط السعر والتكلفة</h3><div class="muted">${inp.price && inp.cost >= inp.price ? 'التكلفة أكبر من السعر أو مساوية ليه، يعني إنت بتخسر من غير خصم أصلًا.' : 'محتاج سعر البيع والتكلفة عشان أحسب.'}</div>`;
        $('#d-kpis', el).innerHTML = ''; $('#d-table', el).innerHTML = ''; return;
      }
      if (r.loss) {
        verdict.innerHTML = `<div style="font:800 26px Cairo;color:var(--bad)">خصم ${inp.discount}% = خسارة في كل بيعة</div>
          <div style="margin-top:6px">السعر بعد الخصم (${money(r.newPrice)}) أقل من التكلفة (${money(inp.cost)}). أقصى خصم ممكن من غير خسارة هو <b style="color:var(--white)">${pct(r.maxDiscount)}</b>، وده يعني إنك بتبيع على التكلفة.</div>`;
      } else {
        const hard = r.extraPct >= 100;
        verdict.innerHTML = `<div class="muted">عشان تطلع بنفس المكسب بعد خصم ${inp.discount}%، لازم تبيع</div>
          <div dir="ltr" style="text-align:right;font:800 46px/1.1 Inter, Cairo;color:${hard ? 'var(--bad)' : 'var(--white)'};margin:6px 0">+${pct(r.extraPct)}</div>
          <div>${inp.units ? `يعني <b style="color:var(--white)">${r.unitsNeeded.toLocaleString('en-US')}</b> بدل ${inp.units.toLocaleString('en-US')} (${r.extraUnits.toLocaleString('en-US')} زيادة).` : 'زيادة في عدد المبيعات.'}
          ${hard ? ' <b style="color:var(--bad)">ده أكتر من ضعف مبيعاتك، فالخصم ده غالبًا هيخسّرك.</b>' : r.extraPct > 40 ? ' <span style="color:var(--warn)">رقم صعب. اتأكد إن الخصم هيجيب العملاء دول فعلًا.</span>' : ''}</div>`;
      }
      $('#d-kpis', el).innerHTML = [
        kpi('الهامش قبل الخصم', money(r.margin), pct(r.marginPct) + ' من السعر'),
        kpi('الهامش بعد الخصم', money(r.newMargin), pct(r.newMarginPct) + ' من السعر الجديد', r.newMargin <= 0),
        kpi('أقصى خصم من غير خسارة', pct(r.maxDiscount), 'بعده كل بيعة خسارة'),
        kpi('الربح لو المبيعات متغيرتش', inp.units ? money(r.profitIfSame) : '—', inp.units ? `بدل ${money(r.profitBefore)}` : 'حط المبيعات الحالية', r.profitIfSame < r.profitBefore),
        kpi('نقطة التعادل قبل', r.breakEvenBefore ? r.breakEvenBefore.toLocaleString('en-US') + ' بيعة' : '—', inp.fixed ? 'عشان تغطي المصاريف الثابتة' : 'حط المصاريف الثابتة'),
        kpi('نقطة التعادل بعد', r.breakEvenAfter ? r.breakEvenAfter.toLocaleString('en-US') + ' بيعة' : '—', inp.fixed ? 'بعد الخصم' : ''),
      ].join('');
      const rows = [5, 10, 15, 20, 25, 30, 40, 50].map((d) => ({ d, r: discountMath({ ...inp, discount: d }) }));
      const maxBar = Math.max(...rows.filter((x) => !x.r.loss).map((x) => x.r.extraPct), 1);
      $('#d-table', el).innerHTML = rows.map(({ d, r: x }) => `<div class="row" style="flex-wrap:nowrap;padding:5px 0;${d === inp.discount ? 'background:var(--brand-soft);border-radius:8px;padding-inline:6px' : ''}">
          <b style="width:52px;color:var(--white);font-family:Inter">${d}%</b>
          <div style="flex:1;height:10px;background:var(--black);border-radius:9px;overflow:hidden">${x.loss ? '' : `<div style="width:${Math.min(100, (x.extraPct / maxBar) * 100)}%;height:100%;background:${x.extraPct >= 100 ? 'var(--bad)' : 'var(--brand)'}"></div>`}</div>
          <span style="width:200px;text-align:left;font-family:Inter, Cairo">${x.loss ? '<span style="color:var(--bad)">خسارة في كل بيعة</span>' : `<bdi dir="ltr">+${pct(x.extraPct)}</bdi> مبيعات`}</span></div>`).join('');
      clearTimeout(saveT);
      saveT = setTimeout(() => Store.set('discount', { ...inp, cur: cur() }), 400);
    }
    $$('input', el).forEach((i) => i.addEventListener('input', calc));
    $('#d-cur', el).addEventListener('change', calc);
    $$('[data-d]', el).forEach((b) => b.addEventListener('click', () => { $('#d-discount', el).value = b.dataset.d; calc(); }));
    $('#d-copy', el).addEventListener('click', () => {
      const { inp, r } = last;
      if (!inp.price || r.loss) return copyText(`خصم ${inp.discount}% على منتج هامشه ${pct(r.marginPct)} = خسارة في كل بيعة.\nأقصى خصم ممكن من غير خسارة: ${pct(r.maxDiscount)}.`, 'اتنسخ ✔');
      copyText(`خصم ${inp.discount}% مش مجرد ${inp.discount}% من السعر.\n\nلو هامش ربحك ${pct(r.marginPct)}، فالخصم ده محتاج تبيع ${pct(r.extraPct)} زيادة عشان تطلع بنفس المكسب بالظبط.\n\nقبل أي خصم اسأل: هل الخصم ده هيجيب العملاء الزيادة دول فعلًا؟\n\nاحسبها بنفسك: https://tools.mohammedsabry.site/tools/discount.html`, 'اتنسخ كبوست ✔');
    });
    calc();
  },
};

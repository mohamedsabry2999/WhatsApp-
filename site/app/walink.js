Tools.walink = {
  title: 'لينك واتساب + QR',
  subtitle: 'اعمل لينك wa.me برسالة جاهزة لكل حملة، ومعاه QR تحطه على البوستر أو الفلاير. ومفيش أي حاجة بتتبعت لموقع خارجي.',
  async render(el, { params }) {
    let lib = await Store.get('waLinks', []);
    const startQr = params.get('mode') === 'qr';
    el.innerHTML = `
      <div class="row" style="margin-bottom:14px">
        <button class="btn ${startQr ? '' : 'primary'}" data-m="wa">لينك واتساب</button>
        <button class="btn ${startQr ? 'primary' : ''}" data-m="qr">QR لأي لينك</button>
      </div>
      <div class="grid" style="grid-template-columns: 1fr 300px; align-items:start">
        <div class="card">
          <div id="wa-form" ${startQr ? 'hidden' : ''}>
            <div class="grid g2">
              <label class="f">رقم الواتساب<input type="text" id="phone" placeholder="01012345678 أو +201012345678" dir="ltr"></label>
              <label class="f">اسم الحملة (للمكتبة)<input type="text" id="label" placeholder="بوستر معرض القاهرة"></label>
            </div>
            <label class="f" style="margin-top:10px">الرسالة اللي هتتكتب للعميل<textarea id="msg" rows="3">أهلًا، شفت إعلانكم وعايز أعرف تفاصيل أكتر</textarea></label>
            <label class="f" style="margin-top:10px">كود الحملة (اختياري، بيتضاف آخر الرسالة عشان تعرف العميل جه منين)<input type="text" id="code" placeholder="fb-ramadan" dir="ltr"></label>
            <div class="muted" style="font-size:12px;margin-top:6px">واتساب مفيهوش إحصائيات للينكات، فالكود ده هو اللي بيقولك الرسالة جاية من أنهي إعلان.</div>
          </div>
          <div id="qr-form" ${startQr ? '' : 'hidden'}>
            <label class="f">اللينك أو النص<input type="text" id="qrtext" dir="ltr" placeholder="https://..."></label>
          </div>
          <div class="row" style="margin-top:12px">
            <label class="check" style="padding:0"><input type="radio" name="qc" value="#111111" checked> QR أسود</label>
            <label class="check" style="padding:0"><input type="radio" name="qc" value="#C7161D"> QR أحمر</label>
          </div>
          <div class="card mono" id="out" style="margin-top:12px;background:var(--black)"></div>
          <div class="row" style="margin-top:10px">
            <button class="btn primary" id="copy">نسخ اللينك</button>
            <button class="btn" id="png">تحميل QR (PNG)</button>
            <button class="btn" id="svg">تحميل QR (SVG)</button>
            <button class="btn" id="test">جرّب اللينك</button>
            <button class="btn" id="save">حفظ في المكتبة</button>
          </div>
        </div>
        <div class="card" style="text-align:center">
          <div id="qr" style="background:#fff;border-radius:10px;padding:10px;display:inline-block"></div>
          <div class="muted" style="font-size:12px;margin-top:8px">اطبع الـ QR بمقاس 2×2 سم على الأقل</div>
        </div>
      </div>
      <h3 style="margin-top:22px">مكتبة اللينكات</h3>
      <div class="card" style="padding:0;overflow:auto"><table class="t" id="lib"></table></div>`;

    let mode = startQr ? 'qr' : 'wa';
    if (params.get('url')) $('#qrtext', el).value = params.get('url');
    const normPhone = (p) => {
      let d = String(p).replace(/[^\d+]/g, '');
      if (d.startsWith('+')) d = d.slice(1);
      else if (d.startsWith('00')) d = d.slice(2);
      else if (/^01\d{9}$/.test(d)) d = '2' + d; // رقم مصري محلي
      return d.replace(/\D/g, '');
    };
    const current = () => {
      if (mode === 'qr') return $('#qrtext', el).value.trim();
      const phone = normPhone($('#phone', el).value);
      let msg = $('#msg', el).value.trim();
      const code = $('#code', el).value.trim();
      if (code) msg += (msg ? '\n' : '') + `(كود: ${code})`;
      if (!phone) return '';
      return `https://wa.me/${phone}` + (msg ? '?text=' + encodeURIComponent(msg) : '');
    };
    const color = () => document.querySelector('input[name="qc"]:checked').value;
    function update() {
      const link = current();
      $('#out', el).textContent = link || (mode === 'wa' ? 'اكتب الرقم الأول...' : 'اكتب اللينك...');
      $('#qr', el).innerHTML = link ? makeQrSvg(link, { dark: color(), size: 240 }) : '<div style="width:240px;height:240px"></div>';
      $$('#copy,#png,#svg,#test,#save', el).forEach((b) => (b.disabled = !link));
      $('#test', el).hidden = mode !== 'wa';
    }
    $$('[data-m]', el).forEach((b) => b.addEventListener('click', () => {
      mode = b.dataset.m;
      $$('[data-m]', el).forEach((x) => x.classList.toggle('primary', x === b));
      $('#wa-form', el).hidden = mode !== 'wa'; $('#qr-form', el).hidden = mode !== 'qr';
      update();
    }));
    $$('input, textarea', el).forEach((i) => i.addEventListener('input', update));
    $$('input[name="qc"]', el).forEach((i) => i.addEventListener('change', update));
    const fname = () => 'QR-' + (($('#label', el).value || $('#code', el).value || 'link').trim().replace(/[^\w؀-ۿ-]+/g, '-'));
    $('#copy', el).addEventListener('click', () => copyText(current()));
    $('#test', el).addEventListener('click', () => window.open(current(), '_blank'));
    $('#svg', el).addEventListener('click', () => download(new Blob([makeQrSvg(current(), { dark: color(), size: 1024 })], { type: 'image/svg+xml' }), fname() + '.svg'));
    $('#png', el).addEventListener('click', async () => download(await svgToPngBlob(makeQrSvg(current(), { dark: color(), size: 1024 })), fname() + '.png'));
    $('#save', el).addEventListener('click', async () => {
      lib.unshift({ id: Store.uid(), label: $('#label', el).value.trim() || (mode === 'qr' ? 'QR' : 'لينك واتساب'), link: current(), code: mode === 'wa' ? $('#code', el).value.trim() : '', at: Date.now() });
      await Store.set('waLinks', lib); drawLib(); toast('اتحفظ ✔');
    });

    function drawLib() {
      $('#lib', el).innerHTML = '<tr><th>الحملة</th><th>الكود</th><th>اللينك</th><th>التاريخ</th><th></th></tr>' + (lib.length
        ? lib.map((x, i) => `<tr><td><b style="color:var(--white)">${esc(x.label)}</b></td><td class="mono">${esc(x.code || '—')}</td><td class="mono" style="max-width:380px;font-size:12px">${esc(x.link)}</td><td class="muted">${fmtDateTime(x.at)}</td>
            <td style="white-space:nowrap"><button class="btn sm" data-c="${i}">نسخ</button> <button class="btn sm" data-q="${i}">QR</button> <button class="btn ghost sm" data-d="${i}">حذف</button></td></tr>`).join('')
        : '<tr><td colspan="5" class="empty">لسه مفيش لينكات محفوظة.</td></tr>');
      $$('[data-c]', el).forEach((b) => b.addEventListener('click', () => copyText(lib[+b.dataset.c].link)));
      $$('[data-q]', el).forEach((b) => b.addEventListener('click', async () => download(await svgToPngBlob(makeQrSvg(lib[+b.dataset.q].link, { size: 1024 })), 'QR-' + lib[+b.dataset.q].label + '.png')));
      $$('[data-d]', el).forEach((b) => b.addEventListener('click', async () => { lib.splice(+b.dataset.d, 1); await Store.set('waLinks', lib); drawLib(); }));
    }
    update(); drawLib();
  },
};

// SocialSizer — صورة واحدة ← كل مقاسات السوشيال (كله بيحصل في المتصفح، مفيش رفع لأي سيرفر)
// المقاسات ممكن تتغير مع الوقت، فعدّلها من هنا لو المنصة غيّرتها.
const SIZES = [
  { id: 'ig-portrait', g: 'Instagram', name: 'Post طولي 4:5', w: 1080, h: 1350 },
  { id: 'ig-square', g: 'Instagram', name: 'Post مربع', w: 1080, h: 1080 },
  { id: 'story', g: 'Instagram', name: 'Story / Reels / TikTok', w: 1080, h: 1920 },
  { id: 'ig-landscape', g: 'Instagram', name: 'Post عرضي', w: 1080, h: 566 },
  { id: 'fb-link', g: 'Facebook', name: 'Post / لينك 1.91:1', w: 1200, h: 630 },
  { id: 'fb-cover', g: 'Facebook', name: 'Cover الصفحة', w: 1640, h: 624 },
  { id: 'li-post', g: 'LinkedIn', name: 'Post عرضي', w: 1200, h: 627 },
  { id: 'li-square', g: 'LinkedIn', name: 'Post مربع', w: 1200, h: 1200 },
  { id: 'li-banner', g: 'LinkedIn', name: 'Banner البروفايل', w: 1584, h: 396 },
  { id: 'li-company', g: 'LinkedIn', name: 'Cover صفحة الشركة', w: 1128, h: 191 },
  { id: 'x-post', g: 'X', name: 'Post', w: 1600, h: 900 },
  { id: 'x-header', g: 'X', name: 'Header', w: 1500, h: 500 },
  { id: 'yt-thumb', g: 'YouTube', name: 'Thumbnail', w: 1280, h: 720 },
  { id: 'yt-banner', g: 'YouTube', name: 'Banner القناة', w: 2560, h: 1440 },
  { id: 'pin', g: 'Pinterest', name: 'Pin', w: 1000, h: 1500 },
  { id: 'profile', g: 'عام', name: 'صورة بروفايل', w: 800, h: 800 },
];
const DEFAULT_SIZES = ['ig-portrait', 'ig-square', 'story', 'fb-link', 'li-post', 'x-post'];

// بترسم الصورة في المقاس المطلوب
// mode: 'fill' (قص حوالين نقطة التركيز) أو 'fit' (الصورة كلها + خلفية)
function renderSize(img, w, h, { mode = 'fill', fx = 0.5, fy = 0.5, bg = 'blur' } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.imageSmoothingQuality = 'high';
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  const cover = Math.max(w / iw, h / ih), contain = Math.min(w / iw, h / ih);
  const placeCover = () => {
    const dw = iw * cover, dh = ih * cover;
    const dx = Math.min(0, Math.max(w - dw, w / 2 - fx * dw));
    const dy = Math.min(0, Math.max(h - dh, h / 2 - fy * dh));
    return [dx, dy, dw, dh];
  };
  if (mode === 'fill') {
    x.drawImage(img, ...placeCover());
  } else {
    if (bg === 'blur') {
      x.filter = `blur(${Math.round(Math.max(w, h) / 40)}px) brightness(.7)`;
      const [dx, dy, dw, dh] = placeCover();
      x.drawImage(img, dx - 40, dy - 40, dw + 80, dh + 80);
      x.filter = 'none';
    } else {
      x.fillStyle = bg;
      x.fillRect(0, 0, w, h);
    }
    const dw = iw * contain, dh = ih * contain;
    x.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  }
  return c;
}

Tools.resizer = {
  title: 'SocialSizer — كل مقاسات السوشيال',
  subtitle: 'ارفع صورة واحدة وخدها بكل المقاسات مرة واحدة. والصورة مش بتترفع على أي سيرفر، كله بيحصل جوه المتصفح.',
  async render(el) {
    const st = await Store.get('resizer', { sizes: DEFAULT_SIZES, mode: 'fill', bg: 'blur', fmt: 'jpg' });
    const groups = Array.from(new Set(SIZES.map((s) => s.g)));
    el.innerHTML = `
      <div class="grid" style="grid-template-columns:minmax(0,1fr) 330px;align-items:start">
        <div class="card" style="padding:0;overflow:hidden">
          <label id="r-drop" style="display:grid;place-items:center;min-height:300px;cursor:pointer;background:var(--black);border:2px dashed var(--line);border-radius:12px;margin:12px;text-align:center;padding:20px;position:relative">
            <input type="file" id="r-file" accept="image/*" hidden>
            <div id="r-empty"><div style="font:800 34px Inter;color:var(--brand)">+</div><b style="color:var(--white)">اسحب صورة هنا أو دوس للاختيار</b><div class="muted" style="font-size:12px">أو الصق صورة (Ctrl+V)</div></div>
            <div id="r-prev" hidden style="position:relative;display:inline-block;line-height:0">
              <img id="r-img" style="max-width:100%;max-height:420px;border-radius:6px;cursor:crosshair">
              <span id="r-dot" style="position:absolute;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 2px var(--brand),0 2px 8px rgba(0,0,0,.6);pointer-events:none"></span>
            </div>
          </label>
          <div class="row" style="padding:0 14px 12px;justify-content:space-between">
            <span class="muted" id="r-info" style="font-size:12px">دوس على الصورة عشان تحدد منتصفها (النقطة الحمرا) وقت القص.</span>
            <button class="btn ghost sm" id="r-change" hidden>صورة تانية</button>
          </div>
        </div>
        <div class="card">
          <h3>طريقة الضبط</h3>
          <label class="check"><input type="radio" name="r-mode" value="fill" ${st.mode === 'fill' ? 'checked' : ''}> <span><b style="color:var(--white)">قص</b> — الصورة تملا المقاس، والقص بيبقى حوالين النقطة الحمرا</span></label>
          <label class="check"><input type="radio" name="r-mode" value="fit" ${st.mode === 'fit' ? 'checked' : ''}> <span><b style="color:var(--white)">ملء</b> — الصورة كلها باينة، والفراغ بيتملي بخلفية</span></label>
          <div id="r-bgrow" class="row" style="margin:6px 0 0">${[['blur', 'ضبابي'], ['#111111', 'أسود'], ['#FFFFFF', 'أبيض'], ['#C7161D', 'أحمر']].map(([v, n]) => `<button class="btn sm ${st.bg === v ? 'primary' : ''}" data-bg="${v}">${n}</button>`).join('')}</div>
          <h3 style="margin-top:14px">الصيغة</h3>
          <div class="row">${[['jpg', 'JPG (أخف)'], ['png', 'PNG (أعلى جودة)']].map(([v, n]) => `<label class="check" style="padding:0"><input type="radio" name="r-fmt" value="${v}" ${st.fmt === v ? 'checked' : ''}> ${n}</label>`).join('')}</div>
          <h3 style="margin-top:14px">مقاس مخصص</h3>
          <div class="row" style="flex-wrap:nowrap"><input type="number" id="r-cw" placeholder="العرض" min="16" max="8000"><span class="muted">×</span><input type="number" id="r-ch" placeholder="الطول" min="16" max="8000"></div>
        </div>
      </div>
      <div class="card" style="margin-top:14px">
        <div class="row" style="justify-content:space-between;margin-bottom:8px"><h3 style="margin:0">المقاسات</h3>
          <div class="row"><button class="btn ghost sm" id="r-all">الكل</button><button class="btn ghost sm" id="r-none">ولا حاجة</button></div></div>
        <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:4px 14px">
          ${groups.map((g) => `<div><div class="muted" style="font-size:11px;font-weight:700;margin:6px 0 2px">${g}</div>${SIZES.filter((s) => s.g === g).map((s) => `<label class="check" style="padding:3px 0"><input type="checkbox" value="${s.id}" ${st.sizes.includes(s.id) ? 'checked' : ''}> <span>${esc(s.name)} <span class="muted mono" style="font-size:11px">${s.w}×${s.h}</span></span></label>`).join('')}</div>`).join('')}
        </div>
      </div>
      <div class="row" style="margin:14px 0 10px;justify-content:space-between"><h3 style="margin:0">النتيجة <span class="muted" id="r-count" style="font-weight:400"></span></h3><button class="btn primary" id="r-zip" disabled>تحميل الكل (ZIP)</button></div>
      <div class="grid" id="r-out" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))"></div>`;

    let img = null, name = 'image', fx = 0.5, fy = 0.5, outputs = [];
    const opts = () => ({
      mode: el.querySelector('input[name="r-mode"]:checked').value,
      bg: (el.querySelector('#r-bgrow .primary') || {}).dataset?.bg || 'blur',
      fmt: el.querySelector('input[name="r-fmt"]:checked').value,
      sizes: $$('input[type=checkbox]', el).filter((c) => c.checked).map((c) => c.value),
    });
    const save = () => { const o = opts(); Store.set('resizer', { sizes: o.sizes, mode: o.mode, bg: o.bg, fmt: o.fmt }); };
    const placeDot = () => { const d = $('#r-dot', el); d.style.left = fx * 100 + '%'; d.style.top = fy * 100 + '%'; };

    async function load(file) {
      if (!file || !file.type.startsWith('image/')) return;
      name = (file.name || 'image').replace(/\.[^.]+$/, '').replace(/[^\w؀-ۿ-]+/g, '-').slice(0, 40) || 'image';
      const url = URL.createObjectURL(file);
      const im = new Image();
      im.src = url;
      await im.decode();
      img = im; fx = 0.5; fy = 0.5;
      $('#r-img', el).src = url;
      $('#r-empty', el).hidden = true; $('#r-prev', el).hidden = false; $('#r-change', el).hidden = false;
      $('#r-info', el).textContent = `${im.naturalWidth}×${im.naturalHeight} · دوس على الصورة عشان تحدد منتصفها وقت القص.`;
      placeDot(); draw();
    }
    function draw() {
      const o = opts();
      $('#r-bgrow', el).style.opacity = o.mode === 'fit' ? 1 : 0.4;
      const list = SIZES.filter((s) => o.sizes.includes(s.id));
      const cw = parseInt($('#r-cw', el).value, 10), ch = parseInt($('#r-ch', el).value, 10);
      if (cw >= 16 && ch >= 16 && cw <= 8000 && ch <= 8000) list.push({ id: 'custom', g: 'مخصص', name: 'مقاس مخصص', w: cw, h: ch });
      $('#r-count', el).textContent = `(${list.length} مقاس)`;
      $('#r-zip', el).disabled = !img || !list.length;
      if (!img) { $('#r-out', el).innerHTML = '<div class="empty card" style="grid-column:1/-1">ارفع صورة الأول.</div>'; return; }
      outputs = list.map((s) => ({ s, canvas: renderSize(img, s.w, s.h, { mode: o.mode, fx, fy, bg: o.bg }) }));
      const out = $('#r-out', el);
      out.innerHTML = '';
      outputs.forEach(({ s, canvas }) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.padding = '10px';
        canvas.style.cssText = 'width:100%;height:auto;border-radius:6px;background:#000;display:block;max-height:260px;object-fit:contain';
        const info = document.createElement('div');
        info.className = 'row';
        info.style.cssText = 'justify-content:space-between;margin-top:8px;flex-wrap:nowrap';
        info.innerHTML = `<span style="font-size:12px"><b style="color:var(--white)">${esc(s.g)}</b> ${esc(s.name)}<br><span class="muted mono">${s.w}×${s.h}</span></span><button class="btn sm">تحميل</button>`;
        info.querySelector('button').addEventListener('click', async () => download(await toBlob(canvas, o.fmt), fileName(s, o.fmt)));
        card.append(canvas, info);
        out.appendChild(card);
      });
      save();
    }
    const toBlob = (canvas, fmt) => new Promise((res) => canvas.toBlob(res, fmt === 'png' ? 'image/png' : 'image/jpeg', 0.92));
    const fileName = (s, fmt) => `${name}-${s.id}-${s.w}x${s.h}.${fmt}`;

    $('#r-file', el).addEventListener('change', (e) => load(e.target.files[0]));
    const drop = $('#r-drop', el);
    drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.style.borderColor = 'var(--brand)'; });
    drop.addEventListener('dragleave', () => { drop.style.borderColor = ''; });
    drop.addEventListener('drop', (e) => { e.preventDefault(); drop.style.borderColor = ''; load(e.dataTransfer.files[0]); });
    document.addEventListener('paste', (e) => {
      if (!el.isConnected) return;
      const f = Array.from(e.clipboardData.files || []).find((x) => x.type.startsWith('image/'));
      if (f) load(f);
    });
    $('#r-img', el).addEventListener('click', (e) => {
      e.preventDefault();
      const r = e.target.getBoundingClientRect();
      fx = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      fy = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
      placeDot(); draw();
    });
    $('#r-change', el).addEventListener('click', () => $('#r-file', el).click());
    $$('input[name="r-mode"], input[name="r-fmt"], input[type=checkbox]', el).forEach((i) => i.addEventListener('change', draw));
    $$('#r-cw, #r-ch', el).forEach((i) => i.addEventListener('change', draw));
    $$('[data-bg]', el).forEach((b) => b.addEventListener('click', () => { $$('[data-bg]', el).forEach((x) => x.classList.toggle('primary', x === b)); draw(); }));
    $('#r-all', el).addEventListener('click', () => { $$('input[type=checkbox]', el).forEach((c) => { c.checked = true; }); draw(); });
    $('#r-none', el).addEventListener('click', () => { $$('input[type=checkbox]', el).forEach((c) => { c.checked = false; }); draw(); });
    $('#r-zip', el).addEventListener('click', async () => {
      const btn = $('#r-zip', el), fmt = opts().fmt;
      btn.disabled = true; btn.textContent = 'جاري التجهيز...';
      const files = [];
      for (const { s, canvas } of outputs) files.push({ name: fileName(s, fmt), data: new Uint8Array(await (await toBlob(canvas, fmt)).arrayBuffer()) });
      download(buildZip(files), `${name}-SocialSizer.zip`);
      btn.disabled = false; btn.textContent = 'تحميل الكل (ZIP)';
    });
    draw();
  },
};

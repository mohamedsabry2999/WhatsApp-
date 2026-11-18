Tools.ads = {
  title: 'أرشيف إعلانات المنافسين',
  subtitle: 'افتح Meta Ad Library وهتلاقي زرار "احفظ في الأرشيف" على كل إعلان. وأي إعلان من منصة تانية تقدر تضيفه بإيدك من هنا.',
  async render(el, { actions }) {
    let ads = await Store.get('ads', []);
    let comp = '', q = '';
    actions.innerHTML = '<a class="btn" href="https://www.facebook.com/ads/library/" target="_blank">افتح Meta Ad Library</a><button class="btn" id="add">+ إضافة يدوي</button><button class="btn primary" id="exp">تصدير Excel</button>';
    el.innerHTML = `
      <div class="card" id="form" hidden style="margin-bottom:14px">
        <h3>إضافة إعلان يدوي</h3>
        <div class="grid g2">
          <label class="f">المنافس<input type="text" id="f-comp"></label>
          <label class="f">المنصة<select id="f-src"><option>Meta Ad Library</option><option>TikTok Creative Center</option><option>LinkedIn Ad Library</option><option>Google Ads Transparency</option><option>Snapchat</option><option>أوت دور / مطبوع</option><option>أخرى</option></select></label>
          <label class="f">اللينك<input type="url" id="f-link" dir="ltr"></label>
          <label class="f">صورة / سكرين شوت<input type="file" id="f-img" accept="image/*"></label>
        </div>
        <label class="f" style="margin-top:8px">نص الإعلان<textarea id="f-text" rows="3"></textarea></label>
        <label class="f" style="margin-top:8px">ملاحظتك (الزاوية / الـ Hook / الـ Offer)<textarea id="f-note" rows="2"></textarea></label>
        <div class="row" style="margin-top:10px"><button class="btn primary" id="f-save">حفظ</button><button class="btn ghost" id="f-cancel">إلغاء</button></div>
      </div>
      <div class="row" style="margin-bottom:12px">
        <input type="search" id="q" placeholder="دوّر في النصوص والملاحظات..." style="max-width:300px">
        <select id="comp" style="max-width:220px"></select>
        <span class="muted" id="cnt"></span>
      </div>
      <div class="grid" id="grid" style="grid-template-columns: repeat(auto-fill, minmax(260px, 1fr))"></div>`;

    function draw() {
      const comps = Array.from(new Set(ads.map((a) => a.competitor || 'بدون اسم')));
      $('#comp', el).innerHTML = `<option value="">كل المنافسين (${ads.length})</option>` + comps.map((c) => `<option value="${esc(c)}" ${c === comp ? 'selected' : ''}>${esc(c)} (${ads.filter((a) => (a.competitor || 'بدون اسم') === c).length})</option>`).join('');
      const list = ads.filter((a) => (!comp || (a.competitor || 'بدون اسم') === comp) && (!q || ((a.text || '') + ' ' + (a.note || '') + ' ' + (a.competitor || '')).toLowerCase().includes(q)));
      $('#cnt', el).textContent = `${list.length} إعلان`;
      $('#grid', el).innerHTML = list.length ? list.map((a) => `
        <div class="card" style="padding:0;overflow:hidden;display:flex;flex-direction:column" data-id="${esc(a.id)}">
          ${a.image ? `<img src="${a.image}" style="width:100%;max-height:260px;object-fit:cover;background:#000;display:block">` : `<div style="height:80px;display:grid;place-items:center;background:var(--black)" class="muted">${a.hasVideo ? 'فيديو' : 'من غير صورة'}</div>`}
          <div style="padding:12px;display:flex;flex-direction:column;gap:6px;flex:1">
            <div class="row" style="justify-content:space-between"><input class="cp" value="${esc(a.competitor || '')}" style="font-weight:700;padding:4px 8px" title="اسم المنافس"><span class="pill ${a.active ? 'red' : ''}">${a.active ? 'شغال' : esc(a.source || '')}</span></div>
            ${a.started ? `<div class="muted" style="font-size:12px">بدأ: ${esc(a.started)}</div>` : ''}
            <div style="white-space:pre-line;font-size:12px;max-height:120px;overflow:auto;color:var(--text)">${esc(a.text || '')}</div>
            <textarea class="nt" rows="2" placeholder="ملاحظتك: الزاوية، الـ Hook، العرض..." style="min-height:50px">${esc(a.note || '')}</textarea>
            <div class="row" style="margin-top:auto">${a.link ? `<a class="btn sm" href="${esc(a.link)}" target="_blank">فتح</a>` : ''}<button class="btn ghost sm del">حذف</button><span class="muted" style="font-size:11px;margin-inline-start:auto">${fmtDateTime(a.savedAt)}</span></div>
          </div>
        </div>`).join('') : '<div class="empty card">لسه مفيش إعلانات. افتح Meta Ad Library ودوّر على أي منافس، وهتلاقي زرار الحفظ على كل إعلان.</div>';
      $$('#grid [data-id]', el).forEach((card) => {
        const a = ads.find((x) => x.id === card.dataset.id);
        $('.nt', card).addEventListener('change', async (e) => { a.note = e.target.value; await Store.set('ads', ads); });
        $('.cp', card).addEventListener('change', async (e) => { a.competitor = e.target.value.trim(); await Store.set('ads', ads); draw(); });
        $('.del', card).addEventListener('click', async () => { if (confirm('تحذف الإعلان ده؟')) { ads = ads.filter((x) => x !== a); await Store.set('ads', ads); draw(); } });
      });
    }
    async function fileToDataUrl(file, max = 900) {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await img.decode();
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      return c.toDataURL('image/jpeg', 0.85);
    }
    $('#add', actions).addEventListener('click', () => { $('#form', el).hidden = false; $('#f-comp', el).focus(); });
    $('#f-cancel', el).addEventListener('click', () => { $('#form', el).hidden = true; });
    $('#f-save', el).addEventListener('click', async () => {
      const f = $('#f-img', el).files[0];
      ads.unshift({
        id: 'm-' + Store.uid(), competitor: $('#f-comp', el).value.trim(), source: $('#f-src', el).value,
        link: $('#f-link', el).value.trim(), text: $('#f-text', el).value.trim(), note: $('#f-note', el).value.trim(),
        image: f ? await fileToDataUrl(f) : '', savedAt: Date.now(),
      });
      await Store.set('ads', ads);
      $$('#form input, #form textarea', el).forEach((i) => { if (i.type !== 'file') i.value = ''; else i.value = null; });
      $('#form', el).hidden = true; draw(); toast('اتحفظ ✔');
    });
    $('#q', el).addEventListener('input', (e) => { q = e.target.value.trim().toLowerCase(); draw(); });
    $('#comp', el).addEventListener('change', (e) => { comp = e.target.value; draw(); });
    $('#exp', actions).addEventListener('click', () => exportXlsx('Ads-Archive', ['المنافس', 'المصدر', 'شغال؟', 'بدأ', 'نص الإعلان', 'ملاحظتي', 'اللينك', 'اتحفظ'],
      ads.map((a) => [a.competitor, a.source, a.active ? 'نعم' : '', a.started || '', a.text, a.note, a.link, fmtDateTime(a.savedAt)]), [20, 18, 8, 16, 60, 40, 45, 18]));
    Store.onChange('ads', (v) => { if (el.isConnected && !el.contains(document.activeElement)) { ads = v || []; draw(); } });
    draw();
  },
};

// حدود المنصات. ممكن تتغير مع الوقت، فعدّلها من هنا لو المنصة غيّرتها.
const PLATFORMS = {
  instagram: { name: 'Instagram', max: 2200, tags: 5, fold: 125, linksClickable: false },
  facebook: { name: 'Facebook', max: 63206, tags: 5, fold: 250, linksClickable: true },
  linkedin: { name: 'LinkedIn', max: 3000, tags: 5, fold: 210, linksClickable: true },
  x: { name: 'X (Twitter)', max: 280, tags: 2, fold: 280, linksClickable: true },
  tiktok: { name: 'TikTok', max: 4000, tags: 6, fold: 100, linksClickable: false },
};
const DEFAULT_CTAS = [
  'ابعتلنا رسالة على واتساب',
  'اكتب "تفاصيل" في كومنت',
  'احجز مكانك من اللينك في البايو',
  'احفظ البوست ترجعله بعدين',
  'شارك البوست مع حد محتاجه',
];
const CTA_WORDS = /(ابعت|ابعتل|كلمنا|تواصل|اكتب|كومنت|علّق|علق|احجز|سجّل|سجل|اشترك|اطلب|احفظ|شارك|منشن|لينك|البايو|رابط|اتصل|DM|link in bio|comment|book|order|call|subscribe|save|share)/i;

Tools.post = {
  title: 'مراجع البوست',
  subtitle: 'راجع الكابشن قبل النشر: الطول، والـ Hook، والهاشتاجات، والـ CTA، والنص على التصميم (من 3 لـ 12 كلمة).',
  async render(el) {
    let sets = await Store.get('hashtagSets', [{ name: 'تسويق', tags: '#تسويق #تسويق_رقمي #ماركتنج #براند #مصر' }]);
    let ctas = await Store.get('ctas', DEFAULT_CTAS);
    const draft = await Store.get('postDraft', { platform: 'instagram', caption: '', design: '' });

    el.innerHTML = `
      <div class="grid" style="grid-template-columns: minmax(0,1fr) 340px; align-items:start">
        <div class="grid">
          <div class="card">
            <div class="row" id="plats" style="margin-bottom:10px"></div>
            <label class="f">الكابشن<textarea id="cap" rows="12" placeholder="أول سطر هو الـ Hook..."></textarea></label>
            <div class="row" style="justify-content:space-between;margin-top:6px">
              <span class="muted" id="count"></span>
              <div class="row"><button class="btn sm" id="copy">نسخ الكابشن</button><button class="btn ghost sm" id="clear">مسح</button></div>
            </div>
            <label class="f" style="margin-top:12px">النص اللي على التصميم (Static)<input type="text" id="design" placeholder="مثلًا: التسويق مش بوستات وإعلانات"></label>
          </div>
          <div class="card">
            <h3>كده هيظهر قبل "المزيد"</h3>
            <div id="fold" style="white-space:pre-line;color:var(--white)"></div>
          </div>
        </div>
        <div class="grid">
          <div class="card"><h3>المراجعة</h3><div id="checks"></div></div>
          <div class="card">
            <h3>CTA جاهزة</h3>
            <div class="grid" id="ctas" style="gap:6px"></div>
            <button class="btn ghost sm" id="add-cta" style="margin-top:8px">+ CTA</button>
          </div>
          <div class="card">
            <h3>مجموعات الهاشتاجات</h3>
            <div class="grid" id="sets" style="gap:8px"></div>
            <button class="btn ghost sm" id="add-set" style="margin-top:8px">+ مجموعة</button>
          </div>
        </div>
      </div>`;

    let platform = draft.platform;
    const cap = $('#cap', el), design = $('#design', el);
    cap.value = draft.caption; design.value = draft.design;

    const len = (s) => Array.from(s).length;
    const words = (s) => (s.trim().match(/\S+/g) || []).length;
    let saveT;
    function analyze() {
      const P = PLATFORMS[platform];
      const text = cap.value;
      const L = len(text);
      const lines = text.split('\n');
      const hook = (lines.find((l) => l.trim()) || '').trim();
      const tags = text.match(/#[\p{L}\p{N}_]+/gu) || [];
      const dup = tags.filter((t, i) => tags.indexOf(t) !== i);
      const urls = text.match(/https?:\/\/\S+/g) || [];
      const longPara = text.split(/\n\s*\n/).some((p) => len(p) > 400);
      const dw = words(design.value);
      const ctaHit = ctas.some((c) => c && text.includes(c)) || CTA_WORDS.test(lines.slice(-4).join(' '));
      const c = [];
      if (!L) { $('#checks', el).innerHTML = '<div class="muted">اكتب الكابشن عشان أراجعه.</div>'; }
      else {
        c.push(L > P.max ? ['bad', `الكابشن ${L} حرف، وحد ${P.name} هو ${P.max}`] : ['ok', `الطول ${L} من ${P.max} حرف`]);
        const hw = words(hook);
        c.push(!hook ? ['bad', 'مفيش Hook'] : hw > 12 ? ['warn', `الـ Hook طويل (${hw} كلمة)، خليه 12 كلمة أو أقل`] : ['ok', `الـ Hook قصير وواضح (${hw} كلمة)`]);
        c.push(len(hook) > P.fold ? ['warn', 'الـ Hook أطول من اللي بيظهر قبل "المزيد"'] : ['ok', 'الـ Hook كله باين قبل "المزيد"']);
        c.push(tags.length > P.tags ? ['bad', `${tags.length} هاشتاج، والأنسب لـ ${P.name} ${P.tags} أو أقل`] : ['ok', `${tags.length} هاشتاج`]);
        if (dup.length) c.push(['warn', 'هاشتاج متكرر: ' + Array.from(new Set(dup)).join(' ')]);
        c.push(ctaHit ? ['ok', 'فيه CTA'] : ['warn', 'مفيش CTA واضح في الآخر']);
        if (urls.length && !P.linksClickable) c.push(['warn', `اللينكات مش بتبقى clickable في كابشن ${P.name}، استخدم "اللينك في البايو"`]);
        if (longPara) c.push(['warn', 'فيه فقرة طويلة، قسّمها لسطور أقصر']);
      }
      if (design.value.trim()) c.push(dw < 3 || dw > 12 ? ['warn', `النص على التصميم ${dw} كلمة (القاعدة: من 3 لـ 12)`] : ['ok', `النص على التصميم ${dw} كلمة`]);
      if (c.length) $('#checks', el).innerHTML = c.map(([lvl, m]) => `<div class="check ${lvl}"><span class="i">${lvl === 'ok' ? '✔' : lvl === 'warn' ? '!' : '✖'}</span>${esc(m)}</div>`).join('');
      $('#count', el).textContent = `${L} / ${P.max} حرف · ${words(text)} كلمة · ${tags.length} هاشتاج`;
      $('#count', el).style.color = L > P.max ? 'var(--bad)' : '';
      const folded = Array.from(text).slice(0, P.fold).join('');
      $('#fold', el).textContent = L ? folded + (L > P.fold ? '… المزيد' : '') : '—';
      clearTimeout(saveT);
      saveT = setTimeout(() => Store.set('postDraft', { platform, caption: text, design: design.value }), 400);
    }
    function drawPlats() {
      $('#plats', el).innerHTML = Object.entries(PLATFORMS).map(([k, p]) => `<button class="btn sm ${k === platform ? 'primary' : ''}" data-p="${k}">${p.name}</button>`).join('');
      $$('#plats button', el).forEach((b) => b.addEventListener('click', () => { platform = b.dataset.p; drawPlats(); analyze(); }));
    }
    function insert(text, atEnd = true) {
      const body = cap.value.replace(/\s*$/, '');
      const parts = body.split(/\n\s*\n/);
      const last = parts[parts.length - 1] || '';
      const lastIsTags = parts.length > 1 && /^(#[\p{L}\p{N}_]+\s*)+$/u.test(last.trim());
      if (atEnd && lastIsTags && !text.trim().startsWith('#')) {
        // الـ CTA يدخل قبل الهاشتاجات مش بعدها
        cap.value = parts.slice(0, -1).join('\n\n') + '\n\n' + text + '\n\n' + last;
      } else cap.value = atEnd ? body + (body.trim() ? '\n\n' : '') + text : text + cap.value;
      analyze(); cap.focus();
    }
    function drawLibs() {
      $('#ctas', el).innerHTML = ctas.map((c, i) => `<div class="row" style="flex-wrap:nowrap"><button class="btn sm" style="flex:1;justify-content:flex-start" data-i="${i}">${esc(c)}</button><button class="btn ghost sm" data-x="${i}">✕</button></div>`).join('');
      $$('#ctas [data-i]', el).forEach((b) => b.addEventListener('click', () => insert(ctas[+b.dataset.i])));
      $$('#ctas [data-x]', el).forEach((b) => b.addEventListener('click', async () => { ctas.splice(+b.dataset.x, 1); await Store.set('ctas', ctas); drawLibs(); analyze(); }));
      $('#sets', el).innerHTML = sets.map((s, i) => `<div style="border:1px solid var(--line);border-radius:8px;padding:8px"><div class="row" style="justify-content:space-between"><b style="color:var(--white)">${esc(s.name)}</b><span><button class="btn sm" data-s="${i}">إضافة</button> <button class="btn ghost sm" data-sx="${i}">✕</button></span></div><div class="muted" style="font-size:12px">${esc(s.tags)}</div></div>`).join('');
      $$('#sets [data-s]', el).forEach((b) => b.addEventListener('click', () => insert(sets[+b.dataset.s].tags)));
      $$('#sets [data-sx]', el).forEach((b) => b.addEventListener('click', async () => { sets.splice(+b.dataset.sx, 1); await Store.set('hashtagSets', sets); drawLibs(); }));
    }
    $('#add-cta', el).addEventListener('click', async () => { const v = prompt('اكتب الـ CTA:'); if (v && v.trim()) { ctas.push(v.trim()); await Store.set('ctas', ctas); drawLibs(); analyze(); } });
    $('#add-set', el).addEventListener('click', async () => {
      const name = prompt('اسم المجموعة:'); if (!name) return;
      const tags = prompt('الهاشتاجات (مفصولة بمسافة):', '#'); if (!tags) return;
      sets.push({ name: name.trim(), tags: tags.trim() }); await Store.set('hashtagSets', sets); drawLibs();
    });
    $('#copy', el).addEventListener('click', () => copyText(cap.value, 'الكابشن اتنسخ ✔'));
    $('#clear', el).addEventListener('click', () => { if (confirm('تمسح الكابشن؟')) { cap.value = ''; design.value = ''; analyze(); } });
    cap.addEventListener('input', analyze); design.addEventListener('input', analyze);
    drawPlats(); drawLibs(); analyze();
  },
};

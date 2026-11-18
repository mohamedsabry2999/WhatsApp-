// BriefBuilder — بريف المحتوى بالـ 16 بند + برومت التصميم
// مبني على "Content Production Rule" و "Brand Voice & Visual Execution Guide" بتوع محمد صبري.
const BRIEF_TYPES = ['Static', 'Carousel', 'Reel / Video', 'Story', 'Text Post'];
const BRIEF_PLATFORMS = ['Instagram', 'LinkedIn', 'Facebook', 'X', 'TikTok'];
const BRIEF_STATUS = ['فكرة', 'قيد الكتابة', 'قيد التصميم', 'جاهز للنشر', 'اتنشر'];
const BRIEF_LEVELS = ['أساسي', 'متوسط', 'متقدم'];
const BRIEF_GOALS = ['وعي', 'تعليم', 'بناء سلطة معرفية', 'تفاعل', 'Leads', 'مبيعات'];
const BRIEF_TOV = ['مباشر وواثق', 'قيادي دون تعالٍ', 'عملي دون تبسيط مخل', 'جريء دون افتعال جدل', 'مصري مفهوم'];
const BRIEF_AUDIENCE = ['أصحاب الشركات', 'صناع القرار', 'قادة التسويق', 'المسوّقين الطامحين للتفكير الاستراتيجي'];
const BRIEF_METAPHORS = ['عدسة', 'GPS', 'كتاب ناقص', 'ماكينة', 'مترو', 'مرآة', 'مصعد', 'أشعة', 'سباق', 'بوصلة', 'شطرنج'];
const BRIEF_STYLES = ['Cinematic Photomanipulation', 'Premium 3D Advertising', 'Surreal Conceptual Advertising', 'Editorial Collage', 'Product-style Hero Object', 'Visual Paradox', 'Before and After in one scene'];
const BRIEF_COMPOSITION = ['Centered hero object, eye level', 'Low angle hero shot', 'Top-down flat lay', 'Close-up macro', 'Wide cinematic establishing shot'];
const BRIEF_LIGHTING = ['Cinematic dramatic lighting, deep shadows', 'Soft studio lighting, clean background', 'High-contrast editorial lighting', 'Premium 3D materials, glossy and matte'];
const BRIEF_INTEGRATION = ['Text is part of the scene (printed on a real object in the scene)', 'Bold typography with generous negative space', 'Text on a solid brand-color band'];
const BRIEF_CTAS = ['احفظ البوست ترجعله وقت الخطة', 'شاركه مع حد مسؤول عن التسويق', 'اكتب "منظومة" في كومنت وأبعتلك الإطار', 'تابعني عشان سلسلة الـ Framework كاملة'];
const BRIEF_DEFAULT_SETTINGS = {
  brandName: 'Mohamed Sabry',
  positioning: 'Strategic Marketing & Growth Architect',
  identity: 'Red, black and white visual identity (#C7161D, #111111, #FFFFFF), Cairo Arabic typography, Inter for English',
};

const briefWords = (s) => (String(s || '').trim().match(/\S+/g) || []).length;
function briefRatio(b) {
  if (/Reel|Story/.test(b.type) || (b.platforms || []).join() === 'TikTok') return '9:16 vertical';
  if ((b.platforms || []).length === 1 && b.platforms[0] === 'X') return '16:9';
  if (b.type === 'Text Post') return '1:1 (if a visual is needed)';
  return '4:5 portrait (Instagram / LinkedIn / Facebook)';
}
function briefPrompt(b, s) {
  return [
    'Role: Senior Creative Director.',
    `Personal brand editorial design for ${s.brandName} — ${s.positioning}.`,
    `Strategic message: ${b.message || b.idea || '[strategic message]'}`,
    `Creative visual metaphor: ${b.metaphor || '[visual metaphor]'}`,
    `Scene and visual twist: ${b.scene || '[scene + twist]'}`,
    `Composition and camera angle: ${b.composition}`,
    `Lighting and material treatment: ${b.lighting}`,
    `Visual style: ${b.style}`,
    `Exact Arabic text (no spelling changes): "${b.designText || '[نص التصميم]'}"`,
    `Brand identity: ${s.identity}. Executive minimal layout, bold, strategic, high contrast, grid-based, clean typography. One visual hero only. Highlight one key word or number in the brand color.`,
    `Text integration method: ${b.integration}`,
    'Negative instructions: no company logos; no generic stock-business clichés (no handshakes, no businessman pointing at a screen, no generic office); no ready-made icons or template cards; do not change, translate or misspell the Arabic text.' + (b.negative ? ' ' + b.negative : ''),
    `Signature and output ratio: small "${s.brandName}" signature (not a large logo). Output ratio ${briefRatio(b)}.`,
  ].join('\n');
}
function briefChecks(b) {
  const c = [];
  const hw = briefWords(b.hook), dw = briefWords(b.designText);
  c.push(b.idea ? ['ok', 'الفكرة مكتوبة'] : ['bad', 'اكتب الفكرة']);
  c.push(!b.hook ? ['bad', 'مفيش Hook'] : hw > 12 ? ['warn', `الـ Hook ${hw} كلمة، خليه 12 أو أقل`] : ['ok', `Hook واحد واضح (${hw} كلمة)`]);
  c.push(!b.designText ? ['bad', 'مفيش نص للتصميم'] : dw < 3 || dw > 12 ? ['warn', `نص التصميم ${dw} كلمة (القاعدة: من 3 لـ 12)`] : ['ok', `نص التصميم ${dw} كلمة`]);
  c.push(b.metaphor ? ['ok', 'فيه استعارة بصرية (Visual Metaphor)'] : ['warn', 'التصميم بيبدأ من استعارة بصرية، مش من Layout']);
  c.push(b.scene ? ['ok', 'المشهد والـ Twist متحددين'] : ['warn', 'حدد المشهد والـ Visual Twist']);
  if (b.caption && b.designText && b.caption.includes(b.designText) && b.designText.length > 10) c.push(['warn', 'متنسخش الكابشن على التصميم']);
  c.push(b.cta ? ['ok', 'فيه CTA'] : ['warn', 'مفيش CTA']);
  c.push((b.platforms || []).length ? ['ok', 'المنصة: ' + b.platforms.join('، ')] : ['bad', 'اختار المنصة']);
  c.push(b.axis ? ['ok', 'مربوط بمرحلة: ' + b.axis] : ['warn', 'كل موضوع لازم يرتبط بمرحلة من الـ Framework']);
  return c;
}
function briefMarkdown(b, s) {
  const extra = b.type === 'Carousel' ? '\n\n**خطة الكاروسيل:** Slide 1 Hook قوي · Slides 2–5 تفكيك الفكرة · Slides 6–7 الخطوات أو القرار · آخر Slide الخلاصة + CTA. (فكرة واحدة بس)'
    : /Reel/.test(b.type) ? '\n\n**قواعد الفيديو:** أول ثانيتين فيهم التناقض أو المشكلة · جمل قصيرة ومباشرة · Subtitles كاملة · B-roll بيخدم المعنى · من 35 لـ 60 ثانية · النهاية بجملة Signature أو سؤال تطبيقي.' : '';
  return [
    `# ${b.idea ? b.idea.split('\n')[0].slice(0, 80) : 'بريف محتوى'}`,
    '',
    `1. **التاريخ:** ${b.date || ''}`,
    `2. **نوع البوست:** ${b.type}`,
    `3. **الفكرة:** ${b.idea || ''}`,
    `4. **المحور / الخدمة المعرفية:** ${b.axis || ''}`,
    `5. **الجمهور المستهدف:** ${b.audience || ''}`,
    `6. **مستوى المحتوى:** ${b.level}`,
    `7. **TOV:** ${(b.tov || []).join('، ')}`,
    `8. **الهدف من المحتوى:** ${b.goal}`,
    `9. **الـ Hook:** ${b.hook || ''}`,
    `10. **نص التصميم:** ${b.designText || ''}`,
    `11. **بريف التصميم:** الاستعارة: ${b.metaphor || '—'} · المشهد والـ Twist: ${b.scene || '—'} · الأسلوب: ${b.style} · التكوين: ${b.composition} · الإضاءة: ${b.lighting} · دمج النص: ${b.integration}${extra}`,
    '12. **برومت التنفيذ الكامل:**',
    '',
    '```',
    briefPrompt(b, s),
    '```',
    '',
    `13. **الكابشن الكامل:**\n\n${b.caption || ''}`,
    '',
    `14. **CTA:** ${b.cta || ''}`,
    `15. **المنصة:** ${(b.platforms || []).join('، ')}`,
    `16. **حالة التنفيذ:** ${b.status}`,
    '',
    `— BriefBuilder · ${s.brandName}`,
  ].join('\n');
}

Tools.brief = {
  title: 'BriefBuilder — بريف المحتوى',
  subtitle: 'الـ 16 بند بتوع كل بوست + برومت تصميم جاهز بنفس الترتيب كل مرة. البريف بيتحفظ لوحده وإنت بتكتب.',
  async render(el, { actions }) {
    const fw = typeof FRAMEWORK !== 'undefined' ? FRAMEWORK : [];
    let s = { ...BRIEF_DEFAULT_SETTINGS, ...(await Store.get('briefSettings', {})) };
    let lib = await Store.get('briefs', []);
    const blank = () => ({
      id: Store.uid(), date: new Date().toISOString().slice(0, 10), type: 'Static', platforms: ['Instagram', 'LinkedIn'], status: 'فكرة',
      idea: '', axis: '', audience: '', level: 'متوسط', tov: ['مباشر وواثق', 'مصري مفهوم'], goal: 'بناء سلطة معرفية',
      hook: '', designText: '', cta: '', message: '', metaphor: '', scene: '', composition: BRIEF_COMPOSITION[0], lighting: BRIEF_LIGHTING[0],
      style: BRIEF_STYLES[0], integration: BRIEF_INTEGRATION[0], negative: '', caption: '',
    });
    let b = { ...blank(), ...(await Store.get('briefDraft', {})) };
    const canNotion = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id && (await Store.get('notion', {})).token;

    actions.innerHTML = '<button class="btn" id="b-new">+ بريف جديد</button><button class="btn" id="b-settings">إعدادات الهوية</button>';
    const sel = (k, opts) => `<select data-k="${k}">${opts.map((o) => `<option ${b[k] === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
    const chips = (k, opts) => `<div class="row" style="gap:6px">${opts.map((o) => `<label class="pill" style="cursor:pointer;padding:3px 10px"><input type="checkbox" data-multi="${k}" value="${esc(o)}" ${(b[k] || []).includes(o) ? 'checked' : ''}> ${esc(o)}</label>`).join('')}</div>`;
    el.innerHTML = `
      <div class="card" id="b-set" hidden style="margin-bottom:14px">
        <h3>إعدادات الهوية (بتدخل في كل برومت)</h3>
        <div class="grid g2"><label class="f">الاسم (التوقيع)<input type="text" data-s="brandName"></label><label class="f">الـ Positioning<input type="text" data-s="positioning"></label></div>
        <label class="f" style="margin-top:8px">الهوية البصرية<input type="text" data-s="identity"></label>
      </div>
      <div class="grid" style="grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);align-items:start">
        <div class="grid">
          <div class="card"><h3>1) الأساسيات</h3>
            <div class="grid g2">
              <label class="f">التاريخ<input type="text" data-k="date" dir="ltr" placeholder="2026-11-20"></label>
              <label class="f">نوع البوست${sel('type', BRIEF_TYPES)}</label>
              <label class="f">الهدف من المحتوى${sel('goal', BRIEF_GOALS)}</label>
              <label class="f">حالة التنفيذ${sel('status', BRIEF_STATUS)}</label>
            </div>
            <div class="f" style="margin-top:10px"><span class="muted" style="font-size:12px">المنصة</span>${chips('platforms', BRIEF_PLATFORMS)}</div>
          </div>
          <div class="card"><h3>2) الاستراتيجية</h3>
            <label class="f">الفكرة<textarea data-k="idea" rows="2" placeholder="مثلًا: التسويق مش بوستات، ده منظومة قرارات"></textarea></label>
            <div class="grid g2" style="margin-top:8px">
              <label class="f">المحور / الخدمة المعرفية<select data-k="axis"><option value="">—</option>${fw.map((x) => { const v = `${x.n}. ${x.en}`; return `<option ${b.axis === v ? 'selected' : ''}>${esc(v)}</option>`; }).join('')}</select></label>
              <label class="f">الجمهور المستهدف<input type="text" data-k="audience" list="b-aud"><datalist id="b-aud">${BRIEF_AUDIENCE.map((a) => `<option value="${esc(a)}">`).join('')}</datalist></label>
              <label class="f">مستوى المحتوى${sel('level', BRIEF_LEVELS)}</label>
            </div>
            <div class="f" style="margin-top:10px"><span class="muted" style="font-size:12px">نبرة الصوت (TOV)</span>${chips('tov', BRIEF_TOV)}</div>
          </div>
          <div class="card"><h3>3) الرسالة</h3>
            <label class="f">الـ Hook <span id="b-hw"></span><input type="text" data-k="hook" placeholder="جملة واحدة تبدأ بالمشكلة أو التناقض"></label>
            <label class="f" style="margin-top:8px">نص التصميم <span id="b-dw"></span><input type="text" data-k="designText" placeholder="من 3 لـ 12 كلمة، واكتبه بالظبط زي ما هيتكتب"></label>
            <label class="f" style="margin-top:8px">CTA<input type="text" data-k="cta" list="b-cta"><datalist id="b-cta">${BRIEF_CTAS.map((a) => `<option value="${esc(a)}">`).join('')}</datalist></label>
          </div>
          <div class="card"><h3>4) البريف البصري <span class="muted" style="font-weight:400;font-size:12px">· ابدأ من الاستعارة، مش من الـ Layout</span></h3>
            <label class="f">الرسالة الاستراتيجية (جملة واحدة)<input type="text" data-k="message" placeholder="لو فاضية هتتاخد من الفكرة"></label>
            <label class="f" style="margin-top:8px">الاستعارة البصرية<input type="text" data-k="metaphor" placeholder="الحاجة الحقيقية اللي بتشبه الفكرة"></label>
            <div class="row" style="gap:6px;margin-top:6px">${BRIEF_METAPHORS.map((m) => `<button class="btn sm ghost" data-meta="${esc(m)}">${esc(m)}</button>`).join('')}</div>
            <label class="f" style="margin-top:8px">المشهد والـ Visual Twist<textarea data-k="scene" rows="2" placeholder="بطل بصري واحد + عنصر غير متوقع يخلّي التصميم يتفتكر"></textarea></label>
            <div class="grid g2" style="margin-top:8px">
              <label class="f">الأسلوب${sel('style', BRIEF_STYLES)}</label>
              <label class="f">التكوين وزاوية الكاميرا${sel('composition', BRIEF_COMPOSITION)}</label>
              <label class="f">الإضاءة والخامات${sel('lighting', BRIEF_LIGHTING)}</label>
              <label class="f">طريقة دمج النص${sel('integration', BRIEF_INTEGRATION)}</label>
            </div>
            <label class="f" style="margin-top:8px">ممنوعات إضافية (اختياري)<input type="text" data-k="negative" dir="ltr" placeholder="e.g. no people, no blue"></label>
          </div>
          <div class="card"><h3>5) الكابشن</h3>
            <div class="row" style="margin-bottom:6px"><button class="btn sm" id="b-skel">قالب الهيكل (6 أجزاء)</button><span class="muted" id="b-capn" style="font-size:12px"></span></div>
            <textarea data-k="caption" rows="9"></textarea>
          </div>
        </div>
        <div class="grid" style="position:sticky;top:12px">
          <div class="card"><h3>المراجعة</h3><div id="b-checks"></div></div>
          <div class="card"><div class="row" style="justify-content:space-between"><h3 style="margin:0">برومت التنفيذ</h3><button class="btn sm" id="b-cp">نسخ البرومت</button></div>
            <pre id="b-prompt" class="mono" style="white-space:pre-wrap;background:var(--black);border:1px solid var(--line);border-radius:8px;padding:10px;font-size:11.5px;max-height:320px;overflow:auto;margin:10px 0 0"></pre></div>
          <div class="card">
            <div class="grid" style="gap:8px">
              <button class="btn primary" id="b-copy">نسخ البريف كامل (16 بند)</button>
              <div class="row" style="flex-wrap:nowrap"><button class="btn" id="b-md" style="flex:1">تحميل Markdown</button><button class="btn" id="b-save" style="flex:1">حفظ في المكتبة</button></div>
              ${canNotion ? '<button class="btn" id="b-notion">حفظ على Notion</button>' : ''}
            </div>
            <div id="b-status" class="muted" style="margin-top:8px;font-size:12px"></div>
          </div>
        </div>
      </div>
      <div class="row" style="justify-content:space-between;margin:22px 0 8px"><h3 style="margin:0">مكتبة البريفات</h3><button class="btn sm" id="b-exp">تصدير Excel</button></div>
      <div class="card" style="padding:0;overflow:auto"><table class="t" id="b-lib"></table></div>`;

    let saveT;
    function fill() {
      $$('[data-k]', el).forEach((i) => { i.value = b[i.dataset.k] ?? ''; });
      $$('[data-multi]', el).forEach((i) => { i.checked = (b[i.dataset.multi] || []).includes(i.value); });
      $$('[data-s]', el).forEach((i) => { i.value = s[i.dataset.s] ?? ''; });
    }
    function update() {
      $('#b-hw', el).textContent = b.hook ? `(${briefWords(b.hook)} كلمة)` : '';
      $('#b-dw', el).textContent = b.designText ? `(${briefWords(b.designText)} كلمة)` : '';
      $('#b-capn', el).textContent = b.caption ? `${Array.from(b.caption).length} حرف` : '';
      $('#b-checks', el).innerHTML = briefChecks(b).map(([l, m]) => `<div class="check ${l}"><span class="i">${l === 'ok' ? '✔' : l === 'warn' ? '!' : '✖'}</span>${esc(m)}</div>`).join('');
      $('#b-prompt', el).textContent = briefPrompt(b, s);
      clearTimeout(saveT);
      saveT = setTimeout(() => Store.set('briefDraft', b), 400);
    }
    function drawLib() {
      $('#b-lib', el).innerHTML = '<tr><th>التاريخ</th><th>الفكرة</th><th>النوع</th><th>المحور</th><th>الحالة</th><th></th></tr>' + (lib.length
        ? lib.map((x) => `<tr><td class="mono">${esc(x.date)}</td><td><b style="color:var(--white)">${esc((x.idea || '').slice(0, 70))}</b><div class="muted" style="font-size:12px">${esc(x.hook || '')}</div></td><td>${esc(x.type)}</td><td class="muted">${esc(x.axis || '—')}</td><td><span class="pill ${x.status === 'اتنشر' ? '' : 'red'}">${esc(x.status)}</span></td>
            <td style="white-space:nowrap"><button class="btn sm" data-open="${x.id}">فتح</button> <button class="btn ghost sm" data-del="${x.id}">حذف</button></td></tr>`).join('')
        : '<tr><td colspan="6" class="empty">لسه مفيش بريفات محفوظة.</td></tr>');
      $$('[data-open]', el).forEach((x) => x.addEventListener('click', () => { b = { ...blank(), ...lib.find((y) => y.id === x.dataset.open) }; fill(); update(); window.scrollTo({ top: 0, behavior: 'smooth' }); }));
      $$('[data-del]', el).forEach((x) => x.addEventListener('click', async () => { if (confirm('تحذف البريف ده؟')) { lib = lib.filter((y) => y.id !== x.dataset.del); await Store.set('briefs', lib); drawLib(); } }));
    }
    const status = (m) => { $('#b-status', el).textContent = m; setTimeout(() => { if ($('#b-status', el)) $('#b-status', el).textContent = ''; }, 3000); };

    $$('[data-k]', el).forEach((i) => i.addEventListener(i.tagName === 'SELECT' ? 'change' : 'input', () => { b[i.dataset.k] = i.value; update(); }));
    $$('[data-multi]', el).forEach((i) => i.addEventListener('change', () => { const k = i.dataset.multi; b[k] = $$(`[data-multi="${k}"]`, el).filter((x) => x.checked).map((x) => x.value); update(); }));
    $$('[data-s]', el).forEach((i) => i.addEventListener('input', () => { s[i.dataset.s] = i.value; Store.set('briefSettings', s); update(); }));
    $$('[data-meta]', el).forEach((x) => x.addEventListener('click', () => { b.metaphor = x.dataset.meta; $('[data-k="metaphor"]', el).value = b.metaphor; update(); }));
    $('#b-skel', el).addEventListener('click', () => {
      if (b.caption.trim() && !confirm('هيتحط القالب تحت الكابشن الحالي. أكمل؟')) return;
      const sk = `${b.hook || '[Hook أو موقف]'}\n\n[إعادة تعريف المشكلة]\n\n[المنطق الاستراتيجي]\n\n[الخطوات / الـ Framework / مثال]\n\n[خلاصة تتفتكر]\n\n${b.cta || '[CTA مهني]'}`;
      b.caption = (b.caption.trim() ? b.caption.trim() + '\n\n' : '') + sk;
      $('[data-k="caption"]', el).value = b.caption; update();
    });
    $('#b-settings', actions).addEventListener('click', () => { $('#b-set', el).hidden = !$('#b-set', el).hidden; });
    $('#b-new', actions).addEventListener('click', () => { if (b.idea && !confirm('تبدأ بريف جديد؟ (البريف الحالي محفوظ في المسودة بس، احفظه في المكتبة الأول لو عايزه)')) return; b = blank(); fill(); update(); });
    $('#b-cp', el).addEventListener('click', () => copyText(briefPrompt(b, s), 'البرومت اتنسخ ✔'));
    $('#b-copy', el).addEventListener('click', () => copyText(briefMarkdown(b, s), 'البريف اتنسخ ✔'));
    $('#b-md', el).addEventListener('click', () => download(new Blob([briefMarkdown(b, s)], { type: 'text/markdown;charset=utf-8' }), `brief-${b.date || today()}-${(b.idea || 'post').slice(0, 30).replace(/[^\w؀-ۿ]+/g, '-')}.md`));
    $('#b-save', el).addEventListener('click', async () => {
      lib = [{ ...b }, ...lib.filter((x) => x.id !== b.id)];
      await Store.set('briefs', lib); drawLib(); status('اتحفظ في المكتبة ✔');
    });
    const nb = $('#b-notion', el);
    if (nb) nb.addEventListener('click', async () => {
      nb.disabled = true; status('جاري الحفظ على Notion...');
      const blocks = [
        ['الأساسيات', `التاريخ: ${b.date} · النوع: ${b.type} · المنصة: ${b.platforms.join('، ')} · الحالة: ${b.status}`],
        ['الاستراتيجية', `الفكرة: ${b.idea}\nالمحور: ${b.axis}\nالجمهور: ${b.audience}\nالمستوى: ${b.level} · TOV: ${b.tov.join('، ')} · الهدف: ${b.goal}`],
        ['الرسالة', `Hook: ${b.hook}\nنص التصميم: ${b.designText}\nCTA: ${b.cta}`],
        ['بريف التصميم', `الاستعارة: ${b.metaphor}\nالمشهد والـ Twist: ${b.scene}\nالأسلوب: ${b.style}`],
        ['برومت التنفيذ', briefPrompt(b, s), 'code'],
        ['الكابشن', b.caption],
      ];
      const r = await chrome.runtime.sendMessage({ type: 'notion-save', item: { title: b.idea.split('\n')[0].slice(0, 120) || b.hook || 'بريف محتوى', url: '', blocks } });
      nb.disabled = false;
      status(r && r.ok ? 'اتحفظ على Notion ✔' : 'مقدرتش أحفظ: ' + ((r && r.error) || ''));
    });
    $('#b-exp', el).addEventListener('click', () => exportXlsx('Briefs', ['التاريخ', 'نوع البوست', 'الفكرة', 'المحور', 'الجمهور', 'المستوى', 'TOV', 'الهدف', 'Hook', 'نص التصميم', 'بريف التصميم', 'البرومت', 'الكابشن', 'CTA', 'المنصة', 'الحالة'],
      lib.map((x) => [x.date, x.type, x.idea, x.axis, x.audience, x.level, (x.tov || []).join('، '), x.goal, x.hook, x.designText, `${x.metaphor} · ${x.scene} · ${x.style}`, briefPrompt(x, s), x.caption, x.cta, (x.platforms || []).join('، '), x.status]),
      [12, 12, 40, 22, 20, 10, 20, 14, 30, 26, 40, 60, 60, 24, 18, 12]));
    fill(); update(); drawLib();
  },
};

// GrowthScore — تقييم تسويق الشركة على المراحل التمانية للـ Market-to-Measurement Framework
const AUDIT = {
  business: {
    q: ['عندكم هدف تسويقي مكتوب ومربوط برقم إيراد؟', 'الميزانية التسويقية محسوبة كنسبة من الإيراد أو من الهدف؟', 'الإدارة والتسويق متفقين على أولويات السنة؟'],
    rec: 'ابدأ من رقم: الإيراد المطلوب، ومنه احسب كام عميل و Lead محتاجين، وبعدها الميزانية. كده التسويق يبقى مربوط بالبيزنس.',
    tools: ['calc'],
  },
  intel: {
    q: ['عارفين أكبر 3 منافسين، وعروضهم، وبيعلنوا إزاي؟', 'بتسمعوا للعملاء بانتظام (ريفيوهات، مكالمات، استبيانات)؟', 'عندكم داتا عن مين بيشتري، ومنين بيجي؟'],
    rec: 'اعمل أرشيف للمنافسين: إعلاناتهم، وعروضهم، وأدوات التتبع اللي عندهم. واجمع داتا عملائك في مكان واحد قبل أي قرار.',
    tools: ['ads', 'inspect', 'contactharvest'],
  },
  diagnosis: {
    q: ['عارفين ليه العملاء بيختاروكم، وليه بيمشوا؟', 'عملتوا مراجعة شاملة للتسويق (Audit أو SWOT) آخر سنة؟', 'عارفين أنهي قناة بتجيب أفضل عملاء، مش أكتر عملاء؟'],
    rec: 'قبل ما تزوّد الميزانية، اعرف إيه اللي شغال فعلًا. قارن القنوات بجودة العميل اللي بتجيبه، مش بعدد الـ Leads بس.',
    tools: ['utm'],
  },
  choice: {
    q: ['عندكم شريحة أساسية واضحة، مش "الكل"؟', 'فيه ICP أو Persona مكتوبة والفريق كله عارفها؟', 'بتقولوا "لأ" لعملاء مش مناسبين ليكم؟'],
    rec: 'اختار شريحة واحدة تكسبها الأول. اكتب مين هو العميل المثالي، وإيه مشكلته، وبيقرر إزاي، وخلّي كل الرسايل موجهة ليه.',
    tools: [],
  },
  value: {
    q: ['عرضكم مختلف بوضوح عن المنافسين، والعميل يقدر يقول الفرق في جملة؟', 'التسعير مبني على قيمة وهامش محسوب، مش على المنافس بس؟', 'بتحسبوا أثر الخصم على الربح قبل ما تعملوه؟'],
    rec: 'حدد القيمة اللي بتقدمها بجملة واحدة، واحسب هامشك قبل أي خصم. خصم من غير حساب ممكن يخلّيك تبيع أكتر وتكسب أقل.',
    tools: ['discount'],
  },
  plan: {
    q: ['عندكم خطة تسويق مكتوبة لـ 3 شهور قدام على الأقل؟', 'الميزانية متوزعة على القنوات بناءً على أرقام؟', 'خطة المحتوى مربوطة بأهداف، مش بالمواسم بس؟'],
    rec: 'اكتب خطة 90 يوم: الهدف، والشريحة، والقنوات، والميزانية، ومؤشر نجاح لكل قناة. وخلّي كل محتوى مربوط بهدف.',
    tools: ['calc', 'notion', 'brief'],
  },
  execution: {
    q: ['فيه أدوار ومسؤوليات واضحة للتنفيذ (مين بيعمل إيه وإمتى)؟', 'بتنشروا بانتظام حسب الخطة، مش بالمزاج؟', 'المتابعة مع العملاء المحتملين ليها نظام (CRM، مواعيد، ردود جاهزة)؟'],
    rec: 'حوّل التنفيذ لنظام: بريف ثابت لكل بوست، ومراجعة قبل النشر، ومتابعة كل عميل محتمل لحد ما ياخد قرار.',
    tools: ['brief', 'crm', 'replies', 'post'],
  },
  measure: {
    q: ['بتقيسوا CPL و CAC و ROAS، مش اللايكات بس؟', 'عندكم تقرير شهري ثابت بنفس المؤشرات؟', 'بتعدّلوا الخطة بناءً على النتايج؟'],
    rec: 'حط UTM على كل لينك، وتقرير شهري بنفس المؤشرات كل مرة، وقرار واحد على الأقل من كل تقرير.',
    tools: ['utm', 'calc'],
  },
};
const AUDIT_TOOL_NAMES = { calc: 'CampaignMath', ads: 'AdVault', inspect: 'PixelScope', contactharvest: 'ContactHarvest', utm: 'UTM Studio', discount: 'DiscountCheck', notion: 'IdeaDrop', brief: 'BriefBuilder', crm: 'ChatCRM', replies: 'ReplyKit', post: 'PostCheck' };
const AUDIT_LEVELS = [
  [80, 'منظومة ناضجة', 'التسويق عندكم منظومة فعلًا. الخطوة الجاية إنكم تحسّنوا أضعف مرحلة، وتختبروا قرارات أجرأ.'],
  [60, 'منظومة شغالة', 'الأساس موجود، بس فيه مراحل بتسرّب مجهود وفلوس. ركّزوا على الأولويات اللي تحت.'],
  [35, 'بداية منظومة', 'فيه شغل كويس، لكنه لسه أنشطة أكتر ما هو منظومة. ابدأوا بأول أولوية، ومتحاولوش تصلحوا كله مرة واحدة.'],
  [0, 'تسويق عشوائي', 'التسويق دلوقتي أنشطة متفرقة من غير اتجاه واضح. الخبر الكويس إن أي خطوة منظمة هتفرق جامد.'],
];
function auditScore(answers) {
  const fw = typeof FRAMEWORK !== 'undefined' ? FRAMEWORK : [];
  const stages = fw.map((st) => {
    const a = (answers[st.id] || []);
    const sum = a.reduce((x, y) => x + (y || 0), 0);
    return { ...st, score: Math.round((sum / 6) * 100), answered: a.filter((x) => x !== undefined && x !== null).length };
  });
  const total = Math.round(stages.reduce((x, s) => x + s.score, 0) / (stages.length || 1));
  const level = AUDIT_LEVELS.find(([min]) => total >= min);
  // الأولويات = أضعف المراحل بس (اللي واخدة 100 مش أولوية)
  const priorities = stages.filter((s) => s.score < 100).sort((a, b) => a.score - b.score || a.n - b.n).slice(0, 3);
  return { stages, total, level, priorities };
}

Tools.audit = {
  title: 'GrowthScore — تقييم التسويق',
  subtitle: '24 سؤال على المراحل التمانية. جاوب بصراحة، والنتيجة بتفضل على جهازك.',
  async render(el) {
    const fw = typeof FRAMEWORK !== 'undefined' ? FRAMEWORK : [];
    let st = await Store.get('audit', { company: '', answers: {}, step: 0 });
    const link = (id) => (location.pathname.includes('/tools/') ? id + '.html' : 'https://tools.mohammedsabry.site/tools/' + id + '.html');
    const done = () => fw.every((s) => (st.answers[s.id] || []).filter((x) => x !== null && x !== undefined).length === 3);
    const save = () => Store.set('audit', st);

    const full = (arr) => (arr || []).filter((x) => x !== null && x !== undefined).length === 3;
    function stepView(scroll) {
      const i = st.step, s = fw[i], d = AUDIT[s.id];
      const a = st.answers[s.id] || [];
      const answered = fw.reduce((n, x) => n + (st.answers[x.id] || []).filter((v) => v !== null && v !== undefined).length, 0);
      el.innerHTML = `
        <div class="card" style="margin-bottom:12px">
          <div class="row" style="justify-content:space-between"><span class="muted">مرحلة ${s.n} من 8 · ${answered} من 24 سؤال</span>
            ${i === 0 ? `<input type="text" id="a-co" placeholder="اسم الشركة (اختياري، للتقرير)" value="${esc(st.company)}" style="max-width:260px">` : ''}</div>
          <div style="height:6px;background:var(--black);border-radius:6px;overflow:hidden;margin-top:10px"><div style="height:100%;width:${(answered / 24) * 100}%;background:var(--brand);transition:width .4s"></div></div>
          <div class="row" style="gap:4px;margin-top:10px">${fw.map((x, k) => `<button class="btn sm ${k === i ? 'primary' : ''}" data-go="${k}" title="${esc(x.en)}" style="min-width:34px">${x.n}</button>`).join('')}</div>
        </div>
        <div class="card">
          <div class="muted mono" style="font-size:12px;letter-spacing:.12em">0${s.n} · ${esc(s.en.toUpperCase())}</div>
          <h2 style="margin:4px 0 2px">${esc(s.ar)}</h2>
          <div class="muted">${esc(s.desc)}</div>
          <div class="grid" style="margin-top:16px;gap:12px">
            ${d.q.map((q, k) => `<div style="border:1px solid var(--line);border-radius:10px;padding:12px 14px">
              <b style="color:var(--white)">${k + 1}. ${esc(q)}</b>
              <div class="row" style="margin-top:10px">${[[2, 'أيوه'], [1, 'جزئيًا'], [0, 'لأ']].map(([v, t]) => `<button class="btn sm ${a[k] === v ? 'primary' : ''}" data-q="${k}" data-v="${v}" style="min-width:80px">${t}</button>`).join('')}</div>
            </div>`).join('')}
          </div>
          <div class="row" style="justify-content:space-between;margin-top:16px">
            <button class="btn ghost" id="a-prev" ${i === 0 ? 'disabled' : ''}>→ اللي فاتت</button>
            ${i < 7 ? `<button class="btn primary" id="a-next">المرحلة الجاية ←</button>` : `<button class="btn primary" id="a-res" ${done() ? '' : 'disabled'}>${done() ? 'شوف النتيجة' : 'جاوب كل الأسئلة الأول'}</button>`}
          </div>
        </div>`;
      const co = $('#a-co', el); if (co) co.addEventListener('input', () => { st.company = co.value; save(); });
      $$('[data-q]', el).forEach((btn) => btn.addEventListener('click', () => {
        const before = full(st.answers[s.id]);
        const arr = (st.answers[s.id] || [null, null, null]).slice();
        arr[+btn.dataset.q] = +btn.dataset.v;
        st.answers[s.id] = arr; save();
        stepView();
        // أول ما أسئلة المرحلة تكمل، روح للمرحلة اللي بعدها لوحدك
        if (!before && full(arr) && i < 7) setTimeout(() => { st.step = i + 1; save(); stepView(true); }, 350);
      }));
      $$('[data-go]', el).forEach((b) => b.addEventListener('click', () => { st.step = +b.dataset.go; save(); stepView(true); }));
      $('#a-prev', el).addEventListener('click', () => { st.step = Math.max(0, i - 1); save(); stepView(true); });
      const nx = $('#a-next', el); if (nx) nx.addEventListener('click', () => { st.step = i + 1; save(); stepView(true); });
      const rs = $('#a-res', el); if (rs) rs.addEventListener('click', () => { st.step = 8; save(); resultView(); el.scrollIntoView({ block: 'start', behavior: 'smooth' }); });
      if (scroll) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }

    function gauge(v) {
      const r = 80, c = Math.PI * r;
      return `<svg viewBox="0 0 200 116" width="240" height="140" aria-label="${v} من 100"><path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="#2A2A2A" stroke-width="16" stroke-linecap="round"/>
        <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="#C7161D" stroke-width="16" stroke-linecap="round" stroke-dasharray="${(c * v) / 100} ${c}"/>
        <text x="100" y="92" text-anchor="middle" font-family="Inter" font-weight="800" font-size="40" fill="#fff">${v}</text><text x="100" y="112" text-anchor="middle" font-family="Cairo" font-size="11" fill="#9A9A9A">من 100</text></svg>`;
    }
    function resultView() {
      const r = auditScore(st.answers);
      const [, lvl, lvlText] = r.level;
      el.innerHTML = `
        <div id="audit-report">
          <div class="card" style="text-align:center;padding:24px">
            <div class="muted">${st.company ? esc(st.company) + ' · ' : ''}GrowthScore · ${today()}</div>
            ${gauge(r.total)}
            <h2 style="margin:4px 0">${esc(lvl)}</h2>
            <p class="muted" style="max-width:560px;margin:6px auto 0">${esc(lvlText)}</p>
          </div>
          <div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr);margin-top:14px;align-items:start">
            <div class="card"><h3>المراحل التمانية</h3>
              ${r.stages.map((s) => `<div style="padding:6px 0"><div class="row" style="justify-content:space-between;flex-wrap:nowrap"><span><b class="mono" style="color:var(--muted)">0${s.n}</b> <b style="color:var(--white)">${esc(s.ar)}</b> <span class="muted" style="font-size:11px">${esc(s.en)}</span></span><b style="font-family:Inter;color:${s.score < 50 ? 'var(--bad)' : 'var(--white)'}">${s.score}</b></div>
                <div style="height:8px;background:var(--black);border-radius:8px;overflow:hidden;margin-top:4px"><div style="height:100%;width:${s.score}%;background:${s.score < 50 ? 'var(--bad)' : 'var(--brand)'}"></div></div></div>`).join('')}
            </div>
            <div class="card"><h3>${r.priorities.length === 1 ? 'الأولوية' : r.priorities.length === 2 ? 'أهم أولويتين' : 'أهم 3 أولويات'}</h3>
              ${r.priorities.length ? '' : '<p>كل المراحل واخدة 100. الخطوة الجاية إنكم تختبروا قرارات أجرأ، وتعيدوا التقييم كل 3 شهور.</p>'}
              ${r.priorities.map((s, k) => `<div style="border-top:${k ? '1px solid var(--line)' : '0'};padding:10px 0">
                <div class="row" style="gap:8px"><span class="pill red">${k + 1}</span><b style="color:var(--white)">${esc(s.ar)}</b><span class="muted" style="font-size:12px">${s.score}/100</span></div>
                <p style="margin:6px 0">${esc(AUDIT[s.id].rec)}</p>
                ${AUDIT[s.id].tools.length ? `<div class="row" style="gap:6px">${AUDIT[s.id].tools.map((t) => `<a class="btn sm" href="${link(t)}" target="_blank">${AUDIT_TOOL_NAMES[t]}</a>`).join('')}</div>` : ''}
              </div>`).join('')}
            </div>
          </div>
          <div class="card" style="margin-top:14px;border-color:var(--brand);text-align:center;padding:22px">
            <h3 style="font-size:18px">عايز خطة تحوّل النتيجة دي لمنظومة؟</h3>
            <p class="muted" style="margin:0 0 12px">التقييم ده مبني على الـ Market-to-Measurement Framework بتاع محمد صبري.</p>
            <div class="row" style="justify-content:center">${contactButtons(`أهلًا يا محمد، عملت تقييم GrowthScore${st.company ? ' لـ ' + st.company : ''} وخدت ${r.total}/100 (${lvl}).${r.priorities[0] ? ' أضعف مرحلة عندنا: ' + r.priorities[0].ar + '.' : ''} حابب نتكلم عن خطة.`)}</div>
          </div>
        </div>
        <div class="row" style="margin-top:14px;justify-content:center;gap:6px"><span class="muted">شارك التقييم:</span>${shareButtons(`خدت ${r.total}/100 في GrowthScore. قيّم تسويق شركتك على 8 مراحل في 5 دقايق:`, TOOLS_SITE + '/tools/audit.html')}</div>
        <div class="row" style="margin-top:10px;justify-content:center">
          <button class="btn primary" id="a-print">حفظ PDF / طباعة</button>
          <button class="btn" id="a-copy">نسخ النتيجة</button>
          <button class="btn" id="a-edit">راجع إجاباتي</button>
          <button class="btn ghost" id="a-reset">تقييم جديد</button>
        </div>`;
      $('#a-print', el).addEventListener('click', () => {
        // نسخة من التقرير في حاوية لوحدها جوه body، والطباعة بتخفي أي حاجة تانية
        document.querySelectorAll('#mt-print-root, #mt-print-style').forEach((x) => x.remove());
        const root = document.createElement('div');
        root.id = 'mt-print-root';
        root.className = 'demo';
        root.appendChild($('#audit-report', el).cloneNode(true));
        const style = document.createElement('style');
        style.id = 'mt-print-style';
        style.textContent = '@media screen{#mt-print-root{display:none}}'
          + '@media print{@page{margin:10mm}html,body{background:#111!important}body>*:not(#mt-print-root){display:none!important}'
          + '#mt-print-root{display:block!important;margin:0!important;padding:0!important;border-radius:0!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}'
          + '#mt-print-root .card{break-inside:avoid}#mt-print-root a{text-decoration:none}}';
        document.body.append(style, root);
        const cleanup = () => { root.remove(); style.remove(); window.removeEventListener('afterprint', cleanup); };
        window.addEventListener('afterprint', cleanup);
        window.print();
      });
      $('#a-copy', el).addEventListener('click', () => copyText([
        `GrowthScore${st.company ? ' — ' + st.company : ''}: ${r.total}/100 (${lvl})`, '',
        ...r.stages.map((s) => `${s.n}. ${s.ar}: ${s.score}/100`), '',
        'أهم الأولويات:', ...r.priorities.map((s, k) => `${k + 1}) ${s.ar}: ${AUDIT[s.id].rec}`), '',
        'قيّم شركتك: https://tools.mohammedsabry.site/tools/audit.html',
      ].join('\n'), 'النتيجة اتنسخت ✔'));
      $('#a-edit', el).addEventListener('click', () => { st.step = 0; save(); stepView(true); });
      $('#a-reset', el).addEventListener('click', () => { if (confirm('تمسح الإجابات وتبدأ من الأول؟')) { st = { company: '', answers: {}, step: 0 }; save(); stepView(); } });
    }
    if (st.step >= 8 && done()) resultView(); else { st.step = Math.min(st.step, 7); stepView(); }
  },
};

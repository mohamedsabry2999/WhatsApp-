const UTM_SOURCES = ['facebook', 'instagram', 'google', 'tiktok', 'linkedin', 'snapchat', 'x', 'youtube', 'whatsapp', 'newsletter', 'email', 'sms'];
const UTM_MEDIUMS = ['paid_social', 'social', 'cpc', 'display', 'video', 'email', 'sms', 'referral', 'influencer', 'qr', 'offline'];
const UTM_FIELDS = [
  ['source', 'المصدر (utm_source)', 'facebook'],
  ['medium', 'الوسيلة (utm_medium)', 'paid_social'],
  ['campaign', 'الحملة (utm_campaign)', 'ramadan-2026'],
  ['content', 'المحتوى / الإعلان (utm_content)', 'video-1'],
  ['term', 'الكلمة / الجمهور (utm_term)', 'lookalike-1'],
];

Tools.utm = {
  title: 'UTM Builder',
  subtitle: 'كل اللينكات بنفس نظام التسمية: حروف صغيرة، ومن غير مسافات، وكل الحملات محفوظة في مكتبة واحدة.',
  async render(el, { params, actions }) {
    let lib = await Store.get('utmLinks', []);
    actions.innerHTML = '<button class="btn" id="exp">تصدير Excel</button>';
    el.innerHTML = `
      <div class="grid" style="grid-template-columns: minmax(0,1fr) 280px; align-items:start">
        <div class="card">
          <label class="f">لينك الصفحة<input type="url" id="url" dir="ltr" placeholder="https://example.com/landing"></label>
          <div class="grid g2" style="margin-top:10px">
            ${UTM_FIELDS.map(([k, label, ph]) => `<label class="f">${label}<input type="text" id="u-${k}" dir="ltr" placeholder="${ph}" list="${k === 'source' ? 'srcs' : k === 'medium' ? 'meds' : ''}"></label>`).join('')}
          </div>
          <datalist id="srcs">${UTM_SOURCES.map((s) => `<option value="${s}">`).join('')}</datalist>
          <datalist id="meds">${UTM_MEDIUMS.map((s) => `<option value="${s}">`).join('')}</datalist>
          <div class="row" style="margin-top:10px">
            <button class="btn sm" id="meta">قالب Meta Ads (ديناميك)</button>
            <button class="btn sm" id="tiktok">قالب TikTok Ads (ديناميك)</button>
            <button class="btn ghost sm" id="reset">مسح</button>
          </div>
          <div id="warn" style="margin-top:8px"></div>
          <div class="card mono" id="out" style="margin-top:12px;background:var(--black);color:var(--white)"></div>
          <div class="row" style="margin-top:10px">
            <button class="btn primary" id="copy">نسخ اللينك</button>
            <button class="btn" id="save">حفظ في المكتبة</button>
            <button class="btn" id="qrdl">تحميل QR</button>
          </div>
        </div>
        <div class="card" style="text-align:center"><div id="qr" style="background:#fff;border-radius:10px;padding:8px;display:inline-block"></div>
          <div class="muted" style="font-size:12px;margin-top:8px">QR للينك المتتبَّع، مناسب للمطبوعات (medium = qr)</div></div>
      </div>
      <h3 style="margin-top:22px">مكتبة الحملات</h3>
      <div class="row" style="margin-bottom:8px"><input type="search" id="q" placeholder="دوّر..." style="max-width:300px"></div>
      <div class="card" style="padding:0;overflow:auto"><table class="t" id="lib"></table></div>`;

    if (params.get('url')) $('#url', el).value = params.get('url');
    const isDynamic = (v) => /\{\{.+\}\}|__[A-Z_]+__/.test(v);
    const norm = (v) => isDynamic(v) ? v.trim() : v.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\p{L}\p{N}\-_.]/gu, '').replace(/-{2,}/g, '-');
    const vals = () => Object.fromEntries(UTM_FIELDS.map(([k]) => [k, norm($('#u-' + k, el).value)]));
    function build() {
      const raw = $('#url', el).value.trim();
      if (!raw) return '';
      let u;
      try { u = new URL(/^https?:\/\//.test(raw) ? raw : 'https://' + raw); } catch (e) { return ''; }
      const v = vals();
      UTM_FIELDS.forEach(([k]) => u.searchParams.delete('utm_' + k));
      let s = u.origin + u.pathname;
      const q = [];
      u.searchParams.forEach((val, key) => q.push(encodeURIComponent(key) + '=' + encodeURIComponent(val)));
      UTM_FIELDS.forEach(([k]) => { if (v[k]) q.push('utm_' + k + '=' + (isDynamic(v[k]) ? v[k] : encodeURIComponent(v[k]))); });
      return s + (q.length ? '?' + q.join('&') : '') + u.hash;
    }
    function update() {
      const link = build(), v = vals(), w = [];
      if (!$('#url', el).value.trim()) w.push(['warn', 'حط لينك الصفحة']);
      else if (!link) w.push(['bad', 'اللينك مش مظبوط']);
      ['source', 'medium', 'campaign'].forEach((k) => { if (!v[k]) w.push(['warn', `utm_${k} مطلوب`]); });
      if (Object.values(v).some((x) => /[؀-ۿ]/.test(x))) w.push(['warn', 'فيه عربي في الـ UTM، الأفضل إنجليزي عشان التقارير تبقى نضيفة']);
      $('#warn', el).innerHTML = w.map(([l, m]) => `<div class="check ${l}"><span class="i">${l === 'bad' ? '✖' : '!'}</span>${m}</div>`).join('');
      $('#out', el).textContent = link || '—';
      $('#qr', el).innerHTML = link ? makeQrSvg(link, { size: 220 }) : '<div style="width:220px;height:220px"></div>';
      $$('#copy,#save,#qrdl', el).forEach((b) => (b.disabled = !link));
    }
    const setVals = (o) => { Object.entries(o).forEach(([k, v]) => { $('#u-' + k, el).value = v; }); update(); };
    $('#meta', el).addEventListener('click', () => setVals({ source: '{{site_source_name}}', medium: 'paid_social', campaign: '{{campaign.name}}', content: '{{ad.name}}', term: '{{adset.name}}' }));
    $('#tiktok', el).addEventListener('click', () => setVals({ source: 'tiktok', medium: 'paid_social', campaign: '__CAMPAIGN_NAME__', content: '__CID_NAME__', term: '__AID_NAME__' }));
    $('#reset', el).addEventListener('click', () => setVals({ source: '', medium: '', campaign: '', content: '', term: '' }));
    $$('input', el).forEach((i) => i.addEventListener('input', update));
    $$('[id^="u-"]', el).forEach((i) => i.addEventListener('blur', () => { i.value = norm(i.value); update(); }));
    $('#copy', el).addEventListener('click', () => copyText(build()));
    $('#qrdl', el).addEventListener('click', async () => download(await svgToPngBlob(makeQrSvg(build(), { size: 1024 })), 'QR-' + (vals().campaign || 'utm') + '.png'));
    $('#save', el).addEventListener('click', async () => {
      lib.unshift({ id: Store.uid(), url: $('#url', el).value.trim(), ...vals(), link: build(), at: Date.now() });
      await Store.set('utmLinks', lib); drawLib(); toast('اتحفظ ✔');
    });

    let q = '';
    function drawLib() {
      const rows = lib.filter((x) => !q || JSON.stringify(x).toLowerCase().includes(q));
      $('#lib', el).innerHTML = '<tr><th>الحملة</th><th>source / medium</th><th>content</th><th>اللينك</th><th>التاريخ</th><th></th></tr>' + (rows.length
        ? rows.map((x) => `<tr><td><b style="color:var(--white)" class="mono">${esc(x.campaign)}</b></td><td class="mono">${esc(x.source)} / ${esc(x.medium)}</td><td class="mono">${esc(x.content || '—')}</td>
            <td class="mono" style="max-width:340px;font-size:12px">${esc(x.link)}</td><td class="muted">${fmtDateTime(x.at)}</td>
            <td style="white-space:nowrap"><button class="btn sm" data-c="${x.id}">نسخ</button> <button class="btn sm" data-e="${x.id}">استخدم</button> <button class="btn ghost sm" data-d="${x.id}">حذف</button></td></tr>`).join('')
        : '<tr><td colspan="6" class="empty">لسه مفيش حملات محفوظة.</td></tr>');
      const find = (id) => lib.find((x) => x.id === id);
      $$('[data-c]', el).forEach((b) => b.addEventListener('click', () => copyText(find(b.dataset.c).link)));
      $$('[data-e]', el).forEach((b) => b.addEventListener('click', () => { const x = find(b.dataset.e); $('#url', el).value = x.url; setVals({ source: x.source, medium: x.medium, campaign: x.campaign, content: x.content, term: x.term }); window.scrollTo(0, 0); }));
      $$('[data-d]', el).forEach((b) => b.addEventListener('click', async () => { lib = lib.filter((x) => x.id !== b.dataset.d); await Store.set('utmLinks', lib); drawLib(); }));
    }
    $('#q', el).addEventListener('input', (e) => { q = e.target.value.trim().toLowerCase(); drawLib(); });
    $('#exp', actions).addEventListener('click', () => exportXlsx('UTM-Links', ['الحملة', 'source', 'medium', 'content', 'term', 'لينك الصفحة', 'اللينك الكامل', 'التاريخ'],
      lib.map((x) => [x.campaign, x.source, x.medium, x.content, x.term, x.url, x.link, fmtDateTime(x.at)]), [22, 14, 14, 18, 18, 40, 70, 18]));
    update(); drawLib();
  },
};

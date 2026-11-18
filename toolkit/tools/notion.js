Tools.notion = {
  title: 'Notion',
  subtitle: 'اربط قاعدة بيانات المحتوى بتاعتك، وبعدها أي صفحة أو نص أو صورة تحفظها بضغطة: من الزرار في الإضافة، أو كليك يمين ← "احفظ على Notion".',
  async render(el) {
    const s = await Store.get('notion', {});
    el.innerHTML = `
      <div class="grid" style="grid-template-columns: minmax(0,1fr) 340px; align-items:start">
        <div class="grid">
          <div class="card">
            <h3>1) اعمل مفتاح مجاني (مرة واحدة)</h3>
            <ol style="margin:0;padding-inline-start:18px;line-height:2">
              <li>افتح <a href="https://www.notion.so/profile/integrations" target="_blank">notion.so/profile/integrations</a> ودوس <b>New integration</b>.</li>
              <li>سمّيه مثلًا "Marketer's Toolkit"، واختار الـ Workspace، ونوعه <b>Internal</b>.</li>
              <li>انسخ الـ <b>Internal Integration Secret</b> وحطه تحت.</li>
              <li>افتح قاعدة البيانات اللي هتحفظ فيها (مثلًا <b>Personal Brand Content System</b>) ← <b>⋯</b> ← <b>Connections</b> ← اختار الـ integration.</li>
            </ol>
          </div>
          <div class="card">
            <h3>2) الربط</h3>
            <label class="f">المفتاح (Integration Secret)<input type="password" id="token" dir="ltr" value="${esc(s.token || '')}" placeholder="ntn_..."></label>
            <label class="f" style="margin-top:8px">رابط قاعدة البيانات<input type="text" id="db" dir="ltr" value="${esc(s.dbId || '')}" placeholder="https://www.notion.so/...?v=..."></label>
            <button class="btn primary" id="test" style="margin-top:10px">اختبار الاتصال</button>
            <div id="tstatus" style="margin-top:8px"></div>
          </div>
          <div class="card" id="map" ${s.titleProp ? '' : 'hidden'}>
            <h3>3) الحقول</h3>
            <div class="grid g2">
              <label class="f">عمود العنوان<select id="titleProp"></select></label>
              <label class="f">عمود اللينك (URL)<select id="urlProp"></select></label>
              <label class="f">عمود تاريخ الحفظ<select id="dateProp"></select></label>
              <label class="f">عمود إضافي (مثلًا الحالة)<select id="extraProp"></select></label>
              <label class="f">القيمة اللي تتحط فيه<input type="text" id="extraValue" list="extraOpts" placeholder="Idea"><datalist id="extraOpts"></datalist></label>
            </div>
            <div class="row" style="margin-top:10px"><button class="btn primary" id="save">حفظ الإعدادات</button><button class="btn" id="trial">احفظ صفحة تجربة</button></div>
            <div id="mstatus" style="margin-top:8px"></div>
          </div>
        </div>
        <div class="card"><h3>آخر حاجات اتحفظت</h3><div id="hist"></div></div>
      </div>`;

    let schema = s.schema || null;
    const st = (id, lvl, msg) => { $(id, el).innerHTML = `<div class="check ${lvl}"><span class="i">${lvl === 'ok' ? '✔' : '✖'}</span>${esc(msg)}</div>`; };
    function fillMap() {
      if (!schema) return;
      const opt = (types, sel, none = true) => (none ? '<option value="">— بدون —</option>' : '') + schema.props.filter((p) => types.includes(p.type)).map((p) => `<option ${p.name === sel ? 'selected' : ''} data-type="${p.type}">${esc(p.name)}</option>`).join('');
      const title = schema.props.find((p) => p.type === 'title');
      $('#titleProp', el).innerHTML = opt(['title'], s.titleProp || (title && title.name), false);
      $('#urlProp', el).innerHTML = opt(['url'], s.urlProp ?? (schema.props.find((p) => p.type === 'url') || {}).name);
      $('#dateProp', el).innerHTML = opt(['date'], s.dateProp);
      $('#extraProp', el).innerHTML = opt(['select', 'multi_select', 'status', 'rich_text', 'checkbox'], s.extraProp);
      $('#extraValue', el).value = s.extraValue || '';
      const updOpts = () => {
        const p = schema.props.find((x) => x.name === $('#extraProp', el).value);
        $('#extraOpts', el).innerHTML = p ? p.options.map((o) => `<option value="${esc(o)}">`).join('') : '';
      };
      $('#extraProp', el).onchange = updOpts; updOpts();
      $('#map', el).hidden = false;
    }
    $('#test', el).addEventListener('click', async () => {
      const token = $('#token', el).value.trim(), dbId = $('#db', el).value.trim();
      if (!token || !dbId) return st('#tstatus', 'bad', 'حط المفتاح ورابط قاعدة البيانات.');
      $('#tstatus', el).innerHTML = '<span class="muted">جاري الاتصال...</span>';
      const r = await chrome.runtime.sendMessage({ type: 'notion-schema', token, dbId });
      if (!r.ok) return st('#tstatus', 'bad', r.error);
      schema = r.schema;
      Object.assign(s, { token, dbId, schema, titleProp: s.titleProp || (schema.props.find((p) => p.type === 'title') || {}).name });
      await Store.set('notion', s);
      st('#tstatus', 'ok', `متصل بـ "${schema.title}" (${schema.props.length} عمود)`);
      fillMap();
    });
    async function saveSettings() {
      const ex = $('#extraProp', el).selectedOptions[0];
      Object.assign(s, {
        token: $('#token', el).value.trim(), dbId: $('#db', el).value.trim(),
        titleProp: $('#titleProp', el).value, urlProp: $('#urlProp', el).value, dateProp: $('#dateProp', el).value,
        extraProp: $('#extraProp', el).value, extraType: ex ? ex.dataset.type : '', extraValue: $('#extraValue', el).value.trim(),
      });
      await Store.set('notion', s);
    }
    $('#save', el).addEventListener('click', async () => {
      await saveSettings();
      st('#mstatus', 'ok', 'اتحفظت ✔ جرّب كليك يمين على أي صفحة ← "احفظ على Notion".');
    });
    $('#trial', el).addEventListener('click', async () => {
      await saveSettings();
      $('#mstatus', el).innerHTML = '<span class="muted">جاري الحفظ...</span>';
      const r = await chrome.runtime.sendMessage({ type: 'notion-save', item: { title: 'تجربة من Marketer\'s Toolkit', url: 'https://www.notion.so', note: 'لو شايف الصفحة دي يبقى الربط شغال ✔ تقدر تمسحها.' } });
      r.ok ? st('#mstatus', 'ok', 'صفحة التجربة اتعملت على Notion ✔') : st('#mstatus', 'bad', r.error);
      drawHist();
    });
    async function drawHist() {
      const h = await Store.get('notionHistory', []);
      $('#hist', el).innerHTML = h.length ? h.map((x) => `<div style="padding:6px 0;border-bottom:1px solid var(--line)"><a href="${esc(x.page)}" target="_blank" style="color:var(--white)">${esc(x.title || x.url)}</a><div class="muted" style="font-size:11px">${fmtDateTime(x.at)}</div></div>`).join('') : '<div class="muted">لسه مفيش.</div>';
    }
    Store.onChange('notionHistory', () => { if (el.isConnected) drawHist(); });
    fillMap(); drawHist();
  },
};

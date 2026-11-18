Tools.replies = {
  title: 'الردود الجاهزة',
  subtitle: 'في واتساب ويب اكتب / وبعدها الاختصار (مثلًا /سعر)، والرد هيتكتب لوحده باسم العميل. إنت اللي بتدوس إرسال.',
  async render(el, { actions }) {
    let replies = await Store.get('replies', null);
    if (!replies) replies = await Store.set('replies', DEFAULT_REPLIES);
    let timer;
    const save = () => { clearTimeout(timer); timer = setTimeout(() => Store.set('replies', replies), 300); };

    actions.innerHTML = '<button class="btn primary" id="add">+ رد جديد</button>';
    el.innerHTML = `
      <div class="card" style="margin-bottom:14px">
        <b style="color:var(--white)">المتغيرات اللي تقدر تستخدمها:</b>
        <span class="pill">{الاسم}</span> <span class="pill">{الاسم_الأول}</span> <span class="pill">{اليوم}</span> <span class="pill">{التاريخ}</span>
        <div class="muted" style="margin-top:6px">بتتملي من اسم الشات المفتوح. لو الشات رقم من غير اسم، الاسم بيتشال من الجملة تلقائيًا.</div>
      </div>
      <div class="grid" id="list"></div>`;

    const list = $('#list', el);
    function draw() {
      list.innerHTML = replies.length ? '' : '<div class="empty">مفيش ردود. دوس "+ رد جديد".</div>';
      replies.forEach((r, i) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
          <div class="grid g2" style="grid-template-columns: 160px 1fr auto; align-items:end">
            <label class="f">الاختصار<input type="text" class="sc" value="${esc(r.shortcut)}" placeholder="سعر"></label>
            <label class="f">العنوان<input type="text" class="ti" value="${esc(r.title || '')}" placeholder="الأسعار"></label>
            <button class="btn ghost sm del" title="حذف">حذف</button>
          </div>
          <label class="f" style="margin-top:8px">الرد<textarea class="tx" rows="3">${esc(r.text)}</textarea></label>
          <div class="muted" style="margin-top:6px;font-size:12px">معاينة (لعميل اسمه "أحمد محمد"): <span class="pv" style="color:var(--text);white-space:pre-line"></span></div>`;
        const pv = () => { $('.pv', card).textContent = fillTemplate(r.text, 'أحمد محمد'); };
        pv();
        $('.sc', card).addEventListener('input', (e) => { r.shortcut = e.target.value.replace(/^\/+/, '').replace(/\s+/g, '_'); save(); });
        $('.ti', card).addEventListener('input', (e) => { r.title = e.target.value; save(); });
        $('.tx', card).addEventListener('input', (e) => { r.text = e.target.value; pv(); save(); });
        $('.del', card).addEventListener('click', () => { if (confirm('تحذف الرد ده؟')) { replies.splice(i, 1); Store.set('replies', replies); draw(); } });
        list.appendChild(card);
      });
    }
    $('#add', actions).addEventListener('click', () => {
      replies.unshift({ id: Store.uid(), shortcut: 'جديد' + (replies.length + 1), title: '', text: 'أهلًا {الاسم_الأول}، ' });
      Store.set('replies', replies); draw();
      $('.sc', list).focus();
    });
    draw();
  },
};

// tools.mohammedsabry.site
(function () {
  // ظهور الأقسام مع السكرول
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((el, i) => { el.style.transitionDelay = (el.dataset.delay || 0) + 'ms'; io.observe(el); });

  // منيو الموبايل
  const mb = document.querySelector('.menu-btn'), links = document.querySelector('.nav .links');
  if (mb) mb.addEventListener('click', () => { const o = links.classList.toggle('open'); mb.setAttribute('aria-expanded', o); mb.textContent = o ? '✕' : '☰'; });

  // صور الهيرو المتكدّسة
  const stack = document.querySelector('.stack');
  if (stack) {
    const shots = Array.from(stack.querySelectorAll('.shot'));
    const label = stack.querySelector('.label');
    const bars = Array.from(stack.querySelectorAll('.bars i'));
    let k = 0, timer;
    const show = (n) => {
      k = (n + shots.length) % shots.length;
      // اللي عليه الدور يبقى آخر عنصر (فوق)
      const order = shots.map((_, i) => shots[(k + 1 + i) % shots.length]);
      order.forEach((s) => stack.insertBefore(s, label));
      label.textContent = shots[k].dataset.label;
      bars.forEach((b, i) => b.classList.toggle('on', i === k));
    };
    const auto = () => { clearInterval(timer); timer = setInterval(() => show(k + 1), 4200); };
    stack.querySelector('.next').addEventListener('click', () => { show(k + 1); auto(); });
    stack.querySelector('.prev').addEventListener('click', () => { show(k - 1); auto(); });
    show(0); if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) auto();
  }

  // فلترة الأدوات
  const chips = document.querySelectorAll('.filters .chip');
  chips.forEach((c) => c.addEventListener('click', () => {
    chips.forEach((x) => x.classList.toggle('on', x === c));
    document.querySelectorAll('.tools-grid .tool-card').forEach((card) => {
      const f = c.dataset.f;
      card.hidden = !(f === 'all' || card.dataset.cat === f || (f === 'web' && card.dataset.web === '1'));
    });
  }));

  // الأرقام بتعدّ
  document.querySelectorAll('[data-count]').forEach((el) => {
    const target = +el.dataset.count, suffix = el.dataset.suffix || '';
    const o = new IntersectionObserver((es) => {
      if (!es[0].isIntersecting) return; o.disconnect();
      const t0 = performance.now();
      const step = (t) => { const p = Math.min(1, (t - t0) / 1100); el.firstChild.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix; if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
    o.observe(el);
  });
})();

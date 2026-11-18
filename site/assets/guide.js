// الدليل التفاعلي: نافذة كروم وهمية بتمشي خطوة بخطوة وماوس بيدوس لوحده
(function () {
  const root = document.getElementById('guide');
  if (!root) return;
  const data = JSON.parse(document.getElementById('tools-data').textContent);
  const all = [...data.tools, data.bundle];
  const $ = (s) => root.querySelector(s);
  const $$ = (s) => Array.from(root.querySelectorAll(s));
  const browser = $('.browser');
  const cursor = $('.cursor');
  const steps = $$('.g-step');
  const bar = $('.g-progress i');
  const playBtn = $('[data-act="play"]');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let cur = 0, run = 0, playing = !reduce, tool = null;

  // ===== اختيار الأداة =====
  function setTool(id) {
    tool = all.find((t) => t.id === id) || data.tools[0];
    const folder = tool.download.folder;
    $$('[data-t="name"]').forEach((e) => { e.textContent = tool.name; });
    $$('[data-t="folder"]').forEach((e) => { e.textContent = folder; });
    $$('[data-t="zip"]').forEach((e) => { e.textContent = tool.download.zip.split('/').pop(); });
    $$('[data-t="desc"]').forEach((e) => { e.textContent = tool.tagline; });
    $$('[data-t="ver"]').forEach((e) => { e.textContent = data.version; });
    $$('[data-t="icon"]').forEach((e) => { e.src = 'assets/icons/' + tool.id + '.svg'; });
    $$('[data-t="dl"]').forEach((e) => { e.href = tool.download.zip; });
    document.querySelectorAll('.tool-pick button').forEach((b) => b.classList.toggle('on', b.dataset.id === tool.id));
    try { history.replaceState(null, '', '?tool=' + tool.id + location.hash); } catch (e) {}
  }
  document.querySelectorAll('.tool-pick button').forEach((b) => b.addEventListener('click', () => { setTool(b.dataset.id); go(cur); }));

  // ===== أدوات الحركة =====
  const sleep = (ms, id) => new Promise((res, rej) => setTimeout(() => (id === run ? res() : rej('stop')), reduce ? Math.min(ms, 60) : ms));
  function moveTo(el, id) {
    const b = browser.getBoundingClientRect(), r = el.getBoundingClientRect();
    cursor.style.transform = `translate(${r.left - b.left + Math.min(r.width * 0.55, 60)}px, ${r.top - b.top + r.height * 0.55}px)`;
    return sleep(950, id);
  }
  async function click(id) {
    cursor.classList.remove('click'); void cursor.offsetWidth; cursor.classList.add('click');
    await sleep(350, id);
  }
  async function type(text, id) {
    const out = $('.omni-text');
    out.textContent = '';
    for (const ch of text) { out.textContent += ch; await sleep(55, id); }
  }

  // ===== حالة البداية لكل خطوة =====
  function state(i) {
    $('.s-unzip').classList.toggle('on', i === 0);
    $('.s-unzip').classList.remove('go');
    $('.s-ext').classList.toggle('on', i > 0);
    $('.omni-text').textContent = i > 1 ? 'chrome://extensions' : i === 1 ? '' : 'Downloads';
    $('.tab-title').textContent = i > 1 ? 'Extensions' : i === 1 ? 'New Tab' : 'Downloads';
    $('.toggle').classList.toggle('on', i > 2);
    $('.ext-sub').classList.toggle('on', i > 2);
    $('.ext-card').classList.toggle('on', i > 3);
    $('.ext-empty').hidden = i > 3;
    $('.picker').classList.remove('on', 'peek');
    $('.picker .it.sel-me').classList.remove('sel');
    $('.puzzle-menu').classList.remove('on');
    $('.pin').classList.remove('on');
    browser.classList.remove('pinned');
    $('.load-btn').classList.remove('hl');
  }

  const scenes = [
    async (id) => {
      await moveTo($('.file.zip'), id); await click(id);
      $('.s-unzip').classList.add('go'); await sleep(700, id);
      await moveTo($('.file.folder'), id); await sleep(900, id);
    },
    async (id) => {
      await moveTo($('.b-omni'), id); await click(id);
      await type('chrome://extensions', id); await sleep(300, id);
      $('.tab-title').textContent = 'Extensions'; await sleep(900, id);
    },
    async (id) => {
      await moveTo($('.toggle'), id); await click(id);
      $('.toggle').classList.add('on'); await sleep(400, id);
      $('.ext-sub').classList.add('on'); await sleep(1000, id);
    },
    async (id) => {
      $('.load-btn').classList.add('hl');
      await moveTo($('.load-btn'), id); await click(id);
      $('.picker').classList.add('on'); await sleep(500, id);
      await moveTo($('.picker .sel-me'), id); await click(id);
      $('.picker .sel-me').classList.add('sel'); $('.picker').classList.add('peek'); await sleep(1300, id);
      await moveTo($('.picker .ok'), id); await click(id);
      $('.picker').classList.remove('on'); $('.ext-empty').hidden = true; $('.load-btn').classList.remove('hl');
      await sleep(300, id); $('.ext-card').classList.add('on'); await sleep(1000, id);
    },
    async (id) => {
      await moveTo($('.puzzle'), id); await click(id);
      $('.puzzle-menu').classList.add('on'); await sleep(500, id);
      await moveTo($('.pin'), id); await click(id);
      $('.pin').classList.add('on'); await sleep(500, id);
      $('.puzzle-menu').classList.remove('on'); browser.classList.add('pinned'); await sleep(1600, id);
    },
  ];

  async function go(i) {
    cur = (i + steps.length) % steps.length;
    const id = ++run;
    steps.forEach((s, k) => { s.classList.toggle('on', k === cur); s.classList.toggle('done', k < cur); });
    state(cur);
    bar.style.transition = 'none'; bar.style.width = (cur / steps.length) * 100 + '%';
    try {
      await sleep(250, id);
      bar.style.transition = 'width 4.5s linear'; bar.style.width = ((cur + 1) / steps.length) * 100 + '%';
      await scenes[cur](id);
      bar.style.transition = 'none'; bar.style.width = ((cur + 1) / steps.length) * 100 + '%';
      if (playing) { await sleep(1200, id); if (cur < steps.length - 1) go(cur + 1); else setPlaying(false); }
    } catch (e) { /* اتلغت لأن المستخدم غيّر الخطوة */ }
  }
  function setPlaying(p) { playing = p; playBtn.textContent = p ? '❚❚' : '▶'; playBtn.setAttribute('aria-label', p ? 'إيقاف' : 'تشغيل'); }

  steps.forEach((s, k) => s.addEventListener('click', (e) => { if (e.target.closest('a,button')) return; setPlaying(false); go(k); }));
  $('[data-act="next"]').addEventListener('click', () => { setPlaying(false); go(cur + 1); });
  $('[data-act="prev"]').addEventListener('click', () => { setPlaying(false); go(cur - 1); });
  playBtn.addEventListener('click', () => { const p = !playing; setPlaying(p); if (p) go(cur === steps.length - 1 ? 0 : cur); });
  root.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); } catch (e) {}
    const t = b.textContent; b.textContent = 'اتنسخ ✓'; setTimeout(() => { b.textContent = t; }, 1500);
  }));

  // شغّل لما الدليل يظهر على الشاشة
  setTool(new URLSearchParams(location.search).get('tool') || (root.dataset.tool || 'contactharvest'));
  setPlaying(playing);
  state(0);
  steps[0].classList.add('on');
  let started = false;
  const io = new IntersectionObserver((es) => {
    if (es.some((e) => e.isIntersecting) && !started) { started = true; go(0); }
  }, { threshold: 0.35 });
  io.observe(browser);
})();

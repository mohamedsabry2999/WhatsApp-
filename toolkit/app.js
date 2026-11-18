try { $('#ver').textContent = chrome.runtime.getManifest().version; } catch (e) {}
const params = new URLSearchParams(location.search);
const FEAT = (typeof MT_FEATURES !== 'undefined' && MT_FEATURES) || { tools: Object.keys(Tools), home: 'replies' };
// اخفي الأدوات اللي مش في النسخة دي
$$('#nav a').forEach((a) => { if (!FEAT.tools.includes(a.getAttribute('href').slice(1))) a.hidden = true; });
$$('#nav .grp').forEach((g) => {
  let n = g.nextElementSibling, any = false;
  while (n && !n.classList.contains('grp')) { if (!n.hidden) any = true; n = n.nextElementSibling; }
  g.hidden = !any;
});
if (FEAT.tools.length === 1) {
  document.body.classList.add('single');
  $('#brand').innerHTML = FEAT.nameHtml;
}

function route() {
  let id = (location.hash || '#' + FEAT.home).slice(1);
  if (!FEAT.tools.includes(id)) id = FEAT.home;
  const tool = Tools[id];
  $$('#nav a').forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + id));
  const main = $('#main');
  main.innerHTML = `<div class="page-head"><div><h1>${esc(tool.title)}</h1><p>${esc(tool.subtitle || '')}</p></div><div class="row" id="head-actions"></div></div><div id="tool"></div>`;
  document.title = tool.title + " — Marketer's Toolkit";
  tool.render($('#tool'), { params, actions: $('#head-actions') });
}
window.addEventListener('hashchange', route);
route();

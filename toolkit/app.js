try { $('#ver').textContent = chrome.runtime.getManifest().version; } catch (e) {}
const params = new URLSearchParams(location.search);

function route() {
  const id = (location.hash || '#replies').slice(1);
  const tool = Tools[id] || Tools.replies;
  $$('#nav a').forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + id));
  const main = $('#main');
  main.innerHTML = `<div class="page-head"><div><h1>${esc(tool.title)}</h1><p>${esc(tool.subtitle || '')}</p></div><div class="row" id="head-actions"></div></div><div id="tool"></div>`;
  document.title = tool.title + " — Marketer's Toolkit";
  tool.render($('#tool'), { params, actions: $('#head-actions') });
}
window.addEventListener('hashchange', route);
route();

// Marketer's Toolkit — زرار "احفظ في الأرشيف" على كل إعلان في Meta Ad Library
// بيحفظ الإعلان اللي إنت شايفه بس لما تدوس الزرار، ومش بيسحب أي إعلانات لوحده.
(() => {
  if (window.__mtAds) return;
  window.__mtAds = true;

  const ID_RE = /(?:Library ID|معرّف المكتبة|معرف المكتبة|رقم تعريف المكتبة)\s*[:：]?\s*(\d{6,})/;
  const ID_RE_G = new RegExp(ID_RE.source, 'g');
  let savedIds = new Set();
  Store.get('ads', []).then((a) => { savedIds = new Set(a.map((x) => x.id)); scan(); });
  Store.onChange('ads', (a) => { savedIds = new Set((a || []).map((x) => x.id)); refreshButtons(); });

  const countIds = (el) => ((el.innerText || '').match(ID_RE_G) || []).length;

  function findCards() {
    const cards = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (ID_RE.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP) });
    let node;
    while ((node = walker.nextNode())) {
      const id = node.nodeValue.match(ID_RE)[1];
      let card = node.parentElement;
      for (let d = 0; d < 18 && card.parentElement && card.parentElement !== document.body; d++) {
        if (countIds(card.parentElement) > 1) break;
        card = card.parentElement;
        if (card.getBoundingClientRect().height > 1400) break;
      }
      cards.push({ id, card });
    }
    return cards;
  }

  function extract(card, id) {
    const text = card.innerText || '';
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const started = (text.match(/(?:Started running on|بدأ عرضه في|بدأ العرض في|بدأ تشغيله في)\s*([^\n]+)/) || [])[1] || '';
    const active = /\b(Active)\b|نشط/.test(text) && !/Inactive|غير نشط/.test(text);
    let page = '';
    const links = Array.from(card.querySelectorAll('a[href*="facebook.com/"]')).filter((a) => !/ads\/library|l\.facebook/.test(a.href) && a.innerText.trim());
    if (links[0]) page = links[0].innerText.trim().split('\n')[0];
    const skip = /Library ID|معرّف المكتبة|معرف المكتبة|Started running|بدأ عرضه|Sponsored|مُموَّل|ممول|See ad details|عرض تفاصيل الإعلان|See summary details|Platforms|المنصات|Active|Inactive|نشط|^\d+ ads? use|إعلانات تستخدم|Open Dropdown|احفظ في الأرشيف|جاري الحفظ|محفوظ في الأرشيف/i;
    const body = lines.filter((l) => !skip.test(l) && l !== page && l.length > 2).join('\n').slice(0, 2500);
    if (!page) page = lines.find((l) => !skip.test(l) && l.length < 60) || '';
    let best = null, area = 0;
    card.querySelectorAll('img').forEach((img) => {
      const a = (img.naturalWidth || img.width) * (img.naturalHeight || img.height);
      if (a > area && (img.naturalWidth || img.width) >= 150) { area = a; best = img.currentSrc || img.src; }
    });
    const video = card.querySelector('video');
    if (!best && video && video.poster) best = video.poster;
    return { id, page, text: body, started, active, hasVideo: !!video, imageUrl: best || '', link: 'https://www.facebook.com/ads/library/?id=' + id };
  }

  function setBtn(btn, id) {
    const done = savedIds.has(id);
    btn.textContent = done ? '✔ محفوظ في الأرشيف' : '★ احفظ في الأرشيف';
    btn.classList.toggle('mt-done', done);
  }
  function refreshButtons() { document.querySelectorAll('.mt-save-ad').forEach((b) => setBtn(b, b.dataset.id)); }

  function scan() {
    findCards().forEach(({ id, card }) => {
      if (card.querySelector('.mt-save-ad')) return;
      const btn = document.createElement('button');
      btn.className = 'mt-save-ad';
      btn.dataset.id = id;
      setBtn(btn, id);
      btn.addEventListener('click', async (e) => {
        e.preventDefault(); e.stopPropagation();
        if (savedIds.has(id)) { chrome.runtime.sendMessage({ type: 'open-app', tool: 'ads' }); return; }
        btn.textContent = 'جاري الحفظ...';
        const ad = extract(card, id);
        let image = '';
        if (ad.imageUrl) {
          const r = await chrome.runtime.sendMessage({ type: 'fetch-image', url: ad.imageUrl }).catch(() => null);
          if (r && r.ok) image = r.dataUrl;
        }
        delete ad.imageUrl;
        await Store.update('ads', [], (list) => [{ ...ad, image, competitor: ad.page, note: '', source: 'Meta Ad Library', savedAt: Date.now() }, ...list.filter((x) => x.id !== id)]);
        savedIds.add(id);
        setBtn(btn, id);
      });
      card.style.position = card.style.position || 'relative';
      card.prepend(btn);
    });
  }

  let t;
  new MutationObserver(() => { clearTimeout(t); t = setTimeout(scan, 700); }).observe(document.body, { childList: true, subtree: true });
  setTimeout(scan, 1200);
})();

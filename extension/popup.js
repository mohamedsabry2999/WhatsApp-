const btn = document.getElementById('go');
const statusEl = document.getElementById('status');
try { document.getElementById('ver').textContent = chrome.runtime.getManifest().version; } catch (e) {}

function setStatus(text, cls = '') {
  statusEl.textContent = text;
  statusEl.className = cls;
}

function fmtDate(sec) {
  if (!sec) return '';
  const d = new Date(sec * 1000);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// CSV بترميز UTF-8 مع BOM عشان العربي يفتح صح في إكسيل
function buildCsv(headers, rows) {
  const cell = (v) => {
    const s = String(v ?? '');
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const text = [headers, ...rows].map((r) => r.map(cell).join(',')).join('\r\n');
  return new Blob(['\ufeff' + text], { type: 'text/csv;charset=utf-8' });
}

btn.addEventListener('click', async () => {
  btn.disabled = true;
  setStatus('جاري القراءة...');
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url || !tab.url.startsWith('https://web.whatsapp.com')) {
      setStatus('افتح web.whatsapp.com في التاب الحالي وسجّل دخول، وبعدين دوس الزرار تاني.', 'err');
      return;
    }
    const includeAllContacts = document.getElementById('includeAll').checked;
    const [res] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractWhatsAppContacts,
      args: [{ includeAllContacts }],
    });
    const data = res && res.result;
    if (!data) throw new Error('مفيش نتيجة من الصفحة');
    if (data.error) { setStatus(data.error, 'err'); return; }
    if (!data.rows.length) {
      setStatus('ملقتش أي محادثات. استنى لحد ما واتساب ويب يحمّل المحادثات كلها وجرب تاني.', 'err');
      return;
    }

    const rows = data.rows.map((r, i) => [
      i + 1,
      r.name || '(بدون اسم)',
      r.phone,
      r.pushName,
      r.saved ? 'نعم' : 'لا',
      r.chatted ? fmtDate(r.lastMessage) : '(مفيش محادثة)',
      r.groups.length,
      r.groups.join('، '),
    ]);
    const headers = ['#', 'الاسم', 'رقم التليفون', 'الاسم على واتساب', 'محفوظ عندي؟', 'آخر محادثة', 'عدد الجروبات المشتركة', 'الجروبات المشتركة'];
    const fmt = document.querySelector('input[name="fmt"]:checked').value;
    const blob = fmt === 'csv'
      ? buildCsv(headers, rows)
      : buildXlsx({ sheetName: 'ContactHarvest', headers, rows, widths: [6, 30, 20, 25, 13, 18, 12, 50], rtl: true });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ContactHarvest-${new Date().toISOString().slice(0, 10)}.${fmt}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);

    const hidden = data.rows.filter((r) => !r.phone.startsWith('+')).length;
    setStatus(
      `تم ✔ ${data.rows.length} جهة اتصال اتحفظت في الشيت.` +
      (hidden ? `\n${hidden} منهم رقمهم مخفي من واتساب (خصوصية الجروبات/المجتمعات).` : ''),
      'ok'
    );
  } catch (e) {
    setStatus('حصل خطأ: ' + (e && e.message ? e.message : e), 'err');
  } finally {
    btn.disabled = false;
  }
});

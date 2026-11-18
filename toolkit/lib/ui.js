// أدوات واجهة مشتركة
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1800);
}
async function copyText(text, msg = 'اتنسخ ✔') {
  try { await navigator.clipboard.writeText(text); toast(msg); }
  catch (e) {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); toast(msg);
  }
}
function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
function today() { return new Date().toISOString().slice(0, 10); }
function fmtDateTime(ms) {
  if (!ms) return '';
  const d = new Date(ms), p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
const AUTHOR = 'محمد صبري | Mohamed Sabry';
function exportXlsx(name, headers, rows, widths) {
  download(buildXlsx({ sheetName: name, headers, rows, widths, rtl: true, author: AUTHOR }), `${name}-${today()}.xlsx`);
}
function exportCsv(name, headers, rows) {
  const cell = (v) => { const s = String(v ?? ''); return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const text = [headers, ...rows].map((r) => r.map(cell).join(',')).join('\r\n');
  download(new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' }), `${name}-${today()}.csv`);
}
// يحوّل نص لـ QR (SVG) بالألوان المطلوبة
function makeQrSvg(text, { dark = '#111111', light = '#FFFFFF', size = 220 } = {}) {
  qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount(), m = 4, total = n + m * 2;
  let path = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) path += `M${c + m},${r + m}h1v1h-1z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${size}" height="${size}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="${light}"/><path d="${path}" fill="${dark}"/></svg>`;
}
async function svgToPngBlob(svg, px = 1024) {
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  await img.decode();
  const c = document.createElement('canvas');
  c.width = c.height = px;
  c.getContext('2d').drawImage(img, 0, 0, px, px);
  return new Promise((res) => c.toBlob(res, 'image/png'));
}

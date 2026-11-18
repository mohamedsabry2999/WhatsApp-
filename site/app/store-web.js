// نسخة الويب من Store: نفس الواجهة اللي الإضافة بتستخدمها، بس بتحفظ في localStorage
// عشان أدوات زي UTM والـ QR والحاسبة تشتغل على الموقع من غير إضافة.
const Store = {
  _k: (key) => 'mt:' + key,
  async get(key, fallback) {
    try { const v = localStorage.getItem(Store._k(key)); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
  },
  async set(key, value) {
    try { localStorage.setItem(Store._k(key), JSON.stringify(value)); } catch (e) {}
    return value;
  },
  async update(key, fallback, fn) { return Store.set(key, await fn(await Store.get(key, fallback))); },
  uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); },
  onChange(key, cb) {
    window.addEventListener('storage', (e) => { if (e.key === Store._k(key)) { try { cb(JSON.parse(e.newValue)); } catch (x) {} } });
  },
};
const Tools = {};

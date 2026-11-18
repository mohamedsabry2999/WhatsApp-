// تخزين محلي بسيط فوق chrome.storage.local (البيانات بتفضل على جهازك بس)
const Store = {
  async get(key, fallback) {
    const r = await chrome.storage.local.get(key);
    return r[key] === undefined ? fallback : r[key];
  },
  async set(key, value) {
    await chrome.storage.local.set({ [key]: value });
    return value;
  },
  async update(key, fallback, fn) {
    const cur = await Store.get(key, fallback);
    return Store.set(key, await fn(cur));
  },
  uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  },
  onChange(key, cb) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes[key]) cb(changes[key].newValue);
    });
  },
};

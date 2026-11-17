// يتم حقن الدالة دي جوه صفحة web.whatsapp.com.
// بتقرا قاعدة البيانات المحلية اللي واتساب ويب بيحفظ فيها المحادثات وجهات الاتصال (IndexedDB)
// ومش بتبعت أي بيانات لأي مكان. لازم تكون كاملة لوحدها (مفيش استدعاء لأي حاجة بره الدالة).
async function extractWhatsAppContacts(options) {
  const includeAllContacts = !!(options && options.includeAllContacts);

  function openDb(name) {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(name);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      req.onupgradeneeded = () => {
        // القاعدة مش موجودة: نلغي الإنشاء
        req.transaction.abort();
        reject(new Error('no-db'));
      };
    });
  }
  function getAll(db, store) {
    return new Promise((resolve) => {
      if (!db.objectStoreNames.contains(store)) return resolve([]);
      try {
        const req = db.transaction(store, 'readonly').objectStore(store).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch (e) { resolve([]); }
    });
  }
  const idStr = (id) => {
    if (!id) return '';
    if (typeof id === 'string') return id;
    if (id._serialized) return id._serialized;
    if (id.user && id.server) return id.user + '@' + id.server;
    return String(id);
  };
  const digits = (s) => String(s || '').split('@')[0].split(':')[0].replace(/\D/g, '');

  let db;
  try {
    db = await openDb('model-storage');
  } catch (e) {
    return { error: 'مش لاقي بيانات واتساب. اتأكد إنك فاتح web.whatsapp.com ومسجل دخول وإن المحادثات حمّلت.' };
  }

  const stores = Array.from(db.objectStoreNames);
  const [chats, contacts] = await Promise.all([getAll(db, 'chat'), getAll(db, 'contact')]);

  // ربط المعرفات المخفية (@lid) بأرقام التليفون الحقيقية
  const lidToPhone = new Map();
  for (const store of stores.filter((s) => /lid|pn/i.test(s))) {
    for (const r of await getAll(db, store)) {
      if (!r || typeof r !== 'object') continue;
      const lid = r.lid || r.lidJid || (String(idStr(r.id)).endsWith('@lid') ? idStr(r.id) : null);
      const pn = r.pn || r.phoneNumber || r.pnJid;
      if (lid && pn) lidToPhone.set(digits(idStr(lid)), digits(idStr(pn)));
    }
  }

  const contactById = new Map();
  for (const c of contacts) {
    const id = idStr(c.id);
    if (!id) continue;
    contactById.set(id, c);
    if (id.endsWith('@lid') && c.phoneNumber) lidToPhone.set(digits(id), digits(idStr(c.phoneNumber)));
  }

  const isPerson = (id) => id.endsWith('@c.us') || id.endsWith('@s.whatsapp.net') || id.endsWith('@lid');
  const phoneOf = (id, c) => {
    if (id.endsWith('@lid')) {
      return lidToPhone.get(digits(id)) || (c && c.phoneNumber ? digits(idStr(c.phoneNumber)) : '');
    }
    return digits(id);
  };

  const rows = new Map(); // key = رقم التليفون (أو المعرف لو الرقم مخفي)
  function add(id, chat) {
    if (!isPerson(id)) return; // نتجاهل الجروبات والقنوات والحالات
    const c = contactById.get(id) ||
      (id.endsWith('@lid') ? null : contactById.get(id.replace('@s.whatsapp.net', '@c.us')));
    const phone = phoneOf(id, c);
    const savedName = (c && (c.name || c.shortName)) || '';
    const pushName = (c && (c.pushname || c.verifiedName)) || '';
    const chatName = (chat && (chat.name || chat.formattedTitle)) || '';
    const ts = chat && (chat.t || chat.timestamp) ? Number(chat.t || chat.timestamp) : 0;
    const key = phone || id;
    const prev = rows.get(key);
    const row = {
      name: savedName || chatName || pushName || (prev && prev.name) || '',
      phone: phone ? '+' + phone : '(رقم مخفي)',
      pushName: pushName || (prev && prev.pushName) || '',
      saved: !!(c && (c.isAddressBookContact || c.name)) || !!(prev && prev.saved),
      lastMessage: Math.max(ts, (prev && prev.lastMessage) || 0),
      chatted: !!chat || !!(prev && prev.chatted),
      groups: (prev && prev.groups) || [],
    };
    rows.set(key, row);
  }

  for (const chat of chats) add(idStr(chat.id), chat);
  if (includeAllContacts) {
    for (const c of contacts) {
      const id = idStr(c.id);
      if (c.isAddressBookContact || c.name) add(id, null);
    }
  }

  // الجروبات المشتركة: اسم كل جروب + أعضاؤه
  const groupNames = new Map();
  for (const chat of chats) {
    const id = idStr(chat.id);
    if (id.endsWith('@g.us') && (chat.name || chat.formattedTitle)) groupNames.set(id, chat.name || chat.formattedTitle);
  }
  for (const g of await getAll(db, 'group-metadata')) {
    const id = idStr(g.id);
    if (id && g.subject && !groupNames.has(id)) groupNames.set(id, g.subject);
  }
  const keyOf = (id) => phoneOf(id, contactById.get(id)) || id;
  for (const rec of await getAll(db, 'participant')) {
    const gid = idStr(rec.groupId || rec.id);
    const gname = groupNames.get(gid);
    if (!gname || !Array.isArray(rec.participants)) continue;
    for (const p of rec.participants) {
      const pid = idStr(p && typeof p === 'object' && !p.server && p.id ? p.id : p);
      const row = rows.get(keyOf(pid));
      if (row && !row.groups.includes(gname)) row.groups.push(gname);
    }
  }

  const list = Array.from(rows.values()).sort((a, b) => b.lastMessage - a.lastMessage);
  return { rows: list, chatCount: chats.length, contactCount: contacts.length, stores };
}

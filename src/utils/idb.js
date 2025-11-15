// encoding: utf-8

const DB_NAME = "portal";
const DB_VERSION = 2;
const STORES = [
  { name: "unread_notifications", options: { keyPath: "id" } },
  { name: "read_notifications", options: { keyPath: "id" } },
];

export const IDB_STORES = {
  UNREAD: "unread_notifications",
  READ: "read_notifications",
};

export function openDB(name = DB_NAME, version = DB_VERSION, upgradeCb) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, version);
    req.onupgradeneeded = (event) => {
      const db = req.result;
      STORES.forEach((store) => {
        if (!db.objectStoreNames.contains(store.name)) {
          db.createObjectStore(store.name, store.options);
        }
      });
      if (upgradeCb) upgradeCb(db, event.oldVersion, event.newVersion);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function idbPut(store, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(value);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

export async function idbDelete(store, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

export async function idbGetAll(store) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function idbClear(store) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).clear();
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

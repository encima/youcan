// Lightweight IndexedDB wrapper for storing translations by URL
const DB_NAME = 'youcan_translations';
const STORE_NAME = 'translations';

// For TypeScript: Provide a type declaration for module consumers
type Translation = any[];

export default defineUnlistedScript(() => {
  console.log('Setting up Youcan', { id: browser.runtime.id });
});

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'url' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getTranslation(url: string): Promise<Translation|null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(url);
    req.onsuccess = () => resolve(req.result ? req.result.translation : null);
    req.onerror = () => reject(req.error);
  });
}

export async function setTranslation(url: string, translation: Translation): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put({ url, translation });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Lista carta → canción. Es la misma que usa la app oficial de Hitster (servidor de Jumbo).
// Se descarga en el teléfono y se guarda en IndexedDB; se renueva cada 7 días.
export const CATALOG_URL = 'https://hitster.jumboplay.com/hitster-assets/gameset_database.json';
const MAX_AGE = 7 * 24 * 3600 * 1000;

// { gamesets: [{ sku, gameset_data: { cards: [{ CardNumber, Spotify }] } }] }  →  { sku: { "00211": "id" } }
export function buildIndex(db) {
  const index = {};
  for (const g of db?.gamesets || []) {
    const sku = String(g?.sku || '').toLowerCase();
    if (!sku) continue;
    const cards = {};
    for (const c of g?.gameset_data?.cards || []) {
      if (c?.CardNumber && c?.Spotify) cards[String(c.CardNumber).padStart(5, '0')] = String(c.Spotify);
    }
    index[sku] = Object.assign(index[sku] || {}, cards);
  }
  return index;
}

function idb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('bingo-vinilo', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('kv');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbGet(key) {
  const db = await idb();
  return new Promise((resolve) => {
    const r = db.transaction('kv').objectStore('kv').get(key);
    r.onsuccess = () => resolve(r.result || null);
    r.onerror = () => resolve(null);
  });
}
async function idbSet(key, value) {
  const db = await idb();
  return new Promise((resolve) => {
    const tx = db.transaction('kv', 'readwrite');
    tx.objectStore('kv').put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

let memo = null;
export async function loadCatalog({ force = false } = {}) {
  if (memo && !force) return memo;
  let cached = null;
  try { cached = await idbGet('catalog'); } catch {}
  if (cached && !force && Date.now() - cached.saved < MAX_AGE) return (memo = cached.index);
  try {
    const r = await fetch(CATALOG_URL, { cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const index = buildIndex(await r.json());
    if (!Object.keys(index).length) throw new Error('lista vacía');
    try { await idbSet('catalog', { saved: Date.now(), index }); } catch {}
    return (memo = index);
  } catch (e) {
    if (cached) return (memo = cached.index);
    throw new Error('No pude bajar la lista de canciones de Hitster. Revisa la conexión a internet.', { cause: e });
  }
}

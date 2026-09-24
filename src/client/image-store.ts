import { IMAGE_DB, IMAGE_KEY, IMAGE_STORE, LEGACY_IMAGE_DB } from './constants.ts'
import { sanitizeWallpaperRecord, type WallpaperRecord } from './image.ts'

/** Persistence face for the uploaded wallpaper blob. */
export interface ImageStore {
  get(): Promise<WallpaperRecord | undefined>
  put(record: WallpaperRecord): Promise<void>
  clear(): Promise<void>
}

/**
 * Open the IndexedDB-backed store. The database is created on first use.
 *
 * A wallpaper saved by dsh-frosted-window is adopted on first read, so moving
 * to the merged plugin does not lose the user's image. The legacy database is
 * never written to and never created: we only look inside it if IndexedDB
 * reports that it already exists.
 */
export function openImageStore(): ImageStore {
  return {
    get: async () => {
      const stored = await withStore(IMAGE_DB, 'readonly', store =>
        requestToPromise<WallpaperRecord | undefined>(store.get(IMAGE_KEY)))
      if (stored !== undefined) return hydrate(stored)
      return hydrate(await readLegacy())
    },
    put: record => withStore(IMAGE_DB, 'readwrite', store => requestToPromise(store.put({
      bytes: record.bytes,
      mime: record.mime,
      name: record.name,
      width: record.width,
      height: record.height,
      updatedAt: record.updatedAt,
    } satisfies WallpaperRecord, IMAGE_KEY)).then(() => undefined)),
    clear: () => withStore(IMAGE_DB, 'readwrite', store =>
      requestToPromise(store.delete(IMAGE_KEY)).then(() => undefined)),
  }
}

/** Read the predecessor plugin's wallpaper, if that database exists. */
async function readLegacy(): Promise<WallpaperRecord | undefined> {
  if (typeof indexedDB.databases !== 'function') return undefined
  try {
    const present = (await indexedDB.databases()).some(entry => entry.name === LEGACY_IMAGE_DB)
    if (!present) return undefined
    return await withStore(LEGACY_IMAGE_DB, 'readonly', store =>
      requestToPromise<WallpaperRecord | undefined>(store.get(IMAGE_KEY)))
  } catch {
    // A missing or unreadable legacy database simply means nothing to adopt.
    return undefined
  }
}

function hydrate(stored: WallpaperRecord | undefined): WallpaperRecord | undefined {
  return sanitizeWallpaperRecord(stored)
}

async function withStore<T>(
  database: string,
  mode: IDBTransactionMode,
  use: (store: IDBObjectStore) => T | Promise<T>,
): Promise<T> {
  const db = await openDb(database)
  try {
    const tx = db.transaction(IMAGE_STORE, mode)
    const result = await use(tx.objectStore(IMAGE_STORE))
    await txDone(tx)
    return result
  } finally {
    db.close()
  }
}

function openDb(database: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(database, 1)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(IMAGE_STORE)) {
        req.result.createObjectStore(IMAGE_STORE)
      }
    }
    req.onsuccess = () => { resolve(req.result) }
    req.onerror = () => { reject(req.error ?? new Error('indexedDB open failed')) }
  })
}

function requestToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => { resolve(req.result) }
    req.onerror = () => { reject(req.error ?? new Error('indexedDB request failed')) }
  })
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { resolve() }
    tx.onerror = () => { reject(tx.error ?? new Error('indexedDB transaction failed')) }
    tx.onabort = () => { reject(tx.error ?? new Error('indexedDB transaction aborted')) }
  })
}

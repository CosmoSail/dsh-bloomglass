import { describe, expect, it } from 'vitest'
import { IMAGE_KEY, IMAGE_STORE, LEGACY_IMAGE_DB } from '../src/client/constants.ts'
import { openImageStore } from '../src/client/image-store.ts'

/** Seed the predecessor plugin's database by hand. */
function seedLegacy(record: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(LEGACY_IMAGE_DB, 1)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(IMAGE_STORE)) {
        req.result.createObjectStore(IMAGE_STORE)
      }
    }
    req.onsuccess = () => {
      const db = req.result
      const tx = db.transaction(IMAGE_STORE, 'readwrite')
      tx.objectStore(IMAGE_STORE).put(record, IMAGE_KEY)
      tx.oncomplete = () => { db.close(); resolve() }
      tx.onerror = () => { db.close(); reject(tx.error ?? new Error('seed failed')) }
    }
    req.onerror = () => { reject(req.error ?? new Error('seed open failed')) }
  })
}

describe('image store', () => {
  it('puts, reads, and clears a wallpaper record', async () => {
    const store = openImageStore()
    const bytes = [1, 2, 3]
    await store.put({
      bytes,
      mime: 'image/jpeg',
      name: 'wall.jpg',
      width: 10,
      height: 8,
      updatedAt: 1,
    })
    const got = await store.get()
    expect(got?.name).toBe('wall.jpg')
    expect(got?.width).toBe(10)
    expect(got?.mime).toBe('image/jpeg')
    expect(got?.bytes).toEqual([1, 2, 3])
    await store.clear()
    expect(await store.get()).toBeUndefined()
  })

  it('adopts a wallpaper left behind by dsh-frosted-window', async () => {
    await seedLegacy({
      bytes: [9, 9, 9],
      mime: 'image/png',
      name: 'legacy.png',
      width: 4,
      height: 2,
      updatedAt: 7,
    })
    const got = await openImageStore().get()
    expect(got?.name).toBe('legacy.png')
    expect(got?.bytes).toEqual([9, 9, 9])
  })

  it('prefers its own record over the legacy one', async () => {
    await seedLegacy({ bytes: [9], mime: 'image/png', name: 'legacy.png', width: 4, height: 2, updatedAt: 7 })
    const store = openImageStore()
    await store.put({ bytes: [5], mime: 'image/jpeg', name: 'mine.jpg', width: 1, height: 1, updatedAt: 8 })
    expect((await store.get())?.name).toBe('mine.jpg')
    await store.clear()
  })
})

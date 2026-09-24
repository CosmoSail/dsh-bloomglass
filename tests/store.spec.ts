import { describe, expect, it } from 'vitest'
import { createBloomglassStore, INITIAL_STATE } from '../src/client/store.ts'

describe('createBloomglassStore', () => {
  it('notifies subscribers on set and unsubscribes', () => {
    const store = createBloomglassStore()
    const seen: number[] = []
    const off = store.subscribe(() => { seen.push(store.get().revision) })
    store.set({ ...INITIAL_STATE, revision: 1, hasImage: true })
    off()
    store.set({ ...INITIAL_STATE, revision: 2 })
    expect(seen).toEqual([1])
    expect(store.get().hasImage).toBe(false)
  })
})

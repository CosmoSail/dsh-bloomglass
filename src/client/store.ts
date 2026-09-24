import { DEFAULT_KNOBS, type BloomglassKnobs } from './knobs.ts'

/** Settings-section mirror of the live theme surface. */
export interface BloomglassState extends BloomglassKnobs {
  hasImage: boolean
  previewUrl: string | null
  fileName: string | null
  width: number
  height: number
  dirty: boolean
  busy: boolean
  error: string | null
  revision: number
}

export const INITIAL_STATE: BloomglassState = {
  ...DEFAULT_KNOBS,
  hasImage: false,
  previewUrl: null,
  fileName: null,
  width: 0,
  height: 0,
  dirty: false,
  busy: false,
  error: null,
  revision: -1,
}

/** Tiny store — avoids a hard runtime import in unit tests. */
export interface BloomglassStore {
  get(): BloomglassState
  set(next: BloomglassState): void
  subscribe(listener: () => void): () => void
}

/** Create an in-memory store for the settings section. */
export function createBloomglassStore(init: BloomglassState = INITIAL_STATE): BloomglassStore {
  let state = init
  const listeners = new Set<() => void>()
  return {
    get: () => state,
    set: (next) => {
      state = next
      for (const listener of listeners) listener()
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
  }
}

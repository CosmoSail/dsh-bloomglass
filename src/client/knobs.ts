/**
 * User-tunable knobs — one record now covers both halves of the merge.
 *
 * The palette key (Bloom) and the glass / wallpaper numbers (Frosted) live
 * together because they are saved together: a theme is the pair of them.
 * Image bytes never live here — those go to IndexedDB.
 */
import { KNOBS_KEY, LEGACY_KNOBS_KEY, LEGACY_VARIANT_KEY } from './constants.ts'
import { isVariant, type Variant } from './palette.ts'

/** Persisted theme preferences. */
export interface BloomglassKnobs {
  /** Apply wallpaper + glass when an image is stored. */
  enabled: boolean
  /** Active Bloom palette key. */
  variant: Variant
  /** Glass fill opacity in [0.18, 0.82]. */
  glassOpacity: number
  /** Backdrop blur in px, [8, 64]. */
  blurPx: number
  /** Backdrop saturate multiplier, [1, 2]. */
  saturate: number
  /** Wallpaper dim veil in [0, 0.65]. */
  dim: number
}

export const DEFAULT_KNOBS: BloomglassKnobs = {
  enabled: true,
  variant: 'mist',
  glassOpacity: 0.46,
  blurPx: 28,
  saturate: 1.55,
  dim: 0.28,
}

/** Numeric knob bounds, shared by the clamps and the settings sliders. */
export const KNOB_RANGES = {
  glassOpacity: [0.18, 0.82],
  blurPx: [8, 64],
  saturate: [1, 2],
  dim: [0, 0.65],
} as const satisfies Record<string, readonly [number, number]>

/** Slider metadata: the published range plus the step the UI should use. */
export const KNOB_STEPS: Record<keyof typeof KNOB_RANGES, number> = {
  glassOpacity: 0.01,
  blurPx: 1,
  saturate: 0.05,
  dim: 0.01,
}

/**
 * Clamp one numeric knob into its published range.
 * @param key - numeric knob name.
 * @param value - raw number.
 */
export function clampKnob<K extends keyof typeof KNOB_RANGES>(key: K, value: number): number {
  const [min, max] = KNOB_RANGES[key]
  if (!Number.isFinite(value)) return DEFAULT_KNOBS[key]
  return Math.min(max, Math.max(min, value))
}

/**
 * Normalize a partial / unknown record into a complete knob set.
 * @param raw - persisted JSON or UI draft.
 */
export function normalizeKnobs(raw: unknown): BloomglassKnobs {
  const input = raw !== null && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  return {
    enabled: input.enabled !== false,
    variant: isVariant(input.variant) ? input.variant : DEFAULT_KNOBS.variant,
    glassOpacity: clampKnob('glassOpacity', Number(input.glassOpacity)),
    blurPx: clampKnob('blurPx', Number(input.blurPx)),
    saturate: clampKnob('saturate', Number(input.saturate)),
    dim: clampKnob('dim', Number(input.dim)),
  }
}

/**
 * Read the palette and glass numbers the two predecessor plugins persisted,
 * so moving to the merged plugin does not reset a tuned theme.
 *
 * Best-effort: any failure just yields nothing and defaults take over.
 */
function readLegacy(): Record<string, unknown> {
  const legacy: Record<string, unknown> = {}
  try {
    const variant = localStorage.getItem(LEGACY_VARIANT_KEY)
    if (isVariant(variant)) legacy.variant = variant
  } catch {
    // Private mode / disabled storage — defaults are fine.
  }
  try {
    const raw = localStorage.getItem(LEGACY_KNOBS_KEY)
    if (raw !== null) Object.assign(legacy, JSON.parse(raw) as unknown)
  } catch {
    // Corrupt legacy record — ignore it rather than fail the load.
  }
  return legacy
}

/** Read knobs from localStorage; missing or corrupt values become defaults. */
export function loadKnobs(): BloomglassKnobs {
  try {
    const raw = localStorage.getItem(KNOBS_KEY)
    if (raw !== null) return normalizeKnobs(JSON.parse(raw) as unknown)
  } catch {
    // Fall through to the legacy read, then to defaults.
  }
  return normalizeKnobs(readLegacy())
}

/** Persist a complete knob set. Failures stay local (private mode / quota). */
export function saveKnobs(knobs: BloomglassKnobs): void {
  try {
    localStorage.setItem(KNOBS_KEY, JSON.stringify(normalizeKnobs(knobs)))
  } catch {
    // Persistence is best-effort; the live session still applies.
  }
}

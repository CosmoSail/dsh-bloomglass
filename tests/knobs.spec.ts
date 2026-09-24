import { describe, expect, it, beforeEach } from 'vitest'
import { KNOBS_KEY, LEGACY_KNOBS_KEY, LEGACY_VARIANT_KEY } from '../src/client/constants.ts'
import {
  DEFAULT_KNOBS, clampKnob, loadKnobs, normalizeKnobs, saveKnobs,
} from '../src/client/knobs.ts'

describe('knobs', () => {
  beforeEach(() => { localStorage.clear() })

  it('clamps numeric knobs into published ranges', () => {
    expect(clampKnob('glassOpacity', 2)).toBe(0.82)
    expect(clampKnob('glassOpacity', -1)).toBe(0.18)
    expect(clampKnob('blurPx', 3)).toBe(8)
    expect(clampKnob('blurPx', 99)).toBe(64)
    expect(clampKnob('saturate', Number.NaN)).toBe(DEFAULT_KNOBS.saturate)
    expect(clampKnob('dim', 1)).toBe(0.65)
  })

  it('treats missing enabled as on and fills defaults', () => {
    expect(normalizeKnobs(null)).toEqual(DEFAULT_KNOBS)
    expect(normalizeKnobs({ enabled: false, glassOpacity: 9 }).enabled).toBe(false)
    expect(normalizeKnobs({ glassOpacity: 9 }).glassOpacity).toBe(0.82)
  })

  it('round-trips through localStorage', () => {
    saveKnobs({ ...DEFAULT_KNOBS, enabled: false, blurPx: 40 })
    expect(loadKnobs()).toMatchObject({ enabled: false, blurPx: 40 })
    expect(JSON.parse(localStorage.getItem(KNOBS_KEY)!).blurPx).toBe(40)
  })

  it('returns defaults when stored JSON is corrupt', () => {
    localStorage.setItem(KNOBS_KEY, '{')
    expect(loadKnobs()).toEqual(DEFAULT_KNOBS)
  })

  describe('migration from the two predecessor plugins', () => {
    it('adopts the palette dsh-bloom-theme persisted', () => {
      localStorage.setItem(LEGACY_VARIANT_KEY, 'lapis')
      expect(loadKnobs().variant).toBe('lapis')
    })

    it('adopts the glass numbers dsh-frosted-window persisted', () => {
      localStorage.setItem(LEGACY_KNOBS_KEY, JSON.stringify({
        enabled: true, glassOpacity: 0.7, blurPx: 12, saturate: 1.2, dim: 0.5,
      }))
      expect(loadKnobs()).toMatchObject({ glassOpacity: 0.7, blurPx: 12, saturate: 1.2, dim: 0.5 })
    })

    it('prefers its own record once one exists', () => {
      localStorage.setItem(LEGACY_VARIANT_KEY, 'lapis')
      saveKnobs({ ...DEFAULT_KNOBS, variant: 'sage' })
      localStorage.setItem(LEGACY_VARIANT_KEY, 'amber')
      expect(loadKnobs().variant).toBe('sage')
    })

    it('ignores an unknown palette key and a corrupt legacy record', () => {
      localStorage.setItem(LEGACY_VARIANT_KEY, 'not-a-palette')
      localStorage.setItem(LEGACY_KNOBS_KEY, '{')
      expect(loadKnobs()).toEqual(DEFAULT_KNOBS)
    })

    it('clamps legacy numbers into the published ranges', () => {
      localStorage.setItem(LEGACY_KNOBS_KEY, JSON.stringify({ blurPx: 999, saturate: -3 }))
      expect(loadKnobs()).toMatchObject({ blurPx: 64, saturate: 1 })
    })
  })
})

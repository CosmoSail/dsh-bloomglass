import { describe, expect, it } from 'vitest'
import { PALETTE, VARIANTS } from '../src/client/palette.ts'
import { VARIANT_ATTR } from '../src/client/constants.ts'
import { applyGlass, bloomOwnVarsCss, bloomglassTokens, bloomTokenOverrides, veil } from '../src/client/tokens.ts'

const GLASS = { glassOpacity: 0.46, frosted: true }

describe('bloomTokenOverrides', () => {
  it('emits a light and a dark value for every token, for every palette', () => {
    for (const variant of VARIANTS) {
      const tokens = bloomTokenOverrides(variant)
      expect(Object.keys(tokens).length).toBeGreaterThan(80)
      for (const [name, modes] of Object.entries(tokens)) {
        expect(name.startsWith('--dsw-'), `${name} should be a DSH token`).toBe(true)
        expect(typeof modes.light, `${name} light`).toBe('string')
        expect(typeof modes.dark, `${name} dark`).toBe('string')
        expect(modes.light.length, `${name} light non-empty`).toBeGreaterThan(0)
        expect(modes.dark.length, `${name} dark non-empty`).toBeGreaterThan(0)
      }
    }
  })

  it('carries the palette accent into the brand token in both modes', () => {
    for (const variant of VARIANTS) {
      const tokens = bloomTokenOverrides(variant)
      expect(tokens['--dsw-alias-brand-primary'].light).toBe(PALETTE[variant].accentL)
      expect(tokens['--dsw-alias-brand-primary'].dark).toBe(PALETTE[variant].accentD)
    }
  })

  it('carries the palette background into the base surface in both modes', () => {
    const tokens = bloomTokenOverrides('cinnabar')
    expect(tokens['--dsw-alias-bg-base'].light).toBe(PALETTE.cinnabar.bgL)
    expect(tokens['--dsw-alias-bg-base'].dark).toBe(PALETTE.cinnabar.bgD)
  })

  it('gives every palette a distinct accent, so a switch is observable', () => {
    const accents = new Set(VARIANTS.map(v => bloomTokenOverrides(v)['--dsw-alias-brand-primary'].light))
    expect(accents.size).toBe(VARIANTS.length)
  })

  it('falls back to mist for an unknown palette key', () => {
    expect(bloomTokenOverrides('nope')).toEqual(bloomTokenOverrides('mist'))
    expect(bloomTokenOverrides(undefined)).toEqual(bloomTokenOverrides('mist'))
  })

  it('inherits mist for tokens a variant does not restate', () => {
    const mist = bloomTokenOverrides('mist')
    const lapis = bloomTokenOverrides('lapis')
    expect(Object.keys(lapis).sort()).toEqual(Object.keys(mist).sort())
  })
})

describe('veil', () => {
  it('converts an opacity into a transparent colour-mix, preserving the source colour', () => {
    expect(veil('oklch(96% 0.01 240)', 0.5)).toBe('color-mix(in oklch, oklch(96% 0.01 240), transparent 50%)')
  })

  it('clamps out-of-range opacity', () => {
    expect(veil('#fff', 2)).toBe('color-mix(in oklch, #fff, transparent 0%)')
    expect(veil('#fff', -1)).toBe('color-mix(in oklch, #fff, transparent 100%)')
  })
})

describe('applyGlass', () => {
  const base = bloomTokenOverrides('mist')

  it('re-expresses only surface tokens as translucent plates', () => {
    const glassed = applyGlass(base, 0.46)
    for (const name of [
      '--dsw-alias-bg-base',
      '--dsw-alias-bg-layer-1',
      '--dsw-alias-bg-layer-2',
      '--dsw-specific-sidebar-fill',
      '--dsw-specific-input-major',
      '--dsw-specific-menu',
      '--dsw-specific-bubble',
      '--dsw-alias-markdown-code-block',
    ]) {
      expect(glassed[name].light, `${name} light`).toContain('color-mix(in oklch,')
      expect(glassed[name].light, `${name} keeps the palette colour`).toContain(base[name].light)
      expect(glassed[name].dark, `${name} dark`).toContain('color-mix(in oklch,')
    }
  })

  it('leaves text, border, and brand tokens fully opaque', () => {
    const glassed = applyGlass(base, 0.46)
    for (const name of [
      '--dsw-alias-label-primary',
      '--dsw-alias-label-secondary',
      '--dsw-alias-border-l1',
      '--dsw-alias-brand-primary',
      '--dsw-alias-state-error-primary',
    ]) {
      expect(glassed[name], `${name} must stay opaque`).toEqual(base[name])
    }
  })

  it('keeps every token name — glass only rewrites values', () => {
    expect(Object.keys(applyGlass(base, 0.3)).sort()).toEqual(Object.keys(base).sort())
  })

  it('tracks the density knob: a higher value means less transparency', () => {
    const thin = applyGlass(base, 0.2)['--dsw-alias-bg-layer-1'].light
    const thick = applyGlass(base, 0.8)['--dsw-alias-bg-layer-1'].light
    const transparency = (value: string): number => Number(/transparent ([\d.]+)%/.exec(value)?.[1])
    expect(transparency(thin)).toBeGreaterThan(transparency(thick))
  })
})

describe('bloomglassTokens', () => {
  it('returns the untouched palette while no wallpaper is painted', () => {
    expect(bloomglassTokens({ variant: 'sage', ...GLASS, frosted: false }))
      .toEqual(bloomTokenOverrides('sage'))
  })

  it('folds the frost in once a wallpaper is painted', () => {
    const frosted = bloomglassTokens({ variant: 'sage', ...GLASS, frosted: true })
    expect(frosted['--dsw-alias-bg-layer-1'].light).toContain('color-mix(in oklch,')
    expect(frosted['--dsw-alias-label-primary']).toEqual(bloomTokenOverrides('sage')['--dsw-alias-label-primary'])
  })
})

describe('bloomOwnVarsCss', () => {
  const css = bloomOwnVarsCss('petal', VARIANT_ATTR)

  it('scopes Bloom internals to the palette attribute', () => {
    expect(css).toContain(`body[${VARIANT_ATTR}="petal"]`)
  })

  it('ships a dark block keyed on the official dark attribute', () => {
    expect(css).toContain(`body[${VARIANT_ATTR}="petal"][data-ds-dark-theme]`)
  })

  it('never emits a DSH token — those belong to the override layer', () => {
    expect(css).not.toContain('--dsw-')
  })

  it('publishes the variables Bloom stylesheets read', () => {
    for (const name of ['--bloom-morandi', '--bloom-accent', '--bloom-glass-blur', '--bloom-hairline']) {
      expect(css, name).toContain(name)
    }
  })

  it('resolves light and dark to different values', () => {
    const light = /--bloom-accent:\s*([^;]+);/.exec(css)
    const dark = /\[data-ds-dark-theme\]\{[^}]*--bloom-accent:\s*([^;]+);/.exec(css)
    expect(light?.[1]).toBe(PALETTE.petal.accentL)
    expect(dark?.[1]).toBe(PALETTE.petal.accentD)
    expect(light?.[1]).not.toBe(dark?.[1])
  })
})

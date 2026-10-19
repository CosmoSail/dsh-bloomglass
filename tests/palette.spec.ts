import { describe, expect, it } from 'vitest'
import { PALETTE, VARIANTS } from '../src/client/palette.ts'

/**
 * oklch(L% C H) → sRGB, with the OKLab → linear-sRGB matrix and the sRGB transfer
 * function. The engine resolves these same values on a canvas; the script that
 * produced the table in palette.ts measured 6.16 / 5.68 / 5.47:1 for mist /
 * cinnabar / petal in light mode, and this transform reproduces them within 0.03
 * (the residue is CSS gamut mapping), so the floor below is asserted with that
 * slack in mind rather than against a rounded literal.
 */
function srgb(value: string): [number, number, number] {
  const match = /oklch\(([\d.]+)%\s+([\d.]+)\s+([\d.]+)\)/.exec(value.trim())
  if (match === null) throw new Error(`not an oklch colour: ${value}`)
  const L = Number(match[1]) / 100
  const C = Number(match[2])
  const H = (Number(match[3]) * Math.PI) / 180
  const a = C * Math.cos(H)
  const b = C * Math.sin(H)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  const encode = (v: number): number => {
    const c = Math.min(1, Math.max(0, v))
    return (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055) * 255
  }
  return [
    encode(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    encode(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    encode(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ]
}

function luminance(value: string): number {
  const [r, g, b] = srgb(value).map((channel) => {
    const c = channel / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const l1 = luminance(a)
  const l2 = luminance(b)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

const lightness = (value: string): number => Number(/oklch\(([\d.]+)%/.exec(value)?.[1])

describe('palette contrast floors', () => {
  it('keeps accent × background above AA in both modes', () => {
    // The pair is also the primary button's fill × its ink (tokens.ts), so it is
    // the one ratio the palette cannot trade away for looks. The tightest of the
    // twenty is 4.78 (ripple, light) after the second light-mode deepening.
    for (const variant of VARIANTS) {
      const p = PALETTE[variant]
      expect(contrast(p.accentL, p.bgL), `${variant} light accent × bg`).toBeGreaterThanOrEqual(4.5)
      expect(contrast(p.accentD, p.bgD), `${variant} dark accent × bg`).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('keeps body ink far above AA on every surface it lands on', () => {
    for (const variant of VARIANTS) {
      const p = PALETTE[variant]
      for (const [label, ink, ground] of [
        ['light ink × bg', p.txL, p.bgL],
        ['light ink × surface-2', p.txL, p.sf2L],
        ['dark ink × bg', p.txD, p.bgD],
        ['dark ink × surface-2', p.txD, p.sf2D],
      ] as const) {
        expect(contrast(ink, ground), `${variant} ${label}`).toBeGreaterThanOrEqual(7)
      }
    }
  })

  it('keeps the light track deepened and the dark track untouched', () => {
    // 2026-10-16 (owner): the light tones were a notch too pale, so every
    // variant's light track dropped by 4–5L with its accent following 2.0–3.2L
    // down to hold the ratio above. 2026-10-19 (owner, second pass): one more
    // notch — bg -4, sf/sf2 -5, accent -3 (ripple -4 to keep its floor). This
    // guards the direction: no light base may climb back above 91L, the two
    // surface steps must stay below it, and the dark track must not move.
    for (const variant of VARIANTS) {
      const p = PALETTE[variant]
      expect(lightness(p.bgL), `${variant} bgL`).toBeLessThanOrEqual(91)
      expect(lightness(p.sfL), `${variant} sfL`).toBeLessThan(lightness(p.bgL))
      expect(lightness(p.sf2L), `${variant} sf2L`).toBeLessThan(lightness(p.sfL))
      // The accent had to follow the base down to hold its ratio.
      expect(lightness(p.accentL), `${variant} accentL`).toBeLessThan(50)
      expect(lightness(p.bgD), `${variant} bgD`).toBeLessThan(30)
    }
  })
})

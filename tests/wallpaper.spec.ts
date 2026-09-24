import { describe, expect, it, afterEach } from 'vitest'
import { BODY_ATTR, FROST_ATTR, PACKAGE_ID } from '../src/client/constants.ts'
import { DEFAULT_KNOBS } from '../src/client/knobs.ts'
import { GLASS_CSS, SETTINGS_CSS } from '../src/client/glass-css.ts'
import { FrostedPresenter } from '../src/client/wallpaper.ts'

describe('FrostedPresenter', () => {
  afterEach(() => {
    document.body.replaceChildren()
    document.head.querySelectorAll('style[data-plugin]').forEach(node => { node.remove() })
    document.body.removeAttribute(FROST_ATTR)
  })

  it('paints wallpaper, dim, stylesheet, and body attribute', () => {
    const presenter = new FrostedPresenter()
    presenter.apply({
      knobs: DEFAULT_KNOBS,
      objectUrl: 'blob:test',
      scheme: 'dark',
    })
    expect(document.body.getAttribute(FROST_ATTR)).toBe('dark')
    // One blur knob feeds both halves of the merge.
    expect(document.body.style.getPropertyValue('--bloom-glass-blur')).toBe('28px')
    expect(document.body.style.getPropertyValue('--fw-dim')).toBe('0.28')
    // Bloom paints its own ambience wash; a wallpaper must displace it.
    expect(document.body.style.getPropertyValue('--bloom-ambience')).toBe('none')
    expect(document.querySelector(`[${FROST_ATTR}-wallpaper]`)?.getAttribute('style'))
      .toContain('blob:test')
    expect(document.querySelector(`[${FROST_ATTR}-dim]`)).not.toBeNull()
    expect(document.head.querySelector(`style[data-plugin="${PACKAGE_ID}"]`)?.textContent)
      .toContain('backdrop-filter')
    presenter.dispose()
    expect(document.body.hasAttribute(FROST_ATTR)).toBe(false)
    expect(document.querySelector(`[${FROST_ATTR}-wallpaper]`)).toBeNull()
    expect(document.head.querySelector(`style[data-plugin="${PACKAGE_ID}"]`)).toBeNull()
  })

  it('never touches the palette gate, so retracting the frost keeps the theme', () => {
    document.body.setAttribute(BODY_ATTR, '')
    const presenter = new FrostedPresenter()
    presenter.apply({ knobs: DEFAULT_KNOBS, objectUrl: 'blob:test', scheme: 'light' })
    presenter.dispose()
    expect(document.body.hasAttribute(BODY_ATTR)).toBe(true)
  })

  it('retracts when disabled or when the image is missing', () => {
    const presenter = new FrostedPresenter()
    presenter.apply({ knobs: DEFAULT_KNOBS, objectUrl: 'blob:test', scheme: 'light' })
    presenter.apply({ knobs: { ...DEFAULT_KNOBS, enabled: false }, objectUrl: 'blob:test', scheme: 'light' })
    expect(document.body.hasAttribute(FROST_ATTR)).toBe(false)
    presenter.apply({ knobs: DEFAULT_KNOBS, objectUrl: 'blob:test', scheme: 'light' })
    presenter.apply({ knobs: DEFAULT_KNOBS, objectUrl: null, scheme: 'light' })
    expect(document.querySelector(`[${FROST_ATTR}-wallpaper]`)).toBeNull()
    presenter.dispose()
  })

  it('frosts every column via ::before and never filters the settings dialog', () => {
    expect(GLASS_CSS).toMatch(/\*:has\(> \[data-slot='sidebar'\]\)::before/)
    expect(GLASS_CSS).toMatch(/\*:has\(> \[data-slot='conversation'\]\)::before/)
    expect(GLASS_CSS).toMatch(/\*:has\(> \[data-slot='details'\]\)::before/)
    expect(GLASS_CSS).toContain('border-right: none !important')
    expect(GLASS_CSS).not.toMatch(/\[role='dialog'\]/)
    expect(GLASS_CSS).not.toMatch(/sidebar\.settings/)
    const sidebarSelf = /\[data-slot='sidebar'\]\s*\{[^}]*backdrop-filter/
    expect(GLASS_CSS).not.toMatch(sidebarSelf)
  })

  it('keeps the wallpaper behind the palette ambience layer', () => {
    // Frosted's plate was at -2 and Bloom's aurora ribbon sits at -1, so the
    // ribbon used to paint over the wallpaper.
    const plate = /\[data-bloomglass-frost-wallpaper\]\s*\{[^}]*z-index:\s*(-?\d+)/
    expect(GLASS_CSS).toMatch(plate)
    expect(Number(plate.exec(GLASS_CSS)?.[1])).toBeLessThan(-1)
  })

  it('carries the settings-panel styles separately from the frost chrome', () => {
    expect(SETTINGS_CSS).toContain('.fw-panel')
    expect(GLASS_CSS).not.toContain('.fw-panel')
  })

  it('drives the frost from variables the presenter actually publishes', () => {
    // Regression guard: the plate CSS used to read --fw-blur while the
    // presenter wrote --bloom-glass-blur, so the blur silently did nothing.
    const consumed = new Set(
      [...GLASS_CSS.matchAll(/var\((--[\w-]+)/g)].map(match => match[1]),
    )
    const published = new Set(['--bloom-glass-blur', '--fw-saturate', '--fw-dim', '--bloom-ambience'])
    const frostOwned = [...consumed].filter(name => name.startsWith('--fw-') || name.startsWith('--bloom-'))
    expect(frostOwned.length).toBeGreaterThan(0)
    for (const name of frostOwned) {
      expect(published.has(name), `${name} is consumed but never published`).toBe(true)
    }
  })

  it('revokes the current object URL on dispose', () => {
    const revoked: string[] = []
    const original = URL.revokeObjectURL
    URL.revokeObjectURL = (url: string) => { revoked.push(url) }
    const presenter = new FrostedPresenter()
    presenter.adoptObjectUrl('blob:one')
    presenter.adoptObjectUrl('blob:two')
    presenter.dispose()
    URL.revokeObjectURL = original
    expect(revoked).toEqual(['blob:two'])
  })
})

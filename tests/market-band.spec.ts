import { afterEach, describe, expect, it } from 'vitest'
import { SURFACE_CSS } from '../src/client/glass-css.ts'
import {
  MARKET_CATS_VAR,
  MARKET_HEAD_SOURCE,
  MARKET_HEAD_VAR,
  clearMarketBand,
  publishMarketBand,
} from '../src/client/market-band.ts'

/** Mount a market root the way dshmarket does: attribute + inline metrics. */
function marketRoot(head = '64px', hostTop = '130px'): HTMLElement {
  const root = document.createElement('div')
  root.setAttribute('data-dsh-market-plugins-tab', 'true')
  root.style.setProperty(MARKET_HEAD_SOURCE, head)
  root.style.setProperty('--dshm-host-sticky-top', hostTop)
  document.body.append(root)
  return root
}

/** A sticky row with a fixed box (jsdom does not lay out, so the box is stubbed). */
function stickyRow(root: HTMLElement, top: string, height: number): HTMLElement {
  const row = document.createElement('div')
  row.style.position = 'sticky'
  row.style.top = top
  row.getBoundingClientRect = () => ({ height }) as DOMRect
  root.append(row)
  return row
}

afterEach(() => {
  document.body.innerHTML = ''
  clearMarketBand()
})

describe('publishMarketBand — the two heights CSS cannot take', () => {
  it('publishes the market’s head and the measured category row', () => {
    // dshmarket applies the head's height only to its own root; the bar is a
    // sibling branch, so the copy has to live on <html>.
    const root = marketRoot('64px', '130px')
    stickyRow(root, '130px', 64)   // the head itself: at the host's own offset
    stickyRow(root, '194px', 56)   // the category row, one head below
    const metrics = publishMarketBand()
    expect(metrics).toEqual({ head: '64px', cats: '58px' })   // 56 + the 2px margin
    expect(document.documentElement.style.getPropertyValue(MARKET_HEAD_VAR)).toBe('64px')
    expect(document.documentElement.style.getPropertyValue(MARKET_CATS_VAR)).toBe('58px')
  })

  it('follows the wrap when the panel narrows', () => {
    // Measured on the running app: at a 412px panel the head grows 64 → 118 and
    // the category row 56 → 72. A hard-coded pair ends the band short.
    const root = marketRoot('118px', '66px')
    stickyRow(root, '66px', 118)
    stickyRow(root, '184px', 72)
    expect(publishMarketBand()).toEqual({ head: '118px', cats: '74px' })
  })

  it('takes the first sticky row below the head, not one further down', () => {
    const root = marketRoot('64px', '66px')
    stickyRow(root, '130px', 56)     // the category row
    stickyRow(root, '420px', 40)     // a card's own sticky header
    expect(publishMarketBand()?.cats).toBe('58px')
  })

  it('falls back to the measured worst case when no row is found', () => {
    marketRoot('64px', '66px')
    expect(publishMarketBand()?.cats).toBe('58px')
  })

  it('writes nothing without the market', () => {
    expect(publishMarketBand()).toBeUndefined()
    expect(document.documentElement.style.getPropertyValue(MARKET_HEAD_VAR)).toBe('')
    expect(document.documentElement.style.getPropertyValue(MARKET_CATS_VAR)).toBe('')
  })

  it('writes nothing when the market publishes no head height', () => {
    const root = document.createElement('div')
    root.setAttribute('data-dsh-market-plugins-tab', 'true')
    document.body.append(root)
    expect(publishMarketBand()).toBeUndefined()
  })

  it('re-publishes when the market’s own metrics change', () => {
    const root = marketRoot('64px', '66px')
    stickyRow(root, '130px', 56)
    expect(publishMarketBand()?.head).toBe('64px')
    root.style.setProperty(MARKET_HEAD_SOURCE, '118px')
    expect(publishMarketBand()?.head).toBe('118px')
    expect(document.documentElement.style.getPropertyValue(MARKET_HEAD_VAR)).toBe('118px')
  })

  it('drops both copies on teardown', () => {
    const root = marketRoot('64px', '66px')
    stickyRow(root, '130px', 56)
    publishMarketBand()
    clearMarketBand()
    expect(document.documentElement.style.getPropertyValue(MARKET_HEAD_VAR)).toBe('')
    expect(document.documentElement.style.getPropertyValue(MARKET_CATS_VAR)).toBe('')
  })
})

/** The one rule that grows the plugin bar's strip over the market's sticky stack. */
const BAND = /body\[[^\]]+\]\[[^\]]+\] \[data-plugin-panel\]:has\(\[data-dsh-market-plugins-tab\]\):has\(\[data-dshm-stuck\]\) \[data-plugin-bar\]\[data-natural\]::before\s*\{([^}]*)\}/

/** The second, heavier tier over the tab head — painted on the panel, not the bar. */
const TIER = /body\[[^\]]+\]\[[^\]]+\] \[data-plugin-panel\]:has\(\[data-dsh-market-plugins-tab\]\):has\(\[data-dshm-stuck\]\)::after\s*\{([^}]*)\}/

describe('SURFACE_CSS — the plugin market’s sticky band', () => {
  it('reaches 16/9 of bar paint + market head + category row + a 20px tail', () => {
    const declarations = BAND.exec(SURFACE_CSS)?.[1] ?? ''
    // The owner asked for a third more range twice (2026-11-27), so the named
    // scale is (4/3)^2 = 16/9. The literal is pinned: changing the scale must
    // change this expectation too.
    expect(declarations).toContain(
      'height: calc((var(--plugin-header-paint-height, 66px) + var(--bloom-market-head, 64px) + var(--bloom-market-cats, 58px) + 20px) * 4 / 3 * 4 / 3)',
    )
    // Both heights come from market-band.ts; the fallbacks only cover the moment
    // before it measures.
    expect(declarations).toContain('var(--bloom-market-head, 64px)')
    expect(declarations).toContain('var(--bloom-market-cats, 58px)')
  })

  it('lets the blur fade out under the header, and leaves the bar’s own stripe full', () => {
    const declarations = BAND.exec(SURFACE_CSS)?.[1] ?? ''
    // A plain to-bottom ramp across the whole band would have cut the plugin
    // bar's own stripe to 68% at its bottom edge; holding #000 to the paint
    // height keeps the shipped 1.0.7 band exactly as it was.
    expect(declarations).toContain(
      'mask-image: linear-gradient(to bottom, #000 0, #000 var(--plugin-header-paint-height, 66px), transparent 100%)',
    )
    expect(declarations).toContain('pointer-events: none')
  })

  it('adds a heavier second tier over the tab head', () => {
    const declarations = TIER.exec(SURFACE_CSS)?.[1] ?? ''
    // A fixed strip over the head only: it starts at the bar's paint edge and
    // reaches transparency at the category row's top edge.
    expect(declarations).toContain("content: ''")
    expect(declarations).toContain('position: fixed')
    expect(declarations).toContain('top: var(--plugin-header-paint-height, 66px)')
    expect(declarations).toContain('height: calc(var(--bloom-market-head, 64px) + 2px)')
    // Twice the user's blur knob — never a hard-coded radius.
    expect(declarations).toContain('blur(calc(var(--bloom-glass-blur) * 2))')
    expect(declarations).toContain('pointer-events: none')
    // The ramp has more than two stops, and lands at 0 on the category row.
    expect(declarations).toContain(
      'mask-image: linear-gradient(to bottom, #000 0, rgba(0, 0, 0, 0.78) 30%, rgba(0, 0, 0, 0.46) 62%, rgba(0, 0, 0, 0.18) 85%, transparent 100%)',
    )
    // No tint: the tier is only a filter.
    expect(declarations).not.toContain('background')
  })

  it('does not reuse the bar’s ::after, which carries the market’s hairline', () => {
    const match = TIER.exec(SURFACE_CSS)?.[0] ?? ''
    expect(match).toContain('[data-plugin-panel]')
    expect(match).not.toContain('[data-plugin-bar]')
  })

  it('adds no tint of its own', () => {
    const declarations = BAND.exec(SURFACE_CSS)?.[1] ?? ''
    expect(declarations).not.toContain('background-color')
    expect(declarations).not.toContain('background:')
  })

  it('is gated on the market page and on the stuck marker', () => {
    // Both tiers carry the same two gates: no band at rest, and nothing on
    // plugin pages that are not the market.
    for (const rule of [BAND, TIER]) {
      const match = rule.exec(SURFACE_CSS)
      expect(match).not.toBeNull()
      const selector = match?.[0] ?? ''
      expect(selector).toContain('body[')
      expect(selector).toContain(':has([data-dsh-market-plugins-tab])')
      expect(selector).toContain(':has([data-dshm-stuck])')
      // Stable hooks only: the market's class names are build hashes.
      expect(selector).not.toContain('[class')
    }
  })

  it('leaves every other plugin page on the shipped strip', () => {
    // The base rule (1.0.7's top band) is still there, un-narrowed.
    expect(SURFACE_CSS).toMatch(
      /body\[[^\]]+\]\[[^\]]+\] \[data-plugin-panel\] \[data-plugin-bar\]\[data-natural\]::before\s*\{[^}]*backdrop-filter: blur\(var\(--bloom-glass-blur\)\)/,
    )
  })

  it('turns the band and the market rows solid under reduced transparency', () => {
    const reduced = /@media \(prefers-reduced-transparency: reduce\)\s*\{([\s\S]*)\}\s*$/.exec(SURFACE_CSS)?.[1] ?? ''
    // The band is cancelled at the same specificity it was applied with: with
    // the filter gone it would be an invisible strip.
    expect(reduced).toMatch(
      /:has\(\[data-dsh-market-plugins-tab\]\):has\(\[data-dshm-stuck\]\) \[data-plugin-bar\]\[data-natural\]::before\s*\{[^}]*height: var\(--plugin-header-paint-height, 66px\)/,
    )
    expect(reduced).toMatch(/mask-image: none/)
    expect(reduced).toMatch(/background-color: var\(--bt-glass-cover\)/)
    // The rows hand their 8% veil back through the market's own variables.
    expect(reduced).toMatch(/\[data-dsh-market-plugins-tab\]\s*\{[^}]*--dshm-sticky-bg:\s*var\(--bt-glass-cover\)/)
    expect(reduced).toMatch(/--dshm-stuck-bg:\s*var\(--bt-glass-cover\)/)
    // The second tier is pure filter: it is cancelled outright, not made solid.
    expect(reduced).toMatch(
      /:has\(\[data-dsh-market-plugins-tab\]\):has\(\[data-dshm-stuck\]\)::after\s*\{[^}]*content: none/,
    )
    expect(reduced).toMatch(
      /:has\(\[data-dsh-market-plugins-tab\]\):has\(\[data-dshm-stuck\]\)::after\s*\{[^}]*backdrop-filter: none/,
    )
  })
})

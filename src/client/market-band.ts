/**
 * The plugin market's sticky band — the two heights CSS cannot take.
 *
 * dshmarket (1.84.1) stacks two sticky rows under the plugin bar: a tab head and
 * a category row. Both paint `var(--dshm-sticky-bg, var(--dsw-alias-bg-base))`,
 * which under frost is the palette's base at 8%, and neither carries a backdrop
 * filter, so the plugin cards scrolling underneath read straight through them
 * (measured: 93.5% of the detail survived; the tab labels sat at 1.09:1).
 *
 * The theme's gradient band is painted by the plugin bar's `::before` — the one
 * strip the market page does frost — and it has to reach across both rows. The
 * head's height is published by the market itself in
 * `--dshm-plugins-head-height`, inline on the market root. That root is a
 * *sibling branch* of the bar inside `[data-plugin-panel]`, and custom
 * properties do not travel sideways, so the bar cannot inherit it. The category
 * row publishes nothing at all, and neither height is constant: both grow when
 * the panel narrows (measured 64 → 118 and 56 → 72 at a 412px panel), so a
 * hard-coded pair of numbers ends the band short when the window is resized.
 *
 * So this module measures both and copies them onto `<html>`, where every
 * descendant — the panel, the bar, and the bar's `::before` — inherits them:
 *
 *   --bloom-market-head   the market's own `--dshm-plugins-head-height`
 *   --bloom-market-cats   the sticky row directly below the head, measured
 *
 * The row is found by its behaviour, never by a class name (dshmarket's classes
 * are build hashes): it is the sticky descendant whose `top` is the smallest one
 * *below* `--dshm-host-sticky-top`. The search runs only when the market mounts,
 * its inline metrics change, or the window resizes.
 *
 * Both values get a 2px margin: the band may end long (the tail is a fade),
 * never short.
 */
export const MARKET_ROOT_SELECTOR = '[data-dsh-market-plugins-tab]'

/** The market's own inline custom properties. */
export const MARKET_HEAD_SOURCE = '--dshm-plugins-head-height'
export const MARKET_HOST_SOURCE = '--dshm-host-sticky-top'

/** Where the copies land, so the bar's ::before can read them. */
export const MARKET_HEAD_VAR = '--bloom-market-head'
export const MARKET_CATS_VAR = '--bloom-market-cats'

/** dshmarket 1.84.1's category row at the widest layout, plus the margin. */
const FALLBACK_CATS = 58

/** The band's two heights, both as CSS lengths. */
export interface MarketBandMetrics {
  head: string
  cats: string
}

const px = (value: string): number | undefined => {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

/** Read a custom property from the element's own inline style, then computed. */
function ownProperty(el: HTMLElement, name: string): string {
  const inline = el.style.getPropertyValue(name).trim()
  return inline !== '' ? inline : getComputedStyle(el).getPropertyValue(name).trim()
}

/**
 * The category row's height: the sticky descendant directly under the head.
 * @param root - the market root.
 * @param hostTop - the market's own sticky offset for the head.
 */
function measureCats(root: HTMLElement, hostTop: number): number | undefined {
  let best: { top: number; height: number } | undefined
  for (const el of root.querySelectorAll<HTMLElement>('*')) {
    const style = getComputedStyle(el)
    const position = style.position === '' ? el.style.position : style.position
    if (position !== 'sticky') continue
    const top = px(style.top) ?? px(el.style.top)
    if (top === undefined || top <= hostTop + 1) continue
    const height = el.getBoundingClientRect().height
    if (height < 10) continue
    if (best === undefined || top < best.top) best = { top, height }
  }
  return best?.height
}

/**
 * Publish the market's band metrics onto the document root.
 * @param doc - the document to read and write (tests pass their own).
 * @returns the published values, or undefined when there is no market to measure.
 */
export function publishMarketBand(doc: Document = document): MarketBandMetrics | undefined {
  const root = doc.querySelector<HTMLElement>(MARKET_ROOT_SELECTOR)
  if (root === null) return undefined
  const head = ownProperty(root, MARKET_HEAD_SOURCE)
  if (head === '') return undefined
  const hostTop = px(ownProperty(root, MARKET_HOST_SOURCE)) ?? 0
  const cats = measureCats(root, hostTop)
  const metrics: MarketBandMetrics = {
    head,
    cats: `${Math.ceil(cats ?? FALLBACK_CATS - 2) + 2}px`,
  }
  const html = doc.documentElement
  if (html.style.getPropertyValue(MARKET_HEAD_VAR) !== metrics.head) {
    html.style.setProperty(MARKET_HEAD_VAR, metrics.head)
  }
  if (html.style.getPropertyValue(MARKET_CATS_VAR) !== metrics.cats) {
    html.style.setProperty(MARKET_CATS_VAR, metrics.cats)
  }
  return metrics
}

/** Drop the copies (theme teardown). */
export function clearMarketBand(doc: Document = document): void {
  doc.documentElement.style.removeProperty(MARKET_HEAD_VAR)
  doc.documentElement.style.removeProperty(MARKET_CATS_VAR)
}

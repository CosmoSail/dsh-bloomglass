import { describe, expect, it } from 'vitest'
import { BODY_ATTR } from '../src/client/constants.ts'
import { COMPONENT_CSS } from '../src/client/css/bloom-component.ts'

/**
 * The focus ring is themed for controls without their own focus style, and
 * deliberately *withheld* from text entry: Chrome matches :focus-visible on a
 * click for anything you can type into, and the ring then draws a 2px bar as
 * tall as the box right beside the caret — two vertical lines that read as two
 * cursors (user report, 2026-10-15).
 */
describe('COMPONENT_CSS — the focus ring', () => {
  const ring = COMPONENT_CSS.indexOf(':focus-visible {\n  outline: 2px solid var(--bloom-accent) !important')
  const optOut = COMPONENT_CSS.indexOf('[data-composer-input]:focus-visible')

  it('keeps a themed ring for controls that have no focus style of their own', () => {
    expect(ring).toBeGreaterThan(-1)
    expect(COMPONENT_CSS).toMatch(/:focus-visible \{[^}]*outline: 2px solid var\(--bloom-accent\) !important/)
  })

  it('withholds the ring from the composer input and any contenteditable textbox', () => {
    expect(optOut).toBeGreaterThan(-1)
    expect(COMPONENT_CSS).toMatch(/\[data-composer-input\]:focus-visible,[^}]*\[role="textbox"\]\[contenteditable\]:focus-visible \{[^}]*outline: none !important/)
  })

  it('kills the browser default ring too, not just the themed one', () => {
    // Dropping only the themed ring would expose -webkit-focus-ring-color, which
    // is the same second line in another colour.
    const block = COMPONENT_CSS.slice(optOut, COMPONENT_CSS.indexOf('}', optOut))
    expect(block).toMatch(/outline: none !important/)
  })

  it('declares the opt-out after the ring, so it also wins on order', () => {
    expect(ring).toBeGreaterThan(-1)
    expect(optOut).toBeGreaterThan(ring)
  })

  it('applies to the host composer everywhere, not only inside the Bot UI', () => {
    // The composer is the shell's, so an opt-out scoped to a body attribute
    // would leave the same two lines in the main chat.
    const block = COMPONENT_CSS.slice(optOut - 1, COMPONENT_CSS.indexOf('}', optOut))
    expect(block).not.toContain(`[${BODY_ATTR}`)
    expect(block).not.toContain('_bt-')
    expect(block).not.toContain('body[')
  })
})

/**
 * The new-session button became a gradient (user report: the flat 8% accent fill
 * read as a solid block). What matters structurally is that the endpoints are
 * *derived* from the accent — 0.1.6 handed the Bot UI's accent back to ds-bot,
 * and a hard-coded stop would not survive the change — and that the hover state
 * brightens the same gradient by an animatable amount rather than swapping in a
 * second background-image (which cannot be transitioned).
 */
describe('COMPONENT_CSS — the new-session gradient', () => {
  const base = /body\[data-bloomglass-variant\]\s*button\[class\*="_newSession"\]\s*\{([^}]*)\}/.exec(COMPONENT_CSS)?.[1] ?? ''
  const hover = /body\[data-bloomglass-variant\]\s*button\[class\*="_newSession"\]:hover\s*\{([^}]*)\}/.exec(COMPONENT_CSS)?.[1] ?? ''

  it('paints the gradient on the button only, never on the parts inside it', () => {
    // Owner report, second pass (2026-10-16): the new gradient read as "分了几块
    // 渐变色区域". The button's own children carry the same class fragment —
    // …_newSessionLabelMask / …_newSessionContent / …_newSessionLabel /
    // …_newSessionShortcut — so an unqualified [class*="_newSession"] painted a
    // copy of the gradient inside every one of those boxes, and tinted the
    // shortcut. The tag qualifier is what keeps it to the button's own box.
    expect(base).not.toBe('')
    expect(COMPONENT_CSS).not.toMatch(/body\[data-bloomglass-variant\]\s*\[class\*="_newSession"\]\s*\{/)
  })

  it('gives the shortcut hint text only, hidden until the button is hovered', () => {
    // "另外这个按钮的快捷键提示不需要渐变色也不要明显色块，只显示字（鼠标光标
    // 没有移动到按钮上面时，字隐藏）" — the host already hides it with opacity 0
    // and lifts it on :hover/:focus-visible; the theme adds the colour and a
    // transition, and pins the background off whatever the host paints there.
    const shortcut = /body\[data-bloomglass-variant\]\s*button\[class\*="_newSession"\]\s*\[class\*="_newSessionShortcut"\]\s*\{([^}]*)\}/.exec(COMPONENT_CSS)?.[1] ?? ''
    expect(shortcut).toContain('background: none')
    expect(shortcut).toContain('border: 0')
    expect(shortcut).toContain('opacity: 0')
    expect(shortcut).not.toContain('gradient')
    const shown = /body\[data-bloomglass-variant\]\s*button\[class\*="_newSession"\]:is\(:hover,\s*:focus-visible\)\s*\[class\*="_newSessionShortcut"\]\s*\{([^}]*)\}/.exec(COMPONENT_CSS)?.[1] ?? ''
    expect(shown).toContain('opacity: 1')
  })

  it('paints a gradient whose stops all come from the accent', () => {
    expect(base).toContain('background-image: linear-gradient')
    expect(base).toContain('background-color: transparent')
    const stops = [...base.matchAll(/color-mix\(in oklch, var\(--bloom-accent/g)]
    expect(stops.length).toBeGreaterThanOrEqual(3)
    // No literal colour in the fill. The `var(--bloom-accent, #6b8f71)` fallback
    // is the usual guard for the variable being absent, not a stop.
    const withoutFallback = base.replace(/var\(--bloom-accent,\s*#[0-9a-f]{6}\)/gi, 'var(--bloom-accent)')
    expect(withoutFallback).not.toMatch(/#[0-9a-f]{3,8}\b/i)
    expect(withoutFallback).not.toMatch(/rgb\(/)
    // The three stops ramp down (18 → 9 → 4), so the fill reads as light rather
    // than a block.
    const alphas = [...base.matchAll(/calc\((\d+)% \* var\(--bloom-newchat-boost, 1\)\)/g)].map(m => Number(m[1]))
    expect(alphas).toEqual([18, 9, 4])
    // Every use carries the `, 1` fallback: without it an engine that does not
    // support @property leaves the variable unset, and an unfallbacked var()
    // makes the whole background-image invalid (no gradient at rest at all).
    expect([...base.matchAll(/var\(--bloom-newchat-boost\)/g)]).toHaveLength(0)
    expect(base).toContain(') 52%,')
  })

  it('raises the stops through an interpolatable number on hover', () => {
    // background-image cannot be transitioned, so a second, brighter gradient
    // would switch instantly (reviewer's note, 2026-10-16). A registered custom
    // property interpolates — the same @property technique the composer halo
    // uses — and the hover state only moves that number.
    expect(COMPONENT_CSS).toMatch(/@property --bloom-newchat-boost\s*\{[^}]*syntax:\s*'<number>'/)
    expect(COMPONENT_CSS).toMatch(/@property --bloom-newchat-boost\s*\{[^}]*initial-value:\s*1;/)
    expect(hover).toContain('--bloom-newchat-boost: 1.45')
    expect(hover).not.toContain('background-image')
    expect(hover).not.toContain('background-color:')
    // 18 / 9 / 4 × 1.45 = 26.1 / 13.05 / 5.8 — the brightness the old hover had.
    expect(base).toContain('--bloom-newchat-boost var(')
  })
})

/**
 * Windows draws the caption itself (titleBarStyle 'hidden' + titleBarOverlay), so
 * the theme cannot style a titlebar element — it can only seed the colour the
 * Desktop preload measures. That preload appends a bare `<span>` whose inline
 * `background-color` is `var(--dsw-specific-sidebar-fill)` and hands the sampled
 * rgba to `setTitleBarOverlay`. Frosted mode re-expresses that same token as a
 * translucent plate (the sidebar's glass face reads it), which made the caption
 * see-through — user report 2026-10-19: "最上端的窗口栏是透明的，改为纯色".
 * The fix re-points the token on the probe only.
 */
describe('COMPONENT_CSS — the Windows caption colour', () => {
  const selector = 'body[data-bloomglass-variant] > span[style*="--dsw-specific-sidebar-fill"]'
  const block = /body\[data-bloomglass-variant\]\s*>\s*span\[style\*="--dsw-specific-sidebar-fill"\]\s*\{([^}]*)\}/.exec(COMPONENT_CSS)?.[1] ?? ''

  it('pins the probe to the unfrosted sidebar fill', () => {
    expect(block).not.toBe('')
    expect(block).toContain('--dsw-specific-sidebar-fill: var(--bloom-sidebar-solid)')
    // No `!important`: the probe declares no inline value for the custom property,
    // so an element-level declaration already beats inheritance from body.
    expect(block).not.toContain('!important')
  })

  it('leaves the token on body alone, so the sidebar keeps its glass face', () => {
    // glass-css.ts paints the sidebar plate with var(--dsw-specific-sidebar-fill);
    // redefining it on body would swap the glass for an opaque slab.
    expect(COMPONENT_CSS).not.toMatch(/body\[data-bloomglass-variant\]\s*\{[^}]*--dsw-specific-sidebar-fill/)
  })

  it('matches the probe the Desktop preload appends, and nothing else', () => {
    // Mirrors `probe.style.cssText` in lib/preload-windows.js.
    const attribute = 'data-bloomglass-variant'
    document.body.setAttribute(attribute, 'mist')
    const probe = document.createElement('span')
    probe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;background-color:var(--dsw-specific-sidebar-fill);color:var(--dsw-alias-label-primary)'
    const otherTag = document.createElement('div')
    otherTag.style.cssText = 'background-color:var(--dsw-specific-sidebar-fill)'
    const nested = document.createElement('div')
    const nestedSpan = document.createElement('span')
    nestedSpan.style.cssText = 'background-color:var(--dsw-specific-sidebar-fill)'
    nested.append(nestedSpan)
    document.body.append(probe, otherTag, nested)
    try {
      expect(probe.matches(selector)).toBe(true)
      // Only the body-level <span> probe is the caption's colour source.
      expect(otherTag.matches(selector)).toBe(false)
      expect(nestedSpan.matches(selector)).toBe(false)
    } finally {
      nested.remove()
      otherTag.remove()
      probe.remove()
      document.body.removeAttribute(attribute)
    }
  })
})

/**
 * What the eye sees at the top of a Windows window is not the native caption but
 * a strip the page paints itself: AppFrame gives `.frame` a caption-height top
 * padding and `.frame::before` the same fill, both from
 * `var(--dsw-specific-sidebar-fill)`. In frosted mode that token is a translucent
 * plate, so the strip let the wallpaper through (user report 2026-10-19, and the
 * caption-colour fix alone changed nothing visible). The strip alone gets the
 * solid tone; the frame's own background has to keep the plate, because the
 * columns are transparent and the wallpaper shows through it.
 */
describe('COMPONENT_CSS — the Windows title strip', () => {
  const selector = 'html[data-windows-titlebar] body[data-bloomglass-variant] [class*="_frame"]::before'
  const block = /html\[data-windows-titlebar\]\s*body\[data-bloomglass-variant\]\s*\[class\*="_frame"\]::before\s*\{([^}]*)\}/.exec(COMPONENT_CSS)?.[1] ?? ''

  it('paints the strip with the unfrosted tone', () => {
    expect(block).not.toBe('')
    expect(block).toContain('background: var(--bloom-sidebar-solid)')
    expect(block).not.toContain('--dsw-specific-sidebar-fill')
  })

  it('never repaints the frame itself, or the wallpaper disappears', () => {
    // A background on [class*="_frame"] (no ::before) would sit behind the three
    // transparent columns and hide the wallpaper everywhere.
    expect(COMPONENT_CSS).not.toMatch(/\[class\*="_frame"\]\s*\{[^}]*background/)
  })

  it('outranks the host rule, which is (0,2,1)', () => {
    // Host: [data-windows-titlebar] .frame:before. Ours adds an element (html),
    // an element (body) and a second attribute selector, so it wins by cascade
    // order-independence rather than by !important.
    expect(selector).toContain('html[data-windows-titlebar]')
    expect(selector).toContain('body[data-bloomglass-variant]')
    expect(block).not.toContain('!important')
  })

  it('matches the real AppFrame class and attributes', () => {
    document.documentElement.setAttribute('data-windows-titlebar', '')
    document.body.setAttribute('data-bloomglass-variant', 'mist')
    const frame = document.createElement('div')
    frame.className = 'BynINW_frame'
    document.body.append(frame)
    try {
      // The pseudo-element cannot be matched in jsdom, so match its host part.
      expect(frame.matches('html[data-windows-titlebar] body[data-bloomglass-variant] [class*="_frame"]')).toBe(true)
      frame.className = 'BynINW_centerCol'
      expect(frame.matches('html[data-windows-titlebar] body[data-bloomglass-variant] [class*="_frame"]')).toBe(false)
    } finally {
      frame.remove()
      document.body.removeAttribute('data-bloomglass-variant')
      document.documentElement.removeAttribute('data-windows-titlebar')
    }
  })
})


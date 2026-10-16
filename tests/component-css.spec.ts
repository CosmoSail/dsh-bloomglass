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
  const base = /body\[data-bloomglass-variant\]\s*\[class\*="_newSession"\]\s*\{([^}]*)\}/.exec(COMPONENT_CSS)?.[1] ?? ''
  const hover = /body\[data-bloomglass-variant\]\s*\[class\*="_newSession"\]:hover\s*\{([^}]*)\}/.exec(COMPONENT_CSS)?.[1] ?? ''

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

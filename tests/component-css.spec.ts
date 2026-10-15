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

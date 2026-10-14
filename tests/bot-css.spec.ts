import { describe, expect, it } from 'vitest'
import { BODY_ATTR, FROST_ATTR } from '../src/client/constants.ts'
import { BOT_CSS, BOT_GLASS_CSS } from '../src/client/css/bot-css.ts'

/** Short aliases: the bridge and the frost sheet are both keyed on body attributes. */
const MR = BODY_ATTR
const FR = FROST_ATTR

describe('BOT_CSS — the ds-bot palette bridge', () => {
  it('re-points every role at a DSH token rather than a literal colour', () => {
    const mapped = [...BOT_CSS.matchAll(/(--bt-[a-z0-9-]+)\s*:\s*([^;]+);/g)]
    expect(mapped.length).toBeGreaterThan(0)
    for (const [, name, value] of mapped) {
      expect(value.trim(), `${name} must resolve through the theme's token layer`)
        .toMatch(/^var\(--dsw-/)
    }
  })

  it('covers the roles ds-bot actually paints with', () => {
    const names = new Set([...BOT_CSS.matchAll(/(--bt-[a-z0-9-]+)\s*:/g)].map(match => match[1]))
    const roles = [
      '--bt-ink', '--bt-ink-2', '--bt-ink-3',
      '--bt-line', '--bt-line-2',
      '--bt-main', '--bt-sidebar', '--bt-card', '--bt-bubble',
      '--bt-hover', '--bt-active',
      '--bt-accent', '--bt-accent-ink',
      '--bt-green', '--bt-star',
      '--bt-tag-bg', '--bt-tag-ink',
      '--bt-user', '--bt-user-ink',
    ]
    expect(roles.filter(role => !names.has(role))).toEqual([])
  })

  it('outranks the stylesheet ds-bot injects after this one', () => {
    // ds-bot writes the same variables on `html body` (0,0,2) and
    // `html body[data-ds-dark-theme]` (0,1,2) from a tag appended at its own
    // mount, i.e. later than the theme's; an equal-specificity rule would lose.
    expect(BOT_CSS).toContain(`html body[${MR}]`)
    expect(BOT_CSS).toContain(`html body[${MR}][data-ds-dark-theme]`)
    expect(BOT_CSS).not.toMatch(/^body\[/m)
  })

  it('leaves the avatar inks alone', () => {
    // `--bt-ink-<name>` picks a Bot's avatar colour (ds-bot's INKS table), and
    // the two opacity roles are the only numeric ones. Bridging a named ink
    // would repaint every avatar in the team.
    expect([...BOT_CSS.matchAll(/--bt-ink-[a-z][a-z0-9-]*\s*:/g)]).toHaveLength(0)
  })
})

describe('BOT_GLASS_CSS — frost over the Bot UI', () => {
  it('gates every rule on both body attributes', () => {
    const opened = BOT_GLASS_CSS.match(/body\[/g)?.length ?? 0
    const gated = BOT_GLASS_CSS.match(new RegExp(`body\\[${MR}\\]\\[${FR}\\]`, 'g'))?.length ?? 0
    expect(opened).toBeGreaterThan(0)
    expect(gated).toBe(opened)
  })

  it('plates the fixed panels on a pseudo-element, never on the panel', () => {
    // A backdrop-filter on .bt-panel would make it a containing block and
    // re-anchor the position: fixed menus rendered inside it.
    const panel = new RegExp(`body\\[${MR}\\]\\[${FR}\\]\\s*:is\\(\\.bt-panel, \\.bt-pane\\)\\s*\\{([^}]*)\\}`)
    const declarations = panel.exec(BOT_GLASS_CSS)?.[1] ?? ''
    expect(declarations).toContain('background-color: transparent')
    expect(declarations).not.toMatch(/backdrop-filter/)

    const plate = new RegExp(`:is\\(\\.bt-panel, \\.bt-pane\\)::before\\s*\\{([^}]*)\\}`)
    const body = plate.exec(BOT_GLASS_CSS)?.[1] ?? ''
    expect(body).toContain('position: absolute')
    expect(body).toContain('inset: 0')
    expect(body).toContain('backdrop-filter')
    expect(body).toContain('var(--dsw-alias-bg-layer-1)')
  })

  it('hands the DSH composer card back to the theme plate', () => {
    // ds-bot repaints [data-composer-card] with its own fill and !important, so
    // the rule needs !important too, on a more specific selector.
    expect(BOT_GLASS_CSS).toMatch(/\[data-composer-card\]\s*\{[^}]*background-color:\s*transparent\s*!important/)
  })

  it('consumes only variables the presenter publishes', () => {
    const published = new Set(['--bloom-glass-blur', '--fw-saturate', '--fw-dim', '--bloom-ambience'])
    const consumed = [...BOT_GLASS_CSS.matchAll(/var\((--[\w-]+)/g)].map(match => match[1])
    const frostOwned = consumed.filter(name => name.startsWith('--fw-') || name.startsWith('--bloom-'))
    expect(frostOwned.length).toBeGreaterThan(0)
    for (const name of frostOwned) {
      expect(published.has(name), `${name} is consumed but never published`).toBe(true)
    }
  })

  it('honours prefers-reduced-transparency', () => {
    const reduced = /@media \(prefers-reduced-transparency: reduce\)\s*\{([\s\S]*)\}\s*$/
    const block = reduced.exec(BOT_GLASS_CSS)?.[1] ?? ''
    expect(block).toContain('.bt-panel')
    expect(block).toContain('.bt-menu')
    expect(block).toContain('.bt-settings')
    expect(block).toContain('backdrop-filter: none')
  })
})

import { describe, expect, it } from 'vitest'
import { BODY_ATTR, FROST_ATTR } from '../src/client/constants.ts'
import { BOT_CSS, BOT_GLASS_CSS } from '../src/client/css/bot-css.ts'

/** Short aliases: the bridge and the frost sheet are both keyed on body attributes. */
const MR = BODY_ATTR
const FR = FROST_ATTR

describe('BOT_CSS — the ds-bot palette bridge', () => {
  it('re-points every role at a token rather than a literal colour', () => {
    const mapped = [...BOT_CSS.matchAll(/(--bt-[a-z0-9-]+)\s*:\s*([^;]+);/g)]
    expect(mapped.length).toBeGreaterThan(0)
    for (const [, name, value] of mapped) {
      // `--bt-` counts as well: the user's voice is deliberately the send
      // button's own pair (`--bt-accent` / `--bt-accent-ink`) rather than a copy
      // of its colour, so the two can never drift apart.
      expect(value.trim(), `${name} must resolve through the token layer`)
        .toMatch(/var\(--(dsw|bloom|bt)-/)
      expect(value.trim(), `${name} must not be a literal colour`)
        .not.toMatch(/^#[0-9a-f]{3,8}\b/i)
    }
  })

  it('gives the user voice the composer send button’s own pair, solid', () => {
    // ds-bot fills `[data-composer-card] button[class*="_primary"]` with
    // --bt-accent and inks it with --bt-accent-ink, and paints every user-side
    // surface from --bt-user/--bt-user-ink. Pointing the user's pair at the
    // button's pair is what makes the bubble *the button's colour* in every
    // palette and scheme, since both are custom properties resolved at use time.
    // No veil: the button is an opaque fill, and any transparency would
    // composite the bubble to a colour the button does not have.
    expect(BOT_CSS).toMatch(/--bt-user:\s*var\(--bt-accent\)/)
    expect(BOT_CSS).toMatch(/--bt-user-ink:\s*var\(--bt-accent-ink\)/)
    expect(BOT_CSS).not.toMatch(/--bt-user:\s*color-mix/)
    expect(BOT_CSS).not.toMatch(/--bt-user-ink:\s*var\(--dsw-alias-label-primary\)/)
  })

  it('builds a covering plate for the one strip that scrolls over text', () => {
    // The exchange sheet's composer footer scrolls over its own transcript, so it
    // keeps the near-solid cover recipe instead of a share of the density; every
    // other covering surface takes the overlay glass (checked below).
    expect(BOT_CSS).toMatch(/--bt-glass-cover:\s*color-mix\(in oklab, var\(--dsw-alias-bg-overlay\), var\(--bloom-surface-solid, var\(--dsw-alias-bg-layer-1\)\)/)
    expect(BOT_GLASS_CSS).toMatch(/\.bt-exchange \.bt-dialog-foot\s*\{[^}]*background-color:\s*var\(--bt-glass-cover\)/)
    expect(BOT_GLASS_CSS).toMatch(/\.bt-exchange \.bt-dialog-foot::before\s*\{[^}]*linear-gradient\(to top, var\(--bt-glass-cover\), transparent\)/)
    expect(BOT_GLASS_CSS).not.toMatch(/:is\(\.bt-panel, \.bt-pane\)::before\s*\{[^}]*var\(--bt-glass-cover\)/)
  })

  it('covers the roles ds-bot actually paints with', () => {
    const names = new Set([...BOT_CSS.matchAll(/(--bt-[a-z0-9-]+)\s*:/g)].map(match => match[1]))
    const roles = [
      '--bt-ink', '--bt-ink-2', '--bt-ink-3',
      '--bt-line', '--bt-line-2',
      '--bt-main', '--bt-sidebar', '--bt-card', '--bt-bubble',
      '--bt-hover', '--bt-active',
      '--bt-accent-ink',
      '--bt-green', '--bt-star',
      '--bt-tag-bg', '--bt-tag-ink',
      '--bt-user', '--bt-user-ink',
    ]
    expect(roles.filter(role => !names.has(role))).toEqual([])
  })

  it('leaves the accent fill to ds-bot’s own setting', () => {
    // The user's accent control writes `--bt-accent` into the stylesheet ds-bot
    // injects at mount, and this bridge used to outrank that write — which is
    // exactly why the control did nothing in the Bot UI. The fill is ds-bot's to
    // own; every surface that paints it (send/stop button, .bt-voice, badges,
    // switches, and the user's bubble) reads it from there.
    expect(BOT_CSS).not.toMatch(/--bt-accent\s*:/)
    expect(BOT_CSS).toMatch(/--bt-user:\s*var\(--bt-accent\)/)
  })

  it('chooses the accent ink from the accent’s own lightness', () => {
    // ds-bot's own rule is a luminance threshold at 0.45, which keeps white text
    // on colours that cannot carry it (its green swatch measures 2.19:1, orange
    // 2.64, cyan 2.21, violet 2.96, the default blue 4.33 — all below AA), and
    // that fill is also the user's bubble. The step sits just under the crossover
    // where dark and light ink swap places: measured over ds-bot's seventeen
    // swatches, its worst case is 4.65:1.
    const step = /--bt-accent-ink:\s*oklch\(from var\(--bt-accent\)\s*calc\(0\.99 - clamp\(0, \(l - 0\.513\) \* 1000, 0\.86\)\)\s*0 h\)/
    expect(BOT_CSS).toMatch(step)
    // Same specificity as the fallback rule, so it must come after it.
    const fallback = BOT_CSS.indexOf('--bt-accent-ink: var(--dsw-alias-label-primary-foreground)')
    expect(fallback).toBeGreaterThan(-1)
    expect(BOT_CSS.indexOf('@supports (color: oklch(from red l c h))')).toBeGreaterThan(fallback)
    // An engine without relative colour syntax must keep a usable ink rather
    // than inherit into an invisible one.
    expect(BOT_CSS).toMatch(/@supports \(color: oklch\(from red l c h\)\)\s*\{[\s\S]*?--bt-accent-ink:/)
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

  it('keeps control fills out of the most-veiled surface role', () => {
    // ds-bot paints round icon buttons, tab thumbs and the switch knob with
    // --bt-main; the base surface is the most veiled token there is (a fifth of
    // the glass density, floored at 8%), so at a low glass setting those
    // controls all but vanish. The floating button fill is the role the shell
    // itself uses for a control that sits on the page.
    expect(BOT_CSS).toContain('--bt-main: var(--dsw-alias-button-floating-fill)')
    expect(BOT_CSS).not.toContain('--bt-main: var(--dsw-alias-bg-base)')
  })

  it('draws badge rings in the palette opaque tone, not the veiled token', () => {
    // A ring is a knockout, not a surface: veiled it erases the gap, and the
    // crown reads as a stray star lying on the avatar.
    expect(BOT_CSS).toMatch(/\.bt-badge:not\(\.bt-badge-main\)\s*\{[^}]*box-shadow:\s*0 0 0 1\.5px var\(--bloom-sidebar-solid/)
    expect(BOT_CSS).toMatch(/\.bt-badge-main path\s*\{[^}]*stroke:\s*var\(--bloom-sidebar-solid/)
    // The couple belongs to the palette sheet, so the frost sheet must not need it.
    expect(BOT_GLASS_CSS).not.toContain('--bloom-sidebar-solid')
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
    expect(body).toContain('background-color: var(--dsw-alias-bg-overlay)')
  })

  it('runs one glass family across every covering surface', () => {
    // Sidebar column, panels, dialogs, menus, pill, cards and the settings nav
    // all take the overlay role: one recipe, so nothing reads as a flat slab next
    // to something that is glass.
    const overlay = [...BOT_GLASS_CSS.matchAll(/background-color: var\(--dsw-alias-bg-overlay\)/g)].length
    expect(overlay).toBeGreaterThanOrEqual(3)
    const blockAfter = (needle: string): string =>
      new RegExp(`${needle}[\\s\\S]*?\\{([^}]*)\\}`).exec(BOT_GLASS_CSS)?.[1] ?? ''
    expect(blockAfter(':has\\(\\.bt-side\\)')).toContain('background-color: transparent')
    expect(blockAfter('\\.bt-rail\\)\\)::before')).toContain('var(--dsw-alias-bg-overlay)')
    expect(blockAfter('\\.bt-settings-nav')).toContain('var(--dsw-alias-bg-overlay)')
  })

  it('blurs both directions of the conversation bubbles', () => {
    // Bot messages keep the theme's bubble role and its blur; the user's own is
    // the send button's solid pair, so it takes no backdrop filter — blurring
    // behind an opaque fill would cost a pass and change nothing.
    expect(BOT_GLASS_CSS).toMatch(/\.bt-bubble\s*\{[^}]*background-color:\s*var\(--dsw-specific-bubble\)[^}]*backdrop-filter/)
    const userBubble = /:is\(\.bt-ubody, \.bt-ububble\)\s*\{([^}]*)\}/.exec(BOT_GLASS_CSS)?.[1] ?? ''
    expect(userBubble).toContain('background-color: var(--bt-user)')
    expect(userBubble).not.toMatch(/backdrop-filter/)
  })

  it('densifies the exchange sheet past the point where the host chat shows', () => {
    // The sheet is the one covering surface that has to erase what is behind it:
    // a share of the glass density still lets the host conversation be read.
    const sheet = /\.bt-exchange::before\s*\{([^}]*)\}/.exec(BOT_GLASS_CSS)?.[1] ?? ''
    expect(sheet).toContain('color-mix(in oklab, var(--dsw-alias-bg-overlay), var(--bloom-surface-solid')
    expect(sheet).toMatch(/\b75%\)/)
    // The panel/dialog tier keeps the plain overlay role, and the near-solid
    // recipe stays reserved for the composer strip that scrolls over its own log.
    expect(BOT_GLASS_CSS).toMatch(/:is\(\.bt-panel, \.bt-pane\)::before\s*\{[^}]*background-color:\s*var\(--dsw-alias-bg-overlay\)/)
    expect(BOT_GLASS_CSS).not.toMatch(/:is\(\.bt-panel, \.bt-pane\)::before\s*\{[^}]*var\(--bt-glass-cover\)/)
  })

  it('hands the DSH composer card back to the theme plate', () => {
    // ds-bot repaints [data-composer-card] with its own fill and !important, so
    // the rule needs !important too, on a more specific selector.
    expect(BOT_GLASS_CSS).toMatch(/\[data-composer-card\]\s*\{[^}]*background-color:\s*transparent\s*!important/)
  })

  it('consumes only variables the theme publishes', () => {
    // Frost's own knob plus the palette sheet's opaque surface tone, which
    // bloomOwnVarsCss writes on the same body element.
    const published = new Set(['--bloom-glass-blur', '--fw-saturate', '--fw-dim', '--bloom-ambience', '--bloom-surface-solid'])
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

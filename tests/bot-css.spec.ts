import { describe, expect, it } from 'vitest'
import { BODY_ATTR, FROST_ATTR } from '../src/client/constants.ts'
import { GLASS_CSS } from '../src/client/glass-css.ts'
import { BOT_CSS, BOT_GLASS_CSS, BOT_LEFTCOL_CSS } from '../src/client/css/bot-css.ts'

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
    expect(BOT_GLASS_CSS).not.toMatch(/:is\(\.bt-panel, \.bt-pane\)::after\s*\{[^}]*var\(--bt-glass-cover\)/)
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

  it('chooses the accent ink from the accent’s own luminance, as a step', () => {
    // ds-bot's own rule is a luminance threshold at 0.45, which keeps white text
    // on colours that cannot carry it (its green swatch measures 2.19:1, orange
    // 2.64, cyan 2.21, violet 2.96, the default blue 4.33 — all below AA), and
    // that fill is also the user's bubble. Two inks are equally readable only
    // where their contrasts cross, and black against white cross at 4.58:1 — the
    // best a two-ink rule can do — so the choice has to be a step on the accent's
    // relative luminance, which xyz-d65 exposes as its y channel: the very
    // quantity the contrast ratio is built from.
    const ink = /--bt-accent-ink:\s*color\(from var\(--bt-accent\) xyz-d65([\s\S]*?)\);/.exec(BOT_CSS)?.[1] ?? ''
    expect(ink).toContain('0.1791 - y')
    expect(ink).toContain('0.9505')
    expect(ink).toContain('1.089')
    // The multiplier keeps the changeover 1e-9 wide; the nearest 8-bit colour on
    // the side a ramp can degrade (#915bcd, under the CSS Color 4 matrix the
    // engine reads y through) is 1.18e-8 away, so no accent a picker can produce
    // lands on a mid-grey ink at its own lightness (the ~1:1 hole a ramp opens).
    expect(ink).toContain('1000000000')
    expect(BOT_CSS).not.toMatch(/--bt-accent-ink:\s*oklch\(/)
    // Same specificity as the fallback rule, so it must come after it.
    const fallback = BOT_CSS.indexOf('--bt-accent-ink: var(--dsw-alias-label-primary-foreground)')
    expect(fallback).toBeGreaterThan(-1)
    expect(BOT_CSS.indexOf('@supports (color: color(from red xyz-d65 x y z))')).toBeGreaterThan(fallback)
    // An engine without relative colour syntax must keep a usable ink rather
    // than inherit into an invisible one.
    expect(BOT_CSS).toMatch(/@supports \(color: color\(from red xyz-d65 x y z\)\)\s*\{[\s\S]*?--bt-accent-ink:/)
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

    const plate = new RegExp(`:is\\(\\.bt-panel, \\.bt-pane\\)::after\\s*\\{([^}]*)\\}`)
    const body = plate.exec(BOT_GLASS_CSS)?.[1] ?? ''
    expect(body).toContain('position: absolute')
    expect(body).toContain('inset: 0')
    expect(body).toContain('backdrop-filter')
    expect(body).toContain('background-color: var(--dsw-alias-bg-overlay)')
    // ds-bot's Windows caption band owns ::before on these same elements; the
    // theme must not plate it there (see the cascade test below).
    expect(BOT_GLASS_CSS).not.toMatch(/:is\(\.bt-panel, \.bt-pane\)::before/)
  })

  it('keeps the plate whole under ds-bot’s Windows caption band', () => {
    // Regression pin for 1.0.4. ds-bot 0.2.x paints a caption band on
    // `:is(.bt-pane,.bt-panel)::before` with `height: var(--bt-caption-band)`,
    // and in the installed shell that resolves to 0px (the frame already clears
    // the title bar). The theme never reset that height — it only declared
    // inset — so while the plate shared the pseudo-element the band won the
    // height and the panel became a hole onto the unblurred wallpaper. Plating
    // ::after keeps the two declarations off each other's element, and keeps the
    // band's `-webkit-app-region: drag` off the panel body.
    const html = document.documentElement
    html.setAttribute('data-windows-titlebar', '')
    document.body.setAttribute(MR, '')
    document.body.setAttribute(FR, '')
    const panel = document.createElement('aside')
    panel.className = 'bt-panel'
    const sheet = document.createElement('aside')
    sheet.className = 'bt-pane bt-exchange'
    document.body.append(panel, sheet)
    try {
      // Theme first, ds-bot after: the real load order, since ds-bot injects its
      // sheet from its own mount, later than the theme's tag.
      const loadOrder = `${BOT_GLASS_CSS}\n${DS_BOT_BAND}`
      const band = declaredOn(loadOrder, panel, '::before')
      const plate = declaredOn(loadOrder, panel, '::after')

      // The band still owns ::before — that is the whole point of the split.
      expect(band.height).toContain('--bt-caption-band')
      expect(band['-webkit-app-region']).toBe('drag')
      expect(band.inset).toBeUndefined()
      expect(band['backdrop-filter']).toBeUndefined()

      // The plate owns ::after: full height by inset, and no height declaration
      // anywhere that could compress it.
      expect(plate.inset).toBe('0')
      expect(plate.height).toBeUndefined()
      expect(plate.position).toBe('absolute')
      expect(plate['z-index']).toBe('-1')
      expect(plate['pointer-events']).toBe('none')
      expect(plate['backdrop-filter']).toContain('blur(var(--bloom-glass-blur))')
      expect(plate['background-color']).toBe('var(--dsw-alias-bg-overlay)')

      // No drag region rides along with the plate onto the panel body.
      expect(plate['-webkit-app-region']).toBeUndefined()

      // The exchange sheet is the same plate, densified, at full height too.
      const cover = declaredOn(loadOrder, sheet, '::after')
      expect(cover['background-color']).toContain('color-mix(in oklab')
      expect(cover.inset).toBe('0')
      expect(cover.height).toBeUndefined()
      expect(cover['background-color']).not.toBe('var(--dsw-alias-bg-overlay)')
    } finally {
      panel.remove()
      sheet.remove()
      document.body.removeAttribute(MR)
      document.body.removeAttribute(FR)
      html.removeAttribute('data-windows-titlebar')
    }
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
    const sheet = /\.bt-exchange::after\s*\{([^}]*)\}/.exec(BOT_GLASS_CSS)?.[1] ?? ''
    expect(sheet).toContain('color-mix(in oklab, var(--dsw-alias-bg-overlay), var(--bloom-surface-solid')
    expect(sheet).toMatch(/\b75%\)/)
    // The panel/dialog tier keeps the plain overlay role, and the near-solid
    // recipe stays reserved for the composer strip that scrolls over its own log.
    expect(BOT_GLASS_CSS).toMatch(/:is\(\.bt-panel, \.bt-pane\)::after\s*\{[^}]*background-color:\s*var\(--dsw-alias-bg-overlay\)/)
    expect(BOT_GLASS_CSS).not.toMatch(/:is\(\.bt-panel, \.bt-pane\)::after\s*\{[^}]*var\(--bt-glass-cover\)/)
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
    expect(block).toContain('::after')
    expect(block).toContain('backdrop-filter: none')
  })
})

/* ── A miniature cascade, just enough to answer one question ────────────────
   Which pseudo-element does each declaration land on? jsdom cannot compute
   styles for pseudo-elements, so this walks the real rule text, matches the
   host part of every selector with the engine's own `matches()`, and merges the
   declarations of the pseudo-element asked for, in source order. */

/** ds-bot 0.2.2's Windows caption band, copied verbatim from its client.js. */
const DS_BOT_BAND = `
html[data-windows-titlebar]:not([data-fullscreen]) :is(.bt-pane,.bt-panel){--bt-caption-band:calc(var(--dsh-windows-titlebar-height,0px) - var(--dsh-frame-chrome-top,0px));padding-top:var(--bt-caption-band)}
html[data-windows-titlebar]:not([data-fullscreen]) :is(.bt-pane,.bt-panel)::before{content:"";position:absolute;top:0;left:0;right:0;height:var(--bt-caption-band);-webkit-app-region:drag}
`

/** The sheet's top-level style rules; at-rules are skipped whole. */
function topLevelRules(css: string): { selector: string; body: string }[] {
  const rules: { selector: string; body: string }[] = []
  let start = 0
  for (let at = css.indexOf('{'); at >= 0; at = css.indexOf('{', start)) {
    let depth = 0
    let end = at
    for (; end < css.length; end++) {
      if (css[end] === '{') depth++
      else if (css[end] === '}' && --depth === 0) break
    }
    const selector = css.slice(start, at).trim()
    // A nested rule's "selector" is the tail of its parent's body; only the
    // top-level rules are wanted, and a leading `@` marks an at-rule.
    if (!selector.includes('@') && selector.length > 0) {
      rules.push({ selector, body: css.slice(at + 1, end) })
    }
    start = end + 1
  }
  return rules
}

/** Split a selector list on the commas that separate rules (`:is(a, b)` keeps its own). */
function selectorList(list: string): string[] {
  const out: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i < list.length; i++) {
    const ch = list[i]
    if (ch === '(' || ch === '[') depth++
    else if (ch === ')' || ch === ']') depth--
    else if (ch === ',' && depth === 0) {
      out.push(list.slice(start, i).trim())
      start = i + 1
    }
  }
  out.push(list.slice(start).trim())
  return out.filter(Boolean)
}

/** Every declaration that reaches `el`'s `pseudo` element, later rules winning. */
function declaredOn(css: string, el: Element, pseudo: '::before' | '::after'): Record<string, string> {
  const out: Record<string, string> = {}
  for (const rule of topLevelRules(css.replace(/\/\*[\s\S]*?\*\//g, ''))) {
    const hits = selectorList(rule.selector).some(selector => {
      if (!selector.endsWith(pseudo)) return false
      const host = selector.slice(0, -pseudo.length).trim()
      try {
        return el.matches(host)
      } catch {
        // A selector jsdom cannot parse must not be silently taken as a match.
        return false
      }
    })
    if (!hits) continue
    for (const declaration of rule.body.split(';')) {
      const colon = declaration.indexOf(':')
      if (colon < 0) continue
      out[declaration.slice(0, colon).trim()] = declaration.slice(colon + 1).trim()
    }
  }
  return out
}

/* ── ds-bot 0.2.4: the Bot list moved out of the shell's sidebar slot ───────
   The list is now `createPortal`ed into a body-level `<div class="bt-leftcol">`
   and the shell column collapses to width 0, so every in-slot selector in
   BOT_GLASS_CSS stops matching. These pin the sheet that covers the portal. */

function leftColumn(attrs: string): HTMLElement {
  const column = document.createElement('div')
  column.className = 'bt-leftcol'
  for (const pair of attrs.split(' ').filter(Boolean)) {
    const [name, value = ''] = pair.split('=')
    column.setAttribute(name!, value)
  }
  document.body.append(column)
  return column
}

describe('BOT_LEFTCOL_CSS — ds-bot 0.2.4’s portalled left column', () => {
  it('gives the portal column the shell column’s seam and glass', () => {
    // The seam the shell column has: the accent tint over layer-1 plus the
    // outward accent glow (no hairline — the theme zeroes the column's border for
    // the same reason), so the portal column does not read as a different panel.
    expect(BOT_LEFTCOL_CSS).toMatch(/\.bt-leftcol\s*\{[^}]*border-right:\s*0/)
    expect(BOT_LEFTCOL_CSS).toMatch(/\.bt-leftcol::after\s*\{[^}]*background-color:\s*color-mix\(in oklch, var\(--bloom-accent/)
    // The glow rides the glass box (which starts under the title band), not the
    // full-height column: on the column it spilled over the title strip.
    expect(BOT_LEFTCOL_CSS).toMatch(/\.bt-leftcol::before\s*\{[^}]*box-shadow:\s*24px 0 40px -24px color-mix\(in oklch, var\(--bloom-accent/)
    expect(BOT_LEFTCOL_CSS).not.toMatch(/\.bt-leftcol\s*\{[^}]*box-shadow:[^}]*24px 0 40px -24px/)
    // The column runs to the window's top edge and shares the title band, so the
    // band above --bt-lc-clear keeps the opaque tone the titlebar strip is
    // painted with; the glass starts below it.
    expect(BOT_LEFTCOL_CSS).toMatch(/linear-gradient\(to bottom,\s*var\(--bloom-sidebar-solid, var\(--bt-sidebar\)\) 0,\s*var\(--bloom-sidebar-solid, var\(--bt-sidebar\)\) var\(--bt-lc-clear/)
    // The plate: never a filter on the column itself (it now hosts the whole
    // portal subtree, dialogs included), and never above the title band.
    expect(BOT_LEFTCOL_CSS).toMatch(/\.bt-leftcol::before\s*\{[^}]*position:\s*absolute/)
    expect(BOT_LEFTCOL_CSS).toMatch(/\.bt-leftcol::before\s*\{[^}]*inset:\s*var\(--bt-lc-clear/)
    expect(BOT_LEFTCOL_CSS).toMatch(/\.bt-leftcol::before\s*\{[^}]*z-index:\s*-1/)
    expect(BOT_LEFTCOL_CSS).toMatch(/\.bt-leftcol::before\s*\{[^}]*pointer-events:\s*none/)
    expect(BOT_LEFTCOL_CSS).toMatch(/\.bt-leftcol::before\s*\{[^}]*backdrop-filter:\s*blur\(var\(--bloom-glass-blur/)
    // Nothing here may shout: the sheet has to lose to ds-bot's own drawer fill
    // on specificity alone, which it does at (0,2,2) against (0,2,0).
    expect(BOT_LEFTCOL_CSS).not.toContain('!important')
  })

  it('hands the portal column to the family glass under frost, and keeps the drawer dense', () => {
    const html = document.documentElement
    html.setAttribute('data-windows-titlebar', '')
    document.body.setAttribute(MR, '')
    document.body.setAttribute(FR, 'dark')
    const column = leftColumn('data-left=dock')
    const drawer = leftColumn('data-left=drawer')
    try {
      // Cascade the sheet the way the browser would for the two states.
      const dockPlate = declaredOn(BOT_LEFTCOL_CSS, column, '::before')
      // The classic sidebar's plate token, not the details panel's overlay role:
      // the owner asked for the two columns to match in transparency/brightness.
      expect(dockPlate['background-color']).toBe('var(--dsw-specific-sidebar-fill)')
      expect(dockPlate['background-color']).not.toBe('var(--dsw-alias-bg-overlay)')
      expect(dockPlate['backdrop-filter']).toContain('blur(var(--bloom-glass-blur))')
      expect(dockPlate['backdrop-filter']).toContain('saturate(var(--fw-saturate')
      expect(dockPlate.inset).toContain('var(--bt-lc-clear')
      // The shell's -2px overhang is clipped by its own overflow: hidden, so the
      // visible bleed is zero; this column has no overflow (it hosts ds-bot's
      // portalled popovers), so it must not copy the parameter.
      expect(dockPlate.inset).not.toContain('-2px')
      expect(dockPlate['z-index']).toBe('-1')

      // The drawer floats over the conversation: the exchange sheet's denser
      // cover, which is the only recipe that leaves nothing readable behind it.
      const drawerPlate = declaredOn(BOT_LEFTCOL_CSS, drawer, '::before')
      expect(drawerPlate['background-color']).toContain('color-mix(in oklab')
      expect(drawerPlate['background-color']).toMatch(/\b75%\)/)
      expect(drawerPlate['background-color']).not.toBe('var(--dsw-alias-bg-overlay)')

      // The frost rules are gated on both body attributes, like the rest.
      const frostRules = [...BOT_LEFTCOL_CSS.matchAll(/body\[[^\]]+\]\[[^\]]+\]\.bt-leftcol|body\[[^\]]+\]\[[^\]]+\] \.bt-leftcol/g)]
      expect(frostRules.length).toBeGreaterThanOrEqual(2)

      // Reduced transparency drops the blur instead of leaving it on.
      const reduced = /@media \(prefers-reduced-transparency: reduce\)\s*\{([\s\S]*)\}\s*$/.exec(BOT_LEFTCOL_CSS)?.[1] ?? ''
      expect(reduced).toContain('.bt-leftcol::before')
      expect(reduced).toContain('backdrop-filter: none')
    } finally {
      column.remove()
      drawer.remove()
      document.body.removeAttribute(MR)
      document.body.removeAttribute(FR)
      html.removeAttribute('data-windows-titlebar')
    }
  })

  it('copies the classic sidebar’s glass chain instead of approximating it', () => {
    // The owner compared the portal column against the classic agent sidebar in
    // the running app: transparency, brightness and frost have to agree. The
    // classic chain is GLASS_CSS's sidebar plate (`--dsw-specific-sidebar-fill`,
    // the shell's -2px overhang, the blur knob) *plus* the column's own accent
    // tint and top wash from bloom-glass.ts / bloom-component.ts. Copying the
    // numbers by eye got the plate token wrong (`--dsw-alias-bg-overlay`, the
    // details panel's role, .77 instead of .55) and dropped the tint, which is
    // exactly what looks heavier and flatter. So this pins *sameness*, not values.
    // The shared plate rule (one recipe for every column) carries the blur pair;
    // the sidebar-specific rule adds its own fill token and the -2px overhang.
    expect(GLASS_CSS).toMatch(/:has\(> \[data-slot='sidebar'\]\)::before,\s*\n[^{]*\{[^}]*blur\(var\(--bloom-glass-blur\)\) saturate\(var\(--fw-saturate\)\)/)
    const classicPlate = /:has\(> \[data-slot='sidebar'\]\)::before\s*\{([^}]*)\}/.exec(GLASS_CSS)?.[1] ?? ''
    expect(classicPlate).toContain('var(--dsw-specific-sidebar-fill)')
    expect(classicPlate).toContain('inset: 0 -2px 0 0')

    const portalBlock = new RegExp(`body\\[[^\\]]+\\]\\[${FR}\\]\\s*\\.bt-leftcol::before\\s*\\{([^}]*)\\}`).exec(BOT_LEFTCOL_CSS)?.[1] ?? ''
    expect(portalBlock).toContain('background-color: var(--dsw-specific-sidebar-fill)')
    expect(portalBlock).toContain('blur(var(--bloom-glass-blur))')
    expect(portalBlock).toContain('saturate(var(--fw-saturate')
    // Same *visible* geometry: the shell's -2px overhang is clipped by its own
    // overflow: hidden, so copying the number here would paint a 2px band over the
    // conversation (this column cannot take overflow: hidden — ds-bot portals its
    // popovers into it).
    expect(portalBlock).not.toContain('-2px')

    // Dark mode has a competitor the light branch does not: the always-on accent
    // plate is `html body[…][data-ds-dark-theme] .bt-leftcol::before` at (0,3,3),
    // and a bare `body[…]` frost rule (0,3,2) loses to it. Measured on the running
    // app, that painted the accent plate — oklch(0.42 …/.557) — instead of the
    // sidebar fill the classic column uses, oklch(0.26 …/.46).
    //
    // The assertion has to read the frost *plate* rule's own block: a plain
    // toMatch(/html body…[frost]…/) is also satisfied by the reduced-transparency
    // block at the end of the sheet, so dropping `html` from the plate rule would
    // still pass (质检 proved that with a mutation). There are exactly two blocks
    // with that selector shape — the plate and the media override — and they must
    // come in that order.
    const frostBlocks = [...BOT_LEFTCOL_CSS.matchAll(
      new RegExp(`html body\\[[^\\]]+\\]\\[${FR}\\]\\s*\\.bt-leftcol::before\\s*\\{([^}]*)\\}`, 'g'),
    )].map(match => match[1] ?? '')
    expect(frostBlocks).toHaveLength(2)
    expect(frostBlocks[0]).toContain('background-color: var(--dsw-specific-sidebar-fill)')
    expect(frostBlocks[0]).toContain('blur(var(--bloom-glass-blur))')
    expect(frostBlocks[0]).toContain('saturate(var(--fw-saturate')
    expect(frostBlocks[1]).toContain('backdrop-filter: none')
    // ... and the frost plate must come after the dark accent plate in the sheet.
    const darkPlateAt = BOT_LEFTCOL_CSS.indexOf('[data-ds-dark-theme] .bt-leftcol::before')
    const frostPlateAt = BOT_LEFTCOL_CSS.search(new RegExp(`html body\\[[^\\]]+\\]\\[${FR}\\]\\s*\\.bt-leftcol::before`))
    expect(darkPlateAt).toBeGreaterThan(-1)
    expect(frostPlateAt).toBeGreaterThan(darkPlateAt)
    // ... and the reduced-transparency override has to clear the same bar.
    const reduced = /@media \(prefers-reduced-transparency: reduce\)\s*\{([\s\S]*)\}\s*$/.exec(BOT_LEFTCOL_CSS)?.[1] ?? ''
    expect(reduced).toMatch(new RegExp(`html body\\[[^\\]]+\\]\\[${FR}\\]\\s*\\.bt-leftcol::before`))

    // ... and the tint + wash that sit above the plate in the classic column. They
    // ride ::after, because the portal column is a stacking context (ds-bot makes
    // it position: fixed; z-index: 25) and a negative-z child would otherwise put
    // the plate *above* the tint — the two translucent layers do not commute.
    expect(BOT_LEFTCOL_CSS).toMatch(/\.bt-leftcol::after\s*\{[^}]*background-color:\s*color-mix\(in oklch, var\(--bloom-accent, #6b8f71\), var\(--dsw-alias-bg-layer-1, #fff\) 94%\)/)
    expect(BOT_LEFTCOL_CSS).toMatch(/\.bt-leftcol::after\s*\{[^}]*background-image:\s*linear-gradient\(to bottom,\s*color-mix\(in oklch, var\(--bloom-accent, #6b8f71\), transparent 94%\),\s*transparent 120px\)/)
    expect(BOT_LEFTCOL_CSS).toMatch(/\.bt-leftcol::after\s*\{[^}]*z-index:\s*-1/)
    // The tint must sit above the plate: same z-index, later in tree order.
    const plateAt = BOT_LEFTCOL_CSS.indexOf('.bt-leftcol::before')
    const tintAt = BOT_LEFTCOL_CSS.indexOf('.bt-leftcol::after')
    expect(plateAt).toBeGreaterThan(-1)
    expect(tintAt).toBeGreaterThan(plateAt)
  })

  it('keeps the in-slot column treatment for a ds-bot that still renders there', () => {
    // 0.2.4 moved the list out, but the old selectors stay: a rolled-back install
    // (or a host that still renders into the slot) must keep its frosted column.
    expect(BOT_GLASS_CSS).toContain(`:has(> [data-slot='sidebar']):has(.bt-side)`)
    expect(BOT_GLASS_CSS).toMatch(/:has\(\.bt-rail\)\)\s*\{\s*background-color:\s*transparent/)
    expect(BOT_GLASS_CSS).toMatch(/:has\(\.bt-rail\)\)::before\s*\{\s*background-color:\s*var\(--dsw-alias-bg-overlay\)/)
  })
})

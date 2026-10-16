import { describe, expect, it, afterEach } from 'vitest'
import { BODY_ATTR, FROST_ATTR, PACKAGE_ID } from '../src/client/constants.ts'
import { DEFAULT_KNOBS } from '../src/client/knobs.ts'
import { GLASS_CSS, SETTINGS_CSS, SURFACE_CSS } from '../src/client/glass-css.ts'
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

  it('frosts every column via ::before', () => {
    expect(GLASS_CSS).toMatch(/\*:has\(> \[data-slot='sidebar'\]\)::before/)
    expect(GLASS_CSS).toMatch(/\*:has\(> \[data-slot='conversation'\]\)::before/)
    expect(GLASS_CSS).toMatch(/\*:has\(> \[data-slot='details'\]\)::before/)
    expect(GLASS_CSS).toContain('border-right: none !important')
    expect(GLASS_CSS).not.toMatch(/sidebar\.settings/)
    const sidebarSelf = /\[data-slot='sidebar'\]\s*\{[^}]*backdrop-filter/
    expect(GLASS_CSS).not.toMatch(sidebarSelf)
  })

  it('frosts the right sidebar column, and ramps its surface when there is no frost', () => {
    // ui-layout ships the column opaque — its rule is '.rightbarCol {
    // background: var(--dsw-alias-bg-base) }' — so the column is made
    // transparent and its surface moves to ::before, keyed on the attribute
    // RightbarColumn actually renders.
    expect(SURFACE_CSS).toMatch(/\[data-rightbar-col\]\s*\{[^}]*background-color:\s*transparent/)
    const always = /body\[[^\]]*\]\s*\[data-rightbar-col\]::before\s*\{([^}]*)\}/.exec(SURFACE_CSS)?.[1] ?? ''
    // Without a wallpaper the surface has to *ramp*: the conversation column is
    // transparent, so the shell's --bloom-ambience wash runs through it, and a
    // flat plate stopped that wash at the rail's edge (a one-pixel 0.61-luminance
    // step — the dividing line). Three stops, no hard edge, and the geometry
    // stays on the pseudo-element: a filter on the column itself would make it a
    // containing block for position:fixed descendants.
    expect(always).toContain('linear-gradient')
    expect(always).toContain('var(--bloom-rail-surface)')
    expect(always).toContain('position: absolute')
    expect(always).not.toContain('backdrop-filter')
    // The ramp has to *start* fully transparent, or the seam turns back into the
    // step the gradient exists to remove.
    expect(always).toMatch(/linear-gradient\([^)]*color-mix\(in oklch, var\(--bloom-rail-surface\), transparent 100%\)/)
    // Frost takes the plate back to one tone over the blur: both sides are the
    // same glass there, and a ramp would dip the tint to zero along the seam.
    const frosted = new RegExp(`body\\[[^\\]]*\\]\\[${FROST_ATTR}\\]\\s*\\[data-rightbar-col\\]::before\\s*\\{([^}]*)\\}`).exec(SURFACE_CSS)?.[1] ?? ''
    expect(frosted).toContain('backdrop-filter')
    expect(frosted).toContain('background-color: var(--dsw-alias-bg-layer-1)')
    expect(frosted).toContain('background-image: none')
  })

  it('gives the rail a surface of its own, deep enough to read as a second region', () => {
    // Second pass (owner, 2026-10-16): with the line gone the two regions read as
    // one field — "两块区域颜色相近不能明显区分". Third pass: "色差不够", so the step
    // is mixed from the label colour rather than the accent — the accent's
    // lightness swings across the palette (aurora's is the brightest of the ten),
    // which is what left aurora at 2.1L in light and behind the field in dark.
    const light = new RegExp(`body\\[[^\\]]*\\]\\s*\\[data-rightbar-col\\]\\s*\\{([^}]*)\\}`).exec(SURFACE_CSS)?.[1] ?? ''
    const dark = new RegExp(`body\\[[^\\]]*\\]\\[data-ds-dark-theme\\]\\s*\\[data-rightbar-col\\]\\s*\\{([^}]*)\\}`).exec(SURFACE_CSS)?.[1] ?? ''
    const shape = (rung: number, ink: number) =>
      new RegExp(`--bloom-rail-surface:\\s*color-mix\\(in oklch, var\\(--bloom-accent[^,]*, #6b8f71\\),\\s*color-mix\\(in oklch, var\\(--dsw-alias-label-primary\\), var\\(--dsw-alias-bg-layer-${rung}\\) ${100 - ink}%\\) ${100 - 4}%\\)`)
    expect(light).toMatch(shape(3, 12))
    expect(dark).toMatch(shape(2, 14))
    // No literal colour anywhere in it — the accent is ds-bot's to move (0.1.6).
    expect(light.replace(/var\(--bloom-accent,\s*#[0-9a-f]{6}\)/i, '')).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('gives aurora one rung more in dark mode', () => {
    // Aurora's ribbons lift the conversation field itself (~11L in dark), which
    // swallowed the shared step: every other variant measured +12…+14L against
    // the field, aurora +5.4. One rung more puts it back in line.
    const aurora = new RegExp(`body\\[[^\\]]*\\]\\[data-ds-dark-theme\\]\\[data-bloomglass-variant='aurora'\\]\\s*\\[data-rightbar-col\\]\\s*\\{([^}]*)\\}`).exec(SURFACE_CSS)?.[1] ?? ''
    expect(aurora).toMatch(/--bloom-rail-surface:\s*color-mix\(in oklch, var\(--bloom-accent[^,]*, #6b8f71\),\s*color-mix\(in oklch, var\(--dsw-alias-label-primary\), var\(--dsw-alias-bg-layer-2\) 78%\) 95%\)/)
    // Only aurora is singled out, and only in dark mode.
    expect(SURFACE_CSS.match(/data-bloomglass-variant='aurora'/g)).toHaveLength(1)
  })

  it('keeps the rail’s tone under an open document, and only without frost', () => {
    // The document preview body paints '--dsw-alias-bg-document-preview' (the
    // page's bg, handed over in tokens.ts) across the whole pane, so with a file
    // open it would cover the rail's tone — the two regions would look alike
    // again exactly when the rail is in use. Scoped to the rail, and off under
    // frost where the rail is a flat glass plate that must match the
    // conversation side tone for tone.
    const scoped = new RegExp(`body\\[[^\\]]*\\]:not\\(\\[${FROST_ATTR}\\]\\)\\s*\\[data-rightbar-col\\]\\s*\\{([^}]*)\\}`).exec(SURFACE_CSS)?.[1] ?? ''
    expect(scoped).toContain('--dsw-alias-bg-document-preview: var(--bloom-rail-surface)')
    // The frost branch must not carry it.
    const frostedScope = new RegExp(`body\\[[^\\]]*\\]\\[${FROST_ATTR}\\]\\s*\\[data-rightbar-col\\]\\s*\\{([^}]*)\\}`).exec(SURFACE_CSS)?.[1] ?? ''
    expect(frostedScope).not.toContain('--dsw-alias-bg-document-preview')
  })

  it('takes the dock rail’s own hairline off — on the tab host, at a specificity that wins', () => {
    // Dockkit draws the first dock column with
    //   '._tabCell[data-dockkit-host=dock][data-dockkit-column="0"] > ._tabHost
    //      { border-left: .5px solid var(--dsw-alias-border-l4) }'
    // — a 40%-ink line (the theme's own border-l4 is rgba(morandi, .40)) down the
    // rail's whole height, and the one hard divider a gradient cannot dissolve.
    //
    // It is painted on the tab *host*, which carries data-dockkit-column as well
    // as data-dockkit-content, so '[data-rightbar-col] [data-dockkit-column=0]'
    // does match it — but only at (0,3,1) against the host rule's (0,4,0), and it
    // loses. That is why the owner still saw a dividing line after the ramp
    // (2026-10-16). Naming data-dockkit-content in the same compound reaches
    // (0,4,1) on exactly the element the hairline is drawn on.
    expect(SURFACE_CSS).toMatch(
      /\[data-rightbar-col\]\s*\[data-dockkit-column='0'\]\[data-dockkit-content\]\s*\{[^}]*border-left:\s*0/,
    )
  })

  it('hands the dock pane surface back to the plate', () => {
    // Dockkit's tab host paints its own fill — '._tabHost:not(._float) {
    // background: var(--dsw-alias-bg-base) }' — and it is in-flow content above
    // the column's plate, so with a file open the right sidebar was that one
    // token and nothing else. It is also one of the six tokens ds-bot writes
    // through the official override layer, which is how opening a file and
    // touching ds-bot's Appearance theme turned the column into ds-bot's opaque
    // grey. Handing the surface back moves it onto the rail's own tone, which
    // nothing else writes.
    const rule = /\[data-rightbar-col\]\s+:is\(\[data-dockkit-content\]:not\(\[data-dockkit-float\]\),\s*\[data-dockkit-empty\]\)\s*\{([^}]*)\}/
    expect(SURFACE_CSS).toMatch(rule)
    expect(rule.exec(SURFACE_CSS)?.[1] ?? '').toContain('background-color: transparent')
    // Floats carry their own fill and are not the column's surface; the empty
    // host paints the same token for the "open something" guide, so it counts.
    expect(SURFACE_CSS).toContain(':not([data-dockkit-float])')
    expect(SURFACE_CSS).toContain('[data-dockkit-empty]')
    // The plate it hands the surface back to is the rail's own tone (see the
    // gradient test above), under frost the flat glass plate.
    expect(SURFACE_CSS).toMatch(/\[data-rightbar-col\]::before\s*\{[^}]*var\(--bloom-rail-surface\)/)
    expect(SURFACE_CSS).toMatch(/\[data-rightbar-col\]::before\s*\{[^}]*background-color: var\(--dsw-alias-bg-layer-1\)/)
  })

  it('plates the fullscreen panel itself, not the column or the viewport', () => {
    // The panel wrapper DSH renders is position:absolute pinned top/bottom/right
    // and grows leftward in fullscreen, so its box is neither the column track
    // nor the viewport. data-sidebar-right-panel is on that wrapper, so plating
    // it makes the geometry follow automatically.
    const rule = /\[data-rightbar-fullscreen\]\s+\[data-sidebar-right-panel\]::before\s*\{([^}]*)\}/
    expect(SURFACE_CSS).toMatch(rule)
    const body = rule.exec(SURFACE_CSS)?.[1] ?? ''
    expect(body).toContain('position: absolute')
    expect(body).toContain('inset: 0')
    // No z-index: -1 drops behind the centre column's in-flow backgrounds, which
    // is what made the panel's content read as overlapping the conversation.
    expect(body).not.toMatch(/z-index/)
    // The column plate must step aside in fullscreen, or the two would stack.
    expect(SURFACE_CSS).toMatch(/\[data-rightbar-fullscreen\]\s+\[data-rightbar-col\]::before\s*\{\s*content:\s*none/)
  })

  it('lifts the fullscreen panel above the composer, and only in fullscreen', () => {
    // Regression: the composer ('position: sticky; z-index: 7', 9 with a trigger
    // menu open) paints above any positioned element left at 'auto', so the
    // input bar covered the fullscreen panel. The panel needs a number of its
    // own, in the gap the host's ladder leaves open.
    const rule = /\[data-rightbar-fullscreen\]\s+\[data-sidebar-right-panel\]\s*\{([^}]*)\}/
    expect(SURFACE_CSS).toMatch(rule)
    const lifted = Number(/z-index:\s*(-?\d+)/.exec(rule.exec(SURFACE_CSS)?.[1] ?? '')?.[1])

    const composerZ = 7
    const composerMenuZ = 9
    const dockkitPaneZ = 10
    const settingsBackdropZ = 1000
    expect(lifted).toBeGreaterThan(composerZ)
    // A tie with the composer's menu-open 9 would fall back to DOM order.
    expect(lifted).toBeGreaterThanOrEqual(composerMenuZ)
    expect(lifted).toBeLessThan(dockkitPaneZ)
    expect(lifted).toBeLessThan(settingsBackdropZ)

    // Only the panel in fullscreen carries it: raising the column would change
    // how the column stacks against the centre column in the ordinary layout,
    // and the panel's own ::before must keep reading 'auto' (see above).
    const normalPanel = /body\[[^\]]*\]\s+\[data-rightbar-col\]\s*\{([^}]*)\}/
    expect(normalPanel.exec(SURFACE_CSS)?.[1] ?? '').not.toMatch(/z-index/)
    const plate = /\[data-rightbar-fullscreen\]\s+\[data-sidebar-right-panel\]::before\s*\{([^}]*)\}/
    expect(plate.exec(SURFACE_CSS)?.[1] ?? '').not.toMatch(/z-index/)
  })

  it('frosts the settings card only, never the backdrop', () => {
    // The card is targeted by the attributes the Modal primitive sets, not a
    // hashed CSS-module class name.
    expect(SURFACE_CSS).toMatch(/\[role='dialog'\]\[aria-modal='true'\]\s*\{[^}]*backdrop-filter/)
    // The mask must be left alone: DSH blurs it with --dsw-mask-blur (shipped as
    // 'none'), and overriding that frosts the whole viewport instead of just the
    // card. Only the card should become glass.
    expect(SURFACE_CSS).not.toMatch(/--dsw-mask-blur\s*:/)
  })

  it('ships those two surfaces on the always-on sheet, not the wallpaper one', () => {
    // GLASS_CSS only exists while a wallpaper is painted; both of these are
    // asked for whenever the theme is installed, so they must not live there.
    expect(GLASS_CSS).not.toContain('data-rightbar-col')
    expect(GLASS_CSS).not.toContain('--dsw-mask-blur')
    expect(SURFACE_CSS).not.toContain('backdrop-filter: blur(var(--fw-blur)')
  })

  it('honours prefers-reduced-transparency for the new surfaces too', () => {
    const reduced = /@media \(prefers-reduced-transparency: reduce\)\s*\{([\s\S]*)\}\s*$/
    const block = reduced.exec(SURFACE_CSS)?.[1] ?? ''
    expect(block).toContain('[data-rightbar-col]::before')
    expect(block).toContain("[role='dialog'][aria-modal='true']")
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

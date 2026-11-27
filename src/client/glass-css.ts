/**
 * Two independently gated stylesheets.
 *
 * GLASS_CSS is the frosted chrome: the wallpaper plate, the dim veil, the
 * per-column glass, the right sidebar column, and the settings modal. The
 * per-column part is gated on FROST_ATTR, which exists only while a wallpaper
 * is actually painted — so retracting the frost leaves the palette theme itself
 * untouched. The modal and right-sidebar rules are gated on BODY_ATTR, because
 * both are asked for whenever the theme is installed, not only over a wallpaper.
 *
 * SETTINGS_CSS styles the settings panel and is injected once per activate.
 */
import { BODY_ATTR, FROST_ATTR } from './constants.ts'

/**
 * Scoped glass stylesheet. Every rule hangs off the plugin body attribute so
 * dispose is one attribute removal + one style-tag removal. Selectors use
 * official `data-slot` names, never hashed CSS-module class names.
 */
export const GLASS_CSS = `
[${FROST_ATTR}-wallpaper] {
  position: fixed;
  inset: 0;
  z-index: -3;
  pointer-events: none;
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
}

[${FROST_ATTR}-dim] {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background: rgba(12, 16, 24, var(--fw-dim, 0.28));
}

body[${FROST_ATTR}] {
  --fw-blur: 28px;
  --fw-saturate: 155%;
  --fw-dim: 0.28;
  --fw-highlight: rgba(255, 255, 255, 0.55);
  --fw-edge: rgba(255, 255, 255, 0.28);
  background-color: transparent;
}

body[${FROST_ATTR}='dark'] [${FROST_ATTR}-dim] {
  background: rgba(6, 8, 12, var(--fw-dim, 0.28));
}

body[${FROST_ATTR}='dark'] {
  --fw-highlight: rgba(255, 255, 255, 0.14);
  --fw-edge: rgba(255, 255, 255, 0.12);
}

/* AppFrame + slot roots: drop opaque fills so the wallpaper shows through. */
body[${FROST_ATTR}] *:has(> [data-slot='sidebar']):has(> [data-slot='conversation']),
body[${FROST_ATTR}] [data-slot='sidebar'],
body[${FROST_ATTR}] [data-slot='sidebar'] > :first-child,
body[${FROST_ATTR}] [data-slot='conversation'],
body[${FROST_ATTR}] [data-slot='details'] {
  background-color: transparent !important;
}

/*
 * One frosted plate per column, painted on ::before.
 * backdrop-filter must stay on the pseudo — never on the column itself —
 * or position:fixed settings (a sidebar descendant) lock to the rail width.
 */
body[${FROST_ATTR}] *:has(> [data-slot='sidebar']),
body[${FROST_ATTR}] *:has(> [data-slot='conversation']),
body[${FROST_ATTR}] *:has(> [data-slot='details']) {
  position: relative;
}
body[${FROST_ATTR}] *:has(> [data-slot='sidebar']) {
  border-right: none !important;
}
body[${FROST_ATTR}] *:has(> [data-slot='details']) {
  border-left: none !important;
}
body[${FROST_ATTR}] *:has(> [data-slot='sidebar'])::before,
body[${FROST_ATTR}] *:has(> [data-slot='conversation'])::before,
body[${FROST_ATTR}] *:has(> [data-slot='details'])::before {
  content: '';
  position: absolute;
  z-index: -1;
  pointer-events: none;
  background: var(--dsw-alias-bg-layer-1);
  -webkit-backdrop-filter: blur(var(--bloom-glass-blur)) saturate(var(--fw-saturate));
  backdrop-filter: blur(var(--bloom-glass-blur)) saturate(var(--fw-saturate));
}
body[${FROST_ATTR}] *:has(> [data-slot='sidebar'])::before {
  inset: 0 -2px 0 0;
  background: var(--dsw-specific-sidebar-fill);
}
body[${FROST_ATTR}] *:has(> [data-slot='conversation'])::before {
  inset: 0 0 0 -2px;
}
body[${FROST_ATTR}] *:has(> [data-slot='details'])::before {
  inset: 0 0 0 -2px;
}

@media (prefers-reduced-transparency: reduce) {
  body[${FROST_ATTR}] *:has(> [data-slot='sidebar'])::before,
  body[${FROST_ATTR}] *:has(> [data-slot='conversation'])::before,
  body[${FROST_ATTR}] *:has(> [data-slot='details'])::before {
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
}`.trim()

/**
 * How far the market band reaches below the plugin bar, relative to the stack
 * it covers: bar paint + tab head + category row + a 20px tail.
 *
 * The owner asked for a third more range twice on 2026-11-27, so the stack is
 * multiplied by (4/3)^2 = 16/9. It lives here as one named expression: the band
 * rule interpolates it into its `calc`, and changing the range is this line.
 */
const MARKET_BAND_SCALE = '4 / 3 * 4 / 3'

/**
 * Surfaces that are frosted whenever the theme is installed, not only while a
 * wallpaper is painted — so unlike GLASS_CSS this sheet rides the always-on
 * style tag. Both rules are keyed on stable DSH attributes rather than hashed
 * CSS-module class names.
 */
export const SURFACE_CSS = `
/*
 * Right sidebar column. DSH ships it opaque — the ui-layout rule is
 * '.rightbarCol { background: var(--dsw-alias-bg-base) }' — so it stayed a
 * solid slab. Make the column itself transparent, always, and paint whatever
 * surface it gets on ::before (never on the column: a backdrop-filter there
 * would make it a containing block for position:fixed descendants, the trap
 * documented in GLASS_CSS).
 *
 * The surface is a *gradient*, and which gradient depends on the frost, because
 * the two modes have different tones to meet:
 *
 *   no wallpaper — the conversation column is transparent and the shell's
 *     --bloom-ambience wash (COMPONENT_CSS, background-attachment: fixed) runs
 *     straight through it, while a flat plate would stop that wash dead at the
 *     rail's left edge and start a slab: measured on the harness as a one-pixel
 *     step of 0.61 luminance in light mode (0.25 in dark) — the dividing line
 *     the dashboard reported. So the rail starts *as* the wash and fades its own
 *     plate tone in over 96px: the boundary dissolves into a ramp instead of a
 *     step.
 *
 *     Second pass (owner, 2026-10-16): with the line gone the two regions then
 *     read as *one* field — "两块区域颜色相近不能明显区分". Two attempts at giving the
 *     rail a tone of its own (a palette surface step, then a deeper one mixed from
 *     the label colour) are **withdrawn**: the second one lifted the dark-mode
 *     rail ~12L and the owner saw it as "泛白" and stopped the work. Worth keeping
 *     in mind before reaching for tone again — this rail sits next to a *file
 *     preview*, so its surface doubles as the page the document is read on.
 *
 *     Fourth pass (owner, 2026-10-16): "换一个思路，可以效仿左侧栏和中间会话区的过度".
 *     The rail goes back to the conversation side's source, and the separation
 *     comes from the *same treatment the left sidebar uses*, mirrored: the
 *     sidebar's own fill formula (6% accent over layer-1, 8% in dark) as the
 *     ramp's far end, plus its outward accent glow, offset to the other side.
 *
 *     What the left seam actually is (worth stating, because the sheet has a dead
 *     rule that looks like it): GLASS_CSS in bloom-glass.ts writes
 *     'body[data-bloomglass-variant] [class*="_sidebarCol"] { background-color:
 *     color-mix(accent, layer-1 94%); box-shadow: …, 24px 0 40px -24px
 *     color-mix(accent, transparent 45%), … }'. It has the same specificity as the
 *     COMPONENT_CSS sidebar block but is injected later, so its box-shadow — not
 *     COMPONENT_CSS's '1px 0 0 var(--bloom-hairline)' — is what renders. The
 *     visible seam is therefore the tinted panel edge plus a ~40px accent glow, and
 *     there is no 1px line at all. Mirroring the *effective* parameters is what
 *     makes the two seams match; copying the dead one would put back the hairline
 *     the owner rejected.
 *
 *     The glow is dropped in fullscreen only: the panel is pinned to the viewport's
 *     right edge there and grows leftward past the column, so the column's left
 *     edge — and this glow with it — would be painted underneath the panel. Frost
 *     keeps the glow, exactly as the sidebar does.
 *
 *   wallpaper — both sides are the same translucent glass (--dsw-alias-bg-layer-1
 *     at the glass density, over the same blur), so the plate stays uniform: any
 *     ramp here would dip the tint to zero along the seam and repaint the very
 *     edge we are removing (the same scan measures 0.004). A *tinted* flat plate
 *     here would be worse still — flat tint against flat tint on both sides is a
 *     one-pixel step of the full difference. So the ramp is deliberately confined
 *     to the no-frost branch; the glow rides both, like the sidebar's.
 *
 * 'data-rightbar-col' is what RightbarColumn actually renders.
 */
body[${BODY_ATTR}] [data-rightbar-col] {
  background-color: transparent !important;
  /* The sidebar's fill formula, verbatim (bloom-glass.ts), as the ramp's far end:
     same tone as the panel on the left, so the two seams read as one treatment. */
  --bloom-rail-surface: color-mix(in oklch, var(--bloom-accent, #6b8f71), var(--dsw-alias-bg-layer-1, #fff) 94%);
  /* The sidebar's outward glow, mirrored across the seam: same colour, same 45%
     ink, same 40px blur and 24/-24 offset — only the direction flips, so the light
     spills left into the conversation column instead of right. */
  box-shadow: -24px 0 40px -24px color-mix(in oklch, var(--bloom-accent, #6b8f71), transparent 45%);
}
body[${BODY_ATTR}][data-ds-dark-theme] [data-rightbar-col] {
  --bloom-rail-surface: color-mix(in oklch, var(--bloom-accent, #6b8f71), var(--dsw-alias-bg-layer-1, #101010) 92%);
  box-shadow: -24px 0 40px -24px color-mix(in oklch, var(--bloom-accent, #6b8f71), transparent 35%);
}
/* No seam in fullscreen: the panel is pinned to the viewport's right edge and
   grows leftward past the column, so the column's left edge (and this glow with
   it) sits underneath the panel. Same reason the plate steps aside there. */
body[${BODY_ATTR}] [data-rightbar-fullscreen] [data-rightbar-col] {
  box-shadow: none;
}
/*
 * The document preview paints its own page colour through
 * '--dsw-alias-bg-document-preview' (tokens.ts hands it the page's bg), and that
 * body fills the pane — with a file open it would paint the page tone over the
 * panel tone the ramp fades in, leaving the tint visible only along the ramp.
 * Inside the rail (and only there) that token becomes the rail's own surface.
 *
 * Not under frost: there the rail is a flat glass plate that has to match the
 * conversation side tone for tone, so the preview keeps the plate colour.
 */
body[${BODY_ATTR}]:not([${FROST_ATTR}]) [data-rightbar-col] {
  --dsw-alias-bg-document-preview: var(--bloom-rail-surface);
  /* Same reason, and the same state: DSH's file navigator (ui-sidebar-files)
     paints its background from the base role, and without a wallpaper that role
     is the page's *opaque* base tone — it painted the whole file list as a
     near-black slab over the rail's ramp. Inside the rail the base has to mean
     the rail's own surface, so every surface that reads it follows the column.
     Under frost the role is already the veil tier (alpha .08, DSH's own card
     wash, never the black slab), so that branch leaves it alone — see below. */
  --dsw-alias-bg-base: var(--bloom-rail-surface);
}
/*
 * Under frost the same token is the page's *opaque* base tone (tokens.ts hands it
 * one — alpha 1), and the preview body fills the pane with it: opening a file
 * turned the whole right rail solid near-black (measured 11,25,27, one colour
 * across the pane) while every other surface in the column was glass. Handing it
 * the placeholder 'transparent' lets the column's frosted plate through, which is
 * the surface the rest of the rail already reads. The non-frost branch above stays
 * as it is — there the rail is a ramp, not a plate, and the preview has to carry
 * the ramp's end tone.
 */
body[${BODY_ATTR}][${FROST_ATTR}] [data-rightbar-col] {
  --dsw-alias-bg-document-preview: transparent;
  /* The base role is deliberately left alone: under frost tokens.ts has already
     re-expressed it as the veil tier (alpha .08), which is DSH's own list-card
     wash and was never broken — zeroing it here would flatten the file list's
     cards into the plate for no gain. */
}
body[${BODY_ATTR}] [data-rightbar-col]::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  /* From the page's own wash, through a half-strength midpoint, into the rail's
     surface tone: three stops, no step. */
  background-image: linear-gradient(
    to right,
    color-mix(in oklch, var(--bloom-rail-surface), transparent 100%),
    color-mix(in oklch, var(--bloom-rail-surface), transparent 45%) 48px,
    var(--bloom-rail-surface) 96px
  );
}
body[${BODY_ATTR}][${FROST_ATTR}] [data-rightbar-col]::before {
  background-image: none;
  background-color: var(--dsw-alias-bg-layer-1);
  -webkit-backdrop-filter: blur(var(--bloom-glass-blur)) saturate(var(--fw-saturate, 100%));
  backdrop-filter: blur(var(--bloom-glass-blur)) saturate(var(--fw-saturate, 100%));
}

/*
 * The dock rail's own hairline, and the reason the ramp above was not enough.
 *
 * Dockkit ships
 *   '._tabCell[data-dockkit-host=dock][data-dockkit-column="0"] > ._tabHost
 *      { border-left: .5px solid var(--dsw-alias-border-l4) }'
 * — a 40%-ink line (the theme's own border-l4 is 'rgba(dye, .40)') down the
 * rail's whole height. It is painted on the tab *host*, and dockkit puts
 * 'data-dockkit-column' on that host as well as on its cell:
 *   '<div class="__tabCell" data-dockkit-host="dock" data-dockkit-column="0">
 *      <section class="__tabHost" data-dockkit-content={id} data-dockkit-column="0">'
 * so a rule of the form '[data-rightbar-col] [data-dockkit-column='0']' does
 * match the host — but it only reaches (0,3,1) against the host rule's (0,4,0),
 * and loses. That is the dividing line the owner still saw after the ramp
 * (2026-10-16): the tone step was gone, the 0.5px line was not.
 *
 * Naming the host's own attribute in the same compound selector is what wins:
 * only the section carries both data-dockkit-column and data-dockkit-content,
 * so the rule lands on exactly the element the hairline is drawn on, at
 * (0,4,1). The theme turns the host's column borders off the same way in
 * GLASS_CSS ('border-right: none !important' for the sidebar slot,
 * 'border-left: none' for details); this is the same line for the rail. The
 * bare 'column' rule stays for the cell, which carries no border of its own.
 */
body[${BODY_ATTR}] [data-rightbar-col] [data-dockkit-column='0'],
body[${BODY_ATTR}] [data-rightbar-col] [data-dockkit-column='0'][data-dockkit-content] {
  border-left: 0;
}

/*
 * The plate above is not what paints the column once a file is open.
 *
 * Dockkit gives the pane's tab host its own fill — its rule is
 * '._tabHost:not(._float) { background: var(--dsw-alias-bg-base) }' — and that
 * host is in-flow content *above* the plate (the plate is a z-index:-1 pseudo
 * element, so it paints behind everything inside the column). So with a
 * document open the right sidebar was that one token and nothing else: a flat
 * opaque slab that ignored the palette, and, worse, one of the six tokens
 * ds-bot's own Appearance layer also writes — opening a file and touching
 * ds-bot's theme handed the whole column ds-bot's grey.
 *
 * Hand the surface back instead: the tab host paints nothing, the column's own
 * surface (the theme's plate under frost, the page's wash without one) shows
 * through, and the rail follows the palette through --dsw-alias-bg-layer-1,
 * which no other plugin writes. Floats are excluded — they carry their own fill
 * and are not the column's surface — and the empty-pane host, which paints the
 * same token for the "open something" guide, is included.
 */
body[${BODY_ATTR}] [data-rightbar-col] :is([data-dockkit-content]:not([data-dockkit-float]), [data-dockkit-empty]) {
  background-color: transparent;
}

/*
 * Fullscreen. The panel wrapper DSH renders — its rule is
 * '.panel { position: absolute; top: 0; bottom: 0; right: 0 }' — is pinned to
 * the column's right edge and grows leftward, past the column, when fullscreen
 * sets max-width to the viewport minus the left sidebar. So the frosted area is
 * neither the column's track nor the whole viewport: a plate on the column
 * showed as a narrow strip down the right edge, and a viewport-wide one covered
 * the left sidebar.
 *
 * data-sidebar-right-panel sits on that wrapper itself, so plating it makes the
 * geometry follow the panel automatically in both modes — no width arithmetic
 * and no dependency on how ui-layout computed the grid.
 *
 * The plate carries no z-index on purpose. -1 would drop it behind every
 * in-flow block background in the root stacking context, letting the centre
 * column paint over it; left at auto it is a positioned box later in DOM order
 * than the centre column, so it clears that column while the panel's own
 * content, which comes after the pseudo-element, still paints on top.
 */
body[${BODY_ATTR}] [data-rightbar-fullscreen] [data-rightbar-col]::before {
  content: none;
}

/*
 * The panel must outrank the composer, or the input bar covers it in fullscreen.
 *
 * 'auto' was enough against the centre column's *block backgrounds*, but the
 * composer is not one of those: DSH ships
 *   '.composerSeat { position: sticky; z-index: 7 }'   (9 while a trigger menu is open)
 * and a positioned element with a numeric z-index paints above every positioned
 * element at 'auto' in the same stacking context — DOM order only breaks ties
 * between equals. The panel is '.panel { position: absolute; top: 0; bottom: 0;
 * right: 0 }', no z-index, so the composer sat on top of it. Both live in the
 * frame's stacking context; nothing between them creates one.
 *
 * 9 is the next integer the host's own ladder leaves free above the composer:
 * above its resting 7 and its menu-open 9 (a tie there is decided by DOM order,
 * and the panel comes after the centre column), above the centre column's
 * '._widthHandle[data-dragging] { z-index: 8 }', and still far below the
 * dockkit panes and dividers (--dsh-dockkit-dock-layer: 10 / 11, 40 in
 * fullscreen), the code-block and menu layers (100 / 101), the settings
 * backdrop (1000) and the portalled popovers (1100). It exposes nothing the
 * panel did not already paint over — the panel is on top in fullscreen today,
 * which is why the plate above is visible at all — it only makes that order
 * explicit instead of resting on the exact z-index the composer happens to
 * carry.
 *
 * A z-index creates a stacking context but no containing block, so the panel
 * stays a positioned-but-non-containing ancestor: its ::before above still
 * resolves against the column, and any position: fixed descendant inside it
 * keeps the viewport as its containing block (the trap documented in
 * bloom-glass.ts). The panel's own width is an inline style from the host
 * ('style: { width: fullscreen ? "100vw" : width }'), which nothing here
 * touches.
 */
body[${BODY_ATTR}] [data-rightbar-fullscreen] [data-sidebar-right-panel] {
  z-index: 9;
}
body[${BODY_ATTR}] [data-rightbar-fullscreen] [data-sidebar-right-panel]::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: var(--dsw-alias-bg-layer-1);
  -webkit-backdrop-filter: blur(var(--bloom-glass-blur)) saturate(var(--fw-saturate, 100%));
  backdrop-filter: blur(var(--bloom-glass-blur)) saturate(var(--fw-saturate, 100%));
}

/*
 * Settings modal. Only the card is frosted — the backdrop keeps whatever the
 * app gives it.
 *
 * DSH's Modal primitive blurs the backdrop with
 * 'backdrop-filter: var(--dsw-mask-blur)' and ships that variable as 'none', so
 * the mask is deliberately left alone: overriding it would frost the whole
 * viewport, which is not what this theme is asked for. The card, an opaque
 * '--dsw-alias-bg-layer-2', is the surface that becomes glass.
 *
 * The card is targeted by role="dialog" + aria-modal — the attributes the
 * primitive itself sets — rather than a hashed CSS-module class name.
 */
body[${BODY_ATTR}] [role='dialog'][aria-modal='true'] {
  -webkit-backdrop-filter: blur(var(--bloom-glass-blur)) saturate(var(--fw-saturate, 100%));
  backdrop-filter: blur(var(--bloom-glass-blur)) saturate(var(--fw-saturate, 100%));
}

@media (prefers-reduced-transparency: reduce) {
  body[${BODY_ATTR}] [data-rightbar-col]::before,
  body[${BODY_ATTR}] [role='dialog'][aria-modal='true'],
  /* html + both body attributes: the plugin-page glass below is written at
     (0,5,3), so a bare body[…] selector here would lose to it. */
  html body[${BODY_ATTR}][${FROST_ATTR}] [data-plugin-panel] [data-plugin-bar][data-natural]::before {
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
}

/*
 * Sticky page bars over the global panel.
 *
 * DSH's pages (the plugin manager is the one reported) keep their header stuck to
 * the top with
 *   '.pageBar[data-natural]::before { background: var(--dsw-alias-bg-base) }'
 * and rely on it to mask the list scrolling underneath. Under the theme that role
 * is the page's base tone at alpha 1, while the page itself is that tone *plus*
 * COMPONENT_CSS's ambience wash on the body — so the bar painted a flat near-black
 * band across the top: measured (11,25,27) where the page reads (23,44,47), 17
 * levels, and the owner reported it as a black frame.
 *
 * Repaint the bar with the surface it covers: the same base role plus the same
 * ambience, fixed to the viewport exactly as the body paints it. Verified
 * pixel-identical to a deliberately transparent bar (0.00 difference, max 0), and
 * 16.5 levels away from the old fill.
 *
 * Only without frost: with a wallpaper there is no ambience to match (the body's
 * wash is gone and the wallpaper is the backdrop), so the bar takes the family
 * glass instead — see the frost rule below.
 */
body[${BODY_ATTR}]:not([${FROST_ATTR}]) [data-plugin-bar][data-natural]::before {
  background-color: var(--dsw-alias-bg-base);
  background-image: var(--bloom-ambience, none);
  background-attachment: fixed;
}

/*
 * The same bar over a wallpaper.
 *
 * A backdrop filter painted inside the page body samples nothing: the body is the
 * page's own scroll container ('overflow: hidden auto'), so the strip only ever
 * got its tint, never a blur (verified on ds-bot 0.3.5: list text scrolling under
 * the strip stayed sharp, while the same filter on a viewport-fixed probe blurred
 * normally). The glass has to be painted outside that scroll container, so the
 * bar's ::before is promoted to position: fixed and 'contain: paint' makes the
 * panel its containing block — the page is already clipped to its own box, so
 * this changes nothing else, and the strip lands on the panel's top edge at the
 * panel's width, at any rail state and under the desktop title bar. Its height
 * keeps coming from DSH's own '--plugin-header-paint-height' (130px at rest,
 * 66px compacted), so the strip follows the header without any measurement.
 *
 * Only the strip is glass: the page itself keeps its normal surface (owner,
 * 2026-11-12: the page should stay as it was, only the header should be frosted),
 * so the strip has no plate tone to inherit. It keeps the blur alone — no fill
 * of its own: measured against the page it sits on, the veil tier still cut a
 * 7.95-level band while pure blur sits 0.37 levels off, and both smear the list
 * underneath the same way. Over a photographed wallpaper the blur itself is the
 * frost you see; over a flat one it simply has nothing to show until content
 * scrolls under it.
 */
body[${BODY_ATTR}][${FROST_ATTR}] [data-plugin-panel] {
  position: relative;
  contain: paint;
}
body[${BODY_ATTR}][${FROST_ATTR}] [data-plugin-panel] [data-plugin-bar][data-natural]::before {
  position: fixed;
  background-color: transparent;
  -webkit-backdrop-filter: blur(var(--bloom-glass-blur)) saturate(var(--fw-saturate, 100%));
  backdrop-filter: blur(var(--bloom-glass-blur)) saturate(var(--fw-saturate, 100%));
}

/*
 * The plugin market's sticky band.
 *
 * dshmarket (1.84.1) stacks its own header rows under the plugin bar and keeps
 * them stuck: a 64px tab head, then a 56px category row. Both paint
 * 'var(--dshm-sticky-bg, var(--dsw-alias-bg-base))' — under frost that role is
 * the palette's base at 8% — and neither has a backdrop filter, so the cards
 * scrolling underneath read straight through them: measured 93.5% of the detail
 * survived and the tab labels sat at 1.09:1 against what showed through. The one
 * strip that *was* frosted is the plugin bar's ::before above, and it stops at
 * the bar's paint height (66px when compacted).
 *
 * So extend that same fixed strip across the market's sticky stack — both rows
 * plus a 20px tail — and mask it so the blur is strongest at the top and gone at
 * the tail: the list gets blurrier the further it scrolls in, and the tabs sit
 * on a fully blurred backdrop instead of a clear one. The rows themselves are
 * untouched: their 8% veil stays, no tint is added, and their text stays sharp
 * because the band is painted behind them (the bar's ::before keeps its place in
 * the stack; only its box grows).
 *
 * The mask holds full through the bar's own stripe before it starts fading: the
 * bar's blur is the 1.0.7 top band, tuned and verified, and the owner asked for
 * the content *below* the top bar to blur — ramping from the viewport's first
 * pixel instead would have weakened the bar to 68% at its bottom edge.
 *
 * Heights come from the market itself, measured and copied onto <html> by
 * market-band.ts, because the bar is a sibling branch of the market root and
 * cannot inherit its custom properties: the head's published
 * '--dshm-plugins-head-height', and the category row's own box, which publishes
 * nothing and is not constant either — both grow when the panel narrows (64/56
 * at a 968px panel, 118/72 at 412px), so a hard-coded pair would end the band
 * short. Both values carry a 2px margin: the band may end long (its tail is a
 * fade), never short.
 *
 * Gated on the market's own stuck marker: at rest the page keeps its surface and
 * no blur band sits under the header.
 *
 * The owner asked for a third more range twice on 2026-11-27, and for a
 * steeper ramp: the measured stack is multiplied by (4/3)^2 = 16/9 through the
 * named scale above, so the tail grows with the rows instead of a hard-coded
 * pixel value, and the tab head gets a second, heavier tier — see the rule
 * below.
 */
body[${BODY_ATTR}][${FROST_ATTR}] [data-plugin-panel]:has([data-dsh-market-plugins-tab]):has([data-dshm-stuck]) [data-plugin-bar][data-natural]::before {
  height: calc((var(--plugin-header-paint-height, 66px) + var(--bloom-market-head, 64px) + var(--bloom-market-cats, 58px) + 20px) * ${MARKET_BAND_SCALE});
  -webkit-mask-image: linear-gradient(to bottom, #000 0, #000 var(--plugin-header-paint-height, 66px), transparent 100%);
  mask-image: linear-gradient(to bottom, #000 0, #000 var(--plugin-header-paint-height, 66px), transparent 100%);
  pointer-events: none;
}

/*
 * The band's second tier: a heavier blur over the tab head.
 *
 * One 8px layer cannot be both a long, gentle fade and a strong blur right
 * under the bar. The owner asked for both (2026-11-27): the range has been
 * extended by a third twice, and the gradient needs more steps — topmost smear,
 * then step by step to clear. So the band above keeps the blur knob across the
 * whole range and its long fade, and this fixed strip adds twice the knob over
 * the tab head only, masked from full at the bar's edge to nothing at the
 * category row's top edge. The two masks multiply: the head starts at 3x the
 * knob, lands at the plain band level at its bottom, and the band then fades
 * out over the tail.
 *
 * Painted on the panel, not the bar: dshmarket hangs a one-pixel hairline on the
 * bar's ::after, and the panel's own pseudo-elements are unused. The panel's
 * 'contain: paint' already makes it the fixed-position containing block for the
 * bar's ::before, so this strip lands on the same edge at the same width. It
 * paints under the bar (z2) and under the market's sticky rows (z6/z5) — their
 * text stays sharp — while the band's own 8px filter above samples this strip's
 * output, so the two filters compound instead of competing.
 *
 * No tint of its own, and only while the market is stuck: at rest the page keeps
 * its surface.
 */
body[${BODY_ATTR}][${FROST_ATTR}] [data-plugin-panel]:has([data-dsh-market-plugins-tab]):has([data-dshm-stuck])::after {
  content: '';
  position: fixed;
  top: var(--plugin-header-paint-height, 66px);
  left: 0;
  right: 0;
  height: calc(var(--bloom-market-head, 64px) + 2px);
  -webkit-backdrop-filter: blur(calc(var(--bloom-glass-blur) * 2)) saturate(var(--fw-saturate, 100%));
  backdrop-filter: blur(calc(var(--bloom-glass-blur) * 2)) saturate(var(--fw-saturate, 100%));
  -webkit-mask-image: linear-gradient(to bottom, #000 0, rgba(0, 0, 0, 0.78) 30%, rgba(0, 0, 0, 0.46) 62%, rgba(0, 0, 0, 0.18) 85%, transparent 100%);
  mask-image: linear-gradient(to bottom, #000 0, rgba(0, 0, 0, 0.78) 30%, rgba(0, 0, 0, 0.46) 62%, rgba(0, 0, 0, 0.18) 85%, transparent 100%);
  pointer-events: none;
}

/*
 * Blur unavailable: solid, not transparent.
 *
 * The band is ours, so its blur only goes away when the engine says the user
 * prefers reduced transparency (the media block at the end of this sheet). The
 * market rows, though, are the market's own surfaces: under that preference the
 * veil alone would leave 92% of the cards readable through them, so they take
 * the family's near-solid cover through the two variables the market documents
 * for exactly this ('--dshm-sticky-bg' at rest, '--dshm-stuck-bg' once stuck).
 * The band is cancelled at the same time — nothing is left to blur — and the
 * bar's own stripe goes solid over its own height.
 */
@media (prefers-reduced-transparency: reduce) {
  /* Same specificity as the band above (both :has() gates), earlier in rank but
     later in the sheet — so the band is cancelled rather than merely re-tinted:
     with the filter gone it would be a transparent strip. */
  body[${BODY_ATTR}][${FROST_ATTR}] [data-plugin-panel]:has([data-dsh-market-plugins-tab]):has([data-dshm-stuck]) [data-plugin-bar][data-natural]::before {
    height: var(--plugin-header-paint-height, 66px);
    background-color: var(--bt-glass-cover);
    -webkit-mask-image: none;
    mask-image: none;
  }
  /* The second tier is pure filter: with reduced transparency it has nothing to
     leave behind, so it is cancelled outright rather than made solid. */
  body[${BODY_ATTR}][${FROST_ATTR}] [data-plugin-panel]:has([data-dsh-market-plugins-tab]):has([data-dshm-stuck])::after {
    content: none;
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    -webkit-mask-image: none;
    mask-image: none;
  }
  /* At rest there is no band to cancel; the bar's own stripe still needs a real
     ground when its blur is gone. */
  body[${BODY_ATTR}][${FROST_ATTR}] [data-plugin-panel]:has([data-dsh-market-plugins-tab]) [data-plugin-bar][data-natural]::before {
    background-color: var(--bt-glass-cover);
  }
  body[${BODY_ATTR}][${FROST_ATTR}] [data-dsh-market-plugins-tab] {
    --dshm-sticky-bg: var(--bt-glass-cover);
    --dshm-stuck-bg: var(--bt-glass-cover);
  }
}`.trim()

/** Settings-panel styles. Class names are fw- prefixed and used only by SettingsSection. */
export const SETTINGS_CSS = `/* Settings page */
.fw-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px 0 28px;
  min-width: 0;
  max-width: 100%;
  color: var(--dsw-alias-label-primary);
}
.fw-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 18px;
  border-radius: 20px;
  border: 1px solid var(--dsw-alias-border-l2);
  background:
    linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02)),
    var(--dsw-alias-bg-layer-1);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.28);
}
body[data-ds-dark-theme] .fw-panel {
  background:
    linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01)),
    var(--dsw-alias-bg-layer-1);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
}
.fw-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.fw-lead { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.fw-kicker {
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--dsw-alias-label-tertiary);
}
.fw-title { font-size: 18px; line-height: 26px; font-weight: 600; }
.fw-desc { font-size: 13px; line-height: 20px; color: var(--dsw-alias-label-secondary); }
.fw-chip {
  flex: 0 0 auto;
  margin-top: 4px;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  line-height: 16px;
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-secondary);
}
.fw-chip[data-tone='warn'] {
  background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 18%, transparent);
  color: var(--dsw-alias-state-warn-label, var(--dsw-alias-state-warn-primary));
}
.fw-hero {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  width: 100%;
  max-width: 100%;
  min-height: 196px;
  border: 0;
  border-radius: 16px;
  padding: 0;
  background:
    radial-gradient(circle at 20% 20%, rgba(255,255,255,0.18), transparent 42%),
    linear-gradient(135deg, #8aa4c8 0%, #3d4f6b 52%, #1b2330 100%);
  color: inherit;
  font: inherit;
  cursor: pointer;
}
.fw-hero[data-over='true'] { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }
.fw-hero:disabled { cursor: default; }
.fw-hero img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.fw-hero-glass {
  position: absolute;
  inset: auto 18px 18px auto;
  width: 42%;
  min-width: 120px;
  height: 46%;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.35);
  background: rgba(255,255,255, var(--fw-ui-glass, 0.46));
  -webkit-backdrop-filter: blur(var(--fw-ui-blur, 28px)) saturate(var(--fw-ui-sat, 155%));
  backdrop-filter: blur(var(--fw-ui-blur, 28px)) saturate(var(--fw-ui-sat, 155%));
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.55);
  pointer-events: none;
}
.fw-hero-copy {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 20px;
  text-align: left;
}
.fw-hero-copy strong { font-size: 14px; line-height: 20px; font-weight: 600; }
.fw-hero-copy span {
  font-size: 12px;
  line-height: 18px;
  color: var(--dsw-alias-label-secondary);
}
.fw-hero:not([data-has='true']) .fw-hero-copy strong,
.fw-hero:not([data-has='true']) .fw-hero-copy span { color: #f4f7fb; }
.fw-switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 14px;
  line-height: 22px;
}
.fw-switch input {
  appearance: none;
  -webkit-appearance: none;
  width: 44px;
  height: 26px;
  margin: 0;
  border: 0;
  border-radius: 999px;
  background: #6b7178;
  position: relative;
  cursor: pointer;
  transition: background 160ms ease;
}
.fw-switch input::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.28);
  transition: transform 160ms ease;
}
.fw-switch input:checked {
  background: #34c759;
}
.fw-switch input:checked::after { transform: translateX(18px); }
.fw-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 16px;
}
@media (max-width: 640px) { .fw-grid { grid-template-columns: 1fr; } }
.fw-row { display: flex; flex-direction: column; gap: 8px; }
.fw-row-head {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  line-height: 18px;
}
.fw-row-head span:last-child { color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums; }
.fw-row input[type='range'] {
  width: 100%;
  height: 4px;
  accent-color: var(--dsw-alias-brand-primary);
  cursor: pointer;
}
.fw-bar {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 4px;
}
.fw-btn {
  appearance: none;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 12px;
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 13px;
  line-height: 20px;
  padding: 8px 14px;
  cursor: pointer;
}
.fw-btn:hover { background: var(--dsw-alias-interactive-bg-hover); }
.fw-btn[data-kind='primary'] {
  background: #34c759;
  color: #fff;
  border-color: transparent;
}
.fw-btn[data-kind='primary']:hover { background: #2fb350; }
.fw-btn[data-kind='primary']:disabled {
  background: transparent;
  color: var(--dsw-alias-label-primary);
  border-color: var(--dsw-alias-border-l2);
  opacity: 0.5;
}
.fw-btn[data-kind='danger'] { color: var(--dsw-alias-state-error-primary); }
.fw-btn:disabled { opacity: 0.5; cursor: default; }
.fw-error {
  font-size: 13px;
  line-height: 20px;
  color: var(--dsw-alias-state-error-primary);
}
.fw-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
`.trim()

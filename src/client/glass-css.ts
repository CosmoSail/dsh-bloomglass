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
 *     read as *one* field — "两块区域颜色相近不能明显区分". The rail needs its own
 *     tone, not the page's: --bloom-rail-surface below steps off the page colour
 *     in the direction each mode lifts surfaces (darker in light, lighter in
 *     dark). Far from the seam the difference is plain; at the seam it is still
 *     zero (the ramp starts fully transparent), which is what keeps a region
 *     boundary from becoming a dividing line.
 *
 *     Third pass (owner: "色差不够"): the tone is mixed out of the *label* colour,
 *     not the accent. The accent's lightness swings across the palette — aurora's
 *     is the brightest of the ten — so an accent-driven step could not be uniform:
 *     aurora landed at 2.1L in light and flipped sign in dark (-3.3, its streams
 *     lift the conversation field above the base). The label is the same ink in
 *     every variant, so the step is the same everywhere; a small accent share on
 *     top is what still carries the variant's hue. Depth is ~12L light / ~12-14L
 *     dark, with aurora given one rung more (see below).
 *
 *   wallpaper — both sides are the same translucent glass (--dsw-alias-bg-layer-1
 *     at the glass density, over the same blur), so the plate stays uniform: any
 *     ramp here would dip the tint to zero along the seam and repaint the very
 *     edge we are removing (the same scan measures 0.004). A *tinted* flat plate
 *     here would be worse still — flat tint against flat tint on both sides is a
 *     one-pixel step of the full difference. So the tint is deliberately
 *     confined to the no-frost branch.
 *
 * 'data-rightbar-col' is what RightbarColumn actually renders.
 */
body[${BODY_ATTR}] [data-rightbar-col] {
  background-color: transparent !important;
  /* One rung of the palette's surface ladder (layer-3 is -5…-6L under the base
     in light mode) plus 12% of the label colour — the ladder alone is too shallow
     to read as a separate panel — then nudged 4% toward the accent so the panel
     belongs to the variant. The dark rung differs (layer-2, +6…+8L) because that
     ladder is steeper; 14% ink lands on the same perceived step. */
  --bloom-rail-surface: color-mix(in oklch, var(--bloom-accent, #6b8f71), color-mix(in oklch, var(--dsw-alias-label-primary), var(--dsw-alias-bg-layer-3) 88%) 96%);
}
body[${BODY_ATTR}][data-ds-dark-theme] [data-rightbar-col] {
  --bloom-rail-surface: color-mix(in oklch, var(--bloom-accent, #6b8f71), color-mix(in oklch, var(--dsw-alias-label-primary), var(--dsw-alias-bg-layer-2) 86%) 96%);
}
/*
 * Aurora is the one variant whose ambience is bright enough to lift the
 * conversation field itself (its three aurora-stream ribbons, at half opacity,
 * are the strongest wash of the ten). In dark mode that lift (~11L) swallowed the
 * whole step: every other variant landed at +12…+14L against the field, aurora at
 * +5.4. It gets one rung more — 22% ink instead of 14% — so it clears the field
 * like the rest. The light end needs no special case (aurora's light wash is
 * mild, and it measured -9.5L).
 */
body[${BODY_ATTR}][data-ds-dark-theme][data-bloomglass-variant='aurora'] [data-rightbar-col] {
  --bloom-rail-surface: color-mix(in oklch, var(--bloom-accent, #6b8f71), color-mix(in oklch, var(--dsw-alias-label-primary), var(--dsw-alias-bg-layer-2) 78%) 95%);
}
/*
 * The document preview paints its own page colour through
 * '--dsw-alias-bg-document-preview' (tokens.ts hands it the page's bg), and that
 * body fills the pane — so with a file open it would cover the rail's tone and
 * the two regions would look alike again exactly when the rail is in use. Inside
 * the rail (and only there) that token becomes the rail's own surface.
 *
 * Not under frost: there the rail is a flat glass plate that has to match the
 * conversation side tone for tone, so the preview keeps the plate colour.
 */
body[${BODY_ATTR}]:not([${FROST_ATTR}]) [data-rightbar-col] {
  --dsw-alias-bg-document-preview: var(--bloom-rail-surface);
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
 * — a 40%-ink line (the theme's own border-l4 is 'rgba(morandi, .40)') down the
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
  body[${BODY_ATTR}] [role='dialog'][aria-modal='true'] {
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
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

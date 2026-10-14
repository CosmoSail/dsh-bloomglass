/**
 * DS Bot — the Bot team UI (`ds-bot`) — as a theme surface.
 *
 * ds-bot draws its own shell inside DSH's slots: the Bot list in the sidebar
 * (`sidebar.workspaces`), the chat cells and user bubbles in the conversation,
 * the composer, a floating header pill, a fixed details panel on the right,
 * and its own dialogs, menus and toasts in `shell.overlay`. None of it reads
 * the `--dsw-*` tokens the rest of the app is built from: it paints from its
 * own `--bt-*` palette, written on `html body` and
 * `html body[data-ds-dark-theme]` by a stylesheet it injects when it mounts —
 * which is after this plugin's tag, so today the Bot UI keeps its own greys
 * inside a Morandi shell, and stays opaque over a wallpaper.
 *
 * This module fixes both halves:
 *
 *   1. `BOT_CSS` re-points `--bt-*` at the DSH tokens the shell already uses,
 *      so a Bot row, bubble, card or panel is coloured by the active palette.
 *      Every value is a `var()` reference, so light/dark resolution and the
 *      frosted re-expression of surface tokens arrive through the token layer
 *      unchanged — no second copy of the palette lives here. The selectors
 *      carry two attribute selectors on purpose: `html body[data-dsh-bloomglass]`
 *      (0,1,2) outranks ds-bot's light block `html body` (0,0,2), and the dark
 *      selector `html body[data-dsh-bloomglass][data-ds-dark-theme]` (0,2,2)
 *      outranks its `html body[data-ds-dark-theme]` (0,1,2) — without them
 *      ds-bot's later tag wins the tie and the bridge is dead code.
 *
 *   2. `BOT_GLASS_CSS` turns what floats over the wallpaper into glass while
 *      one is painted. Plates go on `::before`, never on a panel itself: a
 *      `backdrop-filter` on `.bt-panel` would make it a containing block and
 *      re-anchor the `position: fixed` menus rendered inside it (the same trap
 *      documented for the sidebar column in `bloom-glass.ts`).
 *
 * Knob-token coverage follows the theme's own roles, not ds-bot's flat greys:
 * columns/panels read the plate token, menus the menu token, dialogs the
 * overlay token. Every one of them is a token `applyGlass()` re-expresses, so
 * the glass slider moves the Bot UI with the rest of the window.
 */
import { BODY_ATTR, FROST_ATTR } from '../constants.ts'

/**
 * Palette bridge: `--bt-*` to the DSH tokens those roles already mean.
 * Gated on {@link BODY_ATTR} so uninstalling the theme hands the Bot UI back
 * to ds-bot untouched.
 */
export const BOT_CSS = `
html body[${BODY_ATTR}],
html body[${BODY_ATTR}][data-ds-dark-theme] {
  --bt-ink: var(--dsw-alias-label-primary);
  --bt-ink-2: var(--dsw-alias-label-secondary);
  --bt-ink-3: var(--dsw-alias-label-tertiary);
  --bt-line: var(--dsw-alias-border-l1);
  --bt-line-2: var(--dsw-alias-border-l2);
  --bt-main: var(--dsw-alias-bg-base);
  --bt-sidebar: var(--dsw-specific-sidebar-fill);
  --bt-card: var(--dsw-alias-bg-layer-2);
  --bt-bubble: var(--dsw-specific-bubble);
  --bt-hover: var(--dsw-alias-interactive-bg-hover);
  --bt-active: var(--dsw-alias-interactive-bg-active);
  --bt-accent: var(--dsw-alias-brand-primary);
  --bt-accent-ink: var(--dsw-alias-label-primary-foreground);
  --bt-green: var(--dsw-alias-state-success-primary);
  --bt-star: var(--dsw-alias-state-warn-primary);
  --bt-tag-bg: var(--dsw-alias-interactive-bg-hover);
  --bt-tag-ink: var(--dsw-alias-label-secondary);
  /* The user's own voice: ds-bot fills a bubble and tints selected chips with
     this pair, so it needs a filled colour with contrasting ink rather than a
     translucent highlight. */
  --bt-user: var(--dsw-alias-button-primary-fill);
  --bt-user-ink: var(--dsw-alias-label-primary-foreground);
}
`.trim()

/** Surfaces that float over the wallpaper: fixed panels, popovers, dialogs. */
const PANEL = ':is(.bt-panel, .bt-pane)'
const POPOVER =
  ':is(.bt-menu, .bt-drop, .bt-avedit, .bt-connect-tip, .bt-update-pop, .bt-us-pick, .bt-react-strip, .bt-pill)'
const DIALOG = ':is(.bt-settings, .bt-mem, .bt-palette)'

/**
 * Frosted chrome for the Bot UI. The gate needs both body attributes — the
 * theme's, so the sheet cannot outlive it, and the frost's — and it is three
 * attribute-selectors deep, so it also outranks ds-bot's own `:hover` and
 * `[aria-pressed]` fills instead of losing a tie to whichever tag came later.
 */
export const BOT_GLASS_CSS = `
/* Fixed side panels. DSH's right column is plated on ::before with the layer
   token; a Bot panel is the same surface, so it gets the same plate — and the
   panel itself stays filter-free for its fixed descendants. */
body[${BODY_ATTR}][${FROST_ATTR}] ${PANEL} {
  background-color: transparent;
}
body[${BODY_ATTR}][${FROST_ATTR}] ${PANEL}::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background-color: var(--dsw-alias-bg-layer-1);
  -webkit-backdrop-filter: blur(var(--bloom-glass-blur)) saturate(var(--fw-saturate, 100%));
  backdrop-filter: blur(var(--bloom-glass-blur)) saturate(var(--fw-saturate, 100%));
}

/* Popovers and the header pill: the menu role, one step more opaque than a
   plate, because their text sits directly on the wallpaper's blur. */
body[${BODY_ATTR}][${FROST_ATTR}] ${POPOVER} {
  background-color: var(--dsw-specific-menu);
  -webkit-backdrop-filter: blur(var(--bloom-glass-blur)) saturate(var(--fw-saturate, 100%));
  backdrop-filter: blur(var(--bloom-glass-blur)) saturate(var(--fw-saturate, 100%));
}

/* Dialogs: the overlay role, the theme's most opaque glass, so a roster, a
   memory editor or the palette picker stays readable over a photo. */
body[${BODY_ATTR}][${FROST_ATTR}] ${DIALOG} {
  background-color: var(--dsw-alias-bg-overlay);
  -webkit-backdrop-filter: blur(var(--bloom-glass-blur)) saturate(var(--fw-saturate, 100%));
  backdrop-filter: blur(var(--bloom-glass-blur)) saturate(var(--fw-saturate, 100%));
}

/* The settings dialog's own sidebar column, and the empty-chat composer card
   ds-bot draws outside DSH's composer tree. */
body[${BODY_ATTR}][${FROST_ATTR}] .bt-settings-nav,
body[${BODY_ATTR}][${FROST_ATTR}] .bt-nc-card {
  background-color: var(--dsw-alias-bg-layer-1);
}

/* The composer is DSH's, which this theme already frosts on ::before. ds-bot
   repaints that card with its own opaque fill and !important, so the plate
   would never show: hand the card back to the theme's plate. */
body[${BODY_ATTR}][${FROST_ATTR}] [data-composer-card] {
  background-color: transparent !important;
}

@media (prefers-reduced-transparency: reduce) {
  body[${BODY_ATTR}][${FROST_ATTR}] ${PANEL}::before,
  body[${BODY_ATTR}][${FROST_ATTR}] ${POPOVER},
  body[${BODY_ATTR}][${FROST_ATTR}] ${DIALOG} {
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
}
`.trim()

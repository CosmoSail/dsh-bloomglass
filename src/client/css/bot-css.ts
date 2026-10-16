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
  /* ds-bot paints round icon buttons, tab thumbs, the switch knob, inputs and
     whole panels with this one role. The base surface is the *most* veiled
     token there is (a fifth of the glass density, floored at 8%), which at a
     low glass setting leaves those controls all but invisible; the floating
     button fill is the role the shell itself uses for a control that sits on
     top of the page, and it stays legible at every density. Panels, menus and
     dialogs are re-plated explicitly in BOT_GLASS_CSS below. */
  --bt-main: var(--dsw-alias-button-floating-fill);
  --bt-sidebar: var(--dsw-specific-sidebar-fill);
  --bt-card: var(--dsw-alias-bg-layer-2);
  --bt-bubble: var(--dsw-specific-bubble);
  --bt-hover: var(--dsw-alias-interactive-bg-hover);
  --bt-active: var(--dsw-alias-interactive-bg-active);
  /* ds-bot's accent stays ds-bot's, and the ink stays ours.
     Its Appearance settings write --bt-accent (a swatch or a custom colour)
     into the stylesheet it injects at mount, and recompute --bt-accent-ink
     from it. Declaring --bt-accent here outranked that write — (0,1,2) beats
     ds-bot's 'html body' (0,0,2) — which is exactly why the accent control did
     nothing in the Bot UI. The fill is the user's to set, so this bridge stops
     claiming it; every surface that paints --bt-accent (the composer's
     send/stop button, .bt-voice, badges, switches, the user's bubble below)
     follows the setting again.
     The *ink* is ours, because ds-bot's own rule — luminance(accent) > 0.45 ?
     '#141414' : '#ffffff' — sits on the wrong side of the crossover: measured
     against its own swatches, white lands at 2.19:1 on green, 2.21 on cyan,
     2.64 on orange, 2.77 on sky, 2.96 on violet and 4.33 on the default blue —
     all below AA, on a fill that is also the user's bubble.
     The value here is only the fallback for an engine without relative colour
     syntax; the @supports rule below picks the ink from the accent itself. */
  --bt-accent-ink: var(--dsw-alias-label-primary-foreground);
  --bt-green: var(--dsw-alias-state-success-primary);
  --bt-star: var(--dsw-alias-state-warn-primary);
  --bt-tag-bg: var(--dsw-alias-interactive-bg-hover);
  --bt-tag-ink: var(--dsw-alias-label-secondary);
  /* The user's voice. ds-bot paints *every* user-side surface from this one
     pair — the host chat's own bubble in every conversation shape (direct,
     group, question-reply, command-input), its own .bt-ubody/.bt-ububble
     copies, and the pressed chips (mic, voice, task day, question options) —
     so this is the place to put the user's voice right, once.
     The user asked for the bubble to be *the composer's send button*, so the
     pair is literally the button's pair rather than a copy of its colour. The
     send button is [data-composer-card] button[class*="_primary"], which
     ds-bot fills with --bt-accent (the user's accent setting) and inks with
     --bt-accent-ink (the voice button that takes its seat on an empty composer
     uses the same two); custom properties resolve per element, so referencing
     them here makes the bubble follow the button through every accent the user
     picks instead of matching a snapshot of its colour. Solid, not veiled: the
     button is an opaque fill, and at any transparency the bubble would
     composite to a different colour than the button it is meant to equal. */
  --bt-user: var(--bt-accent);
  --bt-user-ink: var(--bt-accent-ink);
  /* The plate for the one strip that scrolls over text of its own: the exchange
     sheet's composer footer. A share of the glass density would let the log
     shine through it, and the footer is small enough that a near-solid tone
     costs nothing. Covering *panels* take the dialogs' overlay glass, and the
     Bot↔Bot sheet takes it a step denser (see COVER below). */
  --bt-glass-cover: color-mix(in oklab, var(--dsw-alias-bg-overlay), var(--bloom-surface-solid, var(--dsw-alias-bg-layer-1)) 96%);
}

/* The accent ink, chosen from the accent ds-bot wrote.
   ds-bot's own test — a luminance threshold at 0.45 — keeps white text on colours
   that cannot carry it: measured against its own swatches, green lands at 2.19:1,
   cyan 2.21, orange 2.64, sky 2.77, violet 2.96 and the default blue 4.33, all
   below AA, and that fill is also the user's bubble.
   So the ink is ours, and it is a *step*, never an interpolation: pure white on a
   dark accent, pure black on a light one. Two inks can only be equally readable
   where their contrasts cross, and black against white cross at 4.58:1 — the best
   any two-ink rule can do — so every accent has to land on one of the two ends.
   Which end is decided by the accent's relative luminance, which xyz-d65 exposes
   as its y channel: that is the very quantity the contrast ratio is built from,
   so the decision cannot disagree with the measurement. (oklch's l is not: a scan
   of 33 024 sRGB colours puts its best threshold at 4.10:1 worst case, and D50
   lab's l — chromatic adaptation moves it off the luminance — at 4.45:1, against
   4.58:1 here. Measured in the browser this rule's worst case over the same
   colours is 4.59:1, i.e. the crossover itself.)
   0.1791 is that crossover (where white's 1.05/(Y+0.05) meets black's
   (Y+0.05)/0.05), and the two inks are written in xyz-d65: black is 0 0 0, white
   is the sRGB white point. The multiplier makes the changeover 1e-9 wide, and a
   full scan of the cube — read through the CSS Color 4 sRGB→XYZ matrix, the one
   the engine computes y with — puts the nearest 8-bit colour on the side a ramp
   can degrade (#915bcd) at 1.18e-8, twelve times further than the ramp is wide,
   so no accent a colour picker can produce lands on a mid-grey ink at its own
   lightness (an earlier, gentle, ramp did exactly that at ~1:1).
   Same specificity as the rule above, so it wins by coming later; an engine
   without relative colour syntax skips the block and keeps the fallback. */
@supports (color: color(from red xyz-d65 x y z)) {
  html body[${BODY_ATTR}],
  html body[${BODY_ATTR}][data-ds-dark-theme] {
    --bt-accent-ink: color(from var(--bt-accent) xyz-d65
      calc(0.9505 * clamp(0, (0.1791 - y) * 1000000000, 1))
      calc(1 * clamp(0, (0.1791 - y) * 1000000000, 1))
      calc(1.089 * clamp(0, (0.1791 - y) * 1000000000, 1)));
  }
}

/* Badge rings. ds-bot draws the 1.5px gap around a sidebar badge — and the
   outline that lifts the main Bot's crown off the avatar — in the sidebar's own
   colour. Under frost that colour is a plate veil, which erases the gap and
   lets the crown read as a stray star lying on the avatar, so both ride the
   palette's opaque sidebar tone instead (published by bloomOwnVarsCss; the
   fallback keeps the mapping honest if that var ever disappears).
   The :not(.bt-badge-main) guard keeps the crown out of the box-shadow ring on
   purpose: ds-bot gives that one box-shadow: none and an outlined path. */
html body[${BODY_ATTR}] .bt-badge:not(.bt-badge-main) {
  box-shadow: 0 0 0 1.5px var(--bloom-sidebar-solid, var(--bt-sidebar));
}
html body[${BODY_ATTR}] .bt-badge-main path {
  stroke: var(--bloom-sidebar-solid, var(--bt-sidebar));
}
`.trim()

/** Panels whose subtree holds `position: fixed` nodes: the plate goes on ::before. */
const PLATE = ':is(.bt-panel, .bt-pane)'
/** Surfaces that carry the glass on the element itself. */
const PANE =
  ':is(.bt-menu, .bt-drop, .bt-avedit, .bt-connect-tip, .bt-update-pop, .bt-us-pick, .bt-react-strip, .bt-pill, .bt-settings, .bt-mem, .bt-palette, .bt-nc-card, .bt-settings-nav)'
/** The column that hosts the Bot list (rail or full sidebar). */
const BOT_COLUMN =
  ":is(*:has(> [data-slot='sidebar']):has(.bt-side), *:has(> [data-slot='sidebar']):has(.bt-rail))"

/** The one recipe every covering surface uses: theme overlay role + the blur knob. */
const GLASS = `background-color: var(--dsw-alias-bg-overlay);
  -webkit-backdrop-filter: blur(var(--bloom-glass-blur)) saturate(var(--fw-saturate, 100%));
  backdrop-filter: blur(var(--bloom-glass-blur)) saturate(var(--fw-saturate, 100%));`

/** The same glass with the surface's own tint: message bubbles keep their role. */
const tintedGlass = (fill: string): string => `background-color: ${fill};
  -webkit-backdrop-filter: blur(var(--bloom-glass-blur)) saturate(var(--fw-saturate, 100%));
  backdrop-filter: blur(var(--bloom-glass-blur)) saturate(var(--fw-saturate, 100%));`

/**
 * The Bot↔Bot exchange sheet's plate — the one covering surface that has to
 * *erase* what is behind it, not merely tint it.
 *
 * The sheet drops over the host conversation, so the user reads the two at once.
 * A share of the glass density leaves the host's own lines visible through it
 * however soft the blur is: measured on the harness (14px text behind the sheet,
 * the user's 8px blur) the residual line signal is 7% of the host's own at the
 * overlay's 40%, 5% at 55%, 2% at 70% and 1% at 85% — only from 85% up is
 * nothing of the line left to see. The recipe stays the family's (the same
 * overlay role, the same blur knob) and takes a 75% share of the palette's
 * opaque tone, which lands at 85% opacity at the shipped glass density and rises
 * with the slider. If the backdrop cannot be composited at all —
 * `prefers-reduced-transparency`, or a frame that cuts the backdrop — this
 * density still brings the host's text from 40% of its contrast down to 4.5%,
 * and the blur is what removes it outright.
 */
const COVER = 'color-mix(in oklab, var(--dsw-alias-bg-overlay), var(--bloom-surface-solid, var(--dsw-alias-bg-layer-1)) 75%)'

/**
 * One glass family for the whole Bot UI.
 *
 * Everything that covers the page — the Bot sidebar column, the details panel
 * and the Bot↔Bot exchange sheet, the dialogs, the menus and popovers, the
 * header pill, the empty-chat card and the settings dialog's own navigation —
 * takes the same recipe: the theme's overlay role at the user's blur. Before
 * this, each of them painted its own flat `--bt-main` fill, so at the low end of
 * the glass knob some read as opaque slabs with no blur at all (the sidebar was
 * hidden behind Bloom's own opaque column tint, the bubbles were solid brand).
 *
 * Two deliberate exceptions, both documented where they sit: the exchange
 * sheet's composer footer, which has to hide its *own* scrolling transcript, and
 * the message bubbles, which keep their role tint so a Bot message and the
 * user's own message stay distinguishable.
 *
 * The gate needs both body attributes — the theme's, so the sheet cannot outlive
 * it, and the frost's — and it is deep enough in attribute selectors to outrank
 * ds-bot's own `:hover` and `[aria-pressed]` fills whatever the load order is.
 */
export const BOT_GLASS_CSS = `
/* The Bot sidebar. Bloom's own sheet gives the column an opaque accent tint,
   which paints *over* the frosted plate and hides its blur; under frost the
   column hands its fill to the plate and the plate takes the family glass, so
   the wallpaper reads through it blurred. Scoped to the column that hosts the
   Bot UI, so the ordinary session sidebar keeps the theme's own treatment. */
body[${BODY_ATTR}][${FROST_ATTR}] ${BOT_COLUMN} {
  background-color: transparent;
}
body[${BODY_ATTR}][${FROST_ATTR}] ${BOT_COLUMN}::before {
  background-color: var(--dsw-alias-bg-overlay);
}

/* Covering panels: same glass, on ::before, so the panel itself stays
   filter-free for the fixed descendants it hosts. */
body[${BODY_ATTR}][${FROST_ATTR}] ${PLATE} {
  background-color: transparent;
}
body[${BODY_ATTR}][${FROST_ATTR}] ${PLATE}::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  ${GLASS}
}

/* The Bot↔Bot exchange sheet: the family glass, at the density that erases the
   host conversation behind it (see COVER). Everything else about the plate —
   position, the blur knob, the panel staying filter-free — is the rule above. */
body[${BODY_ATTR}][${FROST_ATTR}] .bt-exchange::before {
  background-color: ${COVER};
}

/* Menus, popovers, dialogs, the header pill, the empty-chat card, the settings
   navigation: the same glass, on the element. */
body[${BODY_ATTR}][${FROST_ATTR}] ${PANE} {
  ${GLASS}
}

/* The exchange sheet's composer footer scrolls over its own transcript, so it
   needs a plate that hides text rather than a share of the density. It is the
   one surface that stays near-solid, and it is a thin strip. */
body[${BODY_ATTR}][${FROST_ATTR}] .bt-exchange .bt-dialog-foot {
  background-color: var(--bt-glass-cover);
}
body[${BODY_ATTR}][${FROST_ATTR}] .bt-exchange .bt-dialog-foot::before {
  background: linear-gradient(to top, var(--bt-glass-cover), transparent);
}

/* Message bubbles: the content tier. The Bot's side keeps the theme's bubble
   role and its blur. The user's side is the one pair --bt-user / --bt-user-ink,
   which ds-bot paints the host chat's bubble with in *every* conversation shape
   ([class*="_userRow"] [class*="_bubble"], question replies, command input) and
   which is also what these two classes — the copies ds-bot renders itself —
   resolve to. Colouring the pair instead of each entry point is what makes every
   conversation agree, and it leaves ds-bot's own !important rule (which sets the
   host bubble's surface and ink) saying the right thing rather than fighting it.
   That pair is now the composer's send-button pair and therefore opaque, so this
   side carries no backdrop filter: blurring behind a solid fill would cost a
   compositing pass and change nothing, and any transparency would make the
   bubble a different colour than the button. */
body[${BODY_ATTR}][${FROST_ATTR}] .bt-bubble {
  ${tintedGlass('var(--dsw-specific-bubble)')}
}
body[${BODY_ATTR}][${FROST_ATTR}] :is(.bt-ubody, .bt-ububble) {
  background-color: var(--bt-user);
}

/* The composer is DSH's, which this theme already frosts on ::before. ds-bot
   repaints that card with its own fill and !important, so the plate would never
   show: hand the card back to the theme's plate. */
body[${BODY_ATTR}][${FROST_ATTR}] [data-composer-card] {
  background-color: transparent !important;
}

@media (prefers-reduced-transparency: reduce) {
  body[${BODY_ATTR}][${FROST_ATTR}] ${BOT_COLUMN}::before,
  body[${BODY_ATTR}][${FROST_ATTR}] ${PLATE}::before,
  body[${BODY_ATTR}][${FROST_ATTR}] ${PANE},
  body[${BODY_ATTR}][${FROST_ATTR}] .bt-bubble {
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
}
`.trim()

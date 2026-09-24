/**
 * Two independently gated stylesheets.
 *
 * GLASS_CSS is the frosted chrome: the wallpaper plate, the dim veil, and the
 * per-column glass. It is gated on FROST_ATTR, which exists only while a
 * wallpaper is actually painted — so retracting the frost leaves the palette
 * theme itself untouched.
 *
 * SETTINGS_CSS styles the settings panel and is injected once per activate.
 */
import { FROST_ATTR } from './constants.ts'

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

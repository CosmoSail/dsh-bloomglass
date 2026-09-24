/**
 * Styles for the palette picker — the one part of the settings panel that is
 * new in the merge, so it lives apart from the ported `SETTINGS_CSS`.
 *
 * Every colour is read from the live theme, so the picker re-tints itself as
 * soon as a palette is chosen.
 */
export const PALETTE_CSS = `
.fw-palette {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
  gap: 8px;
  min-width: 0;
}
.fw-palette-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.12));
  background: transparent;
  cursor: pointer;
  text-align: left;
  font: inherit;
  transition: border-color 0.16s ease, background-color 0.16s ease;
}
.fw-palette-item:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.04));
}
.fw-palette-item[aria-selected='true'] {
  border-color: var(--bloom-accent, #6b8f71);
  background: color-mix(in oklch, var(--bloom-accent, #6b8f71), transparent 91%);
}
.fw-palette-item:focus-visible {
  outline: 2px solid var(--bloom-accent, #6b8f71);
  outline-offset: 2px;
}
.fw-palette-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex: none;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.14);
}
.fw-palette-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.fw-palette-name {
  font-size: 13px;
  line-height: 1.3;
  color: var(--dsw-alias-label-primary);
}
.fw-palette-poem {
  font-size: 11px;
  line-height: 1.3;
  color: var(--dsw-alias-label-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.fw-subhead {
  font-size: 12px;
  font-weight: 600;
  color: var(--dsw-alias-label-secondary);
  margin: 2px 0 -4px;
}
`.trim()

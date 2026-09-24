/**
 * The unified token pipeline — where Bloom and Frosted actually merge.
 *
 * Bloom owns the *colour*: ten OKLCH palettes compiled by `bloom-tokens.ts`
 * into ~90 `--dsw-*` declarations per light/dark mode.
 * Frosted owns the *transparency*: a wallpaper sits behind the UI, so every
 * surface token is re-expressed at the glass opacity the user dialled in.
 *
 * Two separate channels come out of this module:
 *
 *   1. `bloomTokenOverrides()` → `--dsw-*` only, fed to the official
 *      `ThemeRuntime.overrideTokens` layer (reversible, stacks correctly).
 *   2. `bloomOwnVarsCss()` → the `--bloom-*` properties our stylesheets read.
 *      They are plugin-internal, so they ride our own scoped <style> tag
 *      instead of the theme registry.
 *
 * Values are never re-typed by hand: they are parsed out of Bloom's own
 * builders, so the palette cannot drift from upstream during a merge.
 */
import { PALETTE, isVariant, type Variant } from './palette.ts'
import { bloomTokens, mistDark, mistLight, variantBlock } from './bloom-tokens.ts'

/** One override-layer token value: both palette modes are mandatory. */
export interface ThemeTokenModes {
  /** Value applied while the light base palette is active. */
  light: string
  /** Value applied while the dark base palette is active. */
  dark: string
}

/** Override-layer dictionary: token names to per-mode value pairs. */
export type ThemeTokenOverrides = Record<string, ThemeTokenModes>

/**
 * Pull `--name: value;` pairs out of a CSS rule emitted by Bloom's builders.
 * Nested builders are already interpolated by the time we see the text, so the
 * body holds flat declarations and no nested braces.
 * @param css - a rule such as `body[data-bloom-variant="mist"] { --a: b; }`.
 */
function declarations(css: string): Record<string, string> {
  const open = css.indexOf('{')
  const close = css.lastIndexOf('}')
  const body = open >= 0 && close > open ? css.slice(open + 1, close) : css
  const out: Record<string, string> = {}
  const pattern = /(--[a-z0-9-]+)\s*:\s*([^;]+);/gi
  let match: RegExpExecArray | null
  while ((match = pattern.exec(body)) !== null) out[match[1]] = match[2].trim()
  return out
}

/** Split a declaration map into the DSH token layer and Bloom's own variables. */
function partition(map: Record<string, string>): {
  dsw: Record<string, string>
  own: Record<string, string>
} {
  const dsw: Record<string, string> = {}
  const own: Record<string, string> = {}
  for (const [name, value] of Object.entries(map)) {
    if (name.startsWith('--dsw-')) dsw[name] = value
    else own[name] = value
  }
  return { dsw, own }
}

/** Compose light + dark declaration maps into per-mode token pairs. */
function pair(light: Record<string, string>, dark: Record<string, string>): ThemeTokenOverrides {
  const out: ThemeTokenOverrides = {}
  for (const name of new Set([...Object.keys(light), ...Object.keys(dark)])) {
    // A token defined in only one mode repeats that value, so switching the
    // scheme can never leave it undefined (ThemeRuntime contract).
    out[name] = { light: light[name] ?? dark[name], dark: dark[name] ?? light[name] }
  }
  return out
}

/**
 * Bloom's complete DSH token layer for one palette, both modes.
 * `mist` is the skeleton every other variant inherits; a variant only
 * overrides its accent and background tonality.
 * @param variant - palette key; unknown values fall back to `mist`.
 */
export function bloomTokenOverrides(variant: unknown): ThemeTokenOverrides {
  const key: Variant = isVariant(variant) ? variant : 'mist'
  const light = partition(declarations(mistLight(PALETTE.mist))).dsw
  const dark = partition(declarations(mistDark(PALETTE.mist))).dsw
  if (key !== 'mist') {
    Object.assign(light, partition(declarations(variantBlock(key, false))).dsw)
    Object.assign(dark, partition(declarations(variantBlock(key, true))).dsw)
  }
  return pair(light, dark)
}

/**
 * Bloom's own `--bloom-*` properties as a scoped stylesheet.
 * Gated on the plugin body attribute and on the active palette, mirroring the
 * cascade Bloom's own builders rely on (dark block wins by specificity).
 * @param variant - palette key; unknown values fall back to `mist`.
 */
export function bloomOwnVarsCss(variant: unknown, attr: string): string {
  const key: Variant = isVariant(variant) ? variant : 'mist'
  const light = partition(declarations(bloomTokens(PALETTE[key], false))).own
  const dark = partition(declarations(bloomTokens(PALETTE[key], true))).own
  const render = (map: Record<string, string>): string =>
    Object.entries(map).map(([name, value]) => `${name}: ${value};`).join('')
  return [
    `body[${attr}="${key}"]{${render(light)}}`,
    // `data-ds-dark-theme` is a presence attribute on body, not a keyed one.
    `body[${attr}="${key}"][data-ds-dark-theme]{${render(dark)}}`,
  ].join('\n')
}

/** Token roles that turn into frosted plates when a wallpaper is behind them. */
type GlassRole = 'base' | 'plate' | 'raised' | 'overlay' | 'input' | 'menu' | 'bubble' | 'hover' | 'drop'

/**
 * Frosted's published opacity recipe, preserved token-for-token so the merged
 * plugin keeps the slider range users already tuned.
 */
const GLASS_ROLE: Record<string, GlassRole> = {
  '--dsw-alias-bg-base': 'base',
  '--dsw-alias-bg-layer-1': 'plate',
  '--dsw-alias-bg-layer-2': 'raised',
  '--dsw-alias-bg-layer-3': 'raised',
  '--dsw-alias-bg-overlay': 'overlay',
  '--dsw-alias-bg-module-platform': 'raised',
  '--dsw-alias-bg-mask-drop': 'drop',
  '--dsw-specific-sidebar-fill': 'plate',
  '--dsw-specific-input-major': 'input',
  '--dsw-specific-menu': 'menu',
  '--dsw-specific-bubble': 'bubble',
  '--dsw-specific-selector': 'raised',
  '--dsw-specific-sidebar-nav-item-active': 'raised',
  '--dsw-specific-sidebar-nav-item-hover': 'hover',
  '--dsw-alias-button-elevated-fill': 'input',
  '--dsw-alias-button-floating-fill': 'input',
  '--dsw-alias-markdown-code-block': 'raised',
  '--dsw-alias-markdown-inline-code': 'raised',
}

/** Expand one glass-opacity knob into the per-role opacity table. */
function glassAlphas(glassOpacity: number): Record<GlassRole, number> {
  const a = glassOpacity
  return {
    base: Math.max(0.08, a * 0.42),
    plate: a,
    raised: Math.min(0.92, a + 0.1),
    overlay: Math.min(0.94, a + 0.22),
    input: Math.min(0.9, a + 0.12),
    menu: Math.min(0.9, a + 0.16),
    bubble: Math.min(0.88, a + 0.08),
    hover: Math.min(0.55, a * 0.7),
    drop: 0.45,
  }
}

/**
 * Re-express a palette colour at a given opacity without shifting its hue.
 * `color-mix` in oklch keeps the Morandi character that converting to rgba
 * would flatten.
 * @param color - any CSS colour, typically one of Bloom's oklch values.
 * @param alpha - target opacity in [0, 1].
 */
export function veil(color: string, alpha: number): string {
  const clamped = Math.min(1, Math.max(0, alpha))
  const transparency = Math.round((1 - clamped) * 1000) / 10
  return `color-mix(in oklch, ${color}, transparent ${transparency}%)`
}

/**
 * Fold the frosted layer into Bloom's colours: surface tokens become
 * translucent plates, text and border tokens stay exactly as Bloom set them
 * (transparency there would only cost contrast).
 * @param base - Bloom's opaque token layer.
 * @param glassOpacity - the user's glass-density knob.
 */
export function applyGlass(base: ThemeTokenOverrides, glassOpacity: number): ThemeTokenOverrides {
  const alpha = glassAlphas(glassOpacity)
  const out: ThemeTokenOverrides = {}
  for (const [name, modes] of Object.entries(base)) {
    const role = GLASS_ROLE[name]
    if (role === undefined) {
      out[name] = modes
      continue
    }
    out[name] = {
      light: veil(modes.light, alpha[role]),
      dark: veil(modes.dark, alpha[role]),
    }
  }
  return out
}

/** Inputs the pipeline needs from the user's stored knobs. */
export interface TokenInputs {
  /** Active palette key. */
  variant: unknown
  /** Glass density in [0.18, 0.82]. */
  glassOpacity: number
  /** True while a wallpaper is painted behind the UI. */
  frosted: boolean
}

/**
 * The single entry point the plugin calls: Bloom's palette, optionally
 * re-expressed as frosted glass over a wallpaper.
 * @param inputs - palette, glass density, and whether a wallpaper is active.
 */
export function bloomglassTokens(inputs: TokenInputs): ThemeTokenOverrides {
  const base = bloomTokenOverrides(inputs.variant)
  return inputs.frosted ? applyGlass(base, inputs.glassOpacity) : base
}

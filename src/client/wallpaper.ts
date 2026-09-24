/**
 * Owns the wallpaper plate, the dim veil, the scoped frost stylesheet, and the
 * `--fw-*` custom properties. Retracts exactly what it wrote.
 *
 * Deliberately never touches {@link BODY_ATTR}: that attribute means "the
 * palette theme is installed", and the frost is only one optional layer of it.
 */
import { FROST_ATTR, PACKAGE_ID } from './constants.ts'
import { GLASS_CSS } from './glass-css.ts'
import type { BloomglassKnobs } from './knobs.ts'

export type ColorScheme = 'light' | 'dark'

/** One applied wallpaper + glass state. */
export interface FrostedSurface {
  knobs: BloomglassKnobs
  objectUrl: string | null
  scheme: ColorScheme
}

/**
 * Custom properties the frost layer publishes. `--fw-*` drive Frosted's own
 * selectors; `--bloom-glass-blur` is the single blur knob Bloom's stylesheets
 * read, so both halves of the merge blur by the same amount.
 */
const BLUR_VAR = '--bloom-glass-blur'
const SATURATE_VAR = '--fw-saturate'
const DIM_VAR = '--fw-dim'
/** Bloom paints its own ambience wash; a wallpaper must displace it. */
const AMBIENCE_VAR = '--bloom-ambience'
const FROST_VARS = [BLUR_VAR, SATURATE_VAR, DIM_VAR, AMBIENCE_VAR] as const

/** Presenter over the document: one wallpaper, one dim veil, one stylesheet. */
export class FrostedPresenter {
  private styleEl: HTMLStyleElement | undefined
  private wallpaperEl: HTMLDivElement | undefined
  private dimEl: HTMLDivElement | undefined
  private objectUrl: string | undefined

  /** Project one surface onto the document. Passing a disabled/empty surface retracts. */
  apply(surface: FrostedSurface): void {
    const active = surface.knobs.enabled && surface.objectUrl !== null
    if (!active) {
      this.retractChrome()
      return
    }
    this.ensureChrome()
    const wallpaper = this.wallpaperEl
    const dim = this.dimEl
    if (wallpaper === undefined || dim === undefined) return
    const body = document.body
    wallpaper.style.backgroundImage = `url(${JSON.stringify(surface.objectUrl)})`
    body.setAttribute(FROST_ATTR, surface.scheme)
    body.style.setProperty(BLUR_VAR, `${surface.knobs.blurPx}px`)
    body.style.setProperty(SATURATE_VAR, `${Math.round(surface.knobs.saturate * 100)}%`)
    body.style.setProperty(DIM_VAR, String(surface.knobs.dim))
    body.style.setProperty(AMBIENCE_VAR, 'none')
  }

  /** Remember a blob URL so dispose can revoke it. Callers revoke the previous URL after React paints. */
  adoptObjectUrl(url: string | undefined): void {
    this.objectUrl = url
  }

  /** Current adopted object URL, if any. */
  currentObjectUrl(): string | undefined {
    return this.objectUrl
  }

  /** Retract every node, attribute, custom property, and object URL. */
  dispose(): void {
    this.retractChrome()
    if (this.objectUrl !== undefined) {
      URL.revokeObjectURL(this.objectUrl)
      this.objectUrl = undefined
    }
  }

  private ensureChrome(): void {
    if (this.styleEl === undefined || !this.styleEl.isConnected) {
      const style = document.createElement('style')
      style.dataset.plugin = PACKAGE_ID
      style.dataset.pluginCss = `${PACKAGE_ID}/glass.css`
      style.textContent = GLASS_CSS
      document.head.append(style)
      this.styleEl = style
    }
    if (this.wallpaperEl === undefined || !this.wallpaperEl.isConnected) {
      const plate = document.createElement('div')
      plate.setAttribute(`${FROST_ATTR}-wallpaper`, '')
      document.body.prepend(plate)
      this.wallpaperEl = plate
    }
    if (this.dimEl === undefined || !this.dimEl.isConnected) {
      const veil = document.createElement('div')
      veil.setAttribute(`${FROST_ATTR}-dim`, '')
      this.wallpaperEl.after(veil)
      this.dimEl = veil
    }
  }

  private retractChrome(): void {
    this.styleEl?.remove()
    this.styleEl = undefined
    this.wallpaperEl?.remove()
    this.wallpaperEl = undefined
    this.dimEl?.remove()
    this.dimEl = undefined
    const body = document.body
    body.removeAttribute(FROST_ATTR)
    for (const name of FROST_VARS) body.style.removeProperty(name)
  }
}

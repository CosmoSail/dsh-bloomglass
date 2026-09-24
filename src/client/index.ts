/**
 * Browser half of dsh-bloomglass — the merged theme.
 *
 * Bloom and Frosted used to be two plugins fighting over the same token
 * namespace: Bloom wrote ~90 `--dsw-*` properties from a `<style>` tag with no
 * disposer, while Frosted stacked 18 background tokens through the official
 * override layer, which DSH applies as *inline* body styles and therefore wins
 * regardless of order. The result was neutral-grey glass plates under Morandi
 * labels.
 *
 * This plugin keeps one pipeline instead:
 *
 *   palette (Bloom) ──▶ tokens.ts ──▶ ctx.theme.overrideTokens  ← colours, reversible
 *                            └──────▶ scoped <style>            ← --bloom-* internals
 *
 * Frosted's contribution is no longer a competing palette but an alpha
 * transform applied to Bloom's own surface colours, so a wallpaper dims the
 * Morandi tints rather than replacing them.
 */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-theme/client'
import { BODY_ATTR, LOCALE_NS, PACKAGE_ID, VARIANT_ATTR } from './constants.ts'
import { SETTINGS_CSS } from './glass-css.ts'
import { COMPONENT_CSS } from './css/bloom-component.ts'
import { GLASS_CSS as BLOOM_GLASS_CSS } from './css/bloom-glass.ts'
import { PALETTE_CSS } from './css/palette-css.ts'
import { ImageValidationError, prepareWallpaper, wallpaperBlob, type WallpaperRecord } from './image.ts'
import { openImageStore, type ImageStore } from './image-store.ts'
import { loadKnobs, normalizeKnobs, saveKnobs, type BloomglassKnobs } from './knobs.ts'
import { en, zh, type BloomglassKey } from './locales.ts'
import type { Variant } from './palette.ts'
import { SettingsSection, type SettingsSectionInjected } from './SettingsSection.tsx'
import { createBloomglassStore, type BloomglassState } from './store.ts'
import { bloomOwnVarsCss, bloomglassTokens, type ThemeTokenOverrides } from './tokens.ts'
import { FrostedPresenter, type ColorScheme } from './wallpaper.ts'

export const name = PACKAGE_ID
export const inject = ['slots', 'locale', 'theme']

interface ThemeFace {
  getTheme?: () => { active?: { colorScheme?: string } } | undefined
  overrideTokens?: (source: string, tokens: ThemeTokenOverrides) => unknown
}

interface LocaleFace {
  register(ns: string, dicts: { zh: typeof zh; en: typeof en }): () => void
  bind(ns: string): (key: BloomglassKey) => string
}

interface SlotsFace {
  inject(name: string, callback: () => unknown): () => void
  register(meta: Record<string, unknown>, component: unknown): () => void
}

interface ClientCtx extends Context {
  theme: ThemeFace
  locale: LocaleFace
  slots: SlotsFace
}

/** Client plugin body. */
export function apply(ctx: ClientCtx): void {
  const images: ImageStore = openImageStore()
  const presenter = new FrostedPresenter()
  const store = createBloomglassStore({
    ...loadKnobs(),
    hasImage: false,
    previewUrl: null,
    fileName: null,
    width: 0,
    height: 0,
    dirty: false,
    busy: false,
    error: null,
    revision: 0,
  })
  let knobs = loadKnobs()
  let draft: WallpaperRecord | undefined
  let disposeTokens: (() => void) | undefined
  let styleEl: HTMLStyleElement | undefined
  let mutation = 0
  let disposed = false
  let projecting = false

  const t = (key: BloomglassKey): string => {
    try { return ctx.locale.bind(LOCALE_NS)(key) }
    catch { return zh[key] }
  }

  const publish = (patch: Partial<BloomglassState>): void => {
    const current = store.get()
    store.set({ ...current, ...patch, revision: current.revision + 1 })
  }

  const schemeOf = (): ColorScheme => {
    try {
      return ctx.theme.getTheme?.()?.active?.colorScheme === 'dark' ? 'dark' : 'light'
    } catch {
      return 'light'
    }
  }

  /** True while a wallpaper is actually painted behind the UI. */
  const frostLive = (): boolean => knobs.enabled && store.get().previewUrl !== null

  /* ── stylesheet ─────────────────────────────────────────────────────────
   * One tag carries everything: the palette's own `--bloom-*` block (rewritten
   * whenever the palette changes), Bloom's component and glass sheets, and the
   * settings-panel styles. Removing this one node removes the whole theme.
   */
  const ownCss = (variant: Variant): string =>
    [bloomOwnVarsCss(variant, VARIANT_ATTR), COMPONENT_CSS, BLOOM_GLASS_CSS, SETTINGS_CSS, PALETTE_CSS].join('\n')

  const mountChrome = (): void => {
    if (styleEl !== undefined && styleEl.isConnected) return
    const style = document.createElement('style')
    style.dataset.plugin = PACKAGE_ID
    style.dataset.pluginCss = `${PACKAGE_ID}/theme.css`
    style.textContent = ownCss(knobs.variant)
    document.head.append(style)
    styleEl = style
    document.body.setAttribute(BODY_ATTR, '')
    document.body.setAttribute(VARIANT_ATTR, knobs.variant)
  }

  const retractChrome = (): void => {
    styleEl?.remove()
    styleEl = undefined
    document.body.removeAttribute(BODY_ATTR)
    document.body.removeAttribute(VARIANT_ATTR)
  }

  /* ── token layer ─────────────────────────────────────────────────────── */

  const stackTokens = (): void => {
    if (typeof disposeTokens === 'function') disposeTokens()
    disposeTokens = undefined
    if (disposed || typeof ctx.theme.overrideTokens !== 'function') return
    const retract: unknown = ctx.theme.overrideTokens(PACKAGE_ID, bloomglassTokens({
      variant: knobs.variant,
      glassOpacity: knobs.glassOpacity,
      frosted: frostLive(),
    }))
    disposeTokens = typeof retract === 'function' ? (retract as () => void) : undefined
  }

  /* ── projection ──────────────────────────────────────────────────────── */

  const projectChrome = (): void => {
    if (disposed || projecting) return
    projecting = true
    try {
      presenter.apply({ knobs, objectUrl: store.get().previewUrl, scheme: schemeOf() })
    } finally {
      projecting = false
    }
  }

  const project = (restack: boolean): void => {
    if (disposed) return
    projectChrome()
    if (restack) stackTokens()
  }

  /** Palette + slider changes apply live; Save only makes them durable. */
  const persistKnobs = (next: BloomglassKnobs): void => {
    const variantChanged = normalizeKnobs(next).variant !== knobs.variant
    knobs = normalizeKnobs(next)
    publish({ ...knobs, dirty: true })
    if (variantChanged) {
      document.body.setAttribute(VARIANT_ATTR, knobs.variant)
      if (styleEl !== undefined) styleEl.textContent = ownCss(knobs.variant)
    }
    project(true)
  }

  const adoptRecord = (record: WallpaperRecord | undefined, dirty: boolean): void => {
    if (disposed) return
    const previous = presenter.currentObjectUrl()
    draft = record
    if (record === undefined) {
      publish({
        hasImage: false, previewUrl: null, fileName: null, width: 0, height: 0, dirty, error: null,
      })
      presenter.adoptObjectUrl(undefined)
      if (previous !== undefined) requestAnimationFrame(() => { URL.revokeObjectURL(previous) })
      project(true)
      return
    }
    const url = URL.createObjectURL(wallpaperBlob(record))
    publish({
      hasImage: true,
      previewUrl: url,
      fileName: record.name,
      width: record.width,
      height: record.height,
      dirty,
      error: null,
    })
    presenter.adoptObjectUrl(url)
    if (previous !== undefined && previous !== url) {
      requestAnimationFrame(() => { URL.revokeObjectURL(previous) })
    }
    project(true)
  }

  const upload = async (file: File): Promise<void> => {
    const generation = ++mutation
    publish({ busy: true, error: null })
    try {
      const record = await prepareWallpaper(file)
      if (generation !== mutation || disposed) return
      adoptRecord(record, true)
    } catch (error) {
      if (generation !== mutation || disposed) return
      publish({ error: messageFor(error, t) })
    } finally {
      if (generation === mutation && !disposed) publish({ busy: false })
    }
  }

  const save = async (): Promise<void> => {
    const generation = ++mutation
    publish({ busy: true, error: null })
    try {
      saveKnobs(knobs)
      if (draft === undefined) await images.clear()
      else await images.put(draft)
      if (generation !== mutation || disposed) return
      publish({ dirty: false })
    } catch (error) {
      if (generation !== mutation || disposed) return
      publish({ error: messageFor(error, t) })
    } finally {
      if (generation === mutation && !disposed) publish({ busy: false })
    }
  }

  const remove = async (): Promise<void> => {
    const generation = ++mutation
    publish({ busy: true, error: null })
    try {
      await images.clear()
      saveKnobs(knobs)
      if (generation !== mutation || disposed) return
      adoptRecord(undefined, false)
    } catch (error) {
      if (generation !== mutation || disposed) return
      publish({ error: messageFor(error, t) })
    } finally {
      if (generation === mutation && !disposed) publish({ busy: false })
    }
  }

  ctx.effect(() => ctx.locale.register(LOCALE_NS, { zh, en }), `${PACKAGE_ID}: locale`)

  const injected = (): SettingsSectionInjected => ({
    store,
    t,
    setVariant: (variant: Variant) => { persistKnobs({ ...knobs, variant }) },
    setEnabled: (enabled: boolean) => { persistKnobs({ ...knobs, enabled }) },
    setKnob: (key, value) => { persistKnobs({ ...knobs, [key]: value }) },
    upload,
    save,
    remove,
  })

  // One surface only: the dedicated settings section. The theme deliberately
  // does not add a row to the General page — appearance lives in its own
  // section, alongside the official Appearance rows rather than inside them.
  ctx.effect(() => ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: PACKAGE_ID,
    order: 36,
    label: () => t('nav'),
    locale: LOCALE_NS,
    inject: injected,
  }, SettingsSection)), `${PACKAGE_ID}: settings`)

  ctx.effect(() => {
    const boot = mutation
    mountChrome()
    // Stack the palette synchronously: waiting for IndexedDB to answer would
    // flash the official theme before the first paint.
    project(true)
    const off = ctx.on('theme/change', () => { projectChrome() })
    void images.get().then((record) => {
      if (disposed || mutation !== boot) return
      if (record !== undefined) adoptRecord(record, false)
    }).catch((error: unknown) => {
      if (!disposed && mutation === boot) publish({ error: messageFor(error, t) })
    })
    return () => {
      disposed = true
      mutation += 1
      off()
      if (typeof disposeTokens === 'function') disposeTokens()
      disposeTokens = undefined
      retractChrome()
      presenter.dispose()
    }
  }, `${PACKAGE_ID}: surface`)
}

function messageFor(error: unknown, t: (key: BloomglassKey) => string): string {
  if (error instanceof ImageValidationError && error.message.includes('unsupported')) return t('errorType')
  return t('errorGeneric')
}

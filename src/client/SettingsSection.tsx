import { useRef, useState, useSyncExternalStore, type ChangeEvent, type CSSProperties, type DragEvent } from 'react'
import type { BloomglassKey } from './locales.ts'
import { PALETTE, VARIANTS, VARIANT_LABELS, type Variant } from './palette.ts'
import type { BloomglassStore } from './store.ts'
import { KNOB_RANGES } from './knobs.ts'

/** The face `apply()` injects into the settings slot. */
export interface SettingsSectionInjected {
  store: BloomglassStore
  t: (key: BloomglassKey) => string
  /** Pick a palette; applies immediately, like every other control. */
  setVariant: (variant: Variant) => void
  setEnabled: (enabled: boolean) => void
  setKnob: (key: keyof typeof KNOB_RANGES, value: number) => void
  upload: (file: File) => Promise<void>
  save: () => Promise<void>
  remove: () => Promise<void>
}

/**
 * The single settings page for the merged theme: palette picker on top,
 * wallpaper and glass controls underneath. Replaces Bloom's top-bar switcher
 * and Frosted's panel with one surface.
 * @param props - inject face from apply().
 */
export function SettingsSection({
  store, t, setVariant, setEnabled, setKnob, upload, save, remove,
}: SettingsSectionInjected) {
  const state = useSyncExternalStore(store.subscribe, store.get, store.get)
  const inputRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)

  const onFiles = (files: FileList | null): void => {
    if (state.busy) return
    const file = files?.[0]
    if (file === undefined) return
    void upload(file)
  }

  const pick = (): void => {
    if (!state.busy) inputRef.current?.click()
  }

  const previewStyle = {
    '--fw-ui-glass': String(state.glassOpacity),
    '--fw-ui-blur': `${state.blurPx}px`,
    '--fw-ui-sat': `${Math.round(state.saturate * 100)}%`,
  } as CSSProperties

  const meta = [
    state.fileName,
    state.width > 0 && state.height > 0 ? `${state.width}×${state.height}` : null,
  ].filter(Boolean).join(' · ')

  return (
    <div className="fw-section">
      <div className="fw-panel">
        <div className="fw-head">
          <div className="fw-lead">
            <div className="fw-kicker">Theme</div>
            <div className="fw-title">{t('title')}</div>
            <div className="fw-desc">{t('description')}</div>
          </div>
          <span className="fw-chip" data-tone={state.dirty ? 'warn' : undefined}>
            {state.dirty ? t('unsaved') : t('saved')}
          </span>
        </div>

        <div className="fw-subhead">{t('palette')}</div>
        <div className="fw-palette" role="radiogroup" aria-label={t('palette')}>
          {VARIANTS.map((variant) => {
            const label = VARIANT_LABELS[variant]
            const selected = state.variant === variant
            return (
              <button
                key={variant}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-selected={selected}
                className="fw-palette-item"
                data-variant={variant}
                onClick={() => { setVariant(variant) }}
              >
                <span
                  className="fw-palette-dot"
                  style={{ background: PALETTE[variant].accentL }}
                />
                <span className="fw-palette-text">
                  <span className="fw-palette-name">{label.zh}</span>
                  <span className="fw-palette-poem">{label.poem}</span>
                </span>
              </button>
            )
          })}
        </div>

        <div className="fw-subhead">{t('frost')}</div>

        <label className="fw-switch">
          <span>{t('enable')}</span>
          <input
            type="checkbox"
            checked={state.enabled}
            onChange={(event: ChangeEvent<HTMLInputElement>) => { setEnabled(event.target.checked) }}
          />
        </label>

        <button
          type="button"
          className="fw-hero"
          style={previewStyle}
          data-over={over ? 'true' : 'false'}
          data-has={state.hasImage ? 'true' : 'false'}
          disabled={state.busy}
          onClick={pick}
          onDragOver={(event) => { event.preventDefault(); setOver(true) }}
          onDragLeave={() => { setOver(false) }}
          onDrop={(event: DragEvent<HTMLButtonElement>) => {
            event.preventDefault()
            setOver(false)
            onFiles(event.dataTransfer.files)
          }}
        >
          {state.previewUrl !== null ? <img src={state.previewUrl} alt="" /> : null}
          {state.hasImage ? <span className="fw-hero-glass" /> : null}
          <span className="fw-hero-copy">
            <strong>{state.busy ? t('busy') : state.hasImage ? t('dropReplace') : t('drop')}</strong>
            <span>{state.hasImage ? (meta || t('dropReplace')) : t('empty')}</span>
          </span>
        </button>
        <input
          ref={inputRef}
          className="fw-hidden"
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/*"
          onChange={(event) => {
            onFiles(event.target.files)
            event.target.value = ''
          }}
        />

        {state.error !== null ? <div className="fw-error" role="alert">{state.error}</div> : null}

        <div className="fw-grid">
          <Slider label={t('glass')} value={state.glassOpacity} range={KNOB_RANGES.glassOpacity} step={0.01}
            display={`${Math.round(state.glassOpacity * 100)}%`}
            onChange={value => { setKnob('glassOpacity', value) }} />
          <Slider label={t('blur')} value={state.blurPx} range={KNOB_RANGES.blurPx} step={1}
            display={`${Math.round(state.blurPx)}px`}
            onChange={value => { setKnob('blurPx', value) }} />
          <Slider label={t('saturate')} value={state.saturate} range={KNOB_RANGES.saturate} step={0.01}
            display={`${Math.round(state.saturate * 100)}%`}
            onChange={value => { setKnob('saturate', value) }} />
          <Slider label={t('dim')} value={state.dim} range={KNOB_RANGES.dim} step={0.01}
            display={`${Math.round(state.dim * 100)}%`}
            onChange={value => { setKnob('dim', value) }} />
        </div>

        <div className="fw-bar">
          <button type="button" className="fw-btn" data-kind="danger" disabled={!state.hasImage || state.busy} onClick={() => { void remove() }}>
            {t('remove')}
          </button>
          <button type="button" className="fw-btn" onClick={pick} disabled={state.busy}>
            {t('choose')}
          </button>
          <button type="button" className="fw-btn" data-kind="primary" disabled={!state.dirty || state.busy} onClick={() => { void save() }}>
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  )
}

function Slider(props: {
  label: string
  value: number
  range: readonly [number, number]
  step: number
  display: string
  onChange: (value: number) => void
}) {
  return (
    <label className="fw-row">
      <span className="fw-row-head">
        <span>{props.label}</span>
        <span>{props.display}</span>
      </span>
      <input
        type="range"
        min={props.range[0]}
        max={props.range[1]}
        step={props.step}
        value={props.value}
        onChange={(event) => { props.onChange(Number(event.target.value)) }}
      />
    </label>
  )
}

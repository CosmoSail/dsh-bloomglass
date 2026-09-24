// @vitest-environment jsdom
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { SettingsSection } from '../src/client/SettingsSection.tsx'
import { zh } from '../src/client/locales.ts'
import { VARIANTS } from '../src/client/palette.ts'
import { createBloomglassStore, INITIAL_STATE } from '../src/client/store.ts'

async function render(overrides: Partial<Parameters<typeof SettingsSection>[0]> = {}) {
  const store = createBloomglassStore({ ...INITIAL_STATE, revision: 0 })
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  const props = {
    store,
    t: (key: keyof typeof zh) => zh[key],
    setVariant: vi.fn(),
    setEnabled: vi.fn(),
    setKnob: vi.fn(),
    upload: async () => {},
    save: async () => {},
    remove: async () => {},
    ...overrides,
  }
  await act(async () => { root.render(<SettingsSection {...props} />) })
  return { host, root, props }
}

describe('SettingsSection', () => {
  it('offers every palette as a radio, marked with its poem', async () => {
    const { host, root } = await render()
    const options = host.querySelectorAll('[role="radio"]')
    expect(options).toHaveLength(VARIANTS.length)
    expect(host.textContent).toContain('黛蓝')
    expect(host.textContent).toContain('山色有无中')
    expect(host.textContent).toContain('青莲')
    expect(host.textContent).toContain('清水出芙蓉')
    await act(async () => { root.unmount() })
    host.remove()
  })

  it('marks the active palette as checked', async () => {
    const { host, root } = await render()
    const checked = [...host.querySelectorAll('[role="radio"]')]
      .filter(node => node.getAttribute('aria-checked') === 'true')
    expect(checked).toHaveLength(1)
    expect(checked[0].getAttribute('data-variant')).toBe(INITIAL_STATE.variant)
    await act(async () => { root.unmount() })
    host.remove()
  })

  it('reports a palette choice through setVariant', async () => {
    const setVariant = vi.fn()
    const { host, root } = await render({ setVariant })
    const petal = host.querySelector('[data-variant="petal"]') as HTMLButtonElement
    await act(async () => { petal.click() })
    expect(setVariant).toHaveBeenCalledWith('petal')
    await act(async () => { root.unmount() })
    host.remove()
  })

  it('renders the upload surface, four glass sliders, and the actions', async () => {
    const { host, root } = await render()
    expect(host.textContent).toContain('Bloom Glass 主题')
    expect(host.textContent).toContain('启用壁纸与磨砂')
    expect(host.textContent).toContain('保存')
    expect(host.textContent).toContain('删除')
    expect(host.querySelectorAll('input[type="range"]')).toHaveLength(4)
    expect(host.querySelector('input[type="file"]')?.getAttribute('accept')).toContain('image/png')
    await act(async () => { root.unmount() })
    host.remove()
  })

  it('reports slider writes through setKnob', async () => {
    const setKnob = vi.fn()
    const { host, root } = await render({ setKnob })
    const sliders = [...host.querySelectorAll('input[type="range"]')] as HTMLInputElement[]
    const blur = sliders[1]
    await act(async () => {
      // React tracks the value internally, so drive it the way a user would.
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      setter?.call(blur, '40')
      blur.dispatchEvent(new Event('input', { bubbles: true }))
    })
    expect(setKnob).toHaveBeenCalledWith('blurPx', 40)
    await act(async () => { root.unmount() })
    host.remove()
  })
})

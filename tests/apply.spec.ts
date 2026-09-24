import { afterEach, describe, expect, it, vi } from 'vitest'
import { BODY_ATTR, PACKAGE_ID, VARIANT_ATTR } from '../src/client/constants.ts'
import { PALETTE } from '../src/client/palette.ts'
import { apply, inject } from '../src/client/index.ts'

function mockCtx() {
  const effects: Array<() => void> = []
  const tokens: Array<{ source: string; layer: Record<string, { light: string; dark: string }> }> = []
  const sections: unknown[] = []
  const listeners = new Map<string, Array<(...args: unknown[]) => void>>()
  const ctx = {
    theme: {
      getTheme: () => ({ active: { colorScheme: 'light' as const } }),
      overrideTokens: vi.fn((source: string, layer: Record<string, { light: string; dark: string }>) => {
        tokens.push({ source, layer })
        return () => { /* retract */ }
      }),
    },
    locale: {
      register: vi.fn(() => () => { /* retract */ }),
      bind: () => (key: string) => key,
    },
    slots: {
      inject: vi.fn((_name: string, register: () => unknown) => {
        sections.push(register())
        return () => { /* retract */ }
      }),
      register: vi.fn((meta: unknown, component: unknown) => {
        return { meta, component }
      }),
    },
    effect: (factory: () => unknown, _label?: string) => {
      const dispose = factory()
      if (typeof dispose === 'function') effects.push(dispose as () => void)
    },
    on: (event: string, handler: (...args: unknown[]) => void) => {
      const list = listeners.get(event) ?? []
      list.push(handler)
      listeners.set(event, list)
      return () => {
        listeners.set(event, listeners.get(event)?.filter(item => item !== handler) ?? [])
      }
    },
  }
  return { ctx, effects, tokens, sections, listeners }
}

describe('apply', () => {
  afterEach(() => {
    document.body.removeAttribute(BODY_ATTR)
    document.body.removeAttribute(VARIANT_ATTR)
    document.head.querySelectorAll('style[data-plugin]').forEach(node => { node.remove() })
  })

  it('declares the services the fiber must wait for', () => {
    expect(inject).toEqual(['slots', 'locale', 'theme'])
  })

  it('registers locale, one dedicated settings section, and a theme/change listener', () => {
    const { ctx, sections, listeners } = mockCtx()
    apply(ctx as never)
    expect(ctx.locale.register).toHaveBeenCalled()
    expect(ctx.slots.inject).toHaveBeenCalledWith('settings.section', expect.any(Function))
    expect(sections).toHaveLength(1)
    const ids = sections.map(entry => (entry as { meta: { id: string } }).meta.id)
    expect(new Set(ids)).toEqual(new Set([PACKAGE_ID]))
    expect(listeners.has('theme/change')).toBe(true)
  })

  it('keeps out of the General settings page', () => {
    const { ctx } = mockCtx()
    apply(ctx as never)
    const injected = ctx.slots.inject.mock.calls.map(call => call[0])
    expect(injected).not.toContain('settings.general.item')
  })

  it('stacks the Bloom palette through the official override layer', () => {
    const { ctx, tokens } = mockCtx()
    apply(ctx as never)
    expect(tokens.length).toBeGreaterThan(0)
    const [first] = tokens
    expect(first.source).toBe(PACKAGE_ID)
    expect(first.layer['--dsw-alias-brand-primary'].light).toBe(PALETTE.mist.accentL)
    expect(first.layer['--dsw-alias-brand-primary'].dark).toBe(PALETTE.mist.accentD)
  })

  it('gates the palette on body attributes rather than a bare stylesheet', () => {
    const { ctx } = mockCtx()
    apply(ctx as never)
    expect(document.body.hasAttribute(BODY_ATTR)).toBe(true)
    expect(document.body.getAttribute(VARIANT_ATTR)).toBe('mist')
    const style = document.head.querySelector(`style[data-plugin="${PACKAGE_ID}"]`)
    expect(style?.textContent).toContain('--bloom-accent')
    expect(style?.textContent).toContain('fw-palette-item')
  })

  it('removes its stylesheet and attributes on dispose', () => {
    const { ctx, effects } = mockCtx()
    apply(ctx as never)
    for (const dispose of effects) dispose()
    expect(document.head.querySelector(`style[data-plugin="${PACKAGE_ID}"]`)).toBeNull()
    expect(document.body.hasAttribute(BODY_ATTR)).toBe(false)
    expect(document.body.hasAttribute(VARIANT_ATTR)).toBe(false)
  })
})

import { afterEach, describe, expect, it, vi } from 'vitest'
import { BODY_ATTR, PACKAGE_ID, VARIANT_ATTR } from '../src/client/constants.ts'
import { apply } from '../src/client/index.ts'

/**
 * The client module system's own two lines, quoted so this file can replay them
 * instead of describing them: the sweep that files every untagged `<style>` under
 * whichever module is materializing, and the removal that takes them all with it
 * when that module is hot-replaced, invalidated or pruned.
 */
const claimStyles = (id: string): void => {
  for (const el of document.querySelectorAll('style:not([data-plugin])')) el.setAttribute('data-plugin', id)
}
const removeOwnedStyles = (id: string): void => {
  for (const el of document.querySelectorAll('style[data-plugin]')) {
    if (el.getAttribute('data-plugin') === id) el.remove()
  }
}

/** One sheet the way ds-bot's `installStyles` writes it: marker, no `data-plugin`. */
const dsBotSheet = (tag: string): HTMLStyleElement => {
  const style = document.createElement('style')
  style.dataset.dshBot = tag
  style.textContent = `.bt-${tag} { color: red }`
  document.head.append(style)
  return style
}

function mockCtx() {
  const effects: Array<() => void> = []
  const ctx = {
    theme: {
      getTheme: () => ({ active: { colorScheme: 'light' as const } }),
      overrideTokens: vi.fn(() => () => { /* retract */ }),
    },
    locale: {
      register: vi.fn(() => () => { /* retract */ }),
      bind: () => (key: string) => key,
    },
    slots: {
      inject: vi.fn(() => () => { /* retract */ }),
      register: vi.fn(() => ({ /* handle */ })),
    },
    effect: (factory: () => unknown) => {
      const dispose = factory()
      if (typeof dispose === 'function') effects.push(dispose as () => void)
    },
    on: () => () => { /* retract */ },
  }
  activeEffects = effects
  return { ctx, effects }
}

const tick = (): Promise<void> => new Promise(resolve => { setTimeout(resolve, 0) })

/** Every effect registered this test, so the observer cannot outlive it. */
let activeEffects: Array<() => void> = []

describe('style ownership — the Bot UI keeps its sheets', () => {
  afterEach(() => {
    for (const dispose of activeEffects) dispose()
    activeEffects = []
    document.body.removeAttribute(BODY_ATTR)
    document.body.removeAttribute(VARIANT_ATTR)
    document.head.querySelectorAll('style').forEach(node => { node.remove() })
  })

  it('keeps ds-bot’s sheets out of this module’s sweep and removal', () => {
    // The reported failure: the theme materializes after ds-bot, the framework's
    // sweep files ds-bot's fourteen sheets under this package, and the next
    // hot-replace of this theme takes the Bot UI's styles down with it.
    const { ctx } = mockCtx()
    const shell = dsBotSheet('shell')
    apply(ctx as never)

    claimStyles(PACKAGE_ID)
    expect(shell.getAttribute('data-plugin')).toBe('ds-bot')

    removeOwnedStyles(PACKAGE_ID)
    expect(document.head.contains(shell)).toBe(true)
    expect(shell.getAttribute('data-plugin')).toBe('ds-bot')
  })

  it('takes a sheet back from whichever module claimed it', () => {
    // A boot module can be the one holding them; the tags still belong to ds-bot.
    const { ctx } = mockCtx()
    const sidebar = dsBotSheet('sidebar')
    sidebar.setAttribute('data-plugin', '@deepseek-ai/dsh-web-app')
    apply(ctx as never)

    expect(sidebar.getAttribute('data-plugin')).toBe('ds-bot')
    removeOwnedStyles('@deepseek-ai/dsh-web-app')
    expect(document.head.contains(sidebar)).toBe(true)
  })

  it('catches sheets ds-bot injects after this plugin mounted', async () => {
    const { ctx } = mockCtx()
    apply(ctx as never)
    const settings = dsBotSheet('settings')
    await tick()
    expect(settings.getAttribute('data-plugin')).toBe('ds-bot')
  })

  it('leaves this plugin’s own sheets under its own id', () => {
    // The shim must not disturb the theme's own lifecycle: its sheets still carry
    // the package id and still go away with it.
    const { ctx } = mockCtx()
    apply(ctx as never)
    const own = document.head.querySelector(`style[data-plugin="${PACKAGE_ID}"]`)
    expect(own).not.toBeNull()
    removeOwnedStyles(PACKAGE_ID)
    expect(document.head.querySelector(`style[data-plugin="${PACKAGE_ID}"]`)).toBeNull()
  })

  it('stops watching once the plugin is disposed', async () => {
    const { ctx, effects } = mockCtx()
    apply(ctx as never)
    for (const dispose of effects) dispose()
    const late = dsBotSheet('about')
    await tick()
    expect(late.hasAttribute('data-plugin')).toBe(false)
  })
})

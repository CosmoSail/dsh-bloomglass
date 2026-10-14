import { afterEach, describe, expect, it } from 'vitest'
import { BODY_ATTR, PACKAGE_ID, VARIANT_ATTR } from '../src/client/constants.ts'
import { apply } from '../src/client/index.ts'
import { DEFAULT_KNOBS } from '../src/client/knobs.ts'
import { SHARED_LAYER_TOKENS, bloomglassTokens, stolenSharedTokens } from '../src/client/tokens.ts'

type Modes = { light: string; dark: string }
type Scheme = 'light' | 'dark'

/** What ds-bot writes over the six shared tokens. */
const RIVAL = Object.fromEntries(
  SHARED_LAYER_TOKENS.map(name => [name, { light: '#111111', dark: '#222222' }]),
)

/**
 * The slice of `ThemeRuntime` the plugin talks to: one layer per source,
 * later seq wins per token, every write publishes `theme/change`, and
 * `getTheme()` hands back the composed snapshot with scheme-resolved values.
 */
function createTheme() {
  const layers = new Map<string, { seq: number; tokens: Record<string, Modes> }>()
  const listeners: Array<() => void> = []
  const log: string[] = []
  let seq = 0
  let scheme: Scheme = 'light'

  const compose = (): Record<string, string> => {
    const tokens: Record<string, string> = {}
    for (const layer of [...layers.values()].sort((left, right) => left.seq - right.seq)) {
      for (const [name, modes] of Object.entries(layer.tokens)) tokens[name] = modes[scheme]
    }
    return tokens
  }
  const publish = (): void => { for (const listener of [...listeners]) listener() }

  const register = (source: string, tokens: Record<string, Modes>): (() => void) => {
    log.push(source)
    const layer = { seq: ++seq, tokens }
    layers.set(source, layer)
    publish()
    return () => {
      if (layers.get(source) !== layer) return
      layers.delete(source)
      publish()
    }
  }

  return {
    register,
    composed: compose,
    registrations: () => [...log],
    ownRegistrations: () => log.filter(source => source === PACKAGE_ID).length,
    setScheme: (next: Scheme) => { scheme = next; publish() },
    service: {
      getTheme: () => ({ active: { colorScheme: scheme, tokens: compose() } }),
      overrideTokens: (source: string, tokens: Record<string, Modes>) => register(source, tokens),
    },
    on: (event: string, handler: () => void) => {
      if (event !== 'theme/change') return () => { /* not a theme event */ }
      listeners.push(handler)
      return () => {
        const at = listeners.indexOf(handler)
        if (at >= 0) listeners.splice(at, 1)
      }
    },
  }
}

/** Boot the plugin against the fake runtime; `theme` is the test's handle. */
function boot() {
  const theme = createTheme()
  const effects: Array<() => void> = []
  const ctx = {
    theme: theme.service,
    locale: {
      register: () => () => { /* retract */ },
      bind: () => (key: string) => key,
    },
    slots: {
      inject: (_name: string, register: () => unknown) => { register(); return () => { /* retract */ } },
      register: () => ({ /* a registration handle */ }),
    },
    effect: (factory: () => unknown) => {
      const dispose = factory()
      if (typeof dispose === 'function') effects.push(dispose as () => void)
    },
    on: theme.on,
  }
  apply(ctx as never)
  return { theme, effects }
}

/** What the plugin's own layer says for one token, in one scheme. */
const ours = (name: string, scheme: Scheme = 'light'): string => {
  const layer = bloomglassTokens({
    variant: DEFAULT_KNOBS.variant,
    glassOpacity: DEFAULT_KNOBS.glassOpacity,
    frosted: false,
  })
  return layer[name][scheme]
}

describe('shared tokens with ds-bot', () => {
  afterEach(() => {
    document.body.removeAttribute(BODY_ATTR)
    document.body.removeAttribute(VARIANT_ATTR)
    document.head.querySelectorAll('style[data-plugin]').forEach(node => { node.remove() })
  })

  it('boots owning all six', () => {
    const { theme } = boot()
    const composed = theme.composed()
    for (const name of SHARED_LAYER_TOKENS) expect(composed[name]).toBe(ours(name))
  })

  it('takes them back from a layer registered after it', () => {
    const { theme } = boot()
    const before = theme.ownRegistrations()

    // ds-bot registers its own layer at mount, i.e. after ours.
    theme.register('ds-bot', RIVAL)

    expect(theme.ownRegistrations()).toBe(before + 1)
    const composed = theme.composed()
    for (const name of SHARED_LAYER_TOKENS) expect(composed[name]).toBe(ours(name))
  })

  it('takes them back every time the rival re-registers', () => {
    const { theme } = boot()
    const before = theme.ownRegistrations()
    theme.register('ds-bot', RIVAL)
    theme.register('ds-bot', RIVAL)
    expect(theme.ownRegistrations()).toBe(before + 2)
  })

  it('fights for nothing else, even when another layer takes a token we write', () => {
    const { theme } = boot()
    const before = theme.ownRegistrations()

    // A token the palette also defines, but not one of the six we share.
    theme.register('another-plugin', { '--dsw-alias-markdown-code-block': { light: '#ff0000', dark: '#00ff00' } })

    expect(theme.ownRegistrations()).toBe(before)
    expect(theme.composed()['--dsw-alias-markdown-code-block']).toBe('#ff0000')
  })

  it('converges: one re-stack per intrusion, not a loop', () => {
    const { theme } = boot()
    const before = theme.ownRegistrations()
    theme.register('ds-bot', RIVAL)
    expect(theme.ownRegistrations()).toBe(before + 1)

    // A later scheme flip publishes again; our layer is already on top, so the
    // snapshot still matches and nothing is re-registered.
    theme.setScheme('dark')
    expect(theme.ownRegistrations()).toBe(before + 1)
    for (const name of SHARED_LAYER_TOKENS) expect(theme.composed()[name]).toBe(ours(name, 'dark'))
  })

  it('rides the same check through our own theme switches', () => {
    const { theme } = boot()
    const before = theme.ownRegistrations()
    // A palette switch re-registers our layer (project(true) in the plugin);
    // that write is ours, so it must not trigger a second defence pass.
    document.body.setAttribute(VARIANT_ATTR, DEFAULT_KNOBS.variant)
    theme.service.overrideTokens(PACKAGE_ID, bloomglassTokens({
      variant: DEFAULT_KNOBS.variant,
      glassOpacity: DEFAULT_KNOBS.glassOpacity,
      frosted: false,
    }))
    expect(theme.ownRegistrations()).toBe(before + 1)
  })
})

describe('stolenSharedTokens', () => {
  const inputs = { variant: DEFAULT_KNOBS.variant, glassOpacity: DEFAULT_KNOBS.glassOpacity, frosted: false }
  const layer = bloomglassTokens(inputs)

  it('is quiet when the composed snapshot is ours', () => {
    const composed = Object.fromEntries(SHARED_LAYER_TOKENS.map(name => [name, layer[name].light]))
    expect(stolenSharedTokens(composed, inputs, 'light')).toEqual([])
  })

  it('names the tokens a later layer took, and only those', () => {
    const composed = Object.fromEntries(SHARED_LAYER_TOKENS.map(name => [name, layer[name].light]))
    composed['--dsw-alias-bg-base'] = '#123456'
    composed['--dsw-alias-label-primary'] = '#654321'
    expect(stolenSharedTokens(composed, inputs, 'light'))
      .toEqual(['--dsw-alias-bg-base', '--dsw-alias-label-primary'])
  })

  it('reads the active scheme, not the light one', () => {
    const composed = Object.fromEntries(SHARED_LAYER_TOKENS.map(name => [name, layer[name].dark]))
    expect(stolenSharedTokens(composed, inputs, 'dark')).toEqual([])
    expect(stolenSharedTokens(composed, inputs, 'light')).toHaveLength(SHARED_LAYER_TOKENS.length)
  })

  it('reports nothing when the runtime has no snapshot yet', () => {
    expect(stolenSharedTokens(undefined, inputs, 'light')).toEqual([])
  })
})

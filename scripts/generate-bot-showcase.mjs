/**
 * Generate the DS Bot (Bot team) showcase pages.
 *
 * Everything in the markup is INVENTED — bot names, message copy, avatars
 * (geometric gradients), panel rows. No live instance is screenshotted and no
 * real name, path, token or conversation is read. The page is assembled from
 * ds-bot's own installed stylesheet, DSH's shell stylesheet and this package's
 * sheets, so there is nothing private in it to redact.
 *
 * Usage:  node scripts/generate-bot-showcase.mjs
 *   DS_BOT_CLIENT  path to ds-bot's client.js
 *                  (default ~/.dsh/profiles/desktop/node_modules/ds-bot/client.js)
 *   DSH_APP        directory holding @deepseek-ai/* client modules of the app
 *                  (default: the extracted checkout used by the maintainers;
 *                  when absent the shell grid falls back to a four-rule mock)
 * Emits:  docs/showcase/bot-ui-light.html, bot-ui-dark.html
 *         (screenshot these at 1440×900 @2 with a headless browser)
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { BOT_CSS, BOT_GLASS_CSS } from '../src/client/css/bot-css.ts'
import { COMPONENT_CSS } from '../src/client/css/bloom-component.ts'
import { GLASS_CSS as BLOOM_GLASS_CSS } from '../src/client/css/bloom-glass.ts'
import { PALETTE_CSS } from '../src/client/css/palette-css.ts'
import { GLASS_CSS, SETTINGS_CSS, SURFACE_CSS } from '../src/client/glass-css.ts'
import { bloomOwnVarsCss, bloomglassTokens } from '../src/client/tokens.ts'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'showcase')
const BUNDLE = process.env.DS_BOT_CLIENT
  ?? join(homedir(), '.dsh', 'profiles', 'desktop', 'node_modules', 'ds-bot', 'client.js')
const APP = process.env.DSH_APP ?? join(homedir(), '.dsh', 'bot', 'workspace', 'dsh-panel', 'dsh', 'node_modules', '@deepseek-ai')
const PANEL_W = 320
const VARIANT = 'ripple'
const BODY_ATTR = 'data-dsh-bloomglass'
const VARIANT_ATTR = 'data-bloomglass-variant'
/** ds-bot installs these ten blobs when the Bot UI mounts. */
const WRAP_IDS = [
  'SHELL_CSS', 'CONVERSATION_CSS', 'SIDEBAR_CSS', 'USER_MESSAGE_CSS',
  'MEMBER_CSS', 'FEEDBACK_CSS', 'MODEL_CSS', 'FOLDER_CSS', 'BOT_SETTINGS_CSS', 'GROUP_SETTINGS_CSS',
]

let bundle
try {
  bundle = readFileSync(BUNDLE, 'utf8')
} catch {
  console.error(`ds-bot bundle not found at ${BUNDLE}\npoint DS_BOT_CLIENT at its client.js to regenerate these pages.`)
  process.exit(1)
}

/** Skip a quoted JS string starting at its opening quote; returns the index after it. */
const skipString = (text, i) => {
  const quote = text[i]
  i += 1
  while (i < text.length) {
    if (text[i] === '\\') { i += 2; continue }
    if (text[i] === quote) return i + 1
    i += 1
  }
  return i
}

/** Skip a `{…}` balance starting at the `{`, honouring nesting, strings and nested templates. */
const skipBraces = (text, i) => {
  let depth = 0
  while (i < text.length) {
    const c = text[i]
    if (c === '{') { depth += 1; i += 1; continue }
    if (c === '}') { depth -= 1; i += 1; if (depth === 0) return i; continue }
    if (c === '`') { i = skipTemplate(text, i + 1).end; continue }
    if (c === '"' || c === "'") { i = skipString(text, i); continue }
    i += 1
  }
  return i
}

/**
 * Read a template literal body, replacing each `${…}` with `0ms`.
 *
 * The blobs contain *nested* template literals inside their interpolations
 * (`…${list.map(n => `body{--bt-ink-${n}:…}`).join("")}…`), so stopping at the
 * next backtick truncates the stylesheet — SHELL_CSS kept 990 of its 81164
 * characters that way and the render came out unstyled.
 */
const skipTemplate = (text, i) => {
  let out = ''
  while (i < text.length) {
    const c = text[i]
    if (c === '\\') { out += text[i + 1] ?? ''; i += 2; continue }
    if (c === '`') return { body: out, end: i + 1 }
    if (c === '$' && text[i + 1] === '{') { out += '0ms'; i = skipBraces(text, i + 1); continue }
    out += c
    i += 1
  }
  return { body: out, end: i }
}

/** Pull one `var NAME = \`…\`` blob out of a bundle. */
const cssBlob = (text, name) => {
  const marker = `var ${name} = \``
  const start = text.indexOf(marker)
  if (start < 0) throw new Error(`${name} not found in the ds-bot bundle`)
  return skipTemplate(text, start + marker.length).body
}

/**
 * ds-bot's own avatar art, verbatim from its bundle: the named ink table, the
 * twenty character shapes and `characterMarkup(shape, color)` — the function
 * `BotMark` renders. The showcase draws every Bot with this, so the faces in the
 * screenshots are the ones the plugin itself ships (and still nothing real: the
 * shape and the ink are picked per invented Bot below).
 */
const avatarModule = () => {
  const start = bundle.indexOf('var INKS')
  const end = bundle.indexOf('\nvar ', bundle.indexOf('function characterMarkup'))
  if (start < 0 || end < 0) throw new Error('avatar module not found in the ds-bot bundle')
  return bundle.slice(start, end)
}

/** The app's shell grid — the sidebar column paints the fill the Bot list sits on. */
const layoutCss = () => {
  try {
    const text = readFileSync(join(APP, 'dsh-client-ui-layout', 'lib', 'client.js'), 'utf8')
    const marker = 'const css = "'
    const start = text.indexOf(marker)
    if (start < 0) throw new Error('no css module')
    let raw = ''
    for (let i = start + marker.length; i < text.length; i += 1) {
      if (text[i] === '\\') { raw += text[i + 1]; i += 1; continue }
      if (text[i] === '"' && text[i + 1] === ';') break
      raw += text[i]
    }
    return raw
  } catch {
    console.warn(`ui-layout stylesheet not found under ${APP}; using the four-rule shell mock instead.`)
    // Only the shell grid the page needs. The app ships the real one.
    return `
.BynINW_frame{background:var(--dsw-specific-sidebar-fill);display:grid;position:relative;overflow:hidden;height:100vh}
.BynINW_sidebarCol{background:var(--dsw-specific-sidebar-fill);border-right:.5px solid var(--dsw-alias-border-l3);min-width:0;overflow:hidden}
.BynINW_centerCol{display:flex;flex-direction:column;min-width:0;overflow:hidden;background:var(--dsw-alias-bg-base)}
`
  }
}

const themeCss = [
  bloomOwnVarsCss(VARIANT, VARIANT_ATTR),
  COMPONENT_CSS, BLOOM_GLASS_CSS, SURFACE_CSS, SETTINGS_CSS, BOT_CSS, BOT_GLASS_CSS, PALETTE_CSS,
].join('\n')
const DS_BOT_CSS = WRAP_IDS.map((name) => cssBlob(bundle, name)).join('\n')
const TOKENS = bloomglassTokens({ variant: VARIANT, glassOpacity: 0.18, frosted: false })

// ── invented content ────────────────────────────────────────────────────────
// The faces are ds-bot's OWN: `characterMarkup(shape, color)` — the art `BotMark`
// renders — driven by a shape from its twenty-character set and an ink from its
// palette. Only the assignment below is ours, and it names invented Bots.
const BOTS = [
  { name: '示例·写作', tag: 'Main', sub: '文档与文案', shape: 'bunny', color: 'rose' },
  { name: '示例·代码', tag: '工程', sub: '工程实现', shape: 'zed', color: 'sky', active: true, badge: 'working' },
  { name: '示例·调研', tag: '调研', sub: '资料与出处', shape: 'acorn', color: 'cobalt' },
  { name: '示例·质检', tag: '测试', sub: '复核与验收', shape: 'gem', color: 'tangerine', badge: 'alert', alert: '2' },
]
const GROUP = { name: '示例·项目群', shape: 'wave', color: 'aurora' }
/** [bot shape key, message text] — the user's own line is `null`. */
const MESSAGES = [
  ['zed', '口径按上次定的那版改完了：配色表、四言文案、右栏接缝。'],
  ['bunny', '我这边把四言诗补齐了，十条都对上色相。'],
  [null, '好，我先看看效果。'],
  ['acorn', '出处我核过一遍，图鉴和中科院数据集都对得上。'],
]
const PANEL_ROWS = [
  ['成员', '4 名'],
  ['模型', '示例模型'],
  ['今日任务', '3 项'],
  ['记忆', '12 条'],
]

/** A `.bt-mark`, filled at runtime by ds-bot's own characterMarkup. */
const mark = (size, shape, color, badge = '') =>
  `<span class="bt-mark" data-face="${shape}|${color}" data-shape="${shape}" style="width:${size}px;height:${size}px;--bt-size:${size}px">${badge}</span>`

const botRows = BOTS.map((bot) => {
  const badge = bot.badge === 'working'
    ? '<span class="bt-badge bt-badge-working"></span>'
    : bot.badge === 'alert'
      ? `<span class="bt-badge bt-badge-alert">${bot.alert}</span>`
      : ''
  return `
        <button class="bt-row"${bot.active ? ' aria-current="page"' : ''}>
          ${mark(36, bot.shape, bot.color, badge)}
          <span class="bt-row-body">
            <span class="bt-row-name"><span class="bt-row-title">${bot.name}</span><span class="bt-tag">${bot.tag}</span></span>
            <span class="bt-row-sub">${bot.sub}</span>
          </span>
        </button>`
}).join('')

// A group room, so the transcript carries ds-bot's own per-message lead avatar
// ('.bt-lead' → BotMark at 22px) and the speaker's name above each bubble — the
// layout in which every Bot's face is visible inside the conversation itself.
const messages = MESSAGES.map(([shape, text]) => {
  if (shape === null) {
    return `<div class="bt-umsg"><div class="bt-ustack"><div class="bt-ubody">${text}</div></div></div>`
  }
  const bot = BOTS.find((b) => b.shape === shape)
  return `<div class="bt-group-msg">
          <span class="bt-group-name">${bot.name}</span>
          <div class="bt-msg"><div class="bt-msg-line"><button class="bt-lead" aria-label="打开 ${bot.name} 的会话">${mark(22, bot.shape, bot.color)}</button><div class="bt-bubble">${text}</div></div></div>
        </div>`
}).join('\n        ')

const page = (dark) => `<!doctype html>
<html data-windows-titlebar><head><meta charset="utf-8">
<title>DS Bot UI · ${dark ? 'dark' : 'light'}</title>
<style>${themeCss}</style>
<style>${layoutCss()}</style>
<style>${DS_BOT_CSS}</style>
<style>
  /* Page scaffolding only — every surface below comes from ds-bot's sheet,
     DSH's shell sheet, or this package's bridge. */
  html, body { margin: 0; height: 100%; overflow: hidden }
  /* DSH's own base rule: without it the page keeps the canvas white and the
     dark shot comes out with a white conversation column. */
  body {
    background-color: var(--dsw-alias-bg-base, #fff);
    font: 14px/1.55 system-ui, -apple-system, 'Segoe UI', 'Microsoft YaHei', sans-serif;
    /* The accent ds-bot writes from the user's Appearance setting; pointing it at
       the palette is what a user who picked the matching swatch would have. */
    --bt-accent: var(--bloom-accent);
    --bt-panel-w: ${PANEL_W}px;
  }
  .BynINW_frame { grid-template-columns: 276px minmax(0, 1fr) }
  .BynINW_centerCol { margin-right: var(--bt-panel-w) }
  .side-slot { height: 100%; box-sizing: border-box; padding: 6px 4px 8px 12px; display: flex; flex-direction: column; min-height: 0 }
  .bt-list { display: flex; flex-direction: column; gap: 2px; margin-top: 8px; flex: 1; min-height: 0; overflow: hidden }
  .bt-side-foot { display: flex; padding-top: 10px }
  .bt-row[aria-current] { background: var(--bt-hover) }
  .conv-slot { height: 100%; display: flex; flex-direction: column; min-height: 0 }
  .chat-scroll { flex: 1; min-height: 0; overflow: hidden; padding: 10px 26px 6px; display: flex; flex-direction: column;
    gap: 10px; align-items: flex-start; justify-content: flex-end }
  .chat-scroll > .bt-umsg { align-self: stretch }
  .composer-wrap { padding: 0 26px 22px }
  .composer-wrap ._composer_x { display: block }
  .composer-wrap ._card_x { display: flex; align-items: center; gap: 12px; box-sizing: border-box;
    min-height: 52px; padding: 8px 10px 8px 18px; border-radius: 16px; border: 1px solid var(--bloom-hairline, rgba(0,0,0,.08)) }
  .composer-wrap .ph { flex: 1; min-width: 0; color: var(--dsw-alias-label-tertiary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
  .composer-wrap ._primary_x { flex: none; width: 34px; height: 34px; border: 0; border-radius: 50%; display: grid;
    place-items: center; background: var(--bt-accent); color: var(--bt-accent-ink); cursor: pointer }
  .bt-panel-view { gap: 4px }
  .bt-drawer-id { align-items: center }
  .bt-drawer-name { font-size: 15px; font-weight: 600; margin-top: 8px }
  .bt-drawer-sub { font-size: 12px; color: var(--bt-ink-3) }
  .panel-rows { padding: 14px 18px 0; display: flex; flex-direction: column }
  .pnl-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 13px;
    padding: 10px 0; border-bottom: 0.5px solid var(--bt-line) }
  .pnl-row b { font-weight: 400; color: var(--bt-ink-3) }
</style>
</head>
<body ${BODY_ATTR}="" ${VARIANT_ATTR}="${VARIANT}"${dark ? ' data-ds-dark-theme' : ''} style="${Object.entries(TOKENS).map(([name, modes]) => `${name}:${dark ? modes.dark : modes.light}`).join(';')}">
<div class="BynINW_frame">
  <div class="BynINW_sidebarCol"><div class="side-slot">
    <div class="bt-side">
      <div class="bt-side-top">
        <span class="bt-brand"><span class="bt-brand-whale"><svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7.5" fill="currentColor"/></svg></span>DS Bot</span>
        <button class="bt-round" aria-label="新建"><svg width="14" height="14" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12M10 4v12" stroke="currentColor" stroke-width="1.6" fill="none"/></svg></button>
      </div>
      <div class="bt-list">${botRows}
        <div class="bt-tile-wrap"><button class="bt-tile">${mark(44, GROUP.shape, GROUP.color, '<span class="bt-badge bt-badge-alert">3</span>')}<span class="bt-tile-name">${GROUP.name}</span></button></div>
      </div>
      <div class="bt-side-foot"><button class="bt-connect">连接插件</button></div>
    </div>
  </div></div>

  <div class="BynINW_centerCol"><div class="conv-slot" data-slot="conversation">
    <div class="bt-head"><button class="bt-pill">${mark(26, GROUP.shape, GROUP.color)}<span class="bt-pill-name">${GROUP.name}</span><span class="bt-pill-go">▾</span></button></div>
    <div class="chat-scroll">
        ${messages}
    </div>
    <div class="composer-wrap">
      <div class="_composer_x" data-composer-card>
        <div class="_card_x">
          <span class="ph">给 ${GROUP.name} 发消息…</span>
          <button class="_primary_x" aria-label="发送"><svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 16V4M5 9l5-5 5 5" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg></button>
        </div>
      </div>
    </div>
  </div></div>
</div>

<aside class="bt-panel">
  <div class="bt-panel-grip"></div>
  <div class="bt-panel-view">
    <div class="bt-tabs"><button class="bt-tab" aria-selected="true">详情</button><button class="bt-tab">记忆</button></div>
    <div class="bt-drawer-id">${mark(52, GROUP.shape, GROUP.color)}<span class="bt-drawer-name">${GROUP.name}</span><span class="bt-drawer-sub">在线 · 4 名成员</span></div>
    <div class="panel-rows">
      ${PANEL_ROWS.map(([k, v]) => `<div class="pnl-row"><b>${k}</b><span>${v}</span></div>`).join('\n      ')}
    </div>
  </div>
</aside>
<script>
/* ds-bot's own avatar art, extracted from its bundle: the ink table, the twenty
   character shapes and characterMarkup(shape, color) — exactly what BotMark
   renders. Each .bt-mark below names a shape and an ink; %MASK% is the module's
   placeholder for a per-element mask id, so it is made unique here. */
${avatarModule()}
// ds-bot's own ink table becomes its own variables; its stylesheet does this
// with a template interpolation, which the CSS extraction replaces with '0ms'.
// Without them every ink fill is 'var(--bt-ink-…)' and paints black.
const inkCss = Object.keys(INKS).map((n) => 'body{--bt-ink-' + n + ':' + INKS[n][0] + '}').join('')
  + Object.keys(INKS).map((n) => 'body[data-ds-dark-theme]{--bt-ink-' + n + ':' + INKS[n][1] + '}').join('')
const inkStyle = document.createElement('style')
inkStyle.textContent = inkCss
document.head.append(inkStyle)

;(function () {
  let serial = 0
  for (const el of document.querySelectorAll('[data-face]')) {
    const [shape, color] = el.dataset.face.split('|')
    // BotMark wraps the fragment in <svg viewBox="0 0 N N"> itself; the fragment
    // alone is just <defs>/<g> and renders as nothing inside HTML.
    const box = shapeOf(shape).size
    const inner = characterMarkup(shape, color).replaceAll('%MASK%', 'btm' + (++serial))
    el.insertAdjacentHTML('afterbegin', '<svg viewBox="0 0 ' + box + ' ' + box + '" width="100%" height="100%">' + inner + '</svg>')
  }
})()
</script></body></html>`

mkdirSync(OUT, { recursive: true })
writeFileSync(join(OUT, 'bot-ui-light.html'), page(false))
writeFileSync(join(OUT, 'bot-ui-dark.html'), page(true))
console.log('wrote', join(OUT, 'bot-ui-light.html'), 'and bot-ui-dark.html')

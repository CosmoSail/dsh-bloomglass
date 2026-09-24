/**
 * Generate the README showcase pages.
 *
 * These images are SYNTHETIC. They render this package's real stylesheets and
 * token pipeline against a mock of DSH's DOM shape, so no real session, title,
 * message, or file name can appear in them — there is nothing to redact
 * because nothing private is ever loaded.
 *
 * Usage:  node scripts/generate-showcase.mjs
 * Emits:  docs/showcase/*.html   (screenshot these with a headless browser)
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { PALETTE, VARIANTS, VARIANT_LABELS } from '../src/client/palette.ts'
import { bloomOwnVarsCss, bloomglassTokens } from '../src/client/tokens.ts'
import { COMPONENT_CSS } from '../src/client/css/bloom-component.ts'
import { GLASS_CSS as BLOOM_GLASS_CSS } from '../src/client/css/bloom-glass.ts'
import { GLASS_CSS as FROST_CSS, SETTINGS_CSS } from '../src/client/glass-css.ts'
import { PALETTE_CSS } from '../src/client/css/palette-css.ts'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'showcase')

/** Placeholder copy — deliberately generic, never fed from real data. */
const DEMO = {
  sessions: ['示例会话 A', '示例会话 B', '示例会话 C', '示例会话 D'],
  sections: ['今天', '更早'],
  title: '示例会话 A',
  user: '这是一条示例用户消息，用来展示气泡与配色的搭配效果。',
  reply: [
    '这是一段示例回复，用来展示正文排版、行内代码 `npm run build` 与强调色的呈现。',
    '代码块与表格同样跟随配色，而不是保留 DSH 默认的蓝灰调：',
  ],
  code: `export function bloomTokens(p: PaletteEntry, dark: boolean): string {
  const bg = dark ? p.bgD : p.bgL
  return \`--dsw-alias-bg-base: \${bg};\`
}`,
  composer: '输入消息，或按 / 查看命令…',
  table: [['变体', '色相', '对比度'], ['黛蓝', '240', '5.28:1'], ['朱砂', '25', '4.87:1'], ['桃夭', '350', '4.55:1']],
}

/**
 * Wallpaper used by the showcase.
 *
 * NOTE ON RIGHTS: this is a third-party astrophotograph (Orion Nebula) carrying
 * the photographer's watermark, committed here by the repository owner's
 * explicit decision. It is NOT covered by this package's MIT licence; the
 * credit lives in docs/showcase/README.md.
 *
 * A rights-clean alternative is available: `generate-wallpaper.mjs` draws a
 * deep-sky nebula procedurally into `wallpaper.png`. Point this constant at it
 * to render the showcase with no third-party image at all.
 *
 * Either way the image keeps plenty of fine detail, which is what makes the
 * frosted backdrop blur visible — blurring a smooth gradient looks identical
 * to not blurring it.
 */
const WALLPAPER = 'url("Orion_Lorand_1992.jpg")'

/**
 * Frost settings for the wallpaper shot.
 *
 * These are the plugin's *knobs*, and the showcase deliberately runs them at or
 * below the low end so the wallpaper reads clearly behind the panels:
 *
 *   blur     0px  — NOTE: below the plugin's slider floor of 8px. Chosen only
 *                   so the showcase shows the background image unobscured; the
 *                   UI can never be set this low.
 *   glass     0.30 — inside the published range [0.18, 0.82].
 *   dim       0    — inside the published range [0, 0.65].
 *   saturate  100% — inside the published range [1, 2].
 *
 * The stock defaults (0.46 / 28px / 0.28) cover the whole window in frosted
 * plates and smear a detailed wallpaper past recognition.
 */
const GLASS_OPACITY = 0.30
const GLASS_BLUR_PX = 0
const GLASS_DIM = 0
const GLASS_SATURATE = 100

/**
 * Token layer as the theme presenter would apply it (both modes, keyed on the
 * dark attribute). With a wallpaper the surface tokens go through the same
 * frosted transform the plugin uses, otherwise the opaque palette would hide
 * the wallpaper completely.
 */
function tokenCss(variant, frosted) {
  const tokens = bloomglassTokens({ variant, glassOpacity: GLASS_OPACITY, frosted })
  const block = (mode) =>
    Object.entries(tokens).map(([name, modes]) => `${name}:${modes[mode]};`).join('')
  return [
    `body{${block('light')}}`,
    `body[data-ds-dark-theme]{${block('dark')}}`,
  ].join('\n')
}

/** Per-column surface tokens the theme expects the presenter to have set. */
const SHELL_CSS = `
*{box-sizing:border-box}
html,body{height:100%}
body{
  margin:0;
  font:14px/1.6 system-ui,"Segoe UI","Microsoft YaHei",sans-serif;
  color:var(--dsw-alias-label-primary);
  background:var(--dsw-alias-bg-base);
  overflow:hidden;
}
.shell{display:flex;height:100vh}
._root_demo{display:flex;width:100%}
._frame_demo{display:flex;width:100%;gap:0}
._sidebarCol_demo{width:238px;flex:none;display:flex;flex-direction:column;padding:10px 8px;gap:6px;background:var(--dsw-specific-sidebar-fill)}
._centerCol_demo{flex:1;display:flex;flex-direction:column;min-width:0}
._header_demo{display:flex;align-items:center;gap:8px;padding:10px 14px;font-weight:600}
._headerUtilities_demo{margin-left:auto;display:flex;gap:6px;align-items:center}
._brand_demo{display:flex;align-items:center;gap:8px;font-weight:700;padding:4px 6px 10px}
._brandDot_demo{width:16px;height:16px;border-radius:5px;background:var(--bloom-accent)}
._newSession_demo{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:10px;
  border:1px solid var(--dsw-alias-border-l2);background:transparent;color:inherit;font:inherit;cursor:pointer}
._sectionHeader_demo{font-size:11px;letter-spacing:.04em;padding:10px 10px 2px;color:var(--dsw-alias-label-tertiary)}
._list_demo{display:flex;flex-direction:column;gap:2px;overflow:hidden}
._sessionRow_demo{padding:7px 10px;border-radius:9px;font-size:13px;color:var(--dsw-alias-label-secondary);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
._sessionRow_demo._selected_demo{color:var(--dsw-alias-label-primary)}
._scrollBody_demo{flex:1;overflow:hidden;padding:6px 0 0}
._turn_demo{max-width:760px;margin:0 auto;padding:10px 24px;display:flex;flex-direction:column;gap:12px}
._bubble_demo{align-self:flex-end;max-width:78%;padding:10px 14px;border-radius:14px;background:var(--dsw-specific-bubble);color:var(--dsw-alias-label-primary)}
._markdown_demo{padding:2px 0}
._markdown_demo p{margin:0 0 10px}
._markdown_demo h3{margin:6px 0 10px;font-size:16px}
._markdown_demo code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px}
._composerSeat_demo{padding:12px 24px 20px}
._composer_demo{max-width:760px;margin:0 auto;display:flex;gap:8px;align-items:flex-end}
._card_demo{flex:1;border-radius:16px;padding:12px 14px;color:var(--dsw-alias-label-tertiary);font-size:13.5px}
._dock_demo{max-width:760px;margin:0 auto 8px;display:flex;gap:6px;font-size:12px;color:var(--dsw-alias-label-tertiary)}
._toolRow_demo{display:flex;gap:6px;margin-top:6px}
._pill_demo{padding:2px 9px;border-radius:999px;font-size:11.5px;background:color-mix(in oklch,var(--bloom-accent),transparent 88%);color:var(--bloom-accent)}
`;

/** The mock application window. Every string here is a placeholder. */
function appShell() {
  const sessions = DEMO.sessions
    .map((name, index) => `<div class="_sessionRow_demo${index === 0 ? ' _selected_demo' : ''}" role="treeitem">${name}</div>`)
    .join('')
  const codeHtml = DEMO.code
    .split('\n')
    .map(line => `<span>${line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>`)
    .join('\n')
  const rows = DEMO.table
    .map(([a, b, c], index) => `<tr>${index === 0 ? `<th>${a}</th><th>${b}</th><th>${c}</th>` : `<td>${a}</td><td>${b}</td><td>${c}</td>`}</tr>`)
    .join('')

  return `
<div class="shell"><div class="_root_demo"><div class="_frame_demo">
  <aside data-slot="sidebar" class="_sidebarCol_demo">
    <div class="_brand_demo"><span class="_brandDot_demo"></span>Bloom Glass</div>
    <button class="_newSession_demo">＋ 新建会话</button>
    <div class="_sectionHeader_demo">${DEMO.sections[0]}</div>
    <div class="_list_demo">${sessions}</div>
    <div class="_headerUtilities_demo"><span class="_pill_demo">${DEMO.sessions.length}</span></div>
  </aside>

  <main data-slot="conversation" class="_centerCol_demo">
    <header class="_header_demo">${DEMO.title}<span class="_headerUtilities_demo"><span class="_pill_demo">示例</span></span></header>
    <div class="_scrollBody_demo">
      <div class="_turn_demo">
        <div class="_bubble_demo">${DEMO.user}</div>
        <div class="_markdown_demo">
          <p>${DEMO.reply[0]}</p>
          <p>${DEMO.reply[1]}</p>
          <div class="md-code-block"><pre class="shiki"><code>${codeHtml}</code></pre></div>
          <div class="_tableScroll_demo"><table class="_demoTable">${rows}</table></div>
          <div class="_toolRow_demo"><span class="_pill_demo">示例工具</span><span class="_pill_demo">示例状态</span></div>
        </div>
      </div>
    </div>
    <div class="_composerSeat_demo">
      <div class="_dock_demo"><span class="_pill_demo">示例队列</span></div>
      <div class="_composer_demo">
        <div class="_card_demo" contenteditable="true">${DEMO.composer}</div>
      </div>
    </div>
  </main>
</div></div></div>
<style>
._demoTable{width:100%;border-collapse:collapse;font-size:13px}
._demoTable th,.demoTable td,._demoTable td{padding:6px 10px;text-align:left;border-bottom:1px solid var(--dsw-alias-border-l1)}
._demoTable th{color:var(--dsw-alias-label-secondary);font-weight:600}
._tableScroll_demo{margin:4px 0 12px}
</style>`
}

/** Assemble one showcase page. */
function page({ variant, scheme, wallpaper = false }) {
  const dark = scheme === 'dark'
  const attrs = [
    'data-dsh-bloomglass',
    `data-bloomglass-variant="${variant}"`,
    dark ? 'data-ds-dark-theme' : '',
    wallpaper ? `data-bloomglass-frost="${scheme}"` : '',
  ].filter(Boolean).join(' ')

  // The frost layer only exists when a wallpaper is painted, exactly as in the
  // plugin — and its variables go on as INLINE styles, because that is what
  // `body.style.setProperty` does and the only way to outrank Bloom's own
  // stylesheet rules for --bloom-ambience and --bloom-glass-blur.
  const frostVars = wallpaper
    ? `--bloom-glass-blur:${GLASS_BLUR_PX}px;--fw-saturate:${GLASS_SATURATE}%;--fw-dim:${GLASS_DIM};--bloom-ambience:none`
    : ''
  const frostEls = wallpaper
    ? '<div data-bloomglass-frost-wallpaper></div><div data-bloomglass-frost-dim></div>'
    : ''

  return `<!doctype html>
<html lang="zh"><head><meta charset="utf-8">
<title>${VARIANT_LABELS[variant].zh} · ${scheme}${wallpaper ? ' · 磨砂壁纸' : ''}</title>
<style>
${tokenCss(variant, wallpaper)}
${bloomOwnVarsCss(variant, 'data-bloomglass-variant')}
${SHELL_CSS}
${COMPONENT_CSS}
${BLOOM_GLASS_CSS}
${FROST_CSS}
${PALETTE_CSS}
${SETTINGS_CSS}
</style></head>
<body class="${dark ? 'demo-dark' : 'demo-light'}" ${attrs}${frostVars ? ` style="${frostVars}"` : ''}>${frostEls}${appShell()}
${wallpaper ? `<style>[data-bloomglass-frost-wallpaper]{background-image:${WALLPAPER}}</style>` : ''}
</body></html>`
}

/** Ten palettes, each in both modes. */
function paletteBoard() {
  const rows = VARIANTS.map((variant) => {
    const label = VARIANT_LABELS[variant]
    const cell = (mode) => {
      const dark = mode === 'dark'
      const entry = PALETTE[variant]
      const accent = dark ? entry.accentD : entry.accentL
      const bg = dark ? entry.bgD : entry.bgL
      const sf = dark ? entry.sfD : entry.sfL
      const tx = dark ? entry.txD : entry.txL
      return `<div class="sw" style="background:${bg};color:${tx}">
        <span class="sw-tx" style="color:${tx}">示例文字</span>
        <span class="sw-dot" style="background:${accent}"></span>
        <span class="sw-sf" style="background:${sf}"></span>
      </div>`
    }
    return `<div class="row">
      <div class="name"><b>${label.zh}</b><span>${label.poem}</span></div>
      ${cell('light')}${cell('dark')}
    </div>`
  }).join('')

  return `<!doctype html>
<html lang="zh"><head><meta charset="utf-8"><title>Bloom Glass · 配色</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;padding:30px 34px;background:#14181d;color:#e8ecf1;
    font:14px/1.5 system-ui,"Segoe UI","Microsoft YaHei",sans-serif}
  h1{margin:0 0 4px;font-size:19px}
  .sub{color:#98a2ad;font-size:12.5px;margin-bottom:20px}
  .row{display:grid;grid-template-columns:172px 1fr 1fr;gap:12px;align-items:center;margin-bottom:10px}
  .name b{display:block;font-size:14px}
  .name span{color:#8d97a2;font-size:11.5px}
  .sw{height:56px;border-radius:12px;display:flex;align-items:center;gap:10px;padding:0 14px;
    border:1px solid rgba(255,255,255,.07)}
  .sw-tx{font-size:13.5px}
  .sw-dot{width:18px;height:18px;border-radius:50%;margin-left:auto;box-shadow:inset 0 0 0 1px rgba(0,0,0,.18)}
  .sw-sf{width:34px;height:18px;border-radius:6px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.12)}
  .legend{display:flex;gap:18px;color:#8d97a2;font-size:11.5px;margin-top:16px}
</style></head>
<body>
  <h1>Bloom Glass · 10 套莫兰迪配色</h1>
  <div class="sub">左：亮色　右：暗色　　每格展示底色、正文色、强调色与层级面色</div>
  ${rows}
  <div class="legend"><span>亮色</span><span>暗色</span><span>● 强调色</span><span>▬ 层级面色</span></div>
</body></html>`
}

await mkdir(OUT, { recursive: true })
const pages = {
  'palette-board.html': paletteBoard(),
  'ui-mist-light.html': page({ variant: 'mist', scheme: 'light' }),
  // Same palette, same scheme, same window: only the wallpaper layer differs,
  // so the pair reads as a before/after for the frosted glass.
  'ui-ripple-plain.html': page({ variant: 'ripple', scheme: 'dark' }),
  'ui-ripple-glass.html': page({ variant: 'ripple', scheme: 'dark', wallpaper: true }),
}
for (const [name, html] of Object.entries(pages)) {
  await writeFile(join(OUT, name), html, 'utf8')
  process.stdout.write(`wrote ${name} (${html.length} bytes)\n`)
}

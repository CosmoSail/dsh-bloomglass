window.__ModuleLoader__.load({
	id: "dsh-bloomglass",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/constants.ts
		/** Package id — also the theme override layer source and the loader entry id. */
		const PACKAGE_ID = "dsh-bloomglass";
		/** Body attribute that scopes every injected style. */
		const BODY_ATTR = "data-dsh-bloomglass";
		/**
		* Body attribute that exists only while a wallpaper is actually painted.
		*
		* Kept separate from {@link BODY_ATTR} on purpose: retracting the frost must
		* not retract the palette theme. Its value is the resolved colour scheme.
		*/
		const FROST_ATTR = "data-bloomglass-frost";
		/**
		* Body attribute carrying the active palette key.
		*
		* Bloom's stylesheets select on this attribute, so the name is load-bearing:
		* renaming it means rewriting every selector in `css/bloom-*.ts`.
		*/
		const VARIANT_ATTR = "data-bloomglass-variant";
		/** Settings locale namespace. */
		const LOCALE_NS = "settings.bloomglass";
		/** localStorage key for knobs (never the image bytes). */
		const KNOBS_KEY = "dsh-bloomglass:knobs";
		/** IndexedDB database that holds the uploaded wallpaper blob. */
		const IMAGE_DB = "dsh-bloomglass";
		const IMAGE_STORE = "files";
		const IMAGE_KEY = "wallpaper";
		/** Allowed image MIME types at the upload boundary. */
		const ALLOWED_TYPES = [
			"image/jpeg",
			"image/png",
			"image/webp",
			"image/gif"
		];
		/** dsh-bloom-theme's palette key. */
		const LEGACY_VARIANT_KEY = "dsh-bloom-variant";
		/** dsh-frosted-window's knob record. */
		const LEGACY_KNOBS_KEY = "dsh-frosted-window:knobs";
		/** dsh-frosted-window's wallpaper database. */
		const LEGACY_IMAGE_DB = "dsh-frosted-window";
		//#endregion
		//#region src/client/glass-css.ts
		/**
		* Two independently gated stylesheets.
		*
		* GLASS_CSS is the frosted chrome: the wallpaper plate, the dim veil, and the
		* per-column glass. It is gated on FROST_ATTR, which exists only while a
		* wallpaper is actually painted — so retracting the frost leaves the palette
		* theme itself untouched.
		*
		* SETTINGS_CSS styles the settings panel and is injected once per activate.
		*/
		/**
		* Scoped glass stylesheet. Every rule hangs off the plugin body attribute so
		* dispose is one attribute removal + one style-tag removal. Selectors use
		* official `data-slot` names, never hashed CSS-module class names.
		*/
		const GLASS_CSS$1 = `
[${FROST_ATTR}-wallpaper] {
  position: fixed;
  inset: 0;
  z-index: -3;
  pointer-events: none;
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
}

[${FROST_ATTR}-dim] {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background: rgba(12, 16, 24, var(--fw-dim, 0.28));
}

body[${FROST_ATTR}] {
  --fw-blur: 28px;
  --fw-saturate: 155%;
  --fw-dim: 0.28;
  --fw-highlight: rgba(255, 255, 255, 0.55);
  --fw-edge: rgba(255, 255, 255, 0.28);
  background-color: transparent;
}

body[${FROST_ATTR}='dark'] [${FROST_ATTR}-dim] {
  background: rgba(6, 8, 12, var(--fw-dim, 0.28));
}

body[${FROST_ATTR}='dark'] {
  --fw-highlight: rgba(255, 255, 255, 0.14);
  --fw-edge: rgba(255, 255, 255, 0.12);
}

/* AppFrame + slot roots: drop opaque fills so the wallpaper shows through. */
body[${FROST_ATTR}] *:has(> [data-slot='sidebar']):has(> [data-slot='conversation']),
body[${FROST_ATTR}] [data-slot='sidebar'],
body[${FROST_ATTR}] [data-slot='sidebar'] > :first-child,
body[${FROST_ATTR}] [data-slot='conversation'],
body[${FROST_ATTR}] [data-slot='details'] {
  background-color: transparent !important;
}

/*
 * One frosted plate per column, painted on ::before.
 * backdrop-filter must stay on the pseudo — never on the column itself —
 * or position:fixed settings (a sidebar descendant) lock to the rail width.
 */
body[${FROST_ATTR}] *:has(> [data-slot='sidebar']),
body[${FROST_ATTR}] *:has(> [data-slot='conversation']),
body[${FROST_ATTR}] *:has(> [data-slot='details']) {
  position: relative;
}
body[${FROST_ATTR}] *:has(> [data-slot='sidebar']) {
  border-right: none !important;
}
body[${FROST_ATTR}] *:has(> [data-slot='details']) {
  border-left: none !important;
}
body[${FROST_ATTR}] *:has(> [data-slot='sidebar'])::before,
body[${FROST_ATTR}] *:has(> [data-slot='conversation'])::before,
body[${FROST_ATTR}] *:has(> [data-slot='details'])::before {
  content: '';
  position: absolute;
  z-index: -1;
  pointer-events: none;
  background: var(--dsw-alias-bg-layer-1);
  -webkit-backdrop-filter: blur(var(--bloom-glass-blur)) saturate(var(--fw-saturate));
  backdrop-filter: blur(var(--bloom-glass-blur)) saturate(var(--fw-saturate));
}
body[${FROST_ATTR}] *:has(> [data-slot='sidebar'])::before {
  inset: 0 -2px 0 0;
  background: var(--dsw-specific-sidebar-fill);
}
body[${FROST_ATTR}] *:has(> [data-slot='conversation'])::before {
  inset: 0 0 0 -2px;
}
body[${FROST_ATTR}] *:has(> [data-slot='details'])::before {
  inset: 0 0 0 -2px;
}

@media (prefers-reduced-transparency: reduce) {
  body[${FROST_ATTR}] *:has(> [data-slot='sidebar'])::before,
  body[${FROST_ATTR}] *:has(> [data-slot='conversation'])::before,
  body[${FROST_ATTR}] *:has(> [data-slot='details'])::before {
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
}`.trim();
		/** Settings-panel styles. Class names are fw- prefixed and used only by SettingsSection. */
		const SETTINGS_CSS = `/* Settings page */
.fw-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px 0 28px;
  min-width: 0;
  max-width: 100%;
  color: var(--dsw-alias-label-primary);
}
.fw-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 18px;
  border-radius: 20px;
  border: 1px solid var(--dsw-alias-border-l2);
  background:
    linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02)),
    var(--dsw-alias-bg-layer-1);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.28);
}
body[data-ds-dark-theme] .fw-panel {
  background:
    linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01)),
    var(--dsw-alias-bg-layer-1);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
}
.fw-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.fw-lead { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.fw-kicker {
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--dsw-alias-label-tertiary);
}
.fw-title { font-size: 18px; line-height: 26px; font-weight: 600; }
.fw-desc { font-size: 13px; line-height: 20px; color: var(--dsw-alias-label-secondary); }
.fw-chip {
  flex: 0 0 auto;
  margin-top: 4px;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  line-height: 16px;
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-secondary);
}
.fw-chip[data-tone='warn'] {
  background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 18%, transparent);
  color: var(--dsw-alias-state-warn-label, var(--dsw-alias-state-warn-primary));
}
.fw-hero {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  width: 100%;
  max-width: 100%;
  min-height: 196px;
  border: 0;
  border-radius: 16px;
  padding: 0;
  background:
    radial-gradient(circle at 20% 20%, rgba(255,255,255,0.18), transparent 42%),
    linear-gradient(135deg, #8aa4c8 0%, #3d4f6b 52%, #1b2330 100%);
  color: inherit;
  font: inherit;
  cursor: pointer;
}
.fw-hero[data-over='true'] { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }
.fw-hero:disabled { cursor: default; }
.fw-hero img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.fw-hero-glass {
  position: absolute;
  inset: auto 18px 18px auto;
  width: 42%;
  min-width: 120px;
  height: 46%;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.35);
  background: rgba(255,255,255, var(--fw-ui-glass, 0.46));
  -webkit-backdrop-filter: blur(var(--fw-ui-blur, 28px)) saturate(var(--fw-ui-sat, 155%));
  backdrop-filter: blur(var(--fw-ui-blur, 28px)) saturate(var(--fw-ui-sat, 155%));
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.55);
  pointer-events: none;
}
.fw-hero-copy {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 20px;
  text-align: left;
}
.fw-hero-copy strong { font-size: 14px; line-height: 20px; font-weight: 600; }
.fw-hero-copy span {
  font-size: 12px;
  line-height: 18px;
  color: var(--dsw-alias-label-secondary);
}
.fw-hero:not([data-has='true']) .fw-hero-copy strong,
.fw-hero:not([data-has='true']) .fw-hero-copy span { color: #f4f7fb; }
.fw-switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 14px;
  line-height: 22px;
}
.fw-switch input {
  appearance: none;
  -webkit-appearance: none;
  width: 44px;
  height: 26px;
  margin: 0;
  border: 0;
  border-radius: 999px;
  background: #6b7178;
  position: relative;
  cursor: pointer;
  transition: background 160ms ease;
}
.fw-switch input::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.28);
  transition: transform 160ms ease;
}
.fw-switch input:checked {
  background: #34c759;
}
.fw-switch input:checked::after { transform: translateX(18px); }
.fw-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 16px;
}
@media (max-width: 640px) { .fw-grid { grid-template-columns: 1fr; } }
.fw-row { display: flex; flex-direction: column; gap: 8px; }
.fw-row-head {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  line-height: 18px;
}
.fw-row-head span:last-child { color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums; }
.fw-row input[type='range'] {
  width: 100%;
  height: 4px;
  accent-color: var(--dsw-alias-brand-primary);
  cursor: pointer;
}
.fw-bar {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 4px;
}
.fw-btn {
  appearance: none;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 12px;
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 13px;
  line-height: 20px;
  padding: 8px 14px;
  cursor: pointer;
}
.fw-btn:hover { background: var(--dsw-alias-interactive-bg-hover); }
.fw-btn[data-kind='primary'] {
  background: #34c759;
  color: #fff;
  border-color: transparent;
}
.fw-btn[data-kind='primary']:hover { background: #2fb350; }
.fw-btn[data-kind='primary']:disabled {
  background: transparent;
  color: var(--dsw-alias-label-primary);
  border-color: var(--dsw-alias-border-l2);
  opacity: 0.5;
}
.fw-btn[data-kind='danger'] { color: var(--dsw-alias-state-error-primary); }
.fw-btn:disabled { opacity: 0.5; cursor: default; }
.fw-error {
  font-size: 13px;
  line-height: 20px;
  color: var(--dsw-alias-state-error-primary);
}
.fw-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
`.trim();
		//#endregion
		//#region src/client/css/bloom-component.ts
		/**
		* 质感层 —— 这是「Bloom 好看」的真正来源，不是色值。
		*
		* 原版 typora-Bloom-theme 的 base-light/base-dark.css 共 2968 行，做的就是这件事：
		* 14 处氛围渐变 + 20 处长距柔影 + 35 处圆角 + 渐变装饰线。只搬色板（root-*.css，89 行）
		* 得到的是「换了色的原界面」，不是 Bloom。
		*
		* 全部用 var(--bloom-*)（见 bloomTokens），所以这份 CSS 只写一遍，4 个变体 × 明暗自动适配。
		*
		* ⚠️ 选择器脆弱性：DSH 用 CSS Modules，类名形如 `wSkVaW_root`（<hash>_<语义名>）。
		* hash 随 DSH 构建变化，语义名稳定，所以这里一律用 [class*="_语义名"] 后缀匹配。
		* DSH 改版导致失配时，效果只会「退回纯色」——不会错位或不可用，属安全降级。
		*/
		const COMPONENT_CSS = `
/* ═══ 1. 氛围层 ═══════════════════════════════════════════════════
   原版 body 的三层叠加：大尺度径向光晕 + 斜向淡染 + 顶部柔光。
   全部用气质轨(morandi)的极低透明度，这是莫兰迪「灰调通透」的来源。

   v0.10.x（owner 反馈「没光感」）：把 veil 换成 aurora-stream 并提高透明度。
   aurora-stream 来自 motion 谱，是每个变体的三色光谱（鼠尾草=草绿系、青金=蓝系），
   透明度从原来的 40% 提高到 55-65%，让"四角色斑"真正能看出来 —— 这是
   "光感"的主要来源，不再靠硬边光带。 */
body {
  /* 抽成变量：输入区那块不透明底板要原样复刻同一份氛围（见 §1.5），
     两处必须逐字一致，否则底部会出现一道色阶。 */
  --bloom-ambience:
    /* 顶左：主色光晕（accent，给画面主调） */
    radial-gradient(1400px circle at 6% -4%, color-mix(in oklch, var(--bloom-accent, #6b8f71), transparent 80%), transparent 50%),
    /* 顶右：aurora stream 2 —— 异色相，跟主色形成对比 */
    radial-gradient(1100px circle at 100% 8%, color-mix(in oklch, var(--bloom-aurora-stream-2), transparent 50%), transparent 60%),
    /* 底右：aurora stream 3 —— 再一个异色相 */
    radial-gradient(900px circle at 96% 100%, color-mix(in oklch, var(--bloom-aurora-stream-3), transparent 50%), transparent 62%),
    /* 底左：aurora stream 1 —— 四角各一团 */
    radial-gradient(1000px circle at 2% 96%, color-mix(in oklch, var(--bloom-aurora-stream-1), transparent 50%), transparent 60%);
  background-attachment: fixed;
  background-image: var(--bloom-ambience);
}

/* ═══ 1.5 输入区底板：让氛围一路铺到窗口底边 ═══════════════════════
 *
 * owner 反馈「底部有种戛然而止的感觉」。实测原因：DSH 给 _composerSeat 铺了
 *   linear-gradient(transparent 0, oklch(0.28 0.02 25) 36px)
 * ——36px 内从透明冲到**不透明**，之后 90px 全是死板一块。氛围的左右色差
 * 在 y=721 还有 13 级，到 y=757 直接归零，窗口最下面 1/5 是块死色。
 *
 * 修法不是把它改透明（它要盖住滚到输入框背后的正文），而是**在这块不透明
 * 底板上原样重画一遍氛围**：同一份 --bloom-ambience + background-attachment:
 * fixed，光斑相对视口定位，于是和 body 那层严丝合缝地接上。
 *
 * 为什么要走 ::before + mask 而不是直接给 seat 叠背景：直接叠的话，渐变
 * 顶部那段半透明区域会**同时**透出 body 的氛围和自己画的氛围，双份叠加，
 * 实测顶端亮了 20 级。改成 ::before 承载「不透明底 + 氛围」整体，再用
 * mask 做同一条 56px 淡入 —— 淡入区里 ::before 本身是半透的，透出来的
 * 只有 body 那一份，不会重复。实测纵向逐行色差 0-1 级，无缝。
 *
 * ⚠️ 只用 position:absolute + z-index:-1，不引入 backdrop-filter / transform /
 * isolation —— seat 的子树里有 conversation.input.overlay 注入的 fixed 元素，
 * 判据同 glass.ts 侧栏那段。seat 自身是 position:sticky，已经是定位元素，
 * 不需要也不要去改它的 position。 */
/* 宿主那条是 .wSkVaW_root[data-phase="active"] .wSkVaW_composerSeat，特异度
   (0,3,0)；这里必须写满三段才压得过（(0,3,1)），少一段就还是它赢。 */
body[data-bloomglass-variant] [class*="_root"] [class*="_composerSeat"] {
  background-image: none;
}
body[data-bloomglass-variant] [class*="_root"] [class*="_composerSeat"]::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background-color: var(--dsw-alias-bg-layer-1, #101010);
  background-image: var(--bloom-ambience);
  background-attachment: fixed;
  -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 56px);
  mask-image: linear-gradient(to bottom, transparent 0, #000 56px);
}

/* 让 body 的氛围层透出来：DSH 这几个全屏容器自带不透明底色会盖住它。
   侧栏与卡片保留自己的 surface 色（原版同样保留），只做描边和光。 */
body[data-bloomglass-variant] [class*="_frame"],
body[data-bloomglass-variant] [class*="_centerCol"],
/* :has() 里不能加子组合器（\`> \`）：实测 DSH 的结构是 _root > _body > _scrollBody，
   scrollBody 是孙子。写成子选择器这条一直没命中 —— 会话区一直盖着
   oklch(0.28 0.02 240) 不透明底，body 的流线在中区完全看不见（这就是
   owner 说「没光感」的真正原因）。 */
body[data-bloomglass-variant] [class*="_root"]:has([class*="_scrollBody"]),
body[data-bloomglass-variant] [class*="_scrollBody"] {
  background-color: transparent;
  background-image: none;
}

/* ═══ 2. 冷光线条 ═════════════════════════════════════════════════
   细、冷、低透明度的莫兰迪描边 + 极弱外辉。深色下最出效果。 */

/* ═══ 侧栏 ════════════════════════════════════════════════════════
   之前只给了右侧一道竖线，内部还是一整块死板的纯色。补足：顶部氛围淡染、
   会话项冷光态、分组标题层级。 */
[class*="_sidebarCol"] {
  position: relative;
  box-shadow: 1px 0 0 var(--bloom-hairline), 8px 0 32px -10px var(--bloom-glow);
  /* 顶部莫兰迪淡染，跟主区氛围同源，消除"两块拼起来"的割裂感 */
  background-image:
    linear-gradient(180deg, rgba(var(--bloom-morandi), 0.1), transparent 260px),
    radial-gradient(600px circle at 0% 0%, rgba(var(--bloom-morandi), 0.08), transparent 60%);
}

/* 会话条目：圆角 + 过渡。hover / 选中的着色统一在 §6「会话行」那一处，
   这里不再重复一遍（曾经两处各写一遍 6% 和 7%，靠 !important 决定谁赢，
   等于用 !important 压自己人）。 */
[class*="_sidebarCol"] [role="treeitem"],
[class*="_sidebarCol"] [class*="_sessionRow"] {
  border-radius: 8px;
  transition: background 0.15s ease;
}
[class*="_sidebarCol"] [role="treeitem"][aria-selected="true"] [class*="_title"],
[class*="_sidebarCol"] [class*="_active"] [class*="_title"],
[class*="_sidebarCol"] [class*="_selected"] [class*="_title"] {
  font-weight: 500;
  color: var(--dsw-alias-label-primary);
}
/* v0.10.x（owner 反馈「脏」）：左侧 3px 蓝竖条是脏点 —— 莫兰迪克制不应有这种色块。
   删掉 ::before。选中感靠 bg 的 8% 染色传达。 */

/* 新建会话按钮：极淡底色，无 border，文字与图标都用主文字色（owner 反馈「脏」——
   之前 accent 色的 svg + accent 染色 bg + hairline border 三层叠，跟莫兰迪"统一克制"冲突）。
   现在的按钮只靠 5% accent 染色跟会话行区分，没有色块、没有边框、没有彩色文字。 */
[class*="_sidebarCol"] button[class*="_newSession"],
[class*="_sidebarCol"] button[class*="_newChat"] {
  background: color-mix(in oklch, var(--bloom-accent) 5%, transparent);
  border: 0;
  border-radius: 10px;
  transition: background 180ms ease;
}
[class*="_sidebarCol"] button[class*="_newSession"]:hover,
[class*="_sidebarCol"] button[class*="_newChat"]:hover {
  background: color-mix(in oklch, var(--bloom-accent) 12%, transparent);
}
/* 图标和文字都用主色 —— 不让 accent 出现在按钮上，跟莫兰迪统一 */
[class*="_sidebarCol"] button[class*="_newSession"] svg,
[class*="_sidebarCol"] button[class*="_newChat"] svg {
  color: var(--dsw-alias-label-primary);
}

/* 分组标题（工作区 / 未分组）：拉开与条目的层级。
   _sectionLabel 是 DSH 实际用的类名片段（qDHVXG_sectionLabel），
   12px + 字距让它明显是「标签」而不是一行内容。 */
[class*="_sidebarCol"] [class*="_groupLabel"],
[class*="_sidebarCol"] [class*="_sectionTitle"],
[class*="_sidebarCol"] [class*="_sectionLabel"] {
  font-size: 12px;
  letter-spacing: 0.06em;
  color: var(--dsw-alias-label-caption);
}

/* 分区头右侧的搜索/动作图标：默认 60% 亮度降权，hover 才全亮 ——
   和「工作区」标题同排且全亮时，四个元素抢注意力，列表反而不突出。 */
[class*="_sidebarCol"] [class*="_sectionHeader"] [class*="_searchSlot"],
[class*="_sidebarCol"] [class*="_sectionHeader"] [class*="_headerActions"] {
  opacity: 0.6;
  transition: opacity 150ms ease;
}
[class*="_sidebarCol"] [class*="_sectionHeader"] [class*="_searchSlot"]:hover,
[class*="_sidebarCol"] [class*="_sectionHeader"] [class*="_headerActions"]:hover {
  opacity: 1;
}

/* 会话行元信息（时间戳/来源等 _slot）：DSH 默认 0.55 透明度，
   暗色氛围渐变上偏糊，统一提到主题的 secondary 档（明暗自适应）。 */
[class*="_sidebarCol"] [class*="_sessionRow"] [class*="_slot"] {
  color: var(--dsw-alias-label-secondary);
}

/* 会话列表细滚动条：4px、冷光 thumb、hover 才加强。
   系统默认滚动条在 280px 的窄栏里非常抢；DSH 自己只有全局 alias 变量，
   没有给侧栏列表单独收窄。 */
[class*="_sidebarCol"] [class*="_list"]::-webkit-scrollbar { width: 4px; }
[class*="_sidebarCol"] [class*="_list"]::-webkit-scrollbar-track { background: transparent; }
[class*="_sidebarCol"] [class*="_list"]::-webkit-scrollbar-thumb {
  background: color-mix(in oklch, var(--bloom-accent) 30%, transparent);
  border-radius: 999px;
}
[class*="_sidebarCol"] [class*="_list"]::-webkit-scrollbar-thumb:hover {
  background: color-mix(in oklch, var(--bloom-accent) 55%, transparent);
}

/* 侧边栏成「面」：右侧一道冷光分界 + 向内的极淡渐变。
   光靠 sidebar-fill 的底色差不足以让它跟消息区分开 —— 消息区有氛围渐变和气泡，
   侧边栏只有一列文字，不给边界就显得平。分界线用 hairline（比实色 border 轻），
   渐变只在顶部 120px 内，避免整列发灰。

   v0.10.x（owner 反馈「没层次感」）：之前光带 1px + 18% alpha 在截图里几乎
   看不见，侧栏和背景完全融成一片。这里两层：① 内部底色 4% accent 给容器
   自己的"色"，与 body 区分；② 顶部 120px 氛围染。右侧冷光线交给下面的
   ::after / ::before 双层（线 + 光晕），因为 box-shadow inset 会被 glass.ts
   的 _sidebarCol 规则覆盖掉（cascade 顺序），改用伪元素才不会被吃掉。 */
body[data-bloomglass-variant] [class*="_sidebarCol"] {
  /* 宿主那条 0.5px 实线优先级更高，不加 !important 关不掉（实测覆盖后仍是 0.5px） */
  border-right: 0;
  background-color: color-mix(in oklch, var(--bloom-accent, #6b8f71), transparent 96%);
  background-image: linear-gradient(
    180deg,
    color-mix(in oklch, var(--bloom-accent) 6%, transparent),
    transparent 120px
  );
  background-repeat: no-repeat;
  background-position: left top;
  background-size: 100% 100%;
}
/* 侧栏右缘的冷光交给 glass.ts 的 box-shadow（向外投）——
   这里曾用 ::after 画一条 18px 渐变，但侧栏 overflow:hidden，伪元素只能落在
   容器内侧，看上去是「向内发光」，owner 反馈很奇怪。box-shadow 的外阴影不受
   自身 overflow 裁剪，是唯一能真正往外散的做法。 */

/* 底部设置区与会话列表之间补一道分隔，让「设置」不像是最后一条会话 */
[class*="_sidebarCol"] [class*="_footer"],
[class*="_sidebarCol"] [class*="_bottom"] {
  border-top: 1px solid var(--bloom-hairline);
}

/* 顶栏下沿冷光线 —— 标题区与消息流之间的分界，比实色 border 轻。
   只给 tabs 这一条真正的分界线：_header 会同时命中 headerActions /
   headerUtilities 等右上角子容器，给它们加投影会凭空多出几个浮块。 */
div[class*="_tabs"] {
  box-shadow: 0 1px 0 var(--bloom-hairline), 0 6px 20px -12px var(--bloom-glow);
}

/* 排队消息条（输入框上方那条待发送预览）。
   DSH 原样式是「完全透明容器 + 70% 不透明白字」—— 在它自己的纯色底上尚可读，
   但本主题给 body 铺了氛围渐变，背景不再均匀，这条就糊进背景里了。
   这是氛围层带来的副作用，必须由本主题自己补一个实体容器兜住。

   ⚠️ 必须用 :has(> [class*="_preview"]) 收窄，不能裸用 [class*="_dock"]：
   GoalBar（dsh-client-ui-goal）的外层类名也叫「*_dock」，但它是**全宽布局容器**
   （原生 width: calc(100% - 各种 inset)），真正该被看见的条是里面那个限宽居中的
   「*_bar」（max-width: var(--dsh-composer-card-max-width)）。
   裸选择器会把边框+毛玻璃画到那个全宽容器上——实测 dock 1810px 而 bar 只有 748px，
   于是「进行中的目标」左右各露出一大截空壳边框，跟下方输入框完全不对齐。
   QueueDock 一定有「_preview」子元素（就是下一条规则要上色的那个），拿它当判据最稳，
   比写死 QueueDock 的哈希类名（会随 DSH 构建变）可靠。 */
div[class*="_dock"]:has(> [class*="_preview"]) {
  background: color-mix(in oklch, var(--dsw-alias-bg-layer-2, #fff), transparent 22%);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--bloom-hairline);
  border-radius: 12px;
}
div[class*="_dock"] [class*="_preview"] {
  color: var(--dsw-alias-label-secondary);
}

/* 消息卡 / 工具调用行：只给轻描边，不给阴影 —— 数量多（一次会话 30+ 个），
   加长距阴影会把整个消息流糊成一片。全部限定 div，否则会命中 SVG 元素。 */
/* 工具调用行：常态不描边，hover 才亮起。
   常驻边框有两个毛病：① 同为工具行，可展开的 Bash 有框、Read/Edit 没框，视觉不一致；
   ② 折叠行实测 748×26，画成圆角框又扁又长，且边框贴着内容区边缘而行内图标有内缩，
   看起来像个输入框。保留 transparent 占位是为了 hover 时不发生布局跳动。 */
div[class*="_card"],
div[class*="_toolRow"],
div[class*="_panel"] {
  border-radius: 10px;
  border: 1px solid transparent;
  transition: border-color 0.16s ease, background 0.16s ease;
}
div[class*="_card"]:hover,
div[class*="_toolRow"]:hover {
  border-color: var(--bloom-hairline);
  background: rgba(var(--bloom-morandi), 0.05);
}
/* 展开态：DSH 的终端区（_terminal）自带 1px 边框 + 12px 圆角，
   外层 card 再描一圈就是两个几乎同尺寸的圆角框相套（实测 439px 套 377px）＝框中框。
   展开后连 hover 边框也不要。 */
div[class*="_card"]:has([class*="_terminal"]),
div[class*="_card"]:has(pre),
div[class*="_card"]:has([class*="_terminal"]):hover,
div[class*="_card"]:has(pre):hover {
  border-color: transparent;
  background: transparent;
}

/* 输入卡片：整个界面的视觉主角，给足纸感。
   必须限定在 composer 内 —— 裸的 [class*="_card"] 会命中 30+ 个消息卡片，
   把长距阴影糊得到处都是。 */
div[class*="_composer"] div[class*="_card"] {
  border: 1px solid var(--bloom-hairline);
  border-radius: 16px;
  /* 三层：顶部内高光（模拟光从上方打来）+ 长距柔影 + 外侧冷辉 */
  box-shadow:
    inset 0 1px 0 rgba(var(--bloom-morandi), 0.14),
    var(--bloom-shadow),
    0 0 24px -14px var(--bloom-glow);
  transition: border-color 0.22s ease, box-shadow 0.22s ease;
}
div[class*="_composer"] div[class*="_card"]:focus-within {
  border-color: var(--bloom-hairline-strong);
  box-shadow:
    inset 0 1px 0 rgba(var(--bloom-morandi), 0.2),
    var(--bloom-shadow),
    0 0 0 2px var(--bloom-glow);
}

/* 消息气泡：柔和圆角 + 近距阴影，脱离"贴在背景上"的平面感。
   限定 div：DSH 的全局 Tooltip 是 span[class*="_bubble"]（见 glass.ts 同名注释），
   不能吃到气泡的圆角/阴影/入场动画 —— 尤其动画：带 !important 的 bloom-fade-up
   会在 420ms 里盖掉 tooltip 的定位 transform（[data-side=right] 的 translateY(-50%)），
   气泡先偏移再跳回，也是"提示看不清"的一部分。 */
div[class*="_bubble"] {
  border-radius: 14px;
  box-shadow: var(--bloom-shadow-sm);
}

/* ═══ 3. Markdown 排版质感 ═════════════════════════════════════════
   照搬原版手法：标题渐变短横、hr 两端消隐、引用块左侧主色条。 */
[class*="_markdown"] h1,
[class*="_markdown"] h2,
[class*="_markdown"] h3 {
  position: relative;
}
[class*="_markdown"] h1::after,
[class*="_markdown"] h2::after,
[class*="_markdown"] h3::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -0.34em;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(var(--bloom-morandi), 0.45), transparent);
}
[class*="_markdown"] h1::after { width: 76px; height: 3px; }
[class*="_markdown"] h2::after { width: 56px; }
[class*="_markdown"] h3::after { width: 40px; background: linear-gradient(90deg, rgba(var(--bloom-morandi), 0.28), transparent); }

hr {
  border: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--bloom-hairline-strong), transparent);
}

blockquote {
  border-left: 3px solid rgba(var(--bloom-morandi), 0.55);
  border-radius: 12px;
  background: rgba(var(--bloom-morandi), 0.07);
  box-shadow: var(--bloom-shadow-sm);
}

/* 代码：内联块用莫兰迪淡底（变量已在 alias 层修正为背景色），
   块级代码加冷光描边 + 圆角，消除方角感 */
code {
  border-radius: 6px;
}

/* 代码块：描边/阴影只能给「有实色背景的那一层」——DSH 的结构是
     div.md-code-block（实色底 + 圆角）> div > pre.shiki（背景透明）
   曾经把 border/box-shadow 加在 pre 上：两层各画一个 12px 圆角框 = 框中框，
   而且 pre 背景透明，阴影直接投进容器内部形成一圈脏边。
   md-code-block 是 DSH 的全局类名（非 CSS Modules hash），可以稳定引用。 */
.md-code-block {
  border: 1px solid var(--bloom-hairline);
  box-shadow: var(--bloom-shadow-sm);
  overflow: hidden;
}
.md-code-block pre,
pre.shiki {
  border: 0;
  border-radius: 0;
  box-shadow: none;
}
/* 兜底：不在 md-code-block 里的裸 pre 才自己描边 */
pre:not(.shiki) {
  border-radius: 12px;
}
pre code {
  border-radius: 0;
  background: transparent;
}

/* 表格：严格限定在 [_tableScroll] 容器内，只动 markdown 渲染的聊天表格，
   不影响 DSH 会话列表（Y0dWHa_table）这类其他用途的 <table>。
   DSH 原生规则：th/td 各有一条 border-bottom，th:first-child 与 td:first-child
   的 padding-left:0（让首列对齐正文），空 cell 仍撑出 100px min-width。
   三个肉眼短板：① 表头只有加粗无底色，与主体混淆；② 无列分隔，像列表不像表；
   ③ 空 cell 100px 留白让残缺行（如 P1 状态列空）看着"半残废"。 */
[class*="_tableScroll"] {
  border: 1px solid var(--bloom-hairline);
  border-radius: 10px;
  background: rgba(var(--bloom-morandi), 0.02);
}
/* min-width:100% 而不是 width:100%：
   DSH 原生表格按内容定宽，而 _tableScroll 容器是块级全宽。上面刚给容器加了边框+圆角，
   两边宽度不一致立刻就看得见——实测容器 748px、表格只有 469px，右侧露出 279px 空框，
   表头底色和行分隔线都在半路截断（截图里那种「表格缩在左边」）。
   用 min-width 而非 width 是因为 _tableScroll 本来就是横向滚动容器：
   窄表格撑满对齐边框，宽表格仍能超出并滚动；写 width:100% 会把宽表格压缩换行，
   把这个容器的滚动能力废掉。 */
[class*="_tableScroll"] table {
  border-collapse: separate;
  border-spacing: 0;
  min-width: 100%;
}
body[data-bloomglass-variant] [class*="_tableScroll"] th,
body[data-bloomglass-variant] [class*="_tableScroll"] td {
  border-color: var(--bloom-hairline);
  border-right-width: 1px;
  border-right-style: solid;
  border-bottom-width: 1px;
}
[class*="_tableScroll"] th:last-child,
[class*="_tableScroll"] td:last-child { border-right: 0; }
[class*="_tableScroll"] tr:last-child th,
[class*="_tableScroll"] tr:last-child td { border-bottom: 0; }
[class*="_tableScroll"] th:first-child,
[class*="_tableScroll"] td:first-child { padding-left: 16px; }
[class*="_tableScroll"] thead th {
  background: rgba(var(--bloom-morandi), 0.10);
  font-weight: 600;
  border-bottom-width: 1px;
  border-bottom-color: var(--bloom-hairline-strong);
  color: var(--dsw-alias-label-secondary, currentColor);
}
[class*="_tableScroll"] tbody tr:hover { background: rgba(var(--bloom-morandi), 0.06); }
/* 空 cell 视觉降权：透明度 0.35，省得缺值列（P1 状态空）显得行"断了一截" */
[class*="_tableScroll"] td:empty { opacity: 0.35; }

/* 推理中的 “Deep diving…”：DSH 原生 shimmer 直接使用 DeepSeek 静态蓝。
   Bloom 为每个变体提供主色及两种邻近色，做成克制的三色光谱流动：有 Gemini
   式的生命力，但色相始终属于当前主题。以语义后缀而非 CSS Module hash 匹配。 */
body[data-bloomglass-variant] [class*="_turnStatus"]:not([class*="_turnStatusClock"]) {
  background-image: linear-gradient(
    110deg,
    var(--bloom-motion-1) 0%,
    var(--bloom-motion-2) 24%,
    var(--bloom-motion-3) 43%,
    var(--bloom-motion-1) 60%,
    var(--bloom-motion-2) 78%,
    var(--bloom-motion-3) 100%
  );
  background-size: 260% 100% !important;
  animation: bloom-deep-dive-spectrum 3.6s ease-in-out infinite alternate !important;
}
[class*="_turnStatusClock"] {
  color: color-mix(in oklch, var(--bloom-motion-2) 58%, var(--dsw-alias-label-caption)) !important;
  -webkit-text-fill-color: color-mix(in oklch, var(--bloom-motion-2) 58%, var(--dsw-alias-label-caption)) !important;
}
@keyframes bloom-deep-dive-spectrum {
  from { background-position: 100% 0; }
  to { background-position: 0 0; }
}
@media (prefers-reduced-motion: reduce) {
  [class*="_turnStatus"]:not([class*="_turnStatusClock"]) {
    animation: none !important;
    background-position: 50% 0 !important;
  }
}

/* 选中文本：原版用 accent 混 80%，比 DSH 默认的 85% 更实，能看清 */
::selection {
  background: color-mix(in oklch, var(--bloom-accent), transparent 78%);
}

/* ═══ 4. 裸露的 <think> 标签 ═══════════════════════════════════════
   由 markThinkTags() 打标（见该函数注释：这是 workaround，根因在 LLM 适配层）。
   标签行整行隐藏 —— 实测它们各自独占段落，隐藏不丢内容；
   标签之间的思考内容只降权、不隐藏，用冷光竖线标出，信息仍可读。 */
[data-bloom-think] {
  display: none !important;
}
/* 左侧冷光竖线 + 降低透明度。
   ⚠️ 竖线错位的坑：思考块是一串平铺的兄弟元素（p / ul / ol / h3 / div），各标签
   默认 margin-left 不同（实测 p 被置为 0、ul 为 2px），不强制归零就会让竖线
   错开 2px、连不成一条直线。所以 margin-left 必须 !important 压平。
   另：用背景色块代替竖线会让每段变成一张「卡片」，且色块边缘直接贴住文字，
   观感更差 —— 竖线 + 内边距才是对的做法。 */
[data-bloom-think-body] {
  opacity: 0.62;
  border-left: 2px solid var(--bloom-hairline);
  margin-left: 0 !important;
  padding-left: 14px;
  transition: opacity 0.2s ease, border-color 0.2s ease;
}
[data-bloom-think-body]:hover {
  opacity: 0.92;
  border-left-color: var(--bloom-hairline-strong);
}
/* 列表要保留编号/圆点的缩进，否则 padding 被覆盖后编号会贴到竖线上 */
ul[data-bloom-think-body],
ol[data-bloom-think-body] {
  padding-left: 38px;
}

/* ═══ 6. 微交互动效系统（v0.5.0）══════════════════════════════════
   原则（导师批注）：
   ① 只为「状态反馈」动：hover=可点、active=按下、选中=切换；
   ② 统一时长/缓动走 token（反馈 130ms、常规 200ms、大过渡 280ms；
      ease-out 入场、通用 ease），全站一致，否则就是「东一块西一块」；
   ③ 只动 transform/opacity（GPU 合成不动布局），backdrop-filter 很贵不放进 transition；
   ④ prefers-reduced-motion 一律降级成瞬间（无动画）。
   别加「为了炫而炫」的常驻动画——那个会回到「脏/四不像」。 */
body {
  --bloom-ease: cubic-bezier(0.2, 0.8, 0.2, 1);
  --bloom-ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --bloom-dur-fast: 130ms;
  --bloom-dur: 200ms;
  --bloom-dur-slow: 280ms;
}

/* 侧栏会话行：hover 轻微右移 + 淡染（可点暗示），active 按下回弹 */
[class*="_sidebarCol"] [role="treeitem"],
[class*="_sidebarCol"] [class*="_sessionRow"] {
  transition:
    background var(--bloom-dur-fast) var(--bloom-ease),
    transform var(--bloom-dur-fast) var(--bloom-ease);
}
[class*="_sidebarCol"] [role="treeitem"]:hover {
  transform: translateX(2px);
}
[class*="_sidebarCol"] [role="treeitem"]:active { transform: translateX(2px) scale(0.996); }

/* ── 侧栏：去分割线，靠间距 + 极淡光感分组（owner 2026-09-10）──
 *
 * 反馈原话：「基本取消分割线，用行间距和浅色交替分组」「取消网格，增加当前行
 * 左侧粉色短竖条」「现在已经不流行通过 border 去做切割了，要不然就是很淡的
 * 边框线加光感流动或者是阴影，比硬的边框好看得多」。
 *
 * 所以这里一条实线都不画。曾经退而求其次画过"极淡的渐隐光带"，
 * 结果 18 个分组 = 18 条横线，等于换了个材质的网格 —— 也删了，见下。
 */
[class*="_sidebarCol"] [class*="_groupSection"] + [class*="_groupSection"] {
  /* 分组之间只靠留白。10px 时还要配一条组标题下的光带才分得开，
     16px 之后光带就多余了 —— 见下面那段。 */
  margin-top: 16px;
}

/* 组标题下曾有一道渐隐光带（左浓右透）。删掉了：侧栏里有 18 个分组，
 * 一组一条 = 18 条横线，正是 owner 说的「取消网格」要取消的东西
 * （2026-09-10 实拍反馈"细节不满意"）。浅色下线的左端是 28% accent，
 * 在莫兰迪里更是一条明显的彩色规线。
 *
 * 分组识别现在靠三件不画线的东西：组标题自带文件夹图标、条目相对缩进、
 * 组间 16px 留白。实测这三样够了 —— 加线只是把"够了"变成"吵"。 */

/* 会话行：圆角 + hover 淡染，靠留白区分，不描边不画网格 */
[class*="_sidebarCol"] [class*="_sessionRow"] {
  position: relative;
  border-radius: 8px;
}
[class*="_sidebarCol"] [class*="_sessionRow"]:hover {
  background: color-mix(in oklch, var(--bloom-accent, #6b8f71), transparent 93%);
}

/* 当前行：只染色，不画条不画框（owner 反馈「脏」）
   之前有左侧 3px 蓝竖条 + inset 1px 边框 + 25% accent 实色底，三个都是脏点。
   现在只留一个 8% 的极淡 accent 染色，跟 hover 区分用细微浓淡差。

   这里不需要 !important（2026-09-10 实测推翻了原注释）：DSH 那条是
   .YDXeBa_sessionRow.YDXeBa_selected { background: var(--dsw-alias-interactive-bg-hover) }，
   特异度 (0,2,0) 且不带 !important，而本条 (0,3,0) 本来就赢；更何况
   --dsw-alias-interactive-bg-hover 早已被 tokens.ts 覆写成本主题的 accent，
   压根不是"固定蓝色"。 */
[class*="_sidebarCol"] [class*="_sessionRow"][class*="_selected"],
[class*="_sidebarCol"] [class*="_sessionRow"][class*="_active"],
[class*="_sidebarCol"] [class*="_sessionRow"][aria-selected="true"],
[class*="_sidebarCol"] [role="treeitem"][aria-selected="true"] {
  background: color-mix(in oklch, var(--bloom-accent, #6b8f71), transparent 92%);
}

/* v0.10.x：左色条 + bloom-bar-in 动画整体删除（owner 反馈「脏」）。
   没有 ::before 了，bloom-bar-in keyframe 也跟着删。 */

/* 玻璃面板 / 输入卡片 hover：微抬升（只在已有 transition 的元素上加，避免泛化抖动） */
div[class*="_composer"] div[class*="_card"] {
  transition:
    border-color var(--bloom-dur) var(--bloom-ease),
    box-shadow var(--bloom-dur) var(--bloom-ease);
}
div[class*="_composer"] div[class*="_card"]:hover {
  border-color: var(--bloom-hairline-strong);
}

/* 主题自己的按钮：按下微缩（明确「点到了」） */
.dsh-bloom-trigger:active,
.dsh-bloom-option:active,
[class*="_sidebarCol"] button:active { transform: scale(0.985); }

/* ═══ 焦点环兜底：统一成主题色 ═══
   DSH 有些控件（例如设置面板右上角的关闭按钮）没定义自己的 focus 样式，
   于是露出**浏览器默认**的 focus ring —— Chrome 暗色下是一圈亮蓝
   rgb(153,200,255)，跟 8 套莫兰迪配色全都打架（用户实拍反馈里那个蓝圈）。
   注意它不是 DSH 的 token，改 --dsw-* 改不到，只能靠这条兜底。

   用 :focus-visible 而不是 :focus —— 只在键盘导航时出现，鼠标点击不显示，
   这也是 WCAG 2.4.7「焦点可见」的正确做法：焦点依然清晰，只是跟着主题走。 */
:focus-visible {
  outline: 2px solid var(--bloom-accent) !important;
  outline-offset: 2px;
}

/* 重新截图/使用观察时可平滑淡入的低频面板入场（默认不绑到常驻元素上） */
@keyframes bloom-panel-in {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: none; }
}

/* ═══ 6.5 空状态视觉锚点 (v0.10.x) ═══════════════════════════════════
 *
 * owner 反馈「没层次感」：空状态下「探索未至之境」一行字飘在苍白画布上，
 * 眼睛找不到着陆位置。这里在 scrollBody 没有气泡时（即空状态），在中央
 * 投一团主题色光晕 + 慢呼吸，给视觉一个焦点。光晕跟 message 流重叠的
 * 概率低（消息堆在顶部），不会污染正常态。
 *
 * selector 限制条件：\`:not(:has(div[class*="_bubble"]))\` 确保只在没消息时出现；
 * 有消息时这条规则不匹配，::before 不渲染。\`:has()\` Chrome 105+/Safari 15.4+。
 * 限定 div 同样是为了不把 tooltip（span）算进"有消息"。 */
[class*="_scrollBody"] { position: relative; }
[class*="_scrollBody"]:not(:has(div[class*="_bubble"]))::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background: radial-gradient(
    42% 32% at 50% 48%,
    color-mix(in oklch, var(--bloom-accent, #6b8f71), transparent 86%) 0%,
    color-mix(in oklch, var(--bloom-aurora-stream-2), transparent 92%) 35%,
    transparent 68%
  );
  animation: bloom-anchor-breathe 4.2s ease-in-out infinite;
}
@keyframes bloom-anchor-breathe {
  0%, 100% { opacity: 0.85; transform: scale(1); }
  50%      { opacity: 1; transform: scale(1.05); }
}

/* ═══ 7. 全站统一入场系统 (v0.10.x) ═════════════════════════════════
 *
 * owner 反馈：「除了深度求索中的文字有动效外，别的几乎是没有任何吸引到我的动画」
 * ——所以这一节专门把页面"活起来"：消息气泡/工具行/侧栏/顶栏首次入场都走
 * 同一条 keyframe，长度/缓动全走 §6 的 token；只动 opacity + transform，
 * prefers-reduced-motion 下由下方媒体查询清零。
 *
 * 为什么用 \`animation\` 而不是 transition + \`:not([hidden])\`：
 *   后者在 React 里反复 toggle hidden 时 transition 不会重新计算；
 *   且「元素插入」这件事 transition 表达不了。\`animation\` 在元素 mount 那一刻
 *   唯一一次触发，正好对应「第一次出现在视野中」的语义；React 重渲染复用
 *   DOM 节点时也不会重放，不会污染正常状态切换。
 */
@keyframes bloom-fade-up {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: none; }
}
@keyframes bloom-fade-down {
  from { opacity: 0; transform: translateY(-12px); }
  to   { opacity: 1; transform: none; }
}

/* 消息气泡 / 工具调用行 / 滚动体内的卡片 —— 整页停留时间最长的地方。
   气泡限定 div（span 的 _bubble 是全局 Tooltip，动画会盖掉它的定位 transform，
   见 §3 气泡圆角处的注释）。
   \`:not(:has(...))\` 排除含终端 / 代码块的卡：它们是「展开后才有」的元素，
   跟着外层一起进，单独动会让代码块在父卡里飘。
   !important 必要：DSH 在这些元素上有自己的 \`animation\`（比如呼吸 loader），
   后注入的会赢；用 !important 让 Bloom 的入场动画压过它。 */
div[class*="_bubble"],
div[class*="_toolRow"],
div[class*="_scrollBody"] > div[class*="_card"]:not(:has([class*="_terminal"])):not(:has(pre)) {
  animation: bloom-fade-up 420ms var(--bloom-ease-out) backwards !important;
}
/* 侧栏会话行：页面打开时整组淡入（一次性，不是循环） */
[class*="_sidebarCol"] [role="treeitem"] {
  animation: bloom-fade-up 320ms var(--bloom-ease-out) backwards !important;
}
/* 顶栏 —— 从顶部滑下比从下方滑上更贴「页面打开」的语义。
   :has(> _tabs) 是"真顶栏"的唯一判据，见下方 §去硬边框 里的说明。 */
[class*="_header"]:has(> [class*="_tabs"]) {
  animation: bloom-fade-down 420ms var(--bloom-ease-out) backwards !important;
}
/* 顶栏三按钮入场（newSession / sessionLog / Bloom trigger）：
   transform / box-shadow 加到原 transition 里 —— 原来 WIP 只 transition 了
   background，加 lift 不需要新 transition 字段，hover 时一并平滑 */
[class*="_newSession"],
[class*="_sessionLogButton"],
.dsh-bloom-trigger {
  animation: bloom-fade-down 320ms var(--bloom-ease-out) backwards !important;
}
[class*="_newSession"]:hover,
[class*="_sessionLogButton"]:hover,
.dsh-bloom-trigger:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px -6px var(--bloom-glow);
}

/* ═══ 输入卡三态 ═══════════════════════════════════════════════════
 * owner 要的是"输入框会说话"（2026-09-10）：
 *   静置   —— 光晕边框慢呼吸（还活着，在等你）
 *   聚焦   —— 同一条呼吸，节奏收紧一倍（跟手）
 *   执行中 —— 流光沿边框流转（它在跑）
 *
 * 两个 @property 是必需的：普通自定义属性在 keyframes 里只会**离散跳变**，
 * 声明了 syntax 浏览器才真正插值。--bloom-halo 推 glass.ts 里那圈主题色
 * 外晕的浓度（阴影本体写在那边，这里只给数值）；--bloom-spin 推 conic
 * 渐变的起始角。
 *
 * 「执行中」的判据是 :has([class*="_pending"])：uV2eYG_pending 是 DSH 自己的
 * 待处理指示点（8px 圆点 + 1s 脉冲），只在跑的时候渲染进输入卡 —— idle 态
 * 实测 DOM 里查不到。比按 aria-label="停止" 判稳（那个会随界面语言变）。 */
@property --bloom-halo { syntax: '<number>'; initial-value: 0.5; inherits: false; }
@property --bloom-spin { syntax: '<angle>'; initial-value: 0deg; inherits: false; }

@keyframes bloom-halo-breathe {
  0%, 100% { --bloom-halo: 0.3; }
  50%      { --bloom-halo: 0.85; }
}
@keyframes bloom-ring-spin {
  to { --bloom-spin: 360deg; }
}

body[data-bloomglass-variant] div[class*="_composer"] div[class*="_card"] {
  animation: bloom-halo-breathe 5.2s ease-in-out infinite;
}
body[data-bloomglass-variant] div[class*="_composer"] div[class*="_card"]:focus-within {
  animation-duration: 2.6s;
}

/* 执行中：1.5px 的一圈环，conic 起始角在转，看上去像一束光绕着卡边跑。
   mask 两层 + exclude 把实心圆角矩形挖成环，padding 就是环的粗细。
   角度停留在 52%~90% 这一段，所以任一时刻只有约三分之一圈是亮的 ——
   亮满一整圈就成了跑马灯，不是"流光"。 */
body[data-bloomglass-variant] div[class*="_composer"] div[class*="_card"]:has([class*="_pending"])::after {
  content: '';
  position: absolute;
  inset: -1.5px;
  border-radius: 18px;
  padding: 1.5px;
  pointer-events: none;
  background: conic-gradient(
    from var(--bloom-spin),
    transparent 0 52%,
    color-mix(in oklch, var(--bloom-accent, #6b8f71), transparent 20%) 70%,
    color-mix(in oklch, var(--bloom-motion-2, #6b8f71), transparent 45%) 80%,
    transparent 90% 100%
  );
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite: exclude;
  animation: bloom-ring-spin 2.6s linear infinite;
}
/* 跑起来时呼吸让位给流光 —— 两套动效同时在同一块边上跑会互相打架 */
body[data-bloomglass-variant] div[class*="_composer"] div[class*="_card"]:has([class*="_pending"]) {
  --bloom-halo: 0.7;
  animation: none;
}

/* View Transition：主题切换时整页 cross-fade，让颜色"流过去"而不是瞬切。
   只有浏览器支持 \`document.startViewTransition\` 时才触发（switcher.ts 里
   调），这里只控动画时长 / 缓动；不支持和 reduced-motion 一起由下方兜底
   清零。 */
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 320ms;
  animation-timing-function: cubic-bezier(0.2, 0.8, 0.2, 1);
}

/* ④ 无障碍：动效全部降级为瞬间 */
@media (prefers-reduced-motion: reduce) {
  [class*="_sidebarCol"] [role="treeitem"],
  [class*="_sidebarCol"] [class*="_active"]::before,
  .dsh-bloom-switcher, .dsh-bloom-trigger, .dsh-bloom-option, .dsh-bloom-menu,
  [class*="_composer"] div[class*="_card"],
  [class*="_composer"] div[class*="_card"]::after,
  [class*="_composer"] div[class*="_card"]:has([class*="_pending"])::after,
  div[class*="_bubble"],
  div[class*="_toolRow"],
  div[class*="_scrollBody"] > div[class*="_card"],
  [class*="_newSession"], [class*="_sessionLogButton"],
  [class*="_scrollBody"]:not(:has(div[class*="_bubble"]))::before,
  ::view-transition-old(root), ::view-transition-new(root) {
    animation: none !important;
    transition: none !important;
  }
}

/* ══ 去硬边框：全站统一换成光带 / 浅底 / 阴影（owner 2026-09-10）══
 *
 * 原话：「现在已经不流行通过 border 去做切割了，要不然就是很淡的边框线加光感
 * 流动或者是阴影，比硬的边框好看得多」；以及「不能光靠我一个一个说」。
 *
 * 所以全页扫了一遍 border-width > 0 的元素（39 处 / 9 类），按类别统一处理。
 * 消息气泡与输入卡不在此列 —— 它们的边由 glass.ts 的玻璃体系管，动了会破相。
 */

/* 顶部标题栏下沿：跟侧栏右缘同一套做法 —— box-shadow 往外投的辉光，
 * 不是伪元素画的带。
 *
 * 为什么不用 ::after：伪元素被自身盒子裁在里面，渐变最浓的一端就是一条
 * 硬边（实拍 y=58 处 207→189 一跳）。box-shadow 的外阴影画在 border-box
 * 之外、由 blur 自然收尾，两头都没有边。offset 与 spread 同量（24/-24）
 * 保证光只往下走，不糊到左右和顶上。
 *
 * ⚠️ 选择器必须是 :has(> [class*="_tabs"])，不能只写 [class*="_header"]。
 * 后者在实际 DOM 里匹配 5 个元素，其中 4 个是**小按钮组**
 * （wSkVaW_headerActions 68px、wSkVaW_headerUtilities 208px、
 *   bhn1Oq_headerActions 60px、_2ctAZa_header 24px），二三十像素高的盒子
 * 挂上 18px 光带就是一小段悬空横带 —— owner 反馈"像被玻璃劈开"
 * （2026-09-10 实拍：药丸组下沿 y=43 一条硬边，色差 191→209）。
 * 而真顶栏 wSkVaW_header 反而没吃到：它自带 ::after 是 0.5px 线，
 * 跟我们 (0,1,0) 平手、后注入者赢。:has() 把特异度提到 (0,2,0)，
 * 既只命中真顶栏，又压得过宿主那条硬线。 */
body[data-bloomglass-variant] [class*="_header"]:has(> [class*="_tabs"]) {
  position: relative;
  border-bottom: 0;
  /* 强度实测定档：45% 时边界跳变 32 级、仍读成一条线；78% 跳变 10 级，
     只剩"上面比下面亮一点"的错觉，这才是分隔而不是分割。 */
  box-shadow: 0 28px 48px -28px color-mix(in oklch, var(--bloom-accent, #6b8f71), transparent 78%);
}
body[data-bloomglass-variant] [class*="_header"]:has(> [class*="_tabs"])::after {
  /* 宿主那条 0.5px 硬线关掉，交给上面的辉光 */
  display: none;
}

/* 描边按钮 → 浅底。新会话 / Session 日志 / 本主题切换器三个长得一样，
   一起处理，免得只改自己的显得突兀 */
body[data-bloomglass-variant] [class*="_newSession"],
body[data-bloomglass-variant] [class*="_sessionLogButton"],
body[data-bloomglass-variant] .dsh-bloom-trigger {
  border-color: transparent;
  background: color-mix(in oklch, var(--bloom-accent, #6b8f71), transparent 92%);
  /* transform + box-shadow 也进 transition：§7 hover 抬升要平滑，不能 snap。
     §7 那边只改属性，不重声明 transition —— 避免重复定义打架 */
  transition:
    background var(--bloom-dur-fast, .16s) var(--bloom-ease, ease),
    transform var(--bloom-dur-fast, .16s) var(--bloom-ease, ease),
    box-shadow var(--bloom-dur-fast, .16s) var(--bloom-ease, ease);
}
body[data-bloomglass-variant] [class*="_newSession"]:hover,
body[data-bloomglass-variant] [class*="_sessionLogButton"]:hover,
body[data-bloomglass-variant] .dsh-bloom-trigger:hover {
  background: color-mix(in oklch, var(--bloom-accent, #6b8f71), transparent 86%);
}

/* 侧栏底部操作区：上边框 → 向上扩散的极淡阴影 */
body[data-bloomglass-variant] [class*="_footerActions"] {
  border-top: 0;
  box-shadow: 0 -6px 10px -8px color-mix(in oklch, var(--bloom-accent, #6b8f71), transparent 78%);
}

/* ═══ 禁用主按钮的图标可读性（2026-09-14 用户实拍「浅色下看不清」）══
 * DSH 禁用主按钮（空输入时的发送键等）的原生做法：fill 压到 10% + 整体再叠
 * opacity .4，但文字/图标仍用「fill 上的前景」label-primary-foreground ——
 * 那个 token 亮色语义就是白（static neutral-bluish-00）。白箭头浮在洗白的
 * 淡染底上，禁用态形同消失（禁用 bloom 样式实测原生同样如此，只是莫兰迪的
 * 淡底把它衬得更明显）。README 挂着 WCAG 徽章，这里修正：禁用态的底已经是
 * 近白的淡染，图标用正文字色（label-primary）才读得清，明暗自适应 ——
 * 暗色下两者同为亮色，行为不变，只有亮色被纠正。 */
body[data-bloomglass-variant] button[class*="_primary"]:disabled {
  color: var(--dsw-alias-label-primary);
}
`;
		//#endregion
		//#region src/client/css/bloom-glass.ts
		/**
		* 氛围层 CSS（v0.4.0）—— 壁纸 + 磨砂玻璃，全部由 body 的 data-* 属性驱动，
		* 默认不生效（data 属性不写就不渲染），关掉即完全回到 v0.3 的纯 Bloom。
		*
		* 壁纸：两个 fixed 层（图 + 压暗纱），z-index:-1 画在 body 背景之上、
		* 应用内容之下；同时必须把 body 自己的氛围渐变和底色清掉，否则会盖住壁纸。
		* 玻璃：只接管「面」级容器（侧栏/气泡/输入卡/菜单/顶栏）——这些容器
		* 已经在 COMPONENT_CSS 里被透明化过背景，这里补半透明底 + backdrop-filter。
		*/
		/**
		* 玻璃层（v0.5.0，主视觉）—— 不再有壁纸/氛围层。
		*
		* 背景即 body 的莫兰迪氛围渐变（见 COMPONENT_CSS 第 1 节，已增强）。
		* 玻璃由三件事读出来，缺一不可：
		*   1. 半透底（透明 60~82%）让氛围渐变的色相透过来；
		*   2. backdrop blur + saturate：面板与背景/内容交界产生霜化；
		*   3. 玻璃边缘——顶部亮高光(inset) + 半透描边 + 柔和深色外辉。
		*
		* 明暗两档透明度：暗色面板更实一点（保亮字可读），亮色更透（玻璃感更足）。
		* 全部用 color-mix(theme token, transparent) 而不是死白/死黑，色相跟着变体走。
		*/
		const GLASS_CSS = `
/* ═══ 落霞流线（v0.9.0，仅 aurora 变体）═══════════════════════════
   用户要的「流线」—— body 背后挂两条斜向渐变丝带，transform 缓慢漂移 +
   blur 软化，做出光帘的视差感。
   用 ::before 而非改 body background 的原因：动 body 的 background-image
   每帧重绘整个 viewport；伪元素独立合成层，transform 走 GPU，便宜得多。
   z-index:-1 + position:fixed —— body 的背景透传规则下，负 z-index 落在根
   堆叠上下文的负层，画在 body 背景之上、应用内容之下。
   颜色走 --bloom-aurora-stream-1/2/3（在 tokens.ts 由 motion 谱混透明得到），
   v0.12.x 起 aurora 换橙黄系，切到该变体时呈现金→橙→珊瑚的晚霞流光，
   其它变体保持原样不显示。 */
body[data-bloomglass-variant="aurora"]::before {
  content: '';
  position: fixed;
  inset: -40%;
  z-index: -1;
  pointer-events: none;
  background-image:
    linear-gradient(115deg,
      transparent 38%, var(--bloom-aurora-stream-1) 50%, transparent 62%),
    linear-gradient(70deg,
      transparent 32%, var(--bloom-aurora-stream-2) 46%, transparent 60%),
    radial-gradient(60% 40% at 50% 60%,
      var(--bloom-aurora-stream-3), transparent 70%);
  background-size: 220% 220%, 260% 240%, 100% 100%;
  background-position: 25% 30%, 80% 15%, 50% 50%;
  background-repeat: no-repeat;
  /* v0.12.1：这层是「脏」的真正来源（owner 2026-09-15）。原来 opacity .6 +
     saturate(1.2) + blur 60px 铺满整个视口 —— 三条金橙渐变糊成一片盖在界面上，
     底色再干净也被这层罩住。saturate 尤其致命：它在已经糊开的大色块上继续加彩度，
     等于把浑浊放大。
     氛围层的作用是「若隐若现的呼吸感」，不是给界面上色：不透明度砍到三分之一，
     去掉饱和增益，blur 加大让边界更软。 */
  filter: blur(76px);
  opacity: 0.2;
  transform: translate3d(0, 0, 0);
  animation: bloom-aurora-drift 28s ease-in-out infinite alternate;
  will-change: transform, background-position;
}
@keyframes bloom-aurora-drift {
  from { transform: translate3d(-2.5%, -1.5%, 0); background-position: 25% 30%, 80% 15%, 50% 50%; }
  to   { transform: translate3d(3%, 2%, 0);      background-position: 65% 55%, 35% 45%, 55% 45%; }
}
@media (prefers-reduced-motion: reduce) {
  body[data-bloomglass-variant="aurora"]::before {
    animation: none !important;
    transform: none !important;
    opacity: 0.4 !important;
  }
}

/* ═══ 顶栏 tab 条：不做玻璃,只留一条发丝底边 ═══════════════════
   这里曾和侧栏/排队条共用「面级玻璃」档位(半透底 + backdrop blur +
   inset 白描边)。但 tab 条只有 27px 高、1400px 宽 —— 那套玻璃在这个尺寸上
   读不出「一块玻璃」,只会变成一条自带底色和白边框的横带,跟下方内容区
   撞出一道突兀的色块边界(用户实拍反馈:「对话和轨迹这里」)。

   玻璃需要面积才成立。窄条带该做的是「分界」而不是「面」,所以只留一条
   morandi 发丝底边,底色完全交给 body 的氛围渐变。 */
body[data-bloomglass-variant] div[class*="_tabs"] {
  background-color: transparent;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  box-shadow: inset 0 -1px 0 var(--bloom-hairline, rgba(146,168,179,0.3));
}

/* ═══ 面级面板（排队条 / 预览 dock）═══════════════════════════════
   面积大，档位「略实」；顶部亮高光 + 深色外辉让它像一块立起来的玻璃。 */
body[data-bloomglass-variant] div[class*="_dock"]:has(> [class*="_preview"]) {
  background-color: color-mix(in oklch, var(--dsw-alias-bg-layer-1, #fff), transparent 82%);
  backdrop-filter: blur(var(--bloom-glass-blur, 24px)) saturate(1.3);
  -webkit-backdrop-filter: blur(var(--bloom-glass-blur, 24px)) saturate(1.3);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.22),
    inset 0 0 0 1px rgba(255,255,255,0.10),
    0 14px 44px -16px rgba(0,0,0,0.22);
}
body[data-ds-dark-theme] div[class*="_dock"]:has(> [class*="_preview"]) {
  background-color: color-mix(in oklch, var(--dsw-alias-bg-layer-1, #101010), transparent 64%);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.10),
    inset 0 0 0 1px rgba(255,255,255,0.05),
    0 16px 48px -18px rgba(0,0,0,0.5);
}

/* ═══ 侧栏玻璃：backdrop-filter 必须走 ::before，绝不能加在 _sidebarCol 自身 ═══
   ⚠️ 这是本项目踩过的最贵的坑，改这块前先读完。

   backdrop-filter（和 transform / filter / perspective / contain / will-change 一样）
   会让元素成为**其 position:fixed 后代的 containing block**。而 DSH 的**设置面板
   挂在侧栏子树里**（_sidebarCol > … > _footArea > _settingsArea > _overlay），
   它的 overlay 是 fixed + inset:0，本来相对视口铺满、panel 800px 居中。

   一旦 _sidebarCol 自己带 backdrop-filter，那个 fixed 就改为相对 280px 宽的侧栏定位：
   遮罩缩到侧栏那一条，panel 被挤成 279px，detail 区 flex 收缩到 18px ——
   于是中文变成逐字竖排。这个「DSH 的 layout bug」从来不是 DSH 的，是我们自己造的，
   而且为它写了 60 行 modal 改造 CSS、来回改了三轮（详见 DEV_NOTES 2026-08-24）。

   伪元素的 backdrop-filter 只作用于伪元素自己，不改变父元素的 containing block
   资格，所以玻璃观感一致、fixed 后代不受影响。

   ⚠️ 第二个坑（修第一个坑时当场踩的）：**不要给侧栏加 isolation: isolate。**
   它确实不创建 containing block，但会创建 **stacking context** —— overlay 的
   z-index:1000 会被困在侧栏内部，而侧栏自身是 z-index:auto，于是设置面板被
   主聊天区的 composer 画在了上面。两个属性伤的是两件不同的事：
     backdrop-filter → containing block（伤 fixed 的**定位基准**）
     isolation        → stacking context（伤 fixed 的**层叠顺序**）
   所以这里只用 position:relative + z-index:-1：伪元素落在 root 层叠上下文里、
   body 氛围渐变之上、所有正常流内容之下，玻璃该模糊的背景一点没变。

   判据（以后加玻璃时对每个目标问一遍）：
   「这个元素的子树里有 position:fixed 的东西吗？」有 → 玻璃必须走 ::before，
   且不得引入 isolation / transform / filter / contain / will-change。
   输入卡的 conversation.input.overlay 槽也会注入 fixed 元素（如 dsh-convmap），
   必须遵守同一判据，不能把滤镜放回卡片本体（issue #15）。 */
body[data-bloomglass-variant] [class*="_sidebarCol"] {
  position: relative;
  /* v0.10.x：之前 transparent !important 让侧栏和 body 完全同色，没有容器感。
     改成带 accent tint 的底色 —— 6% accent 混进 bg-layer-1，肉眼能看出
     "这块区域有自己的颜色"，但又不至于抢内容。 */
  background-color: color-mix(in oklch, var(--bloom-accent, #6b8f71), var(--dsw-alias-bg-layer-1, #fff) 94%);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.22),
    inset 0 0 0 1px rgba(255,255,255,0.10),
    /* 右缘冷光必须走 box-shadow：侧栏 overflow:hidden，伪元素画的光带只能落在
       容器内侧，看上去是「向内发光」（owner 2026-09-10 反馈）；外阴影不受自身
       overflow 裁剪，是唯一真正往外散的做法。offset 与 spread 同量（24/-24），
       让光只出现在右侧，不糊到上下边。 */
    24px 0 40px -24px color-mix(in oklch, var(--bloom-accent, #6b8f71), transparent 45%),
    0 14px 44px -16px rgba(0,0,0,0.22);
}
body[data-bloomglass-variant] [class*="_sidebarCol"]::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  /* 玻璃层也带一点 accent tint —— 和上面的底色呼应 */
  background-color: color-mix(in oklch, var(--bloom-accent, #6b8f71), var(--dsw-alias-bg-layer-1, #fff) 88%);
  backdrop-filter: blur(var(--bloom-glass-blur, 24px)) saturate(1.3);
  -webkit-backdrop-filter: blur(var(--bloom-glass-blur, 24px)) saturate(1.3);
}
body[data-ds-dark-theme] [class*="_sidebarCol"] {
  background-color: color-mix(in oklch, var(--bloom-accent, #6b8f71), var(--dsw-alias-bg-layer-1, #101010) 92%);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.10),
    inset 0 0 0 1px rgba(255,255,255,0.05),
    24px 0 40px -24px color-mix(in oklch, var(--bloom-accent, #6b8f71), transparent 35%),
    0 16px 48px -18px rgba(0,0,0,0.5);
}
body[data-ds-dark-theme] [class*="_sidebarCol"]::before {
  background-color: color-mix(in oklch, var(--bloom-accent, #6b8f71), var(--dsw-alias-bg-layer-1, #101010) 82%);
}

/* v0.6.2: 「对话 / 轨迹」tab 字号上限保护 —— 用户在窄屏 / 浏览器 zoom>100% 下
   反馈 tab 视觉上被放大、撑得过宽。DSH 原生 tab 是 wSkVaW_tab（默认 13px），
   这里兜底 clamp 到 14px，避免任何状态下字号异常撑开。 */
div[class*="_tabs"] button[class*="_tab"],
div[class*="_tabs"] [class*="_tab"] {
  font-size: clamp(13px, 0.9vw, 14px) !important;
  font-weight: 500 !important;
  letter-spacing: normal !important;
  white-space: nowrap !important;
}

/* ═══ 输入卡片（主角）—— 最清晰的一块玻璃，focus 时玻璃边缘点亮 ═══
   v0.9.0: 用户反馈边框「粗粗的」——
     原因不是 1px hairline 本身粗，而是 COMPONENT_CSS 给的 border: 1px solid var(--bloom-hairline)
     又叠了 GLASS_CSS 的 inset 0 0 0 1px rgba(255,255,255,...) 内白圈，
     1px 外框 + 1px 内圈 = 视觉上等于 2px 的厚边框；focus-within 再加 3px 的
     --bloom-glow 光环就更肥。
   修复：去掉 inset 0 0 0 1px 那圈内白线，只保留顶部 1px 高光（玻璃边沿）
     和外阴影；focus 环 3px -> 2px，颜色用 accent x 25% 收敛到主题色相，
     远看像一根细线而不是一圈光晕。border 本身仍走 COMPONENT_CSS 的 hairline。 */
body[data-bloomglass-variant] div[class*="_composer"] div[class*="_card"] {
  position: relative;
  background-color: transparent;
  /* v0.10.x（owner 反馈「没层次感」）：阴影只完成"功能"没完成"戏剧"。
     单层远影 + 顶部内高光只是让卡片不和背景撞色，不让卡片"提起来"。
     三层叠：① 顶部内高光（光从上方来）；② 紧贴的硬短影（贴着卡边的
     0.5px 影，像把卡片按下去一点弹回来的感觉）；③ 远散的长距柔影
     （把卡片安放在画布上）；④ 主题色 tint 外晕（"这张卡属于这里"——
     莫兰迪主题自己的颜色，不是死的灰黑阴影）。 */
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.28),
    0 1px 2px -1px rgba(0, 0, 0, 0.18),
    0 18px 52px -20px rgba(0,0,0,0.26),
    /* 外晕浓度由 --bloom-halo 驱动（component.ts §7 的呼吸动画在推它）：
       halo=0.73 时等于原来的 78%，0.3 时淡到 91%，0.85 时浓到 74.5%。 */
    0 0 48px -16px color-mix(in oklch, var(--bloom-accent, #6b8f71), transparent calc(100% - var(--bloom-halo, 0.73) * 30%));
}
body[data-bloomglass-variant] div[class*="_composer"] div[class*="_card"]::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  border-radius: inherit;
  background-color: color-mix(in oklch, var(--dsw-alias-bg-layer-1, #fff), transparent 84%);
  backdrop-filter: blur(var(--bloom-glass-blur, 24px)) saturate(1.35);
  -webkit-backdrop-filter: blur(var(--bloom-glass-blur, 24px)) saturate(1.35);
}
body[data-ds-dark-theme] div[class*="_composer"] div[class*="_card"] {
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.12),
    0 1px 2px -1px rgba(0, 0, 0, 0.5),
    0 20px 56px -22px rgba(0,0,0,0.55),
    0 0 64px -20px color-mix(in oklch, var(--bloom-accent, #6b8f71), transparent calc(100% - var(--bloom-halo, 0.7) * 40%));
}
body[data-ds-dark-theme] div[class*="_composer"] div[class*="_card"]::before {
  background-color: color-mix(in oklch, var(--dsw-alias-bg-layer-1, #101010), transparent 66%);
}
body[data-bloomglass-variant] div[class*="_composer"] div[class*="_card"]:focus-within {
  border-color: var(--bloom-hairline-strong);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.3),
    0 1px 2px -1px rgba(0, 0, 0, 0.18),
    0 0 0 2px color-mix(in oklch, var(--bloom-accent) 25%, transparent),
    0 18px 52px -20px rgba(0,0,0,0.26),
    0 0 56px -16px color-mix(in oklch, var(--bloom-accent, #6b8f71), transparent 74%);
}
body[data-ds-dark-theme] div[class*="_composer"] div[class*="_card"]:focus-within {
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.14),
    0 1px 2px -1px rgba(0, 0, 0, 0.5),
    0 0 0 2px color-mix(in oklch, var(--bloom-accent) 28%, transparent),
    0 20px 56px -22px rgba(0,0,0,0.55),
    0 0 72px -20px color-mix(in oklch, var(--bloom-accent, #6b8f71), transparent 68%);
}

/* ═══ 消息气泡 —— 柔和玻璃，近距淡影，不压内容 ═══
   ⚠️ 必须限定 div（2026-09-14 用户实拍「浅色下提示看不清」）：
   DSH 的全局 Tooltip 与消息气泡共用「_bubble」语义类名（_bubble_1nw3t_1，span）。
   裸 [class*="_bubble"] 会把 tooltip 的深底 var(--dsw-alias-tooltip-bg) 盖成
   22% 透明度的近白玻璃，而 tooltip 文字是 static 白（--dsw-static-neutral-bluish-00）
   —— 白字白底，实测对比度 1.0。消息气泡是 div、tooltip 是 span，限定标签即分开；
   tooltip 的底色由 tokens.ts 接管的 --dsw-alias-tooltip-bg（深底）自动跟随主题。 */
body[data-bloomglass-variant] div[class*="_bubble"] {
  background-color: color-mix(in oklch, var(--dsw-alias-bg-layer-1, #fff), transparent 78%);
  backdrop-filter: blur(var(--bloom-glass-blur, 24px)) saturate(1.25);
  -webkit-backdrop-filter: blur(var(--bloom-glass-blur, 24px)) saturate(1.25);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.16),
    inset 0 0 0 1px rgba(255,255,255,0.08),
    0 6px 24px -10px rgba(0,0,0,0.14);
}
body[data-ds-dark-theme] div[class*="_bubble"] {
  background-color: color-mix(in oklch, var(--dsw-alias-bg-layer-1, #101010), transparent 62%);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.08),
    inset 0 0 0 1px rgba(255,255,255,0.04),
    0 8px 28px -12px rgba(0,0,0,0.4);
}

/* ═══ 下拉/选择器（覆盖型）—— blur 在这里真正可见 ═══ */
/* v0.6.0 patch: 暗色版从 transparent 52% → 12%（48% → 88% 不透明）。
   v0.6.0 早期设到 22%（78% 不透明）已被 verify 证伪：青金/冷色调 + 亮色聊天内容
   透字仍明显（用户截图「字竖排的 layout bug」整段透出）。现在跟 Bloom 自己的
   下拉（transparent 12%）一致。*/
body[data-bloomglass-variant] [class*="_menu"],
body[data-bloomglass-variant] [class*="_selector"] {
  background-color: color-mix(in oklch, var(--dsw-alias-bg-layer-2, #fff), transparent 20%);
  backdrop-filter: blur(28px) saturate(1.4);
  -webkit-backdrop-filter: blur(28px) saturate(1.4);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.22),
    inset 0 0 0 1px rgba(255,255,255,0.12),
    0 20px 56px -18px rgba(0,0,0,0.3);
}
body[data-ds-dark-theme] [class*="_menu"],
body[data-ds-dark-theme] [class*="_selector"] {
  background-color: color-mix(in oklch, var(--dsw-alias-bg-layer-2, #101010), transparent 12%);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.1),
    inset 0 0 0 1px rgba(255,255,255,0.05),
    0 24px 64px -20px rgba(0,0,0,0.6);
}

/* ═══ 设置面板：无需任何覆盖 ═══
   这里曾经有 60 行把「279px 窄 drawer」改造成居中 modal 的 CSS，前后改了三轮
   （v0.6.0 修 → v0.6.1 以「不覆盖 DSH 原生 layout」回滚并记为「去官方提 issue」
   → 又改回来）。三轮都白做，因为**前提是错的**：

   实测（2026-08-24，摘掉 Bloom 样式后量的）DSH 原生设置面板本来就是
   800×800 的居中 modal，x=464=(1728-800)/2 精确居中，中文描述 383~398px 正常横排。
   **DSH 没有这个 bug。** 那个「窄 drawer + 中文逐字竖排」是 Bloom 自己造成的回归 ——
   见上方 _sidebarCol 的 ::before 注释：侧栏的 backdrop-filter 把设置面板 overlay
   的 fixed containing block 从视口换成了 280px 的侧栏。

   修根因（玻璃移到伪元素）之后，**布局上**这里一行 CSS 都不需要。

   ── 唯一的例外是下面这条，它改的是颜色而不是布局 ── */

/* DSH 拿**前景色 token 当边框色**用的地方（第二例）。设置面板 Agent 预设的
   选中卡片写的是 border-color: var(--dsw-alias-label-primary) —— 那是正文文字色，
   Bloom 在暗色下给它 oklch(0.96 …) 近白，于是选中卡围了一圈刺眼白边。
   选中态本该是主题色。hover 态同样拿 label-dimmed 当边框，一并换成发丝线。 */
body[data-bloomglass-variant] [class*="_cardActive"] {
  border-color: var(--bloom-accent);
}
body[data-bloomglass-variant] [class*="_card"]:hover:not([class*="_cardActive"]) {
  border-color: var(--bloom-hairline-strong);
}

/* 「浅色 / 深色 / 跟随系统」选中态的边框：DSH 用 --dsw-static-neutral-bluish-400
   （#adb2b8）画它。那是 static 层的中性灰阶 —— 绕过了 alias 层，主题的
   --dsw-alias-border-* 改不到它，于是在莫兰迪暗底上留下一圈刺眼的灰白边
   （用户实拍反馈「白色边框很突兀」，而且只有选中那一个特别亮）。

   选中态本该是主题色，这里按 accent 接管。并且**不**整体覆盖
   --dsw-static-neutral-bluish-400 —— static 是 DSH 的基础色阶，全局改会波及
   大量无关组件；只在这个具体组件上纠正，影响面可控。 */
body[data-bloomglass-variant] button[class*="_themeCube"][class*="_selected"] {
  border-color: var(--bloom-accent);
}

body[data-bloomglass-variant] .md-code-block,
body[data-bloomglass-variant] [class*="_tableScroll"] {
  background-color: color-mix(in oklch, var(--dsw-alias-bg-layer-1, #fff), transparent 70%);
  backdrop-filter: blur(var(--bloom-glass-blur, 24px)) saturate(1.2);
  -webkit-backdrop-filter: blur(var(--bloom-glass-blur, 24px)) saturate(1.2);
}
body[data-ds-dark-theme] .md-code-block,
body[data-ds-dark-theme] [class*="_tableScroll"] {
  background-color: color-mix(in oklch, var(--dsw-alias-bg-layer-1, #101010), transparent 56%);
}
body[data-bloomglass-variant] .md-code-block pre,
body[data-bloomglass-variant] .md-code-block code { background: transparent; }

/* ═══ 表格内部分隔线加强（v0.9.0）用户截图反馈列线几乎不可见 ═══
   原 CSS 用 var(--bloom-hairline)（莫兰迪 30% alpha）做列分隔，
   在深色氛围渐变上几乎消失，看起来像没线的「列表」。提到
   hairline-strong（55% alpha）并给 thead 加一档淡底，列与行都立起来。 */
body[data-bloomglass-variant] [class*="_tableScroll"] th,
body[data-bloomglass-variant] [class*="_tableScroll"] td {
  border-color: var(--bloom-hairline-strong);
}
[class*="_tableScroll"] thead th {
  background: rgba(var(--bloom-morandi), 0.10);
}
body[data-ds-dark-theme] [class*="_tableScroll"] thead th {
  background: rgba(var(--bloom-morandi), 0.08);
}
[class*="_tableScroll"] tbody tr:nth-child(even) td {
  background: rgba(var(--bloom-morandi), 0.03);
}
body[data-ds-dark-theme] [class*="_tableScroll"] tbody tr:nth-child(even) td {
  background: rgba(var(--bloom-morandi), 0.04);
}
`;
		//#endregion
		//#region src/client/css/palette-css.ts
		/**
		* Styles for the palette picker — the one part of the settings panel that is
		* new in the merge, so it lives apart from the ported `SETTINGS_CSS`.
		*
		* Every colour is read from the live theme, so the picker re-tints itself as
		* soon as a palette is chosen.
		*/
		const PALETTE_CSS = `
.fw-palette {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
  gap: 8px;
  min-width: 0;
}
.fw-palette-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.12));
  background: transparent;
  cursor: pointer;
  text-align: left;
  font: inherit;
  transition: border-color 0.16s ease, background-color 0.16s ease;
}
.fw-palette-item:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.04));
}
.fw-palette-item[aria-selected='true'] {
  border-color: var(--bloom-accent, #6b8f71);
  background: color-mix(in oklch, var(--bloom-accent, #6b8f71), transparent 91%);
}
.fw-palette-item:focus-visible {
  outline: 2px solid var(--bloom-accent, #6b8f71);
  outline-offset: 2px;
}
.fw-palette-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex: none;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.14);
}
.fw-palette-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.fw-palette-name {
  font-size: 13px;
  line-height: 1.3;
  color: var(--dsw-alias-label-primary);
}
.fw-palette-poem {
  font-size: 11px;
  line-height: 1.3;
  color: var(--dsw-alias-label-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.fw-subhead {
  font-size: 12px;
  font-weight: 600;
  color: var(--dsw-alias-label-secondary);
  margin: 2px 0 -4px;
}
`.trim();
		//#endregion
		//#region src/client/image.ts
		/** Build a Blob for object URLs, keeping the original encoded type. */
		function wallpaperBlob(record) {
			const type = ALLOWED_TYPES.includes(record.mime) ? record.mime : "image/jpeg";
			return new Blob([Uint8Array.from(record.bytes)], { type });
		}
		var ImageValidationError = class extends Error {
			name = "ImageValidationError";
		};
		const MAGIC = [
			{
				mime: "image/jpeg",
				test: (b) => b[0] === 255 && b[1] === 216 && b[2] === 255
			},
			{
				mime: "image/png",
				test: (b) => b[0] === 137 && b[1] === 80 && b[2] === 78 && b[3] === 71
			},
			{
				mime: "image/gif",
				test: (b) => b[0] === 71 && b[1] === 73 && b[2] === 70 && b[3] === 56
			},
			{
				mime: "image/webp",
				test: (b) => b[0] === 82 && b[1] === 73 && b[2] === 70 && b[3] === 70 && b[8] === 87 && b[9] === 69 && b[10] === 66 && b[11] === 80
			}
		];
		function normalizeImageType(type) {
			if (type === "image/jpg") return "image/jpeg";
			return ALLOWED_TYPES.find((allowed) => allowed === type);
		}
		/**
		* Reject files that are not a supported image. Size is intentionally unbounded.
		* @param file - browser File from an <input> or drop.
		*/
		function assertImageFile(file) {
			if (file.size <= 0) throw new ImageValidationError("empty image");
			if (file.type !== "" && normalizeImageType(file.type) === void 0) throw new ImageValidationError(`unsupported type: ${file.type}`);
		}
		/** Confirm the file header matches a declared or inferred image type. */
		async function assertImageMagic(file) {
			const header = new Uint8Array(await readFileBytes(file.slice(0, 16)));
			const declared = normalizeImageType(file.type);
			const match = MAGIC.find((entry) => entry.test(header));
			if (match === void 0) throw new ImageValidationError(`unsupported type: ${file.type || "unknown"}`);
			if (declared !== void 0 && declared !== match.mime) throw new ImageValidationError(`unsupported type: ${file.type}`);
			return match.mime;
		}
		/** Read width/height from the container when the header is well-formed. */
		function readImageSize(bytes) {
			if (bytes.length >= 24 && MAGIC[1].test(bytes)) return {
				width: readU32(bytes, 16),
				height: readU32(bytes, 20)
			};
			if (bytes.length >= 10 && MAGIC[2].test(bytes)) return {
				width: bytes[6] | bytes[7] << 8,
				height: bytes[8] | bytes[9] << 8
			};
			if (bytes.length >= 30 && MAGIC[3].test(bytes)) return readWebpSize(bytes);
			if (bytes.length >= 4 && MAGIC[0].test(bytes)) return readJpegSize(bytes);
		}
		/** Accept a record that came back from IndexedDB. */
		function sanitizeWallpaperRecord(raw) {
			if (raw === null || typeof raw !== "object") return void 0;
			const value = raw;
			if (!Array.isArray(value.bytes) || value.bytes.length < 1) return void 0;
			const mime = normalizeImageType(String(value.mime ?? "")) ?? "image/jpeg";
			const width = Number(value.width);
			const height = Number(value.height);
			return {
				bytes: value.bytes.map((item) => Number(item) & 255),
				mime,
				name: typeof value.name === "string" ? value.name : "wallpaper",
				width: Number.isFinite(width) && width > 0 ? width : 0,
				height: Number.isFinite(height) && height > 0 ? height : 0,
				updatedAt: Number(value.updatedAt) || 0
			};
		}
		/**
		* Keep the original encoded image. No resize and no byte cap.
		*/
		async function prepareWallpaper(file) {
			assertImageFile(file);
			const mime = await assertImageMagic(file);
			const source = new Uint8Array(await readFileBytes(file));
			const declared = readImageSize(source);
			return {
				bytes: Array.from(source),
				mime,
				name: file.name,
				width: declared?.width ?? 0,
				height: declared?.height ?? 0,
				updatedAt: Date.now()
			};
		}
		function readU32(bytes, offset) {
			return (bytes[offset] << 24 | bytes[offset + 1] << 16 | bytes[offset + 2] << 8 | bytes[offset + 3]) >>> 0;
		}
		function readWebpSize(bytes) {
			const fourcc = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);
			if (fourcc === "VP8X" && bytes.length >= 30) return {
				width: 1 + (bytes[24] | bytes[25] << 8 | bytes[26] << 16),
				height: 1 + (bytes[27] | bytes[28] << 8 | bytes[29] << 16)
			};
			if (fourcc === "VP8 " && bytes.length >= 30 && bytes[23] === 157 && bytes[24] === 1 && bytes[25] === 42) return {
				width: (bytes[26] | bytes[27] << 8) & 16383,
				height: (bytes[28] | bytes[29] << 8) & 16383
			};
			if (fourcc === "VP8L" && bytes.length >= 25 && bytes[20] === 47) {
				const bits = bytes[21] | bytes[22] << 8 | bytes[23] << 16 | bytes[24] << 24;
				return {
					width: (bits & 16383) + 1,
					height: (bits >> 14 & 16383) + 1
				};
			}
		}
		function readJpegSize(bytes) {
			let offset = 2;
			while (offset + 8 < bytes.length) {
				if (bytes[offset] !== 255) return void 0;
				const marker = bytes[offset + 1];
				offset += 2;
				if (marker === 216 || marker === 217 || marker >= 208 && marker <= 215) continue;
				const length = bytes[offset] << 8 | bytes[offset + 1];
				if (length < 2) return void 0;
				if (marker >= 192 && marker <= 207 && marker !== 196 && marker !== 200 && marker !== 204) return {
					height: bytes[offset + 3] << 8 | bytes[offset + 4],
					width: bytes[offset + 5] << 8 | bytes[offset + 6]
				};
				offset += length;
			}
		}
		function readFileBytes(file) {
			if (typeof file.arrayBuffer === "function") return file.arrayBuffer();
			return new Promise((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = () => {
					resolve(reader.result);
				};
				reader.onerror = () => {
					reject(reader.error ?? /* @__PURE__ */ new Error("failed to read image"));
				};
				reader.readAsArrayBuffer(file);
			});
		}
		//#endregion
		//#region src/client/image-store.ts
		/**
		* Open the IndexedDB-backed store. The database is created on first use.
		*
		* A wallpaper saved by dsh-frosted-window is adopted on first read, so moving
		* to the merged plugin does not lose the user's image. The legacy database is
		* never written to and never created: we only look inside it if IndexedDB
		* reports that it already exists.
		*/
		function openImageStore() {
			return {
				get: async () => {
					const stored = await withStore(IMAGE_DB, "readonly", (store) => requestToPromise(store.get(IMAGE_KEY)));
					if (stored !== void 0) return hydrate(stored);
					return hydrate(await readLegacy$1());
				},
				put: (record) => withStore(IMAGE_DB, "readwrite", (store) => requestToPromise(store.put({
					bytes: record.bytes,
					mime: record.mime,
					name: record.name,
					width: record.width,
					height: record.height,
					updatedAt: record.updatedAt
				}, IMAGE_KEY)).then(() => void 0)),
				clear: () => withStore(IMAGE_DB, "readwrite", (store) => requestToPromise(store.delete(IMAGE_KEY)).then(() => void 0))
			};
		}
		/** Read the predecessor plugin's wallpaper, if that database exists. */
		async function readLegacy$1() {
			if (typeof indexedDB.databases !== "function") return void 0;
			try {
				if (!(await indexedDB.databases()).some((entry) => entry.name === "dsh-frosted-window")) return void 0;
				return await withStore(LEGACY_IMAGE_DB, "readonly", (store) => requestToPromise(store.get(IMAGE_KEY)));
			} catch {
				return;
			}
		}
		function hydrate(stored) {
			return sanitizeWallpaperRecord(stored);
		}
		async function withStore(database, mode, use) {
			const db = await openDb(database);
			try {
				const tx = db.transaction(IMAGE_STORE, mode);
				const result = await use(tx.objectStore(IMAGE_STORE));
				await txDone(tx);
				return result;
			} finally {
				db.close();
			}
		}
		function openDb(database) {
			return new Promise((resolve, reject) => {
				const req = indexedDB.open(database, 1);
				req.onupgradeneeded = () => {
					if (!req.result.objectStoreNames.contains("files")) req.result.createObjectStore(IMAGE_STORE);
				};
				req.onsuccess = () => {
					resolve(req.result);
				};
				req.onerror = () => {
					reject(req.error ?? /* @__PURE__ */ new Error("indexedDB open failed"));
				};
			});
		}
		function requestToPromise(req) {
			return new Promise((resolve, reject) => {
				req.onsuccess = () => {
					resolve(req.result);
				};
				req.onerror = () => {
					reject(req.error ?? /* @__PURE__ */ new Error("indexedDB request failed"));
				};
			});
		}
		function txDone(tx) {
			return new Promise((resolve, reject) => {
				tx.oncomplete = () => {
					resolve();
				};
				tx.onerror = () => {
					reject(tx.error ?? /* @__PURE__ */ new Error("indexedDB transaction failed"));
				};
				tx.onabort = () => {
					reject(tx.error ?? /* @__PURE__ */ new Error("indexedDB transaction aborted"));
				};
			});
		}
		//#endregion
		//#region src/client/palette.ts
		/**
		* 10 套莫兰迪配色的色板与标签 —— 纯数据 + 一个色彩工具函数，不 import 任何东西。
		*
		* **双轨制不能退回单轨**（见 CONTRIBUTING「改配色时注意」）：
		*   accentL / accentD  可读轨 —— 文字、按钮填充、边框，必须过 WCAG AA
		*   morandi            气质轨 —— 只用于 rgba(morandi, 0.05~0.2) 的大面积氛围渐变、
		*                      冷光细线、边框阶梯（暗色档）
		* 拿可读轨铺大面积、或拿气质轨做文字色，都会失去莫兰迪质感。
		*/
		const VARIANTS = [
			"mist",
			"cinnabar",
			"petal",
			"ripple",
			"sage",
			"stone",
			"lapis",
			"amber",
			"aurora",
			"lavender"
		];
		/** Narrow an unknown value to a palette key, for values read back from storage. */
		function isVariant(value) {
			return typeof value === "string" && VARIANTS.includes(value);
		}
		const PALETTE = {
			mist: {
				accentL: "oklch(50% 0.08 240)",
				accentD: "oklch(72% 0.12 240)",
				morandi: "146, 168, 179",
				bgL: "oklch(96% 0.01 240)",
				bgD: "oklch(28% 0.02 240)",
				txL: "oklch(25% 0.02 240)",
				txD: "oklch(96% 0.01 240)",
				sfL: "oklch(94% 0.01 240)",
				sfD: "oklch(34% 0.02 240)",
				sf2L: "oklch(91% 0.01 240)",
				sf2D: "oklch(40% 0.02 240)",
				motionL: [
					"oklch(50% 0.08 240)",
					"oklch(50% 0.10 210)",
					"oklch(50% 0.09 275)"
				],
				motionD: [
					"oklch(72% 0.12 240)",
					"oklch(74% 0.13 210)",
					"oklch(74% 0.11 275)"
				]
			},
			cinnabar: {
				accentL: "oklch(55% 0.18 25)",
				accentD: "oklch(72% 0.12 25)",
				morandi: "215, 75, 75",
				bgL: "oklch(97% 0.005 25)",
				bgD: "oklch(28% 0.02 25)",
				txL: "oklch(25% 0.02 25)",
				txD: "oklch(96% 0.01 25)",
				sfL: "oklch(95% 0.005 25)",
				sfD: "oklch(34% 0.02 25)",
				sf2L: "oklch(92% 0.005 25)",
				sf2D: "oklch(40% 0.02 25)",
				motionL: [
					"oklch(55% 0.18 25)",
					"oklch(55% 0.16 65)",
					"oklch(55% 0.15 350)"
				],
				motionD: [
					"oklch(72% 0.12 25)",
					"oklch(74% 0.14 65)",
					"oklch(73% 0.13 350)"
				]
			},
			petal: {
				accentL: "oklch(58% 0.22 350)",
				accentD: "oklch(75% 0.18 350)",
				morandi: "232, 133, 155",
				bgL: "oklch(98% 0.01 350)",
				bgD: "oklch(28% 0.02 350)",
				txL: "oklch(25% 0.02 354)",
				txD: "oklch(98% 0.01 350)",
				sfL: "oklch(96% 0.015 350)",
				sfD: "oklch(34% 0.02 350)",
				sf2L: "oklch(94% 0.015 350)",
				sf2D: "oklch(40% 0.02 350)",
				motionL: [
					"oklch(58% 0.22 350)",
					"oklch(58% 0.17 310)",
					"oklch(58% 0.17 20)"
				],
				motionD: [
					"oklch(75% 0.18 350)",
					"oklch(75% 0.14 310)",
					"oklch(76% 0.14 20)"
				]
			},
			ripple: {
				accentL: "oklch(51% 0.12 195)",
				accentD: "oklch(75% 0.12 195)",
				morandi: "95, 168, 178",
				bgL: "oklch(96% 0.01 195)",
				bgD: "oklch(20% 0.02 195)",
				txL: "oklch(25% 0.02 195)",
				txD: "oklch(96% 0.01 195)",
				sfL: "oklch(94% 0.01 195)",
				sfD: "oklch(28% 0.02 195)",
				sf2L: "oklch(92% 0.01 195)",
				sf2D: "oklch(38% 0.02 195)",
				motionL: [
					"oklch(51% 0.12 195)",
					"oklch(51% 0.13 225)",
					"oklch(51% 0.11 165)"
				],
				motionD: [
					"oklch(75% 0.12 195)",
					"oklch(76% 0.14 225)",
					"oklch(77% 0.12 165)"
				]
			},
			sage: {
				accentL: "oklch(54.1% 0.111 115)",
				accentD: "oklch(71.9% 0.120 115)",
				morandi: "138, 154, 91",
				bgL: "oklch(97% 0.011 112)",
				bgD: "oklch(20% 0.019 113)",
				txL: "oklch(25% 0.02 116)",
				txD: "oklch(96% 0.011 118)",
				sfL: "oklch(94.9% 0.009 113)",
				sfD: "oklch(27.9% 0.02 116)",
				sf2L: "oklch(91.9% 0.009 113)",
				sf2D: "oklch(34% 0.03 116)",
				motionL: [
					"oklch(54.1% 0.111 115)",
					"oklch(54.1% 0.12 83)",
					"oklch(54.1% 0.10 152)"
				],
				motionD: [
					"oklch(71.9% 0.120 115)",
					"oklch(71.9% 0.13 83)",
					"oklch(71.9% 0.11 152)"
				]
			},
			stone: {
				accentL: "oklch(49.9% 0.06 29)",
				accentD: "oklch(75% 0.12 30)",
				morandi: "180, 160, 155",
				bgL: "oklch(95.9% 0.01 25)",
				bgD: "oklch(20.1% 0.019 30)",
				txL: "oklch(25% 0.02 29)",
				txD: "oklch(95.9% 0.01 25)",
				sfL: "oklch(94.1% 0.01 33)",
				sfD: "oklch(27.9% 0.02 28)",
				sf2L: "oklch(91% 0.01 33)",
				sf2D: "oklch(33.9% 0.03 28)",
				motionL: [
					"oklch(49.9% 0.06 29)",
					"oklch(49.9% 0.075 0)",
					"oklch(49.9% 0.07 60)"
				],
				motionD: [
					"oklch(75% 0.12 30)",
					"oklch(75% 0.13 0)",
					"oklch(75% 0.11 62)"
				]
			},
			lapis: {
				accentL: "oklch(50% 0.13 258)",
				accentD: "oklch(74% 0.10 255)",
				morandi: "47, 98, 172",
				bgL: "oklch(97.4% 0.006 240)",
				bgD: "oklch(23.1% 0.019 249)",
				txL: "oklch(23% 0.02 249)",
				txD: "oklch(96.1% 0.008 237)",
				sfL: "oklch(95.6% 0.008 242)",
				sfD: "oklch(30.1% 0.022 251)",
				sf2L: "oklch(92.4% 0.013 244)",
				sf2D: "oklch(35.9% 0.025 251)",
				motionL: [
					"oklch(50% 0.13 258)",
					"oklch(50% 0.12 226)",
					"oklch(50% 0.11 295)"
				],
				motionD: [
					"oklch(74% 0.10 255)",
					"oklch(74% 0.11 225)",
					"oklch(74% 0.10 292)"
				]
			},
			amber: {
				accentL: "oklch(55.5% 0.12 70)",
				accentD: "oklch(78% 0.11 70)",
				morandi: "159, 100, 1",
				bgL: "oklch(97.5% 0.008 74)",
				bgD: "oklch(26% 0.018 60)",
				txL: "oklch(24% 0.02 74)",
				txD: "oklch(95% 0.008 70)",
				sfL: "oklch(95.6% 0.01 82)",
				sfD: "oklch(32% 0.020 60)",
				sf2L: "oklch(93% 0.014 78)",
				sf2D: "oklch(38% 0.022 60)",
				motionL: [
					"oklch(55.5% 0.12 70)",
					"oklch(55.5% 0.11 38)",
					"oklch(55.5% 0.12 100)"
				],
				motionD: [
					"oklch(78% 0.11 70)",
					"oklch(78% 0.12 38)",
					"oklch(78% 0.11 100)"
				]
			},
			aurora: {
				accentL: "oklch(55% 0.145 72)",
				accentD: "oklch(80% 0.13 72)",
				morandi: "218, 158, 72",
				bgL: "oklch(98% 0.004 72)",
				bgD: "oklch(24.5% 0.008 70)",
				txL: "oklch(24% 0.012 72)",
				txD: "oklch(95% 0.005 72)",
				sfL: "oklch(96.2% 0.005 72)",
				sfD: "oklch(30.5% 0.01 70)",
				sf2L: "oklch(93.4% 0.007 72)",
				sf2D: "oklch(36.5% 0.012 70)",
				motionL: [
					"oklch(55% 0.145 72)",
					"oklch(56% 0.15 50)",
					"oklch(56% 0.13 32)"
				],
				motionD: [
					"oklch(80% 0.13 72)",
					"oklch(80% 0.14 50)",
					"oklch(80% 0.12 32)"
				]
			},
			lavender: {
				accentL: "oklch(52% 0.11 295)",
				accentD: "oklch(75% 0.11 295)",
				morandi: "164, 148, 190",
				bgL: "oklch(97% 0.012 295)",
				bgD: "oklch(26% 0.02 295)",
				txL: "oklch(25% 0.02 295)",
				txD: "oklch(96% 0.012 295)",
				sfL: "oklch(95% 0.014 295)",
				sfD: "oklch(32% 0.022 295)",
				sf2L: "oklch(92.5% 0.016 295)",
				sf2D: "oklch(38% 0.024 295)",
				motionL: [
					"oklch(52% 0.11 295)",
					"oklch(52% 0.10 265)",
					"oklch(53% 0.12 325)"
				],
				motionD: [
					"oklch(75% 0.11 295)",
					"oklch(75% 0.11 265)",
					"oklch(76% 0.12 325)"
				]
			}
		};
		const VARIANT_LABELS = {
			mist: {
				zh: "黛蓝",
				en: "Mist",
				poem: "山色有无中"
			},
			cinnabar: {
				zh: "朱砂",
				en: "Cinnabar",
				poem: "日出江花红胜火"
			},
			petal: {
				zh: "桃夭",
				en: "Petal",
				poem: "灼灼其华"
			},
			ripple: {
				zh: "天青",
				en: "Ripple",
				poem: "雨过天青云破处"
			},
			sage: {
				zh: "竹青",
				en: "Sage",
				poem: "绿竹猗猗"
			},
			stone: {
				zh: "赭石",
				en: "Stone",
				poem: "秋山敛余照"
			},
			lapis: {
				zh: "青金",
				en: "Lapis",
				poem: "碧海青天夜夜心"
			},
			amber: {
				zh: "琥珀",
				en: "Amber",
				poem: "玉碗盛来琥珀光"
			},
			aurora: {
				zh: "落霞",
				en: "Afterglow",
				poem: "落霞与孤鹜齐飞"
			},
			lavender: {
				zh: "青莲",
				en: "Lavender",
				poem: "清水出芙蓉"
			}
		};
		/** oklch 混透明度的简写（在 oklch 空间里混合，色相/彩度不漂移） */
		const mix = (c, p) => `color-mix(in oklch, ${c}, transparent ${p}%)`;
		//#endregion
		//#region src/client/knobs.ts
		/**
		* User-tunable knobs — one record now covers both halves of the merge.
		*
		* The palette key (Bloom) and the glass / wallpaper numbers (Frosted) live
		* together because they are saved together: a theme is the pair of them.
		* Image bytes never live here — those go to IndexedDB.
		*/
		const DEFAULT_KNOBS = {
			enabled: true,
			variant: "mist",
			glassOpacity: .46,
			blurPx: 28,
			saturate: 1.55,
			dim: .28
		};
		/** Numeric knob bounds, shared by the clamps and the settings sliders. */
		const KNOB_RANGES = {
			glassOpacity: [.18, .82],
			blurPx: [8, 64],
			saturate: [1, 2],
			dim: [0, .65]
		};
		/**
		* Clamp one numeric knob into its published range.
		* @param key - numeric knob name.
		* @param value - raw number.
		*/
		function clampKnob(key, value) {
			const [min, max] = KNOB_RANGES[key];
			if (!Number.isFinite(value)) return DEFAULT_KNOBS[key];
			return Math.min(max, Math.max(min, value));
		}
		/**
		* Normalize a partial / unknown record into a complete knob set.
		* @param raw - persisted JSON or UI draft.
		*/
		function normalizeKnobs(raw) {
			const input = raw !== null && typeof raw === "object" ? raw : {};
			return {
				enabled: input.enabled !== false,
				variant: isVariant(input.variant) ? input.variant : DEFAULT_KNOBS.variant,
				glassOpacity: clampKnob("glassOpacity", Number(input.glassOpacity)),
				blurPx: clampKnob("blurPx", Number(input.blurPx)),
				saturate: clampKnob("saturate", Number(input.saturate)),
				dim: clampKnob("dim", Number(input.dim))
			};
		}
		/**
		* Read the palette and glass numbers the two predecessor plugins persisted,
		* so moving to the merged plugin does not reset a tuned theme.
		*
		* Best-effort: any failure just yields nothing and defaults take over.
		*/
		function readLegacy() {
			const legacy = {};
			try {
				const variant = localStorage.getItem(LEGACY_VARIANT_KEY);
				if (isVariant(variant)) legacy.variant = variant;
			} catch {}
			try {
				const raw = localStorage.getItem(LEGACY_KNOBS_KEY);
				if (raw !== null) Object.assign(legacy, JSON.parse(raw));
			} catch {}
			return legacy;
		}
		/** Read knobs from localStorage; missing or corrupt values become defaults. */
		function loadKnobs() {
			try {
				const raw = localStorage.getItem(KNOBS_KEY);
				if (raw !== null) return normalizeKnobs(JSON.parse(raw));
			} catch {}
			return normalizeKnobs(readLegacy());
		}
		/** Persist a complete knob set. Failures stay local (private mode / quota). */
		function saveKnobs(knobs) {
			try {
				localStorage.setItem(KNOBS_KEY, JSON.stringify(normalizeKnobs(knobs)));
			} catch {}
		}
		//#endregion
		//#region src/client/locales.ts
		/**
		* Settings copy. Chinese is the key-set source of truth.
		*
		* Palette names are not here — they come from `palette.ts`, which carries the
		* Chinese name, the English name, and the source poem for all ten palettes.
		*/
		const zh = {
			nav: "Bloom Glass",
			title: "Bloom Glass 主题",
			description: "十套莫兰迪配色打底，可选一张壁纸铺满窗口、界面以磨砂玻璃叠上去。浅色 / 深色仍跟随官方外观。",
			palette: "配色",
			frost: "壁纸与玻璃",
			enable: "启用壁纸与磨砂",
			drop: "把图片拖到这里，或点击选择",
			dropReplace: "更换图片",
			choose: "选择图片",
			save: "保存",
			saved: "已保存",
			unsaved: "未保存",
			remove: "删除",
			glass: "玻璃浓度",
			blur: "磨砂模糊",
			saturate: "色彩饱和",
			dim: "壁纸压暗",
			busy: "正在读取图片…",
			empty: "还没有壁纸，当前为纯配色模式",
			errorType: "只支持 JPEG、PNG、WebP 或 GIF。",
			errorGeneric: "无法读取这张图片，请换一张再试。"
		};
		const en = {
			nav: "Bloom Glass",
			title: "Bloom Glass theme",
			description: "Ten Morandi palettes underneath, and optionally one wallpaper filling the window with the chrome frosted on top. Light / Dark still follow official appearance.",
			palette: "Palette",
			frost: "Wallpaper & glass",
			enable: "Enable wallpaper and frost",
			drop: "Drop an image here, or click to choose",
			dropReplace: "Replace image",
			choose: "Choose image",
			save: "Save",
			saved: "Saved",
			unsaved: "Unsaved",
			remove: "Delete",
			glass: "Glass",
			blur: "Blur",
			saturate: "Saturation",
			dim: "Dim",
			busy: "Reading image…",
			empty: "No wallpaper yet — palette only",
			errorType: "JPEG, PNG, WebP, or GIF only.",
			errorGeneric: "Could not read that image. Try another file."
		};
		//#endregion
		//#region src/client/SettingsSection.tsx
		/**
		* The single settings page for the merged theme: palette picker on top,
		* wallpaper and glass controls underneath. Replaces Bloom's top-bar switcher
		* and Frosted's panel with one surface.
		* @param props - inject face from apply().
		*/
		function SettingsSection({ store, t, setVariant, setEnabled, setKnob, upload, save, remove }) {
			const state = (0, react.useSyncExternalStore)(store.subscribe, store.get, store.get);
			const inputRef = (0, react.useRef)(null);
			const [over, setOver] = (0, react.useState)(false);
			const onFiles = (files) => {
				if (state.busy) return;
				const file = files?.[0];
				if (file === void 0) return;
				upload(file);
			};
			const pick = () => {
				if (!state.busy) inputRef.current?.click();
			};
			const previewStyle = {
				"--fw-ui-glass": String(state.glassOpacity),
				"--fw-ui-blur": `${state.blurPx}px`,
				"--fw-ui-sat": `${Math.round(state.saturate * 100)}%`
			};
			const meta = [state.fileName, state.width > 0 && state.height > 0 ? `${state.width}×${state.height}` : null].filter(Boolean).join(" · ");
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "fw-section",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "fw-panel",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "fw-head",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "fw-lead",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "fw-kicker",
										children: "Theme"
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "fw-title",
										children: t("title")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "fw-desc",
										children: t("description")
									})
								]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "fw-chip",
								"data-tone": state.dirty ? "warn" : void 0,
								children: state.dirty ? t("unsaved") : t("saved")
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "fw-subhead",
							children: t("palette")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "fw-palette",
							role: "radiogroup",
							"aria-label": t("palette"),
							children: VARIANTS.map((variant) => {
								const label = VARIANT_LABELS[variant];
								const selected = state.variant === variant;
								return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
									type: "button",
									role: "radio",
									"aria-checked": selected,
									"aria-selected": selected,
									className: "fw-palette-item",
									"data-variant": variant,
									onClick: () => {
										setVariant(variant);
									},
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "fw-palette-dot",
										style: { background: PALETTE[variant].accentL }
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: "fw-palette-text",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "fw-palette-name",
											children: label.zh
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "fw-palette-poem",
											children: label.poem
										})]
									})]
								}, variant);
							})
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "fw-subhead",
							children: t("frost")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
							className: "fw-switch",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("enable") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: state.enabled,
								onChange: (event) => {
									setEnabled(event.target.checked);
								}
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "fw-hero",
							style: previewStyle,
							"data-over": over ? "true" : "false",
							"data-has": state.hasImage ? "true" : "false",
							disabled: state.busy,
							onClick: pick,
							onDragOver: (event) => {
								event.preventDefault();
								setOver(true);
							},
							onDragLeave: () => {
								setOver(false);
							},
							onDrop: (event) => {
								event.preventDefault();
								setOver(false);
								onFiles(event.dataTransfer.files);
							},
							children: [
								state.previewUrl !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
									src: state.previewUrl,
									alt: ""
								}) : null,
								state.hasImage ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "fw-hero-glass" }) : null,
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: "fw-hero-copy",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: state.busy ? t("busy") : state.hasImage ? t("dropReplace") : t("drop") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: state.hasImage ? meta || t("dropReplace") : t("empty") })]
								})
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							ref: inputRef,
							className: "fw-hidden",
							type: "file",
							accept: "image/jpeg,image/jpg,image/png,image/webp,image/gif,image/*",
							onChange: (event) => {
								onFiles(event.target.files);
								event.target.value = "";
							}
						}),
						state.error !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "fw-error",
							role: "alert",
							children: state.error
						}) : null,
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "fw-grid",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Slider, {
									label: t("glass"),
									value: state.glassOpacity,
									range: KNOB_RANGES.glassOpacity,
									step: .01,
									display: `${Math.round(state.glassOpacity * 100)}%`,
									onChange: (value) => {
										setKnob("glassOpacity", value);
									}
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Slider, {
									label: t("blur"),
									value: state.blurPx,
									range: KNOB_RANGES.blurPx,
									step: 1,
									display: `${Math.round(state.blurPx)}px`,
									onChange: (value) => {
										setKnob("blurPx", value);
									}
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Slider, {
									label: t("saturate"),
									value: state.saturate,
									range: KNOB_RANGES.saturate,
									step: .01,
									display: `${Math.round(state.saturate * 100)}%`,
									onChange: (value) => {
										setKnob("saturate", value);
									}
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Slider, {
									label: t("dim"),
									value: state.dim,
									range: KNOB_RANGES.dim,
									step: .01,
									display: `${Math.round(state.dim * 100)}%`,
									onChange: (value) => {
										setKnob("dim", value);
									}
								})
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "fw-bar",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "fw-btn",
									"data-kind": "danger",
									disabled: !state.hasImage || state.busy,
									onClick: () => {
										remove();
									},
									children: t("remove")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "fw-btn",
									onClick: pick,
									disabled: state.busy,
									children: t("choose")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "fw-btn",
									"data-kind": "primary",
									disabled: !state.dirty || state.busy,
									onClick: () => {
										save();
									},
									children: t("save")
								})
							]
						})
					]
				})
			});
		}
		function Slider(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
				className: "fw-row",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
					className: "fw-row-head",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: props.label }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: props.display })]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
					type: "range",
					min: props.range[0],
					max: props.range[1],
					step: props.step,
					value: props.value,
					onChange: (event) => {
						props.onChange(Number(event.target.value));
					}
				})]
			});
		}
		//#endregion
		//#region src/client/store.ts
		const INITIAL_STATE = {
			...DEFAULT_KNOBS,
			hasImage: false,
			previewUrl: null,
			fileName: null,
			width: 0,
			height: 0,
			dirty: false,
			busy: false,
			error: null,
			revision: -1
		};
		/** Create an in-memory store for the settings section. */
		function createBloomglassStore(init = INITIAL_STATE) {
			let state = init;
			const listeners = /* @__PURE__ */ new Set();
			return {
				get: () => state,
				set: (next) => {
					state = next;
					for (const listener of listeners) listener();
				},
				subscribe: (listener) => {
					listeners.add(listener);
					return () => {
						listeners.delete(listener);
					};
				}
			};
		}
		//#endregion
		//#region src/client/bloom-tokens.ts
		/**
		* 把色板编译成 CSS 变量 —— 主题的「颜色大脑」。
		*
		* 结构：
		*   bloomTokens       每变体的 --bloom-* 自有 token（质感层的唯一色源 SSOT）
		*   borderStack       border 四档阶梯（暗色必须走 morandi，不能用前景色 mix）
		*   labelStack        次级文字四档（单调递减，两档都过 WCAG AA）
		*   sharedDswTokens   状态色 / 反色 / toast / tooltip（三处共用，防变体漂移）
		*   mistLight/Dark    mist 完整骨架
		*   variantBlock      其余 7 个变体（只覆盖主色 + 背景调，骨架继承 mist）
		*   buildBloomCSS     把上面全部拼成一张样式表
		*
		* 这个文件里的三个 *Stack / sharedDswTokens 函数是**刻意抽出来的**：它们覆盖的
		* token 原本在 mistLight / mistDark / variantBlock 三处各写一遍，漂移过多次
		* （ripple/petal 继承过 mist 的错误值；22 个 token 只在 mist 定义，导致其余
		* 7 个变体回落 DSH 原生值）。详见 DEV_NOTES 2026-08-24。
		*/
		/**
		* Bloom 自有 token —— 三个变体块共用，是所有「质感」CSS 的唯一色源(SSOT)。
		* 有了这层，COMPONENT_CSS 只需写一份、全部引用 var(--bloom-*)，
		* 不必为 4 个变体 × 明暗各抄一遍。
		*
		* --bloom-morandi   气质轨 RGB 三元组，供 rgba() 做低透明度氛围渐变与冷光
		* --bloom-shadow-*  长距柔和阴影三档（原版 typora 的 --shadow-sm/md/lg）
		* --bloom-hairline  冷光细线：极低透明度的莫兰迪色，用于分割线/描边
		* --bloom-glow      冷光辉：描边外侧的微弱扩散，深色下尤其出高级感
		*/
		function bloomTokens(p, dark) {
			const tx = dark ? p.txD : p.txL;
			const m = p.morandi;
			const motion = dark ? p.motionD : p.motionL;
			return `
  --bloom-morandi: ${m};
  --bloom-accent: ${dark ? p.accentD : p.accentL};
  --bloom-motion-1: ${motion[0]};
  --bloom-motion-2: ${motion[1]};
  --bloom-motion-3: ${motion[2]};
  /* v0.9.0：落霞流线光带色（v0.12.x 前叫「极光」） —— 从 motion 谱取色，混透明度降饱和后做丝带渐变。
     透明度低是故意的：流线是大尺度、低饱和的氛围效果，不是主色块。
     aurora 变体 v0.12.x 换色后 motion 谱是 78/55/35 → 金→橙→珊瑚，
     「流线」随之变成晚霞色（owner 2026-09-14 反馈原青绿系不好看）。 */
  --bloom-aurora-stream-1: color-mix(in oklch, ${motion[0]}, transparent ${dark ? 55 : 72}%);
  --bloom-aurora-stream-2: color-mix(in oklch, ${motion[1]}, transparent ${dark ? 55 : 72}%);
  --bloom-aurora-stream-3: color-mix(in oklch, ${motion[2]}, transparent ${dark ? 55 : 72}%);
  /* ⚠️ 阴影在暗色下必须用纯黑，不能用前景色混透明度 ——
     暗色的 --text 是近白，mix 出来的"阴影"会变成一团白雾贴在深色背景上。
     原版 root-*-dark.css 同样是写死 rgba(0,0,0,.4~.6)，只有亮色才用 text 混。 */
  --bloom-shadow-sm: 0 2px 8px ${dark ? "rgba(0,0,0,0.4)" : mix(tx, 96)};
  --bloom-shadow: 0 10px 30px ${dark ? "rgba(0,0,0,0.5)" : mix(tx, 94)};
  --bloom-shadow-lg: 0 24px 60px ${dark ? "rgba(0,0,0,0.6)" : mix(tx, 90)};
  /* DSH 的品牌蓝 #679efe(--dsw-alias-state-business-primary)用在顶栏
     「对话 / 轨迹」tab 的选中文字与下划线等处。主题必须接管它,否则 8 套配色
     切来切去,那条选中下划线永远是蓝的、跟主色打架(用户实拍反馈)。
     注意只接管 alias 层 —— --dsw-static-deepseek-400 是 DSH 的品牌标识色,
     不属于主题可覆盖范围。 */
  --dsw-alias-state-business-primary: ${dark ? p.accentD : p.accentL};
  /* 玻璃模糊半径 —— glass.ts 里 10 处 backdrop-filter 都读它。
     之前只写了 var(--bloom-glass-blur, 24px) 却从未定义,fallback 一直生效所以
     视觉没问题,但这个变量是**死的**:想统一调玻璃质感根本改不到。定义出来之后
     它才真的是一个可调参数(暗色略薄一点,深色面板本就更"实"、不需要那么重的糊)。 */
  --bloom-glass-blur: ${dark ? "22px" : "24px"};
  --bloom-hairline: rgba(${m}, ${dark ? .3 : .3});
  --bloom-hairline-strong: rgba(${m}, ${dark ? .55 : .5});
  --bloom-glow: rgba(${m}, ${dark ? .34 : .2});
  --bloom-code-bg: rgba(${m}, ${dark ? .16 : .13});
  --bloom-code-fg: ${dark ? p.txD : p.txL};`;
		}
		/**
		* mist 亮色：完整接管 alias 语义 + specific 组件。
		* 这是骨架 —— 其它变体只覆盖「主色 + 背景调」相关的行。
		*/
		/**
		* border 阶梯（l1 最淡 → l4 最强）—— **暗色必须走 morandi 气质轨**。
		*
		* 这是「前景色 token 当背景/边框用」这个反模式的第三次复发（前两次是
		* markdown-inline-code 和 --bloom-shadow，见 DEV_NOTES 2026-08-18）：
		* 暗色的 tx 是近白 oklch(96%)，`mix(tx, 58%)` 得到 42% 不透明的近白 ——
		* 在莫兰迪暗底上就是一圈扎眼的白框（用户实拍反馈：「白色边框很突兀」）。
		*
		* 暗色改用 rgba(morandi, α)：morandi 是中等亮度的低饱和主题色（如 sage
		* 是 138,154,91 灰绿），同样的可见度但不刺眼，且边框跟着变体走色相 ——
		* 这正是 --bloom-hairline 一直在用的思路，只是 border 阶梯漏了。
		* 亮色仍用 mix(tx)：亮色的 tx 是深色，当边框是对的。
		*
		* 抽成一个函数是因为这四行原本在 mistLight / mistDark / variantBlock
		* **三处**各写一遍 —— 本项目已经因为「三处只改了两处」让 ripple/petal
		* 继承过 mist 的错误值（DEV_NOTES 2026-08-18）。现在只有一个真源。
		*/
		function borderStack(p, dark) {
			const m = p.morandi;
			const tx = dark ? p.txD : p.txL;
			return dark ? `  --dsw-alias-border-l1: rgba(${m}, 0.10);
  --dsw-alias-border-l2: rgba(${m}, 0.18);
  --dsw-alias-border-l3: rgba(${m}, 0.28);
  --dsw-alias-border-l4: rgba(${m}, 0.40);` : `  --dsw-alias-border-l1: ${mix(tx, 90)};
  --dsw-alias-border-l2: ${mix(tx, 80)};
  --dsw-alias-border-l3: ${mix(tx, 70)};
  --dsw-alias-border-l4: ${mix(tx, 60)};`;
		}
		/**
		* 次级文字层级（secondary → tertiary → caption → dimmed，依次更弱）。
		*
		* 和 borderStack 一样，这四行原本在 mistLight / mistDark / variantBlock **三处**
		* 各写一遍，而且亮色档的顺序是乱的：caption 给了 40%、比 tertiary 的 45% 更**不**
		* 透明 —— 说明三处分别改过、没人对齐。
		*
		* 亮色档实测（canvas 取真实 sRGB 值算 WCAG，sage 亮色）：
		*   mix(tx, 45) → 3.46:1   mix(tx, 40) → 4.16:1   都够不上 AA 的 4.5:1
		* README 挂着 WCAG AA 徽章，这里必须达标，所以亮色重新分档到 28/32/35/37
		* （反推自 ratio ≥ 4.5 所需的 alpha ≈ 0.63），层级仍单调递减，只是整体压缩。
		*
		* 暗色档原为 35/45/48/58。前三档没问题（≥ 5:1），但 dimmed 的 58%（= 42% 不透明
		* 近白）在 8 个变体的暗底上只有 3.53~3.78 —— 8/8 全部不及格。dimmed 用在时间戳、
		* 「展开其余 N 个会话」这类**有意义**的信息上，不是纯装饰，所以必须达标。
		* 反推 ratio ≥ 4.5 需要 alpha ≈ 0.57，于是整条阶梯上移到 30/35/40/43。
		*
		* 注意保持单调递减 —— 这个档位修过一次「暗色三档塌成一档」
		* （曾是 35/45/30/35，caption 比 secondary 还亮，见 DEV_NOTES 2026-08-18）。
		* 上移后跨度从 23 收窄到 13，层级仍在（alpha 0.70/0.65/0.60/0.57），
		* 但已经没有再压缩的余地了：再靠近就会重演塌成一档。
		*/
		function labelStack(p, dark) {
			const tx = dark ? p.txD : p.txL;
			return dark ? `  --dsw-alias-label-secondary: ${mix(tx, 30)};
  --dsw-alias-label-tertiary: ${mix(tx, 35)};
  --dsw-alias-label-caption: ${mix(tx, 40)};
  --dsw-alias-label-dimmed: ${mix(tx, 43)};` : `  --dsw-alias-label-secondary: ${mix(tx, 28)};
  --dsw-alias-label-tertiary: ${mix(tx, 32)};
  --dsw-alias-label-caption: ${mix(tx, 35)};
  --dsw-alias-label-dimmed: ${mix(tx, 37)};`;
		}
		/**
		* 三处共用的 --dsw-* token（状态色 / 反色 / toast / tooltip / 遮罩）。
		*
		* 为什么要抽出来：这 22 个 token 原本只在 mistLight / mistDark 定义，
		* **variantBlock 一个都没有** —— 于是除 mist 之外的 7 个变体
		* （cinnabar/petal/ripple/sage/stone/lapis/amber）全部回落到 DSH 原生值：
		* 错误红实测是 DSH 的 #ec1313（4.13:1，够不上 AA），tooltip 是蓝灰
		* oklch(30% 0.02 240)，跟莫兰迪色相完全不搭。
		*
		* 更隐蔽的是 --dsw-alias-state-business-primary：bloomTokens 已把它接管成
		* accent，但 mist 块里还留着旧的蓝色定义 oklch(62% 0.1 250)，同一选择器内
		* 后写的赢 —— 结果「顶栏 tab 选中色跟主题」这个修复在 7 个变体生效、
		* 偏偏 mist（默认变体！）不生效。这类「三处定义漂移」是本仓反复出血的地方，
		* 现在 borderStack / labelStack / sharedDswTokens 三个函数把它收干净了。
		*
		* 状态色顺手修了亮色档对比度（canvas 取真实 sRGB 值实测）：
		*   success oklch(70%) → 2.0:1   warn oklch(75%) → 1.7:1   error oklch(60%) → 2.9:1
		* 三个在亮底上全部不及格，亮色统一压到 45% 左右（≈4.5:1 起）。
		* 暗色档大多本来就有 5~9:1，唯一例外是 error：oklch(62%) 在几个偏亮的暗底变体上
		* 只有 3.74~4.46（mist/cinnabar/petal/lapis/amber 实测），提到 72% 后 16 组全过。
		* 状态色保持红/绿/黄语义色相，不跟 accent 走 —— 「成功」不该因为切了个配色
		* 就变成绿色以外的东西。
		*/
		function sharedDswTokens(p, dark) {
			const bg = dark ? p.bgD : p.bgL;
			const tx = dark ? p.txD : p.txL;
			const ok = dark ? "oklch(72% 0.12 150)" : "oklch(45% 0.14 150)";
			const err = dark ? "oklch(72% 0.16 25)" : "oklch(45% 0.16 25)";
			const warn = dark ? "oklch(80% 0.12 75)" : "oklch(45% 0.11 75)";
			/**
			* ⚠️ secondary 与 tertiary 的语义**完全不同**，别按名字想当然。
			*
			* 实测 DSH 原生值（禁用 Bloom 样式后读 computed）：
			*   state-error-primary    #f25a5a
			*   state-error-secondary  #f25a5a   ← 和 primary **一模一样**，全饱和
			*   state-success-tertiary rgb(35,60,44)  ← 这才是暗淡背景色
			*
			* 也就是说 `-secondary` 是**全饱和状态色本身**（DSH 拿它当 color-mix 的色源），
			* `-tertiary` 才是背景档。Bloom 起初把两档都当成「淡背景」，写了
			* color-mix(c, transparent 82%)，于是：
			*
			*   .assistantVioletBright { color: color-mix(in srgb,
			*      var(--dsw-alias-brand-primary-…) 60%, var(--dsw-alias-state-error-secondary)) }
			*
			* 轨迹视图的 ASSISTANT 标签被混成半透明，对比度 3.39 → 2.89，**比 DSH 原生还差**。
			* 改成拿 bg 预混后 alpha 恢复 1，但色值被暗背景拖黑，2.89 → 2.70，更差 ——
			* 两次都错在把 secondary 当背景。现在 secondary 直接给全饱和值，对齐 DSH 语义。
			*
			* tertiary 保持 bg 预混（它确实是背景），但比例从 90% 降到 78%：原生
			* success-tertiary 有明显绿调，混 90% bg 只剩 rgb(33,36,20) 几乎无色相。
			*
			* Bloom 自己不消费这几个 token（只定义），所以改它们只影响 DSH 组件的渲染。
			*/
			const t = (c, pct) => `color-mix(in oklch, ${c}, ${bg} ${pct}%)`;
			return `
  /* 状态色（语义色相固定，明暗分档，两档都过 WCAG AA） */
  --dsw-alias-state-success-primary: ${ok};
  --dsw-alias-state-success-secondary: ${ok};
  --dsw-alias-state-success-tertiary: ${t(ok, dark ? 78 : 88)};
  --dsw-alias-state-error-primary: ${err};
  --dsw-alias-state-error-secondary: ${err};
  --dsw-alias-state-warn-primary: ${warn};
  --dsw-alias-state-warn-secondary: ${warn};
  --dsw-alias-state-warn-tertiary: ${t(warn, dark ? 78 : 88)};
  --dsw-alias-state-warn-label: ${dark ? "oklch(88% 0.1 75)" : "oklch(40% 0.09 75)"};
  /* interactive-bg-* 是明确的**背景**语义，保持 transparent 混 —— 它要叠在各种
     底色上（行 hover、按钮 hover），预混 bg 反而会在非 bg 底色上露出色块。 */
  --dsw-alias-interactive-bg-hover-danger: ${mix(err, dark ? 86 : 90)};
  /* business = 主题 accent（bloomTokens 里已接管，这里给 tertiary 配套） */
  --dsw-alias-state-business-tertiary: ${t(dark ? p.accentD : p.accentL, dark ? 78 : 88)};
  /* 反色 / 浮层 —— 跟着变体的 bg / tx 走，不再是硬编码蓝灰 */
  --dsw-alias-border-inverted: ${mix(bg, dark ? 85 : 85)};
  --dsw-alias-border-inverted2: ${mix(bg, dark ? 70 : 70)};
  --dsw-alias-label-primary-inverted: ${bg};
  --dsw-alias-button-contrast-fill: ${tx};
  --dsw-alias-button-elevated-fill: ${bg};
  --dsw-alias-button-tool-bar-fill-invisible: transparent;
  --dsw-alias-markdown-code-block-banner: ${mix(tx, 96)};
  /* tooltip / toast 两档都要是「深底浅字」：亮色拿 tx 压深，暗色拿 bg 压更深 */
  --dsw-alias-tooltip-bg: color-mix(in oklch, ${dark ? bg : tx}, black ${dark ? 22 : 8}%);
  --dsw-alias-toast-bg: color-mix(in oklch, ${dark ? bg : tx}, black ${dark ? 22 : 8}%);
  --dsw-alias-bg-mask-photo: color-mix(in oklch, ${bg}, black ${dark ? 45 : 30}%);`;
		}
		function mistLight(p) {
			const { accentL: aL, bgL, txL, sfL, sf2L } = p;
			return `
/* ─── Bloom · mist 雾蓝 亮色（默认 + body[data-bloom-variant=mist]）─────────── */
body, body[data-bloom-variant="mist"] {${bloomTokens(p, false)}${sharedDswTokens(p, false)}
  --dsw-alias-bg-base: ${bgL};
  --dsw-alias-bg-layer-1: ${bgL};
  --dsw-alias-bg-layer-2: ${sfL};
  --dsw-alias-bg-layer-3: ${sf2L};
  --dsw-alias-bg-overlay: ${sfL};
  --dsw-alias-bg-module-platform: ${sfL};
  --dsw-alias-bg-multi-select: ${sf2L};
  --dsw-alias-bg-skeleton: ${mix(txL, 96)};
  --dsw-alias-bg-mask-1: ${mix(txL, 97)};
  --dsw-alias-bg-mask-2: ${mix(txL, 95)};
  --dsw-alias-bg-mask-3: ${mix(txL, 93)};
  --dsw-alias-bg-mask-drop: ${mix(txL, 88)};
  --dsw-alias-label-primary: ${txL};
  --dsw-alias-label-primary-bluish: ${txL};
  --dsw-alias-label-primary-dimmed: ${mix(txL, 25)};
  --dsw-alias-label-primary-foreground: ${bgL};
${labelStack(p, false)}
  --dsw-alias-brand-primary: ${aL};
  --dsw-alias-brand-primary-invert: ${bgL};
  --dsw-alias-brand-text: ${bgL};
${borderStack(p, false)}
  --dsw-alias-button-primary-fill: ${aL};
  --dsw-alias-button-primary-hover: color-mix(in oklch, ${aL}, black 8%);
  /* dimmed 的官方语义是「主按钮填充上的文字色」，与 fill 反向——
     官方亮色 fill=neutral-bluish-1000(#0f1115) / dimmed=neutral-bluish-100(#ebeef2)，
     官方暗色 fill=neutral-bluish-50(#f9fafb) / dimmed=neutral-bluish-750(#43454a)。
     曾误当作「accent 淡化」写成 mix(accent, 85)，于是任何按官方语义把它用作
     文字色的插件（如 @opendsh/dsh-plugin-scheduled-tasks 的 .dshst-btn-primary
     与 .dshst-tab-active）都得到「accent 文字叠在 accent 填充上」→ 对比度趋 0，
     按钮字不可见（#16）。
     这里取 bg 而非 label 类 token 是刻意的：fill 是 accent，而 accent 与 bg 在
     明暗之间反向翻转（亮色 accent 中深 / bg 浅，暗色 accent 亮 / bg 深），
     两个主题都成立；bloom 内 label-primary-foreground 与 brand-primary-invert
     早已用同一个值表达「品牌色块上的前景」，此处复用，不新造颜色。 */
  --dsw-alias-button-primary-dimmed: ${bgL};
  --dsw-alias-button-tool-bar-fill: ${sfL};
  --dsw-alias-button-tool-bar-hover: ${mix(txL, 95)};
  --dsw-alias-button-floating-fill: ${sfL};
  --dsw-alias-button-floating-hover: ${sf2L};
  --dsw-alias-button-info-fill: ${mix(aL, 90)};
  --dsw-alias-button-info-hover: ${mix(aL, 84)};
  --dsw-alias-button-ghost-active-fill: ${mix(aL, 92)};
  --dsw-alias-button-ghost-active-hover: ${mix(aL, 88)};
  --dsw-alias-button-ghost-active-border: ${mix(aL, 78)};
  --dsw-alias-interactive-bg-hover: ${mix(aL, 92)};
  --dsw-alias-interactive-bg-hover-accent: ${mix(aL, 85)};
  --dsw-alias-interactive-bg-hover-solid: ${mix(aL, 88)};
  --dsw-alias-interactive-bg-active: ${mix(aL, 88)};
  /* ⚠️ inline-code 是「背景色」不是文字色 —— DSH 把它 set 到 code 元素的 background。
     曾经按文字色给（亮色 L30% 深色 / 暗色 L88% 浅色），结果亮色深底深字、
     暗色浅底白字（实测 1.2:1，一块刺眼亮斑）。必须给背景值。 */
  --dsw-alias-markdown-inline-code: var(--bloom-code-bg);
  --dsw-alias-markdown-code-block: ${sfL};
  --dsw-alias-markdown-tag: ${mix(aL, 88)};
  --dsw-alias-markdown-placeholder: ${mix(txL, 50)};
  --dsw-alias-markdown-citation: ${mix(txL, 55)};
  --dsw-alias-scrollbar-bg-l1: ${mix(txL, 90)};
  --dsw-alias-scrollbar-bg-l2: ${mix(txL, 80)};
  --dsw-alias-scrollbar-hover-l1: ${mix(txL, 82)};
  --dsw-alias-scrollbar-hover-l2: ${mix(txL, 72)};
  /* specific：消息气泡 / 侧栏 / 输入区 / 菜单 —— 不接管就会回落到 DSH 蓝灰调 */
  --dsw-specific-bubble: color-mix(in oklch, ${bgL}, ${txL} 3%);
  --dsw-specific-bubble-highlight: ${mix(aL, 88)};
  --dsw-specific-input-major: ${bgL};
  --dsw-specific-login-input: ${sfL};
  --dsw-specific-menu: ${sf2L};
  --dsw-specific-selector: ${sfL};
  /* 5% 而不是 2%：2% 的色差在浅色模式下肉眼几乎分不出侧边栏和主区，
     侧边栏就显得没有存在感（配合下方 _sidebarCol 的右侧分界线一起看） */
  --dsw-specific-sidebar-fill: color-mix(in oklch, ${bgL}, ${txL} 5%);
  --dsw-specific-sidebar-nav-item-active-accent: ${mix(aL, 86)};
  --dsw-specific-sidebar-nav-item-active: ${mix(aL, 93)};
  --dsw-specific-sidebar-nav-item-hover: ${mix(txL, 95)};
  --dsw-specific-tip: ${mix(aL, 90)};
}
`;
		}
		/** mist 暗色：完整接管（暗色下文字是亮灰、表面是深灰、主色提亮） */
		function mistDark(p) {
			const { accentD: aD, bgD, txD, sfD, sf2D } = p;
			return `
/* ─── Bloom · mist 暗色 ─────────────────────────────────────────── */
body[data-ds-dark-theme], body[data-ds-dark-theme][data-bloom-variant="mist"] {${bloomTokens(p, true)}${sharedDswTokens(p, true)}
  --dsw-alias-bg-base: ${bgD};
  --dsw-alias-bg-layer-1: ${bgD};
  --dsw-alias-bg-layer-2: ${sfD};
  --dsw-alias-bg-layer-3: ${sf2D};
  --dsw-alias-bg-overlay: ${sfD};
  --dsw-alias-bg-module-platform: ${sfD};
  --dsw-alias-bg-multi-select: ${sf2D};
  --dsw-alias-bg-skeleton: ${mix(txD, 94)};
  --dsw-alias-bg-mask-1: ${mix(txD, 96)};
  --dsw-alias-bg-mask-2: ${mix(txD, 93)};
  --dsw-alias-bg-mask-3: ${mix(txD, 90)};
  --dsw-alias-bg-mask-drop: ${mix(txD, 84)};
  --dsw-alias-label-primary: ${txD};
  --dsw-alias-label-primary-bluish: ${txD};
  --dsw-alias-label-primary-dimmed: ${mix(txD, 30)};
  --dsw-alias-label-primary-foreground: ${bgD};
  /* 四档由 labelStack() 统一给（层级必须单调递减：
     secondary > tertiary > caption > dimmed）。曾经是 35/45/30/35 ——
     caption 比 secondary 还亮、dimmed 跟 secondary 相同，三档在暗色下塌成一档。 */
${labelStack(p, true)}
  --dsw-alias-brand-primary: ${aD};
  --dsw-alias-brand-primary-invert: ${bgD};
  --dsw-alias-brand-text: ${bgD};
${borderStack(p, true)}
  --dsw-alias-button-primary-fill: ${aD};
  --dsw-alias-button-primary-hover: color-mix(in oklch, ${aD}, white 8%);
  /* 见亮色段说明：fill 上的文字色，与 fill 反向（#16） */
  --dsw-alias-button-primary-dimmed: ${bgD};
  --dsw-alias-button-tool-bar-fill: ${sfD};
  --dsw-alias-button-tool-bar-hover: ${mix(txD, 92)};
  --dsw-alias-button-floating-fill: ${sfD};
  --dsw-alias-button-floating-hover: ${sf2D};
  --dsw-alias-button-info-fill: ${mix(aD, 86)};
  --dsw-alias-button-info-hover: ${mix(aD, 78)};
  --dsw-alias-button-ghost-active-fill: ${mix(aD, 88)};
  --dsw-alias-button-ghost-active-hover: ${mix(aD, 82)};
  --dsw-alias-button-ghost-active-border: ${mix(aD, 70)};
  --dsw-alias-interactive-bg-hover: ${mix(aD, 90)};
  --dsw-alias-interactive-bg-hover-accent: ${mix(aD, 84)};
  --dsw-alias-interactive-bg-hover-solid: ${mix(aD, 82)};
  --dsw-alias-interactive-bg-active: ${mix(aD, 86)};
  /* 见亮色块同名变量的说明：这是背景色。 */
  --dsw-alias-markdown-inline-code: var(--bloom-code-bg);
  --dsw-alias-markdown-code-block: oklch(24% 0.02 240);
  --dsw-alias-markdown-tag: ${mix(aD, 85)};
  --dsw-alias-markdown-placeholder: ${mix(txD, 40)};
  --dsw-alias-markdown-citation: ${mix(txD, 35)};
  --dsw-alias-scrollbar-bg-l1: ${mix(txD, 86)};
  --dsw-alias-scrollbar-bg-l2: ${mix(txD, 76)};
  --dsw-alias-scrollbar-hover-l1: ${mix(txD, 75)};
  --dsw-alias-scrollbar-hover-l2: ${mix(txD, 65)};
  --dsw-specific-bubble: color-mix(in oklch, ${bgD}, white 3%);
  --dsw-specific-bubble-highlight: ${mix(aD, 82)};
  --dsw-specific-input-major: ${bgD};
  --dsw-specific-login-input: ${sfD};
  --dsw-specific-menu: ${sf2D};
  --dsw-specific-selector: ${sfD};
  --dsw-specific-sidebar-fill: color-mix(in oklch, ${bgD}, black 7%);
  --dsw-specific-sidebar-nav-item-active-accent: ${mix(aD, 80)};
  --dsw-specific-sidebar-nav-item-active: ${mix(aD, 88)};
  --dsw-specific-sidebar-nav-item-hover: ${mix(txD, 95)};
  --dsw-specific-tip: ${mix(aD, 84)};
}
`;
		}
		/**
		* 非 mist 变体：只覆盖「主色 + 背景调」相关的行（含 specific 组件），
		* 灰阶骨架、状态色、markdown 色继承 mist —— 变体之间保持同构，只换气质。
		*/
		function variantBlock(v, dark) {
			const p = PALETTE[v];
			const a = dark ? p.accentD : p.accentL;
			const bg = dark ? p.bgD : p.bgL;
			const tx = dark ? p.txD : p.txL;
			const sf = dark ? p.sfD : p.sfL;
			const sf2 = dark ? p.sf2D : p.sf2L;
			const sel = dark ? `body[data-ds-dark-theme][data-bloom-variant="${v}"]` : `body[data-bloom-variant="${v}"]`;
			return `
/* ─── Bloom · ${v}${dark ? " 暗色" : ""}（仅覆盖主色 + 背景调，骨架继承 mist）─────────── */
${sel} {${bloomTokens(p, dark)}${sharedDswTokens(p, dark)}
  --dsw-alias-bg-base: ${bg};
  --dsw-alias-bg-layer-1: ${bg};
  --dsw-alias-bg-layer-2: ${sf};
  --dsw-alias-bg-layer-3: ${sf2};
  --dsw-alias-bg-overlay: ${sf};
  --dsw-alias-bg-module-platform: ${sf};
  --dsw-alias-bg-multi-select: ${sf2};
  --dsw-alias-bg-skeleton: ${mix(tx, 95)};
  --dsw-alias-bg-mask-1: ${mix(tx, 97)};
  --dsw-alias-bg-mask-2: ${mix(tx, 95)};
  --dsw-alias-bg-mask-3: ${mix(tx, 93)};
  --dsw-alias-bg-mask-drop: ${mix(tx, 88)};
  --dsw-alias-brand-primary: ${a};
  --dsw-alias-brand-primary-invert: ${bg};
  --dsw-alias-brand-text: ${bg};
  --dsw-alias-button-primary-fill: ${a};
  --dsw-alias-button-primary-hover: color-mix(in oklch, ${a}, ${dark ? "white" : "black"} 8%);
  /* 见亮色段说明：fill 上的文字色，与 fill 反向（#16） */
  --dsw-alias-button-primary-dimmed: ${bg};
  --dsw-alias-button-info-fill: ${mix(a, dark ? 86 : 90)};
  --dsw-alias-button-info-hover: ${mix(a, dark ? 78 : 84)};
  --dsw-alias-button-ghost-active-fill: ${mix(a, dark ? 88 : 92)};
  --dsw-alias-button-ghost-active-hover: ${mix(a, dark ? 82 : 88)};
  --dsw-alias-button-ghost-active-border: ${mix(a, dark ? 70 : 78)};
  --dsw-alias-button-tool-bar-fill: ${sf};
  --dsw-alias-button-tool-bar-hover: ${mix(tx, dark ? 92 : 95)};
  --dsw-alias-button-floating-fill: ${sf};
  --dsw-alias-button-floating-hover: ${sf2};
  --dsw-alias-interactive-bg-hover: ${mix(a, dark ? 90 : 92)};
  --dsw-alias-interactive-bg-hover-accent: ${mix(a, dark ? 84 : 85)};
  --dsw-alias-interactive-bg-hover-solid: ${mix(a, dark ? 82 : 88)};
  --dsw-alias-interactive-bg-active: ${mix(a, dark ? 86 : 88)};
  --dsw-alias-markdown-tag: ${mix(a, dark ? 85 : 88)};
  /* 必须逐变体覆盖：否则继承 mist 的蓝灰 hue，ripple/petal 下代码块会跟主色打架 */
  --dsw-alias-markdown-inline-code: var(--bloom-code-bg);
  --dsw-alias-markdown-code-block: ${dark ? `color-mix(in oklch, ${bg}, black 12%)` : sf};
  --dsw-alias-scrollbar-bg-l1: ${mix(tx, dark ? 86 : 90)};
  --dsw-alias-scrollbar-bg-l2: ${mix(tx, dark ? 76 : 80)};
  --dsw-alias-scrollbar-hover-l1: ${mix(tx, dark ? 75 : 82)};
  --dsw-alias-scrollbar-hover-l2: ${mix(tx, dark ? 65 : 72)};
  --dsw-alias-label-primary: ${tx};
  --dsw-alias-label-primary-bluish: ${tx};
  --dsw-alias-label-primary-dimmed: ${mix(tx, dark ? 30 : 25)};
  --dsw-alias-label-primary-foreground: ${bg};
${labelStack(p, dark)}
${borderStack(p, dark)}
  --dsw-alias-markdown-placeholder: ${mix(tx, dark ? 40 : 50)};
  --dsw-alias-markdown-citation: ${mix(tx, dark ? 35 : 55)};
  --dsw-specific-bubble: color-mix(in oklch, ${bg}, ${tx} ${dark ? 4 : 3}%);
  --dsw-specific-bubble-highlight: ${mix(a, dark ? 82 : 88)};
  --dsw-specific-input-major: ${bg};
  --dsw-specific-login-input: ${sf};
  --dsw-specific-menu: ${sf2};
  --dsw-specific-selector: ${sf};
  /* 4/2% → 7/5%：原值色差太小，侧边栏和主区几乎同一片底色，缺少「面」的区分 */
  --dsw-specific-sidebar-fill: color-mix(in oklch, ${bg}, ${dark ? "black" : tx} ${dark ? 7 : 5}%);
  --dsw-specific-sidebar-nav-item-active-accent: ${mix(a, dark ? 80 : 86)};
  --dsw-specific-sidebar-nav-item-active: ${mix(a, dark ? 88 : 93)};
  --dsw-specific-sidebar-nav-item-hover: ${mix(tx, dark ? 95 : 95)};
  --dsw-specific-tip: ${mix(a, dark ? 84 : 90)};
}
`;
		}
		//#endregion
		//#region src/client/tokens.ts
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
		/**
		* Pull `--name: value;` pairs out of a CSS rule emitted by Bloom's builders.
		* Nested builders are already interpolated by the time we see the text, so the
		* body holds flat declarations and no nested braces.
		* @param css - a rule such as `body[data-bloom-variant="mist"] { --a: b; }`.
		*/
		function declarations(css) {
			const open = css.indexOf("{");
			const close = css.lastIndexOf("}");
			const body = open >= 0 && close > open ? css.slice(open + 1, close) : css;
			const out = {};
			const pattern = /(--[a-z0-9-]+)\s*:\s*([^;]+);/gi;
			let match;
			while ((match = pattern.exec(body)) !== null) out[match[1]] = match[2].trim();
			return out;
		}
		/** Split a declaration map into the DSH token layer and Bloom's own variables. */
		function partition(map) {
			const dsw = {};
			const own = {};
			for (const [name, value] of Object.entries(map)) if (name.startsWith("--dsw-")) dsw[name] = value;
			else own[name] = value;
			return {
				dsw,
				own
			};
		}
		/** Compose light + dark declaration maps into per-mode token pairs. */
		function pair(light, dark) {
			const out = {};
			for (const name of /* @__PURE__ */ new Set([...Object.keys(light), ...Object.keys(dark)])) out[name] = {
				light: light[name] ?? dark[name],
				dark: dark[name] ?? light[name]
			};
			return out;
		}
		/**
		* Bloom's complete DSH token layer for one palette, both modes.
		* `mist` is the skeleton every other variant inherits; a variant only
		* overrides its accent and background tonality.
		* @param variant - palette key; unknown values fall back to `mist`.
		*/
		function bloomTokenOverrides(variant) {
			const key = isVariant(variant) ? variant : "mist";
			const light = partition(declarations(mistLight(PALETTE.mist))).dsw;
			const dark = partition(declarations(mistDark(PALETTE.mist))).dsw;
			if (key !== "mist") {
				Object.assign(light, partition(declarations(variantBlock(key, false))).dsw);
				Object.assign(dark, partition(declarations(variantBlock(key, true))).dsw);
			}
			return pair(light, dark);
		}
		/**
		* Bloom's own `--bloom-*` properties as a scoped stylesheet.
		* Gated on the plugin body attribute and on the active palette, mirroring the
		* cascade Bloom's own builders rely on (dark block wins by specificity).
		* @param variant - palette key; unknown values fall back to `mist`.
		*/
		function bloomOwnVarsCss(variant, attr) {
			const key = isVariant(variant) ? variant : "mist";
			const light = partition(declarations(bloomTokens(PALETTE[key], false))).own;
			const dark = partition(declarations(bloomTokens(PALETTE[key], true))).own;
			const render = (map) => Object.entries(map).map(([name, value]) => `${name}: ${value};`).join("");
			return [`body[${attr}="${key}"]{${render(light)}}`, `body[${attr}="${key}"][data-ds-dark-theme]{${render(dark)}}`].join("\n");
		}
		/**
		* Frosted's published opacity recipe, preserved token-for-token so the merged
		* plugin keeps the slider range users already tuned.
		*/
		const GLASS_ROLE = {
			"--dsw-alias-bg-base": "base",
			"--dsw-alias-bg-layer-1": "plate",
			"--dsw-alias-bg-layer-2": "raised",
			"--dsw-alias-bg-layer-3": "raised",
			"--dsw-alias-bg-overlay": "overlay",
			"--dsw-alias-bg-module-platform": "raised",
			"--dsw-alias-bg-mask-drop": "drop",
			"--dsw-specific-sidebar-fill": "plate",
			"--dsw-specific-input-major": "input",
			"--dsw-specific-menu": "menu",
			"--dsw-specific-bubble": "bubble",
			"--dsw-specific-selector": "raised",
			"--dsw-specific-sidebar-nav-item-active": "raised",
			"--dsw-specific-sidebar-nav-item-hover": "hover",
			"--dsw-alias-button-elevated-fill": "input",
			"--dsw-alias-button-floating-fill": "input",
			"--dsw-alias-markdown-code-block": "raised",
			"--dsw-alias-markdown-inline-code": "raised"
		};
		/** Expand one glass-opacity knob into the per-role opacity table. */
		function glassAlphas(glassOpacity) {
			const a = glassOpacity;
			return {
				base: Math.max(.08, a * .42),
				plate: a,
				raised: Math.min(.92, a + .1),
				overlay: Math.min(.94, a + .22),
				input: Math.min(.9, a + .12),
				menu: Math.min(.9, a + .16),
				bubble: Math.min(.88, a + .08),
				hover: Math.min(.55, a * .7),
				drop: .45
			};
		}
		/**
		* Re-express a palette colour at a given opacity without shifting its hue.
		* `color-mix` in oklch keeps the Morandi character that converting to rgba
		* would flatten.
		* @param color - any CSS colour, typically one of Bloom's oklch values.
		* @param alpha - target opacity in [0, 1].
		*/
		function veil(color, alpha) {
			return `color-mix(in oklch, ${color}, transparent ${Math.round((1 - Math.min(1, Math.max(0, alpha))) * 1e3) / 10}%)`;
		}
		/**
		* Fold the frosted layer into Bloom's colours: surface tokens become
		* translucent plates, text and border tokens stay exactly as Bloom set them
		* (transparency there would only cost contrast).
		* @param base - Bloom's opaque token layer.
		* @param glassOpacity - the user's glass-density knob.
		*/
		function applyGlass(base, glassOpacity) {
			const alpha = glassAlphas(glassOpacity);
			const out = {};
			for (const [name, modes] of Object.entries(base)) {
				const role = GLASS_ROLE[name];
				if (role === void 0) {
					out[name] = modes;
					continue;
				}
				out[name] = {
					light: veil(modes.light, alpha[role]),
					dark: veil(modes.dark, alpha[role])
				};
			}
			return out;
		}
		/**
		* The single entry point the plugin calls: Bloom's palette, optionally
		* re-expressed as frosted glass over a wallpaper.
		* @param inputs - palette, glass density, and whether a wallpaper is active.
		*/
		function bloomglassTokens(inputs) {
			const base = bloomTokenOverrides(inputs.variant);
			return inputs.frosted ? applyGlass(base, inputs.glassOpacity) : base;
		}
		//#endregion
		//#region src/client/wallpaper.ts
		/**
		* Owns the wallpaper plate, the dim veil, the scoped frost stylesheet, and the
		* `--fw-*` custom properties. Retracts exactly what it wrote.
		*
		* Deliberately never touches {@link BODY_ATTR}: that attribute means "the
		* palette theme is installed", and the frost is only one optional layer of it.
		*/
		/**
		* Custom properties the frost layer publishes. `--fw-*` drive Frosted's own
		* selectors; `--bloom-glass-blur` is the single blur knob Bloom's stylesheets
		* read, so both halves of the merge blur by the same amount.
		*/
		const BLUR_VAR = "--bloom-glass-blur";
		const SATURATE_VAR = "--fw-saturate";
		const DIM_VAR = "--fw-dim";
		/** Bloom paints its own ambience wash; a wallpaper must displace it. */
		const AMBIENCE_VAR = "--bloom-ambience";
		const FROST_VARS = [
			BLUR_VAR,
			SATURATE_VAR,
			DIM_VAR,
			AMBIENCE_VAR
		];
		/** Presenter over the document: one wallpaper, one dim veil, one stylesheet. */
		var FrostedPresenter = class {
			styleEl;
			wallpaperEl;
			dimEl;
			objectUrl;
			/** Project one surface onto the document. Passing a disabled/empty surface retracts. */
			apply(surface) {
				if (!(surface.knobs.enabled && surface.objectUrl !== null)) {
					this.retractChrome();
					return;
				}
				this.ensureChrome();
				const wallpaper = this.wallpaperEl;
				const dim = this.dimEl;
				if (wallpaper === void 0 || dim === void 0) return;
				const body = document.body;
				wallpaper.style.backgroundImage = `url(${JSON.stringify(surface.objectUrl)})`;
				body.setAttribute(FROST_ATTR, surface.scheme);
				body.style.setProperty(BLUR_VAR, `${surface.knobs.blurPx}px`);
				body.style.setProperty(SATURATE_VAR, `${Math.round(surface.knobs.saturate * 100)}%`);
				body.style.setProperty(DIM_VAR, String(surface.knobs.dim));
				body.style.setProperty(AMBIENCE_VAR, "none");
			}
			/** Remember a blob URL so dispose can revoke it. Callers revoke the previous URL after React paints. */
			adoptObjectUrl(url) {
				this.objectUrl = url;
			}
			/** Current adopted object URL, if any. */
			currentObjectUrl() {
				return this.objectUrl;
			}
			/** Retract every node, attribute, custom property, and object URL. */
			dispose() {
				this.retractChrome();
				if (this.objectUrl !== void 0) {
					URL.revokeObjectURL(this.objectUrl);
					this.objectUrl = void 0;
				}
			}
			ensureChrome() {
				if (this.styleEl === void 0 || !this.styleEl.isConnected) {
					const style = document.createElement("style");
					style.dataset.plugin = PACKAGE_ID;
					style.dataset.pluginCss = `${PACKAGE_ID}/glass.css`;
					style.textContent = GLASS_CSS$1;
					document.head.append(style);
					this.styleEl = style;
				}
				if (this.wallpaperEl === void 0 || !this.wallpaperEl.isConnected) {
					const plate = document.createElement("div");
					plate.setAttribute(`${FROST_ATTR}-wallpaper`, "");
					document.body.prepend(plate);
					this.wallpaperEl = plate;
				}
				if (this.dimEl === void 0 || !this.dimEl.isConnected) {
					const veil = document.createElement("div");
					veil.setAttribute(`${FROST_ATTR}-dim`, "");
					this.wallpaperEl.after(veil);
					this.dimEl = veil;
				}
			}
			retractChrome() {
				this.styleEl?.remove();
				this.styleEl = void 0;
				this.wallpaperEl?.remove();
				this.wallpaperEl = void 0;
				this.dimEl?.remove();
				this.dimEl = void 0;
				const body = document.body;
				body.removeAttribute(FROST_ATTR);
				for (const name of FROST_VARS) body.style.removeProperty(name);
			}
		};
		//#endregion
		//#region src/client/index.ts
		const name = PACKAGE_ID;
		const inject = [
			"slots",
			"locale",
			"theme"
		];
		/** Client plugin body. */
		function apply(ctx) {
			const images = openImageStore();
			const presenter = new FrostedPresenter();
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
				revision: 0
			});
			let knobs = loadKnobs();
			let draft;
			let disposeTokens;
			let styleEl;
			let mutation = 0;
			let disposed = false;
			let projecting = false;
			const t = (key) => {
				try {
					return ctx.locale.bind(LOCALE_NS)(key);
				} catch {
					return zh[key];
				}
			};
			const publish = (patch) => {
				const current = store.get();
				store.set({
					...current,
					...patch,
					revision: current.revision + 1
				});
			};
			const schemeOf = () => {
				try {
					return ctx.theme.getTheme?.()?.active?.colorScheme === "dark" ? "dark" : "light";
				} catch {
					return "light";
				}
			};
			/** True while a wallpaper is actually painted behind the UI. */
			const frostLive = () => knobs.enabled && store.get().previewUrl !== null;
			const ownCss = (variant) => [
				bloomOwnVarsCss(variant, VARIANT_ATTR),
				COMPONENT_CSS,
				GLASS_CSS,
				SETTINGS_CSS,
				PALETTE_CSS
			].join("\n");
			const mountChrome = () => {
				if (styleEl !== void 0 && styleEl.isConnected) return;
				const style = document.createElement("style");
				style.dataset.plugin = PACKAGE_ID;
				style.dataset.pluginCss = `${PACKAGE_ID}/theme.css`;
				style.textContent = ownCss(knobs.variant);
				document.head.append(style);
				styleEl = style;
				document.body.setAttribute(BODY_ATTR, "");
				document.body.setAttribute(VARIANT_ATTR, knobs.variant);
			};
			const retractChrome = () => {
				styleEl?.remove();
				styleEl = void 0;
				document.body.removeAttribute(BODY_ATTR);
				document.body.removeAttribute(VARIANT_ATTR);
			};
			const stackTokens = () => {
				if (typeof disposeTokens === "function") disposeTokens();
				disposeTokens = void 0;
				if (disposed || typeof ctx.theme.overrideTokens !== "function") return;
				const retract = ctx.theme.overrideTokens(PACKAGE_ID, bloomglassTokens({
					variant: knobs.variant,
					glassOpacity: knobs.glassOpacity,
					frosted: frostLive()
				}));
				disposeTokens = typeof retract === "function" ? retract : void 0;
			};
			const projectChrome = () => {
				if (disposed || projecting) return;
				projecting = true;
				try {
					presenter.apply({
						knobs,
						objectUrl: store.get().previewUrl,
						scheme: schemeOf()
					});
				} finally {
					projecting = false;
				}
			};
			const project = (restack) => {
				if (disposed) return;
				projectChrome();
				if (restack) stackTokens();
			};
			/** Palette + slider changes apply live; Save only makes them durable. */
			const persistKnobs = (next) => {
				const variantChanged = normalizeKnobs(next).variant !== knobs.variant;
				knobs = normalizeKnobs(next);
				publish({
					...knobs,
					dirty: true
				});
				if (variantChanged) {
					document.body.setAttribute(VARIANT_ATTR, knobs.variant);
					if (styleEl !== void 0) styleEl.textContent = ownCss(knobs.variant);
				}
				project(true);
			};
			const adoptRecord = (record, dirty) => {
				if (disposed) return;
				const previous = presenter.currentObjectUrl();
				draft = record;
				if (record === void 0) {
					publish({
						hasImage: false,
						previewUrl: null,
						fileName: null,
						width: 0,
						height: 0,
						dirty,
						error: null
					});
					presenter.adoptObjectUrl(void 0);
					if (previous !== void 0) requestAnimationFrame(() => {
						URL.revokeObjectURL(previous);
					});
					project(true);
					return;
				}
				const url = URL.createObjectURL(wallpaperBlob(record));
				publish({
					hasImage: true,
					previewUrl: url,
					fileName: record.name,
					width: record.width,
					height: record.height,
					dirty,
					error: null
				});
				presenter.adoptObjectUrl(url);
				if (previous !== void 0 && previous !== url) requestAnimationFrame(() => {
					URL.revokeObjectURL(previous);
				});
				project(true);
			};
			const upload = async (file) => {
				const generation = ++mutation;
				publish({
					busy: true,
					error: null
				});
				try {
					const record = await prepareWallpaper(file);
					if (generation !== mutation || disposed) return;
					adoptRecord(record, true);
				} catch (error) {
					if (generation !== mutation || disposed) return;
					publish({ error: messageFor(error, t) });
				} finally {
					if (generation === mutation && !disposed) publish({ busy: false });
				}
			};
			const save = async () => {
				const generation = ++mutation;
				publish({
					busy: true,
					error: null
				});
				try {
					saveKnobs(knobs);
					if (draft === void 0) await images.clear();
					else await images.put(draft);
					if (generation !== mutation || disposed) return;
					publish({ dirty: false });
				} catch (error) {
					if (generation !== mutation || disposed) return;
					publish({ error: messageFor(error, t) });
				} finally {
					if (generation === mutation && !disposed) publish({ busy: false });
				}
			};
			const remove = async () => {
				const generation = ++mutation;
				publish({
					busy: true,
					error: null
				});
				try {
					await images.clear();
					saveKnobs(knobs);
					if (generation !== mutation || disposed) return;
					adoptRecord(void 0, false);
				} catch (error) {
					if (generation !== mutation || disposed) return;
					publish({ error: messageFor(error, t) });
				} finally {
					if (generation === mutation && !disposed) publish({ busy: false });
				}
			};
			ctx.effect(() => ctx.locale.register(LOCALE_NS, {
				zh,
				en
			}), `${PACKAGE_ID}: locale`);
			const injected = () => ({
				store,
				t,
				setVariant: (variant) => {
					persistKnobs({
						...knobs,
						variant
					});
				},
				setEnabled: (enabled) => {
					persistKnobs({
						...knobs,
						enabled
					});
				},
				setKnob: (key, value) => {
					persistKnobs({
						...knobs,
						[key]: value
					});
				},
				upload,
				save,
				remove
			});
			ctx.effect(() => ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: PACKAGE_ID,
				order: 36,
				label: () => t("nav"),
				locale: LOCALE_NS,
				inject: injected
			}, SettingsSection)), `${PACKAGE_ID}: settings`);
			ctx.effect(() => {
				const boot = mutation;
				mountChrome();
				project(true);
				const off = ctx.on("theme/change", () => {
					projectChrome();
				});
				images.get().then((record) => {
					if (disposed || mutation !== boot) return;
					if (record !== void 0) adoptRecord(record, false);
				}).catch((error) => {
					if (!disposed && mutation === boot) publish({ error: messageFor(error, t) });
				});
				return () => {
					disposed = true;
					mutation += 1;
					off();
					if (typeof disposeTokens === "function") disposeTokens();
					disposeTokens = void 0;
					retractChrome();
					presenter.dispose();
				};
			}, `${PACKAGE_ID}: surface`);
		}
		function messageFor(error, t) {
			if (error instanceof ImageValidationError && error.message.includes("unsupported")) return t("errorType");
			return t("errorGeneric");
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		exports.name = name;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map
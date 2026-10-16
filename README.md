# dsh-bloomglass

一个 DeepSeek Harness Web 主题插件：十套 OKLCH 中国传统色（国色）配色打底，可选一张壁纸铺满窗口、界面以磨砂玻璃叠上去。官方 Light / Dark / System 仍然掌权。已适配 DS Bot（Bot 团队）界面。

## 效果展示

10 套配色，每套都有亮色与暗色（底色 / 正文色 / 强调色 / 层级面色）：

![10 套中国传统色配色](docs/showcase/palette-board.png)

| 亮色 · 黛蓝 | 暗色 · 天青 |
| --- | --- |
| ![亮色](docs/showcase/ui-mist-light.png) | ![暗色](docs/showcase/ui-ripple-plain.png) |

同一配色与窗口，只多了壁纸层 —— 表面色按玻璃浓度转为半透明，文字与边框保持不透明：

![壁纸与磨砂玻璃](docs/showcase/ui-ripple-glass.png)

## 功能

- **10 套配色**：黛蓝 / 朱砂 / 桃夭 / 天青 / 竹青 / 赭石 / 青金 / 琥珀 / 落霞 / 青莲，明暗自适应
- **DS Bot（Bot 团队）适配**：Bot 侧栏与分组、对话气泡、输入卡片、详情面板、菜单与对话框都跟随当前配色；铺了壁纸时，浮在壁纸上的面板 / 菜单 / 对话框按玻璃层级转半透明并加背景模糊
- **token 优先权**：ds-bot 也写的 6 个 DSH token，本主题会在它注册之后重新压回自己的值，整窗只留一套配色
- **壁纸 + 磨砂**：本地 JPEG / PNG / WebP / GIF，无大小限制
- **磨砂范围**：左侧栏、会话区、右侧栏（含全屏展开）、设置弹窗，以及 DS Bot 的固定面板与弹层
- **一个独立设置栏**：设置 → Bloom Glass，含配色选择 + 玻璃浓度 / 模糊 / 饱和 / 压暗滑杆 + 保存 / 删除，不往「通用」页插行
- 壁纸关闭时是纯配色模式；打开后表面色按玻璃浓度转为半透明（文字与边框始终不透明）
- 只走官方 `overrideTokens` 覆盖层，从不 `setTheme('custom')`；不写 `settings.yaml`，不请求任何远程 URL

数据位置：壁纸存 IndexedDB，旋钮存 `localStorage`。

### DS Bot（Bot 团队）界面

Bot 列表、对话气泡、输入卡片与右侧详情面板都跟随当前配色与明暗（下图为亮 / 暗两态；截图里的 Bot 名、会话、面板内容**与每个 Bot 的头像**全部为虚构示例 —— 头像是脚本里自绘的机器人脸，不是任何真实头像图片；页面由 `scripts/generate-bot-showcase.mjs` 用 ds-bot 自己的样式表合成，不含任何真实会话）：

| 亮色 | 暗色 |
| --- | --- |
| ![DS Bot 界面 · 亮色](docs/showcase/bot-ui-light.png) | ![DS Bot 界面 · 暗色](docs/showcase/bot-ui-dark.png) |

Bot 团队界面由 `ds-bot` 插件渲染，它不读 DSH 的 `--dsw-*` token，而是用自己的 `--bt-*` 变量上色，并写在 `html body` / `html body[data-ds-dark-theme]` 上（挂载时注入，比本插件的样式标签更晚）。本插件把 `--bt-*` 接到同一批 DSH token（用带两个属性选择器的选择器压过它，否则它的后注入样式会赢），所以 Bot 侧栏与分组、气泡、卡片、输入卡片、面板、菜单与对话框都直接跟当前配色和明暗走。

铺了壁纸时有三条规矩：

- **盖在会话上的表面必须有能盖住下层的底板**。Bot↔Bot 会话层（`ExchangeDialog` 的 `.bt-pane.bt-exchange`）和 Bot 详情面板（`.bt-panel`）是 fixed 覆盖层，ds-bot 原来只给它们 `--bt-main` 一层底色；玻璃密度滑到低端时那层只有一两成不透明，下层主对话的字会透上来和它叠在一起。底板挂在 `::before` 上 —— 面板自身不加 `backdrop-filter`，否则里面 `position: fixed` 的菜单会改定位基准。会话层比别的弹窗再厚一档：它盖的是用户正在读的另一段对话，overlay 角色的 40% 不足以让下层的字消失（实测 40% / 55% / 70% 都还看得见行，85% 才干净，而且把背景模糊关掉也成立），所以它取 overlay 玻璃 + 75% 调色板不透明色调（合到 85% 不透明，随浓度滑杆继续上升），模糊仍跟用户的滑杆。详情面板与其余弹窗保持 overlay 那一档不变；会话层的输入栏与它上方的渐隐另用 `--bt-glass-cover`（96% 的近实心），因为它要遮的是自己滚动中的日志。
- **控件层不借用被削得最狠的角色**。`--bt-main` 被 ds-bot 用在圆图标按钮、标签指示块、开关滑块、输入框上，所以它接的是 shell 自己给浮动按钮用的 `--dsw-alias-button-floating-fill`（同浓度下比 base 厚实得多）；整块面板由上面那条规矩单独铺底。
- **烘托环要实色**。徽标的 1.5px 烘托环和王冠描边改用 `--bloom-sidebar-solid`（调色板里未 frost 的侧栏色），否则在壁纸上会被吃掉。

菜单与对话框分别取 menu / overlay 两个玻璃角色，DSH 输入卡片交回主题自己的玻璃底板。

**用户自己发出的消息**（宿主聊天区的那颗气泡，以及 ds-bot 自己渲染的 `.bt-ubody` / `.bt-ububble` 和按下态的小控件）全部由 `--bt-user` / `--bt-user-ink` 这一对驱动 —— ds-bot 自己就是用这一对刷所有「用户侧」表面（`[class*="_userRow"] [class*="_bubble"]`、问答回复、命令输入都算）。这一对直接指向**输入框最右侧那个按钮**的同名变量：发送按钮 `[data-composer-card] button[class*="_primary"]`（空输入时顶替它的语音按钮 `.bt-voice` 也一样）取 `--bt-accent` 底 + `--bt-accent-ink` 字，所以 `--bt-user` 就是 `var(--bt-accent)`、`--bt-user-ink` 就是 `var(--bt-accent-ink)` —— 引用而不是抄色值，换配色 / 换明暗时气泡和按钮永远一起变，实测两者 computed 值逐字相同（mist 暗色 `oklch(0.72 0.12 240)` 底、亮色 `oklch(0.5 0.08 240)` 底，文字对比度 5.3–6.0:1）。这一对是**实色**：按钮是不透明填充，气泡只要带一点透明度就会合成出按钮没有的颜色，所以用户侧气泡不带 `backdrop-filter`（不透明填充后面的模糊既看不见又白耗一次合成）。

ds-bot 自带「设置 → 外观 → 主题 / 强调色」，它同样写 `--bt-*`；装了本主题后，Bot 界面的配色以本主题为准，那两项设置对 Bot 界面不再生效。它另外通过自己的覆盖层写 6 个 DSH token（`--dsw-alias-bg-base`、`--dsw-specific-sidebar-fill`、`--dsw-specific-input-major`、`--dsw-alias-label-primary/secondary/tertiary`），而覆盖层是「后注册的层赢」——ds-bot 在自己的挂载时刻注册，晚于本主题，这 6 个就会被它拿走。本主题因此在每次 `theme/change` 里读一次已经合成的 token 快照：只要这 6 个里有任何一个不再是自己写的值，就重新压回自己的层。判断走快照而不是 DOM、不轮询、只在真的被拿走时才动手，也不碰这 6 个以外的任何 token（别的插件写的其它 token 照旧归它们）。

## 安装

`dsh web` 需已在运行。

```sh
# 从 npm 安装
dsh plugin --profile web add dsh-bloomglass

# 或直接从仓库安装
dsh plugin --profile web add github:CosmoSail/dsh-bloomglass
```

装完**重启 `dsh web`**（刷新页面不够），然后打开 **设置 → Bloom Glass**。

首次启动会一次性读取旧版插件留下的三个位置——`localStorage` 的 `dsh-bloom-variant`（配色）、`dsh-frosted-window:knobs`（玻璃参数），以及名为 `dsh-frosted-window` 的 IndexedDB 库里的壁纸——把先前保存的选择接过来。之后写入的是本插件自己的键，不再回读。

## 开发

```sh
git clone https://github.com/CosmoSail/dsh-bloomglass.git
cd dsh-bloomglass
npm install
npm test         # vitest，115 个用例
npm run typecheck
npm run build    # tsdown → lib/index.js + lib/client.js
npm run showcase # 重新生成 docs/showcase 下的演示页
npm run showcase:bot # 重新生成 DS Bot 界面演示页（需已安装 ds-bot）
```

`lib/` 随仓库提交（`dsh plugin add github:` 依赖它，也免去用户本地构建），因此**改完源码请重新构建再提交**。

契约：按官方 [package-and-install](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.md) 以 `dsh.bundle` + `dsh.client` 分发。

## 许可

MIT，见 [LICENSE](LICENSE)。

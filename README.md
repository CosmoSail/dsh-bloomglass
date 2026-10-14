# dsh-bloomglass

一个 DeepSeek Harness Web 主题插件：十套 OKLCH 莫兰迪配色打底，可选一张壁纸铺满窗口、界面以磨砂玻璃叠上去。官方 Light / Dark / System 仍然掌权。

## 效果展示

10 套配色，每套都有亮色与暗色（底色 / 正文色 / 强调色 / 层级面色）：

![10 套莫兰迪配色](docs/showcase/palette-board.png)

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

Bot 团队界面由 `ds-bot` 插件渲染，它不读 DSH 的 `--dsw-*` token，而是用自己的 `--bt-*` 变量上色，并写在 `html body` / `html body[data-ds-dark-theme]` 上（挂载时注入，比本插件的样式标签更晚）。本插件把 `--bt-*` 接到同一批 DSH token（用带两个属性选择器的选择器压过它，否则它的后注入样式会赢），所以 Bot 侧栏与分组、气泡、卡片、输入卡片、面板、菜单与对话框都直接跟当前配色和明暗走。铺了壁纸时，`.bt-panel` / `.bt-pane` 在 `::before` 上补玻璃底板（面板自身不加 `backdrop-filter`，否则里面 `position: fixed` 的菜单会改定位基准），菜单与对话框分别取 menu / overlay 两个玻璃角色，DSH 输入卡片交回主题自己的玻璃底板。

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

首次启动会一次性读取这两个键——`localStorage` 的 `dsh-bloom-variant`（配色）、`dsh-frosted-window:knobs`（玻璃参数），以及 `dsh-frosted-window` 这个 IndexedDB 库里的壁纸——把先前保存的选择接过来。之后写入的是本插件自己的键，不再回读。

## 开发

```sh
git clone https://github.com/CosmoSail/dsh-bloomglass.git
cd dsh-bloomglass
npm install
npm test         # vitest，62 个用例
npm run typecheck
npm run build    # tsdown → lib/index.js + lib/client.js
npm run showcase # 重新生成 docs/showcase 下的演示页
```

`lib/` 随仓库提交（`dsh plugin add github:` 依赖它，也免去用户本地构建），因此**改完源码请重新构建再提交**。

**上游代码源**——本包的源码整合自下面两个上游项目：

| 上游代码源 | 取用内容 |
| --- | --- |
| [dsh-bloom-theme](https://github.com/webkubor/dsh-bloom-theme) `0.13.4`（`81ab8a0`）<br>MIT © 2026 webkubor | 色板数据、token 编译层、组件与玻璃样式表 |
| [dsh-frosted-window](https://github.com/SenryLee/dsh-frosted-window) `0.1.0`（`ccee61d`）<br>MIT © 2026 SenryLee | 壁纸上传与 IndexedDB 持久化、磨砂呈现器、玻璃样式、设置面板 |

除 `src/client/tokens.ts`（统一 token 管线）与 `src/client/css/palette-css.ts`（配色选择区样式）为本包新写外，其余源码均取自上述**上游代码源**。两份原始版权声明见 [LICENSE](LICENSE)，再次分发请保留。

契约：按官方 [package-and-install](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.md) 以 `dsh.bundle` + `dsh.client` 分发。

## 许可

MIT，见 [LICENSE](LICENSE)。

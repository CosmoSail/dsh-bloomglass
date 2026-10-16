/**
 * 10 套中国传统色的色板与标签 —— 纯数据 + 一个色彩工具函数，不 import 任何东西。
 *
 * **双轨制不能退回单轨**（见 CONTRIBUTING「改配色时注意」）：
 *   accentL / accentD  可读轨 —— 文字、按钮填充、边框，必须过 WCAG AA
 *   dye / wash         气质轨 —— 传统色本体（真色）与它的淡染档：
 *                      dye  只用于 rgba(dye, 0.28~0.55) 的细线 / 标记 / 小面积淡底
 *                      wash 是同一色相、同一明度、彩度压到 55% 的一档，
 *                           专供大面积氛围渐变（侧栏顶部淡染、表格隔行）
 * 拿可读轨铺大面积、或拿气质轨做文字色，都会失去「国色」的克制。
 */

export const VARIANTS = ['mist', 'cinnabar', 'petal', 'ripple', 'sage', 'stone', 'lapis', 'amber', 'aurora', 'lavender'] as const

export const OTHER_VARIANTS = ['cinnabar', 'petal', 'ripple', 'sage', 'stone', 'lapis', 'amber', 'aurora', 'lavender'] as const

/** Palette keys are persisted as user preference — never rename one. */
export type Variant = (typeof VARIANTS)[number]

/** Narrow an unknown value to a `Variant`. */
export function isVariant(value: unknown): value is Variant {
  return (VARIANTS as readonly string[]).includes(value as string)
}

/**
 * 色板 —— 双轨制（这套设计从主题第一版继承下来，别退回单轨）。
 *
 *   accentL/accentD  「可读轨」：文字、按钮填充、边框。它不是传统色本体，
 *                    而是传统色**按对比度压过明度**的版本（原版 typora-Bloom 的
 *                    注释就叫 `Deepened for better contrast`）：传统色的明度只为
 *                    「这一个色块好看」服务，铺成界面底色就过不了 WCAG。
 *   dye              「真色」：传统色本体，只在细线 / 标记 / 小面积淡底上出现。
 *   wash             「淡染」：真色同色相、同明度、彩度 ×0.55。朱砂（C 0.226）与
 *                    青莲（C 0.213）的彩度是旧灰调档的两倍多，真色大面积铺开会
 *                    像染色而不是氛围，所以大面积渐变一律走这一档。
 *
 * 色值来源（2026-10-16 全仓换中国传统色）：Chinese Color Atlas 图鉴
 * （chinesecoloratlas.com，555 色总录）+ zerosoul/chinese-colors 中科院数据集，
 * 每个名字都对应一种有据可查的实物色：
 *   黛蓝 石黛描眉 · 朱砂 硫化汞矿物颜料 · 桃夭《诗经》花色 · 天青 汝窑釉
 *   竹青 竹色 · 赭石 赤铁矿 · 青金 青金石（天然群青） · 琥珀 松脂化石
 *   落霞 晚霞霞色（王勃），取「杏红」 · 青莲 李白自号
 *
 * 色相全部来自传统色本身；**每一档的 L 与彩度沿用换色前调好的值**，只旋转色相 ——
 * 深色档「琥珀提亮、极光去黄」那几轮微调是针对明度做的，与色相无关，换色不该把它们
 * 推翻。accent 从智库给的 OKLCH 起步，再按 4.5:1 逐档校准（目标是 4.6 以上留余量）。
 *
 * accent × bg 实测对比度（10 变体 × 明暗，全部 ≥ 4.5:1）——这一对同时是主按钮的
 * fill × dimmed（见 tokens.ts 的 button-primary-dimmed），也是本仓唯一不能为好看
 * 让路的比值。下表由脚本在浏览器里用 canvas 取真实 sRGB 值算出（同一组数字
 * palette.spec.ts 也在离线算，差 ≤0.03 是 CSS gamut 映射的余量）：
 *
 *   变体       亮色     暗色        变体       亮色     暗色
 *   mist     6.16:1   5.88:1      stone    6.03:1   7.66:1
 *   cinnabar 5.86:1   6.02:1      lapis    5.63:1   7.68:1
 *   petal    5.45:1   7.59:1      amber    5.66:1   7.00:1
 *   ripple   4.67:1   9.85:1      aurora   5.26:1   7.84:1
 *   sage     5.60:1   8.06:1      lavender 6.77:1   6.16:1
 *
 * 最紧的是天青亮色 4.67:1（正文墨色最紧 8.22:1，落在暗色的表面二档上）——改任何
 * 变体的 accentL/bgL 前先重算，别只看「颜色好不好看」。
 */
/** One palette's colour set. `*L` / `*D` are the light / dark ends of a track. */
export interface PaletteEntry {
  /** Readable track, light mode — text, button fills, borders (WCAG AA). */
  accentL: string
  /** Readable track, dark mode. */
  accentD: string
  /** True colour of the traditional pigment: an `R, G, B` triple, thin marks only. */
  dye: string
  /** The same hue at 55% chroma — the only tier that may cover a large area. */
  wash: string
  bgL: string
  bgD: string
  txL: string
  txD: string
  sfL: string
  sfD: string
  sf2L: string
  sf2D: string
  /** Three hues that drive Bloom's micro-animations. */
  motionL: readonly [string, string, string]
  motionD: readonly [string, string, string]
}

export const PALETTE: Record<Variant, PaletteEntry> = {
  mist: {
    accentL: 'oklch(44% 0.05 259)',  accentD: 'oklch(72% 0.08 259)',
    dye: '66, 80, 102',
    wash: '72, 80, 92',
    bgL: 'oklch(92% 0.01 259)',      bgD: 'oklch(28% 0.02 259)',
    txL: 'oklch(25% 0.02 259)',      txD: 'oklch(96% 0.01 259)',
    sfL: 'oklch(89% 0.01 259)',      sfD: 'oklch(34% 0.02 259)',
    sf2L: 'oklch(86% 0.01 259)',     sf2D: 'oklch(40% 0.02 259)',
    motionL: ['oklch(44% 0.05 259)', 'oklch(44% 0.046 229)', 'oklch(44% 0.045 294)'],
    motionD: ['oklch(72% 0.08 259)', 'oklch(72% 0.074 229)', 'oklch(72% 0.072 294)'],
  },
  cinnabar: {
    accentL: 'oklch(48% 0.2 33)',  accentD: 'oklch(74% 0.15 33)',
    dye: '255, 70, 31',
    wash: '212, 116, 96',
    bgL: 'oklch(93% 0.005 33)',      bgD: 'oklch(28% 0.02 33)',
    txL: 'oklch(25% 0.02 33)',       txD: 'oklch(96% 0.01 33)',
    sfL: 'oklch(90% 0.005 33)',      sfD: 'oklch(34% 0.02 33)',
    sf2L: 'oklch(87% 0.005 33)',     sf2D: 'oklch(40% 0.02 33)',
    motionL: ['oklch(48% 0.2 33)', 'oklch(48% 0.184 3)', 'oklch(48% 0.18 68)'],
    motionD: ['oklch(74% 0.15 33)', 'oklch(74% 0.138 3)', 'oklch(74% 0.135 68)'],
  },
  petal: {
    accentL: 'oklch(50% 0.14 7)',  accentD: 'oklch(80% 0.09 7)',
    dye: '246, 190, 200',
    wash: '229, 198, 203',
    bgL: 'oklch(94% 0.01 7)',      bgD: 'oklch(28% 0.02 7)',
    txL: 'oklch(25% 0.02 7)',      txD: 'oklch(98% 0.01 7)',
    sfL: 'oklch(91% 0.015 7)',     sfD: 'oklch(34% 0.02 7)',
    sf2L: 'oklch(89% 0.015 7)',    sf2D: 'oklch(40% 0.02 7)',
    motionL: ['oklch(50% 0.14 7)', 'oklch(50% 0.129 337)', 'oklch(50% 0.126 42)'],
    motionD: ['oklch(80% 0.09 7)', 'oklch(80% 0.083 337)', 'oklch(80% 0.081 42)'],
  },
  ripple: {
    accentL: 'oklch(49.5% 0.09 209)',  accentD: 'oklch(80% 0.08 209)',
    dye: '155, 196, 203',
    wash: '170, 192, 196',
    bgL: 'oklch(92% 0.01 209)',      bgD: 'oklch(20% 0.02 209)',
    txL: 'oklch(25% 0.02 209)',      txD: 'oklch(96% 0.01 209)',
    sfL: 'oklch(89% 0.01 209)',      sfD: 'oklch(28% 0.02 209)',
    sf2L: 'oklch(87% 0.01 209)',     sf2D: 'oklch(38% 0.02 209)',
    motionL: ['oklch(49.5% 0.09 209)', 'oklch(49.5% 0.083 179)', 'oklch(49.5% 0.081 244)'],
    motionD: ['oklch(80% 0.08 209)', 'oklch(80% 0.074 179)', 'oklch(80% 0.072 244)'],
  },
  /* 竹青 hue 131：色相从旧档的 115 挪到竹叶的青绿区。 */
  sage: {
    accentL: 'oklch(46% 0.1 131)',  accentD: 'oklch(74% 0.1 131)',
    dye: '120, 146, 98',
    wash: '128, 142, 116',
    bgL: 'oklch(93% 0.011 131)',      bgD: 'oklch(20% 0.019 131)',
    txL: 'oklch(25% 0.02 131)',       txD: 'oklch(96% 0.011 131)',
    sfL: 'oklch(89.9% 0.009 131)',    sfD: 'oklch(27.9% 0.02 131)',
    sf2L: 'oklch(86.9% 0.009 131)',   sf2D: 'oklch(34% 0.03 131)',
    motionL: ['oklch(46% 0.1 131)', 'oklch(46% 0.092 101)', 'oklch(46% 0.09 166)'],
    motionD: ['oklch(74% 0.1 131)', 'oklch(74% 0.092 101)', 'oklch(74% 0.09 166)'],
  },
  /* 赭石 hue 62：赤铁矿的暖棕，比旧档（29）更靠橙，与琥珀（51）之间靠彩度和
     场景区分 —— 赭石铺面（墙）、琥珀做强调（树脂）。 */
  stone: {
    accentL: 'oklch(45% 0.09 62)',  accentD: 'oklch(74% 0.1 62)',
    dye: '132, 90, 51',
    wash: '119, 95, 75',
    bgL: 'oklch(91.9% 0.01 62)',      bgD: 'oklch(20.1% 0.019 62)',
    txL: 'oklch(25% 0.02 62)',        txD: 'oklch(95.9% 0.01 62)',
    sfL: 'oklch(89.1% 0.01 62)',      sfD: 'oklch(27.9% 0.02 62)',
    sf2L: 'oklch(86% 0.01 62)',       sf2D: 'oklch(33.9% 0.03 62)',
    motionL: ['oklch(45% 0.09 62)', 'oklch(45% 0.083 32)', 'oklch(45% 0.081 97)'],
    motionD: ['oklch(74% 0.1 62)', 'oklch(74% 0.092 32)', 'oklch(74% 0.09 97)'],
  },
  lapis: {
    accentL: 'oklch(46% 0.11 232)',   accentD: 'oklch(75% 0.1 232)',
    dye: '76, 141, 174',
    wash: '105, 138, 155',
    bgL: 'oklch(93.4% 0.006 232)',    bgD: 'oklch(23.1% 0.019 232)',
    txL: 'oklch(23% 0.02 232)',       txD: 'oklch(96.1% 0.008 232)',
    sfL: 'oklch(90.6% 0.008 232)',    sfD: 'oklch(30.1% 0.022 232)',
    sf2L: 'oklch(87.4% 0.013 232)',   sf2D: 'oklch(35.9% 0.025 232)',
    motionL: ['oklch(46% 0.11 232)', 'oklch(46% 0.101 202)', 'oklch(46% 0.099 267)'],
    motionD: ['oklch(75% 0.1 232)', 'oklch(75% 0.092 202)', 'oklch(75% 0.09 267)'],
  },
  /* 琥珀 hue 51（松脂化石黄褐）。与落霞（hue 54）只差 3°，刻意保留：
     琥珀压暗、彩度中等，读作「棕琥珀」；落霞提亮、彩度更高，读作「金霞」。 */
  amber: {
    accentL: 'oklch(48% 0.15 51)',  accentD: 'oklch(76% 0.13 51)',
    dye: '202, 105, 36',
    wash: '174, 121, 90',
    bgL: 'oklch(93.5% 0.008 51)',     bgD: 'oklch(26% 0.018 51)',
    txL: 'oklch(24% 0.02 51)',        txD: 'oklch(95% 0.008 51)',
    sfL: 'oklch(90.6% 0.01 51)',      sfD: 'oklch(32% 0.020 51)',
    sf2L: 'oklch(88% 0.014 51)',      sf2D: 'oklch(38% 0.022 51)',
    motionL: ['oklch(48% 0.15 51)', 'oklch(48% 0.138 21)', 'oklch(48% 0.135 86)'],
    motionD: ['oklch(76% 0.13 51)', 'oklch(76% 0.12 21)', 'oklch(76% 0.117 86)'],
  },
  /* 落霞 hue 54：传统色表里没有「落霞」这个固定值（纯诗意名），按 owner 定的
     「杏红」#FF8C31 落地 —— 暖霞橙，比琥珀亮一档、彩度高一档（accent C 0.16 对
     0.15、L 50 对 48），两套并排时是「金」与「棕」的区别。
     底色去黄那条规矩继续有效（bgL 彩度 0.004，见 bgL 一行）：暖色只集中在
     accent 与 motion 上，背景保持中性，否则大面积铺开就是「发黄的旧纸」。 */
  aurora: {
    accentL: 'oklch(50% 0.16 54)',   accentD: 'oklch(78% 0.14 54)',
    dye: '255, 140, 49',
    wash: '221, 159, 117',
    bgL: 'oklch(94% 0.004 54)',       bgD: 'oklch(24.5% 0.008 54)',
    txL: 'oklch(24% 0.012 54)',       txD: 'oklch(95% 0.005 54)',
    sfL: 'oklch(91.2% 0.005 54)',     sfD: 'oklch(30.5% 0.01 54)',
    sf2L: 'oklch(88.4% 0.007 54)',    sf2D: 'oklch(36.5% 0.012 54)',
    motionL: ['oklch(50% 0.16 54)', 'oklch(50% 0.147 24)', 'oklch(50% 0.144 89)'],
    motionD: ['oklch(78% 0.14 54)', 'oklch(78% 0.129 24)', 'oklch(78% 0.126 89)'],
  },
  /* 青莲 hue 311：青莲是李白自号，色取青紫色。彩度 0.21（与朱砂同级，是旧紫档的
     两倍），所以大面积一律走 wash 档；真色只出现在细线与标记上，一上面积就俗。 */
  lavender: {
    accentL: 'oklch(45% 0.2 311)',   accentD: 'oklch(73% 0.15 311)',
    dye: '128, 29, 174',
    wash: '111, 69, 138',
    bgL: 'oklch(93% 0.012 311)',      bgD: 'oklch(26% 0.02 311)',
    txL: 'oklch(25% 0.02 311)',       txD: 'oklch(96% 0.012 311)',
    sfL: 'oklch(90% 0.014 311)',      sfD: 'oklch(32% 0.022 311)',
    sf2L: 'oklch(87.5% 0.016 311)',   sf2D: 'oklch(38% 0.024 311)',
    motionL: ['oklch(45% 0.2 311)', 'oklch(45% 0.184 281)', 'oklch(45% 0.18 346)'],
    motionD: ['oklch(73% 0.15 311)', 'oklch(73% 0.138 281)', 'oklch(73% 0.135 346)'],
  },
}

/** Display names for one palette: Chinese name, English name, source poem. */
export interface VariantLabel {
  zh: string
  en: string
  /** The line of classical poetry the colour is drawn from. */
  poem: string
}

export const VARIANT_LABELS: Record<Variant, VariantLabel> = {
  // 中文名一律「两字 · 中国风 · 有出处」，且必须对得上实际色相（owner 2026-09-15 定）；
  // 2026-10-16 起每个名字本身就是一种有据可查的传统色（不再只是意象）。
  // key 全部保持不动 —— key 写进了用户的本地偏好，改 key 等于把人家选好的主题弄丢。
  //
  // poem 是配色右侧那一列：原来放英文名（Mist/Cinnabar…），对中文用户没有信息量
  // （owner：「后面的英文没啥意义，不如一句诗词呢」）。换成该色的出处诗句后，
  // 中国风就从名字渗进了界面本身。en 保留给英文 locale。
  mist:     { zh: '黛蓝', en: 'Mist',      poem: '山色有无中' },   // 石黛 #425066 · hue 259 · 王维《汉江临泛》
  cinnabar: { zh: '朱砂', en: 'Cinnabar',  poem: '日出江花红胜火' },   // 硫化汞 #FF461F · hue 33 · 白居易《忆江南》
  petal:    { zh: '桃夭', en: 'Petal',     poem: '灼灼其华' },     // #F6BEC8 · hue 7 ·《诗经·周南·桃夭》
  ripple:   { zh: '天青', en: 'Ripple',    poem: '雨过天青云破处' },   // 汝窑釉 #9BC4CB · hue 209 · 宋徽宗品汝窑语
  sage:     { zh: '竹青', en: 'Sage',      poem: '绿竹猗猗' },     // 竹色 #789262 · hue 131 ·《诗经·卫风·淇奥》
  stone:    { zh: '赭石', en: 'Stone',     poem: '秋山敛余照' },   // 赤铁矿 #845A33 · hue 62 · 王维《木兰柴》
  lapis:    { zh: '青金', en: 'Lapis',     poem: '碧海青天夜夜心' },   // 青金石 #4C8DAE · hue 232 · 李商隐《嫦娥》
  amber:    { zh: '琥珀', en: 'Amber',     poem: '玉碗盛来琥珀光' },   // 松脂化石 #CA6924 · hue 51 · 李白《客中行》
  aurora:   { zh: '落霞', en: 'Afterglow', poem: '落霞与孤鹜齐飞' },   // 杏红 #FF8C31 · hue 54 · 王勃《滕王阁序》
  lavender: { zh: '青莲', en: 'Lavender',  poem: '清水出芙蓉' },   // 青紫 #801DAE · hue 311 · 李白《经乱离后天恩流夜郎》
}

/** oklch 混透明度的简写（在 oklch 空间里混合，色相/彩度不漂移） */
export const mix = (c: string, p: number): string => `color-mix(in oklch, ${c}, transparent ${p}%)`

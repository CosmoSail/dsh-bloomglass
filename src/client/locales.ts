/**
 * Settings copy. Chinese is the key-set source of truth.
 *
 * Palette names are not here — they come from `palette.ts`, which carries the
 * Chinese name, the English name, and the source poem for all ten palettes.
 */
export const zh = {
  nav: 'Bloom Glass',
  title: 'Bloom Glass 主题',
  description: '十套莫兰迪配色打底，可选一张壁纸铺满窗口、界面以磨砂玻璃叠上去。浅色 / 深色仍跟随官方外观。',
  palette: '配色',
  frost: '壁纸与玻璃',
  enable: '启用壁纸与磨砂',
  drop: '把图片拖到这里，或点击选择',
  dropReplace: '更换图片',
  choose: '选择图片',
  save: '保存',
  saved: '已保存',
  unsaved: '未保存',
  remove: '删除',
  glass: '玻璃浓度',
  blur: '磨砂模糊',
  saturate: '色彩饱和',
  dim: '壁纸压暗',
  busy: '正在读取图片…',
  empty: '还没有壁纸，当前为纯配色模式',
  errorType: '只支持 JPEG、PNG、WebP 或 GIF。',
  errorGeneric: '无法读取这张图片，请换一张再试。',
} satisfies Record<string, string>

export type BloomglassKey = keyof typeof zh

export const en = {
  nav: 'Bloom Glass',
  title: 'Bloom Glass theme',
  description: 'Ten Morandi palettes underneath, and optionally one wallpaper filling the window with the chrome frosted on top. Light / Dark still follow official appearance.',
  palette: 'Palette',
  frost: 'Wallpaper & glass',
  enable: 'Enable wallpaper and frost',
  drop: 'Drop an image here, or click to choose',
  dropReplace: 'Replace image',
  choose: 'Choose image',
  save: 'Save',
  saved: 'Saved',
  unsaved: 'Unsaved',
  remove: 'Delete',
  glass: 'Glass',
  blur: 'Blur',
  saturate: 'Saturation',
  dim: 'Dim',
  busy: 'Reading image…',
  empty: 'No wallpaper yet — palette only',
  errorType: 'JPEG, PNG, WebP, or GIF only.',
  errorGeneric: 'Could not read that image. Try another file.',
} satisfies Record<BloomglassKey, string>

/**
 * Generate the showcase wallpaper.
 *
 * The wallpaper is produced procedurally, pixel by pixel, so this package
 * ships no third-party photograph: no licence to track and no watermark.
 * The look echoes deep-sky astrophotography (nebula clouds, a bright core,
 * scattered stars) because that is the kind of image people actually put
 * behind a frosted window.
 *
 * Output compresses well on purpose: the clouds are smooth, low-frequency
 * noise, so `deflate` shrinks them far more than white noise would.
 *
 * Usage:  node scripts/generate-wallpaper.mjs [width] [height]
 * Emits:  docs/showcase/wallpaper.png
 */
import { deflateSync } from 'node:zlib'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'showcase', 'wallpaper.png')
const WIDTH = Number(process.argv[2] ?? 1600)
const HEIGHT = Number(process.argv[3] ?? 900)

/* ── deterministic noise ──────────────────────────────────────────────────── */

/** Hash a lattice point to [0,1). */
function hash2(x, y, seed) {
  let h = x * 374761393 + y * 668265263 + seed * 2147483647
  h = (h ^ (h >>> 13)) >>> 0
  h = Math.imul(h, 1274126177) >>> 0
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

const smooth = (t) => t * t * (3 - 2 * t)

/** Value noise with smoothstep interpolation. */
function valueNoise(x, y, seed) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = smooth(x - xi)
  const yf = smooth(y - yi)
  const a = hash2(xi, yi, seed)
  const b = hash2(xi + 1, yi, seed)
  const c = hash2(xi, yi + 1, seed)
  const d = hash2(xi + 1, yi + 1, seed)
  return (a * (1 - xf) + b * xf) * (1 - yf) + (c * (1 - xf) + d * xf) * yf
}

/** Fractal Brownian motion: stacked octaves of value noise. */
function fbm(x, y, seed, octaves = 6, gain = 0.5, lacunarity = 2) {
  let sum = 0
  let amp = 1
  let norm = 0
  let fx = x
  let fy = y
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise(fx, fy, seed + i * 17)
    norm += amp
    amp *= gain
    fx *= lacunarity
    fy *= lacunarity
  }
  return sum / norm
}

/* ── colour ramp ──────────────────────────────────────────────────────────── */

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)
const mix = (a, b, t) => a + (b - a) * t

/** Nebula density → colour. Stops run from empty space to a hot core. */
const STOPS = [
  { at: 0.00, rgb: [5, 7, 15] },      // deep space
  { at: 0.38, rgb: [26, 22, 58] },    // indigo
  { at: 0.56, rgb: [74, 42, 112] },   // violet
  { at: 0.70, rgb: [140, 60, 122] },  // magenta
  { at: 0.82, rgb: [198, 104, 116] }, // rose
  { at: 0.91, rgb: [226, 150, 104] }, // warm highlight
  { at: 1.00, rgb: [246, 232, 214] }, // core
]

function ramp(t) {
  const v = clamp01(t)
  for (let i = 1; i < STOPS.length; i++) {
    if (v <= STOPS[i].at) {
      const a = STOPS[i - 1]
      const b = STOPS[i]
      const k = (v - a.at) / (b.at - a.at)
      return [mix(a.rgb[0], b.rgb[0], k), mix(a.rgb[1], b.rgb[1], k), mix(a.rgb[2], b.rgb[2], k)]
    }
  }
  return STOPS[STOPS.length - 1].rgb
}

/* ── render ───────────────────────────────────────────────────────────────── */

const rgba = Buffer.alloc(WIDTH * HEIGHT * 4)

for (let y = 0; y < HEIGHT; y++) {
  for (let x = 0; x < WIDTH; x++) {
    const u = x / WIDTH
    const v = y / HEIGHT

    // Domain warp: displacing the sample point turns smooth noise into the
    // filamentary, folded structure real nebulae have.
    const wx = fbm(u * 3.1, v * 3.1, 11, 4) - 0.5
    const wy = fbm(u * 3.1 + 5.2, v * 3.1 + 1.3, 23, 4) - 0.5
    const sx = u * 2.6 + wx * 1.5
    const sy = v * 2.6 + wy * 1.5

    let density = fbm(sx, sy, 3, 6)
    // Sharpen: push mid tones apart so clouds read as clouds, not fog.
    density = clamp01((density - 0.34) * 2.05)

    // A broad diagonal glow, as if a bright region sits off-centre.
    const gx = u - 0.62
    const gy = v - 0.42
    const glow = Math.exp(-(gx * gx * 3.4 + gy * gy * 5.2) * 2.6)
    density = clamp01(density * 0.82 + glow * 0.55)

    let [r, g, b] = ramp(density)

    // Cool rim light on the thin edges of the clouds.
    const rim = clamp01((density - 0.42) * (1 - density) * 4.2)
    r = mix(r, 92, rim * 0.45)
    g = mix(g, 168, rim * 0.45)
    b = mix(b, 208, rim * 0.45)

    // Vignette keeps the corners quiet so UI text stays legible over them.
    const cx = (u - 0.5) * 2
    const cy = (v - 0.5) * 2
    const vig = 1 - clamp01((cx * cx + cy * cy) * 0.34)
    r *= vig
    g *= vig
    b *= vig

    // Stars: sparse, brighter toward the darker field.
    const starField = hash2(x, y, 97)
    if (starField > 0.99965) {
      const power = (starField - 0.99965) / 0.00035
      const lum = 150 + power * 105
      const t = 0.55 + 0.45 * (1 - density)
      r = mix(r, lum, t)
      g = mix(g, lum, t)
      b = mix(b, Math.min(255, lum * 1.04), t)
    }

    const i = (y * WIDTH + x) * 4
    rgba[i] = r
    rgba[i + 1] = g
    rgba[i + 2] = b
    rgba[i + 3] = 255
  }
}

/* ── minimal PNG encoder (RGBA, 8-bit, filter 0) ──────────────────────────── */

const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([length, body, crc])
}

const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(WIDTH, 0)
ihdr.writeUInt32BE(HEIGHT, 4)
ihdr[8] = 8   // bit depth
ihdr[9] = 6   // colour type: RGBA
ihdr[10] = 0  // deflate
ihdr[11] = 0  // adaptive filtering
ihdr[12] = 0  // no interlace

const stride = WIDTH * 4
const raw = Buffer.alloc((stride + 1) * HEIGHT)
for (let y = 0; y < HEIGHT; y++) {
  raw[y * (stride + 1)] = 0 // filter: none
  rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
}

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
])

await mkdir(dirname(OUT), { recursive: true })
await writeFile(OUT, png)
process.stdout.write(`wrote ${OUT} — ${WIDTH}×${HEIGHT}, ${(png.length / 1024).toFixed(0)} kB\n`)

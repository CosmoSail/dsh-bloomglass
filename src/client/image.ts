import { ALLOWED_TYPES } from './constants.ts'

/** Stored wallpaper metadata plus the bytes that paint the window. */
export interface WallpaperRecord {
  /** Raw file bytes as a JSON/IDB-safe number array. */
  bytes: number[]
  mime: string
  name: string
  width: number
  height: number
  updatedAt: number
}

/** Copy an ArrayBuffer into a plain number array that survives structured clone. */
export function bytesOf(buffer: ArrayBuffer): number[] {
  return Array.from(new Uint8Array(buffer))
}

/** Build a Blob for object URLs, keeping the original encoded type. */
export function wallpaperBlob(record: Pick<WallpaperRecord, 'bytes' | 'mime'>): Blob {
  const type = ALLOWED_TYPES.includes(record.mime as (typeof ALLOWED_TYPES)[number])
    ? record.mime
    : 'image/jpeg'
  return new Blob([Uint8Array.from(record.bytes)], { type })
}

export class ImageValidationError extends Error {
  override readonly name = 'ImageValidationError'
}

const MAGIC: readonly { mime: (typeof ALLOWED_TYPES)[number]; test: (b: Uint8Array) => boolean }[] = [
  { mime: 'image/jpeg', test: b => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: 'image/png', test: b => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { mime: 'image/gif', test: b => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38 },
  { mime: 'image/webp', test: b => b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50 },
]

export function normalizeImageType(type: string): (typeof ALLOWED_TYPES)[number] | undefined {
  if (type === 'image/jpg') return 'image/jpeg'
  return ALLOWED_TYPES.find(allowed => allowed === type)
}

/**
 * Reject files that are not a supported image. Size is intentionally unbounded.
 * @param file - browser File from an <input> or drop.
 */
export function assertImageFile(file: File): void {
  if (file.size <= 0) throw new ImageValidationError('empty image')
  if (file.type !== '' && normalizeImageType(file.type) === undefined) {
    throw new ImageValidationError(`unsupported type: ${file.type}`)
  }
}

/** Confirm the file header matches a declared or inferred image type. */
export async function assertImageMagic(file: File): Promise<(typeof ALLOWED_TYPES)[number]> {
  const header = new Uint8Array(await readFileBytes(file.slice(0, 16)))
  const declared = normalizeImageType(file.type)
  const match = MAGIC.find(entry => entry.test(header))
  if (match === undefined) throw new ImageValidationError(`unsupported type: ${file.type || 'unknown'}`)
  if (declared !== undefined && declared !== match.mime) {
    throw new ImageValidationError(`unsupported type: ${file.type}`)
  }
  return match.mime
}

/** Read width/height from the container when the header is well-formed. */
export function readImageSize(bytes: Uint8Array): { width: number; height: number } | undefined {
  if (bytes.length >= 24 && MAGIC[1]!.test(bytes)) {
    return { width: readU32(bytes, 16), height: readU32(bytes, 20) }
  }
  if (bytes.length >= 10 && MAGIC[2]!.test(bytes)) {
    return {
      width: bytes[6]! | (bytes[7]! << 8),
      height: bytes[8]! | (bytes[9]! << 8),
    }
  }
  if (bytes.length >= 30 && MAGIC[3]!.test(bytes)) return readWebpSize(bytes)
  if (bytes.length >= 4 && MAGIC[0]!.test(bytes)) return readJpegSize(bytes)
  return undefined
}

/** Accept a record that came back from IndexedDB. */
export function sanitizeWallpaperRecord(raw: unknown): WallpaperRecord | undefined {
  if (raw === null || typeof raw !== 'object') return undefined
  const value = raw as Partial<WallpaperRecord>
  if (!Array.isArray(value.bytes) || value.bytes.length < 1) return undefined
  const mime = normalizeImageType(String(value.mime ?? '')) ?? 'image/jpeg'
  const width = Number(value.width)
  const height = Number(value.height)
  return {
    bytes: value.bytes.map(item => Number(item) & 0xff),
    mime,
    name: typeof value.name === 'string' ? value.name : 'wallpaper',
    width: Number.isFinite(width) && width > 0 ? width : 0,
    height: Number.isFinite(height) && height > 0 ? height : 0,
    updatedAt: Number(value.updatedAt) || 0,
  }
}

/**
 * Keep the original encoded image. No resize and no byte cap.
 */
export async function prepareWallpaper(file: File): Promise<WallpaperRecord> {
  assertImageFile(file)
  const mime = await assertImageMagic(file)
  const source = new Uint8Array(await readFileBytes(file))
  const declared = readImageSize(source)
  return {
    bytes: Array.from(source),
    mime,
    name: file.name,
    width: declared?.width ?? 0,
    height: declared?.height ?? 0,
    updatedAt: Date.now(),
  }
}

function readU32(bytes: Uint8Array, offset: number): number {
  return ((bytes[offset]! << 24) | (bytes[offset + 1]! << 16) | (bytes[offset + 2]! << 8) | bytes[offset + 3]!) >>> 0
}

function readWebpSize(bytes: Uint8Array): { width: number; height: number } | undefined {
  const fourcc = String.fromCharCode(bytes[12]!, bytes[13]!, bytes[14]!, bytes[15]!)
  if (fourcc === 'VP8X' && bytes.length >= 30) {
    return {
      width: 1 + (bytes[24]! | (bytes[25]! << 8) | (bytes[26]! << 16)),
      height: 1 + (bytes[27]! | (bytes[28]! << 8) | (bytes[29]! << 16)),
    }
  }
  if (fourcc === 'VP8 ' && bytes.length >= 30 && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) {
    return {
      width: (bytes[26]! | (bytes[27]! << 8)) & 0x3fff,
      height: (bytes[28]! | (bytes[29]! << 8)) & 0x3fff,
    }
  }
  if (fourcc === 'VP8L' && bytes.length >= 25 && bytes[20] === 0x2f) {
    const bits = bytes[21]! | (bytes[22]! << 8) | (bytes[23]! << 16) | (bytes[24]! << 24)
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 }
  }
  return undefined
}

function readJpegSize(bytes: Uint8Array): { width: number; height: number } | undefined {
  let offset = 2
  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 0xff) return undefined
    const marker = bytes[offset + 1]!
    offset += 2
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) continue
    const length = (bytes[offset]! << 8) | bytes[offset + 1]!
    if (length < 2) return undefined
    const sof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc
    if (sof) {
      return {
        height: (bytes[offset + 3]! << 8) | bytes[offset + 4]!,
        width: (bytes[offset + 5]! << 8) | bytes[offset + 6]!,
      }
    }
    offset += length
  }
  return undefined
}

function readFileBytes(file: Blob): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === 'function') return file.arrayBuffer()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => { resolve(reader.result as ArrayBuffer) }
    reader.onerror = () => { reject(reader.error ?? new Error('failed to read image')) }
    reader.readAsArrayBuffer(file)
  })
}

import { describe, expect, it } from 'vitest'
import {
  assertImageFile, assertImageMagic, ImageValidationError,
  readImageSize, sanitizeWallpaperRecord,
} from '../src/client/image.ts'

const file = (type: string, size: number): File =>
  new File([new Uint8Array(size)], 'pic.jpg', { type })

describe('assertImageFile', () => {
  it('accepts supported types of any size', () => {
    expect(() => { assertImageFile(file('image/jpeg', 16)) }).not.toThrow()
    expect(() => { assertImageFile(file('image/png', 16)) }).not.toThrow()
    expect(() => { assertImageFile(file('image/webp', 16)) }).not.toThrow()
    expect(() => { assertImageFile(file('image/gif', 16)) }).not.toThrow()
    expect(() => { assertImageFile(file('image/jpeg', 20 * 1024 * 1024)) }).not.toThrow()
  })

  it('rejects other types and empty files', () => {
    expect(() => { assertImageFile(file('image/svg+xml', 16)) }).toThrow(ImageValidationError)
    expect(() => { assertImageFile(file('application/octet-stream', 16)) }).toThrow(/unsupported/)
    expect(() => { assertImageFile(file('image/jpeg', 0)) }).toThrow(ImageValidationError)
  })
})

describe('assertImageMagic', () => {
  it('accepts a JPEG SOI header and rejects a mismatched payload', async () => {
    const jpeg = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0])], 'a.jpg', { type: 'image/jpeg' })
    await expect(assertImageMagic(jpeg)).resolves.toBe('image/jpeg')
    const fake = new File([new Uint8Array(16)], 'a.jpg', { type: 'image/jpeg' })
    await expect(assertImageMagic(fake)).rejects.toThrow(ImageValidationError)
  })
})

describe('readImageSize', () => {
  it('reads PNG IHDR, GIF screen, and JPEG SOF dimensions', () => {
    const png = Uint8Array.of(
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52,
      0, 0, 0, 10, 0, 0, 0, 8, 8, 2, 0, 0, 0,
    )
    expect(readImageSize(png)).toEqual({ width: 10, height: 8 })

    const gif = Uint8Array.of(0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 10, 0, 8, 0)
    expect(readImageSize(gif)).toEqual({ width: 10, height: 8 })

    const jpeg = Uint8Array.of(
      0xff, 0xd8, 0xff, 0xc0, 0, 11, 8, 0, 8, 0, 10, 3, 0,
    )
    expect(readImageSize(jpeg)).toEqual({ width: 10, height: 8 })
  })
})

describe('sanitizeWallpaperRecord', () => {
  it('keeps jpeg and png of any pixel size', () => {
    expect(sanitizeWallpaperRecord({
      bytes: [1, 2, 3], mime: 'image/png', name: 'a.png', width: 10, height: 8, updatedAt: 1,
    })?.mime).toBe('image/png')
    expect(sanitizeWallpaperRecord({
      bytes: [1], mime: 'image/jpeg', name: 'a.jpg', width: 65535, height: 65535, updatedAt: 1,
    })?.width).toBe(65535)
    expect(sanitizeWallpaperRecord({ bytes: [] })).toBeUndefined()
  })
})

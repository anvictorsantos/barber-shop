import { describe, expect, it } from 'vitest'

import { imageMimeType } from '@/lib/uploads/image'
import { imageUrlSchema } from '@/lib/validation/image'

describe('image upload', () => {
  it('detects allowed image signatures', () => {
    expect(imageMimeType(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg')
    expect(imageMimeType(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(
      'image/png',
    )
    expect(imageMimeType(Uint8Array.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]))).toBe('image/gif')
    expect(
      imageMimeType(Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50])),
    ).toBe('image/webp')
  })

  it('rejects content that is not an allowed image', () => {
    expect(imageMimeType(Uint8Array.from([0x3c, 0x73, 0x76, 0x67]))).toBeNull()
    expect(imageMimeType(new Uint8Array())).toBeNull()
  })

  it('accepts public paths and http(s) URLs', () => {
    expect(imageUrlSchema.parse('/barbers/hinner.webp')).toBe('/barbers/hinner.webp')
    expect(imageUrlSchema.parse('https://images.unsplash.com/foto.webp')).toBe(
      'https://images.unsplash.com/foto.webp',
    )
    expect(imageUrlSchema.parse('')).toBe('')
  })

  it('rejects other schemes', () => {
    expect(imageUrlSchema.safeParse('javascript:alert(1)').success).toBe(false)
    expect(imageUrlSchema.safeParse('//evil.example/foto.webp').success).toBe(false)
    expect(imageUrlSchema.safeParse('not-a-url').success).toBe(false)
  })
})

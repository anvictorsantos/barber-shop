import { describe, expect, it } from 'vitest'

import { createOpaqueToken, createOtp, hashesMatch, hashToken } from '@/lib/auth/tokens'

describe('auth tokens', () => {
  it('creates a six digit OTP', () => {
    expect(createOtp()).toMatch(/^\d{6}$/)
  })

  it('creates unique opaque tokens', () => {
    expect(createOpaqueToken()).not.toBe(createOpaqueToken())
  })

  it('hashes deterministically and compares safely', () => {
    const token = '123456'
    const hash = hashToken(token)
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
    expect(hashesMatch(hash, hashToken(token))).toBe(true)
    expect(hashesMatch(hash, hashToken('654321'))).toBe(false)
    expect(hashesMatch(hash, 'short')).toBe(false)
  })
})

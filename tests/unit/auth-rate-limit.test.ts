import { beforeEach, describe, expect, it } from 'vitest'

import { resetRateLimits, takeRateLimit } from '@/lib/auth/rate-limit'

describe('rate limit', () => {
  beforeEach(() => {
    resetRateLimits('test:')
  })

  it('allows requests up to the limit and then blocks', () => {
    expect(takeRateLimit('test:login', 2, 1000, 1000).allowed).toBe(true)
    expect(takeRateLimit('test:login', 2, 1000, 1100).allowed).toBe(true)

    const blocked = takeRateLimit('test:login', 2, 1000, 1200)
    expect(blocked.allowed).toBe(false)
    expect(blocked.retryAfterMs).toBe(800)
  })

  it('resets after the window', () => {
    takeRateLimit('test:otp', 1, 1000, 1000)
    expect(takeRateLimit('test:otp', 1, 1000, 1500).allowed).toBe(false)
    expect(takeRateLimit('test:otp', 1, 1000, 2001).allowed).toBe(true)
  })

  it('keeps keys independent', () => {
    takeRateLimit('test:a', 1, 1000, 1000)
    expect(takeRateLimit('test:b', 1, 1000, 1000).allowed).toBe(true)
  })
})

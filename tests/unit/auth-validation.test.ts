import { describe, expect, it } from 'vitest'

import { registerSchema, resetPasswordSchema, verifyPhoneSchema } from '@/lib/validation/auth'

describe('auth validation', () => {
  it('accepts a valid registration', () => {
    const parsed = registerSchema.safeParse({
      name: 'João Silva',
      identifier: 'joao@example.com',
      password: 'secret123',
    })
    expect(parsed.success).toBe(true)
  })

  it('rejects a short password', () => {
    const parsed = registerSchema.safeParse({
      name: 'João Silva',
      identifier: 'joao@example.com',
      password: 'short',
    })
    expect(parsed.success).toBe(false)
  })

  it('rejects a malformed OTP', () => {
    expect(verifyPhoneSchema.safeParse({ phone: '+5531999999999', code: '12345' }).success).toBe(
      false,
    )
  })

  it('accepts reset by token or by phone OTP', () => {
    expect(
      resetPasswordSchema.safeParse({
        token: 'a'.repeat(24),
        password: 'secret123',
      }).success,
    ).toBe(true)
    expect(
      resetPasswordSchema.safeParse({
        phone: '+5531999999999',
        code: '123456',
        password: 'secret123',
      }).success,
    ).toBe(true)
  })
})

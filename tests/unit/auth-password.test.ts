import { describe, expect, it } from 'vitest'

import { hashPassword, verifyPassword } from '@/lib/auth/password'

describe('password hashing', () => {
  it('hashes with Argon2id and verifies the password', async () => {
    const password = 'correct horse battery staple'
    const passwordHash = await hashPassword(password)

    expect(passwordHash).not.toContain(password)
    expect(passwordHash.startsWith('$argon2id$')).toBe(true)
    await expect(verifyPassword(passwordHash, password)).resolves.toBe(true)
  })

  it('rejects a wrong password', async () => {
    const passwordHash = await hashPassword('correct horse battery staple')
    await expect(verifyPassword(passwordHash, 'wrong')).resolves.toBe(false)
  })

  it('returns false for a malformed hash', async () => {
    await expect(verifyPassword('not-a-hash', 'password')).resolves.toBe(false)
  })
})

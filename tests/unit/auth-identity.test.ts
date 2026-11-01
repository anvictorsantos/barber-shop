import { describe, expect, it } from 'vitest'

import {
  emailDomain,
  normalizeEmail,
  normalizeIdentifier,
  normalizePhone,
} from '@/lib/auth/identity'

describe('identity normalization', () => {
  it('normalizes email casing and whitespace', () => {
    expect(normalizeEmail('  Foo@Example.COM ')).toBe('foo@example.com')
    expect(normalizeEmail('foo@localhost')).toBeNull()
    expect(normalizeEmail('not-an-email')).toBeNull()
  })

  it('extracts a valid email domain', () => {
    expect(emailDomain('user@example.com')).toBe('example.com')
    expect(emailDomain('user@')).toBeNull()
    expect(emailDomain('user@-bad.com')).toBeNull()
  })

  it('normalizes phone numbers to E.164', () => {
    expect(normalizePhone('31 98881-5243')).toBe('+5531988815243')
    expect(normalizePhone('+1 415 555 2671')).toBe('+14155552671')
    expect(normalizePhone('123')).toBeNull()
  })

  it('recognizes either identifier', () => {
    expect(normalizeIdentifier(' Foo@Example.com ')).toEqual({
      kind: 'email',
      value: 'foo@example.com',
    })
    expect(normalizeIdentifier('+55 31 98881-5243')).toEqual({
      kind: 'phone',
      value: '+5531988815243',
    })
    expect(normalizeIdentifier('not-an-identifier')).toBeNull()
  })
})

import { describe, expect, it } from 'vitest'

import { normalizeSslMode } from '@/lib/db/connection-string'

describe('normalizeSslMode', () => {
  it.each(['prefer', 'require', 'verify-ca'])('rewrites sslmode=%s to verify-full', (mode) => {
    expect(normalizeSslMode(`postgresql://u:p@db.example.com/app?sslmode=${mode}`)).toBe(
      'postgresql://u:p@db.example.com/app?sslmode=verify-full',
    )
  })

  it('keeps explicit modes untouched', () => {
    const verifyFull = 'postgresql://u:p@db.example.com/app?sslmode=verify-full'
    const disabled = 'postgresql://u:p@db.example.com/app?sslmode=disable'
    expect(normalizeSslMode(verifyFull)).toBe(verifyFull)
    expect(normalizeSslMode(disabled)).toBe(disabled)
  })

  it('leaves URLs without sslmode untouched', () => {
    const url = 'postgresql://u:p@db.example.com/app?schema=public'
    expect(normalizeSslMode(url)).toBe(url)
  })

  it('respects libpq compatibility mode', () => {
    const url = 'postgresql://u:p@db.example.com/app?sslmode=require&uselibpqcompat=true'
    expect(normalizeSslMode(url)).toBe(url)
  })

  it('preserves the other parameters', () => {
    const url = normalizeSslMode(
      'postgresql://u:p@db.example.com/app?sslmode=require&schema=public&channel_binding=require',
    )
    expect(url).toContain('sslmode=verify-full')
    expect(url).toContain('schema=public')
    expect(url).toContain('channel_binding=require')
  })
})

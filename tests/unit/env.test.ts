import { describe, expect, it } from 'vitest'

import { parseServerEnv } from '@/lib/env'

const base = {
  NODE_ENV: 'development',
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/barbearia',
  DIRECT_URL: 'postgresql://user:pass@localhost:5432/barbearia',
  APP_URL: 'http://localhost:3000',
  SESSION_SECRET: 'a'.repeat(32),
  CRON_SECRET: 'b'.repeat(16),
} as NodeJS.ProcessEnv

describe('parseServerEnv', () => {
  it('parses defaults', () => {
    const env = parseServerEnv(base)
    expect(env.DEMO_MODE).toBe(false)
    expect(env.SHOP_TIMEZONE).toBe('America/Sao_Paulo')
    expect(env.EMAIL_ENABLED).toBe(true)
  })

  it('parses boolean strings', () => {
    const env = parseServerEnv({ ...base, DEMO_MODE: 'true', EMAIL_ENABLED: 'false' })
    expect(env.DEMO_MODE).toBe(true)
    expect(env.EMAIL_ENABLED).toBe(false)
  })

  it('rejects a short session secret', () => {
    expect(() => parseServerEnv({ ...base, SESSION_SECRET: 'short' })).toThrow(/SESSION_SECRET/)
  })

  it('rejects demo mode in production', () => {
    expect(() => parseServerEnv({ ...base, NODE_ENV: 'production', DEMO_MODE: 'true' })).toThrow(
      /DEMO_MODE is forbidden in production/,
    )
  })
})

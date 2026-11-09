import { describe, expect, it } from 'vitest'

import { isTransientDbError } from '@/lib/db/prisma'

describe('isTransientDbError', () => {
  it('treats dropped sockets and unreachable databases as transient', () => {
    expect(isTransientDbError({ code: 'ETIMEDOUT' })).toBe(true)
    expect(isTransientDbError({ code: 'ECONNRESET' })).toBe(true)
    expect(isTransientDbError({ code: 'P1017' })).toBe(true)
  })

  it('treats a pool connection timeout as transient', () => {
    expect(isTransientDbError(new Error('timeout exceeded when trying to connect'))).toBe(true)
  })

  it('leaves query errors alone', () => {
    expect(isTransientDbError({ code: 'P2002' })).toBe(false)
    expect(isTransientDbError(new Error('Unique constraint failed'))).toBe(false)
    expect(isTransientDbError(undefined)).toBe(false)
  })
})

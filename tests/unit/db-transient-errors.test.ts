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

  it('treats a Neon idle-socket drop as transient', () => {
    expect(isTransientDbError(new Error('Connection terminated due to connection timeout'))).toBe(
      true,
    )
    expect(isTransientDbError(new Error('Connection terminated unexpectedly'))).toBe(true)
  })

  it('finds the pg error Prisma nests under meta.driverAdapterError', () => {
    expect(
      isTransientDbError({
        name: 'PrismaClientKnownRequestError',
        code: 'P2039',
        message: '\nInvalid `prisma.review.findMany()` invocation:',
        meta: {
          driverAdapterError: {
            cause: { kind: 'postgres', code: '57P03', message: 'the database system is starting up' },
          },
        },
      }),
    ).toBe(true)
  })

  it('retries when Prisma gives up classifying the driver error', () => {
    expect(
      isTransientDbError({
        code: 'P2039',
        message: '\nInvalid `prisma.review.findMany()` invocation:\n\n',
      }),
    ).toBe(true)
    expect(
      isTransientDbError({
        code: 'P2039',
        message:
          '\nInvalid `prisma.review.findMany()` invocation in\n/app/lib/home/queries.ts:87:30\n\nDatabase error. Code: `42P01`. Message: `relation "reviews" does not exist`',
      }),
    ).toBe(false)
  })

  it('retries a pool client that was dropped mid-session', () => {
    expect(isTransientDbError(new Error('Client has encountered a connection error and is not queryable'))).toBe(
      true,
    )
  })

  it('leaves query errors alone', () => {
    expect(isTransientDbError({ code: 'P2002' })).toBe(false)
    expect(isTransientDbError({ code: 'P2025' })).toBe(false)
    expect(isTransientDbError(new Error('Unique constraint failed'))).toBe(false)
    expect(isTransientDbError(undefined)).toBe(false)
  })
})

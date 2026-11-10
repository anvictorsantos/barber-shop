import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const TRANSIENT_DB_CODES = new Set([
  'ETIMEDOUT',
  'ECONNRESET',
  'ECONNREFUSED',
  'ENOTFOUND',
  'P1000',
  'P1001',
  'P1002',
  'P1003',
  'P1008',
  'P1010',
  'P1011',
  'P1017',
  'P2024',
  '08000',
  '08003',
  '08006',
  '57P01',
  '57P03',
  '53300',
])

const TRANSIENT_MESSAGES = [
  'Connection terminated',
  'timeout exceeded when trying to connect',
  'connection error and is not queryable',
]

const READ_RETRIES = 3
const RETRY_DELAYS_MS = [250, 750]

// Prisma prints an empty body when it cannot classify a driver error, which hides the cause.
function isEmptyPrismaInvocation(message: string): boolean {
  const [firstLine, ...rest] = message.trimStart().split('\n')
  return (
    firstLine?.includes('Invalid `prisma.') === true &&
    firstLine.includes('invocation') &&
    rest.join('').trim() === ''
  )
}

const READ_OPERATIONS = new Set([
  'findUnique',
  'findUniqueOrThrow',
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
])

export function isTransientDbError(error: unknown): boolean {
  const seen = new Set<unknown>()
  const pending: unknown[] = [error]

  while (pending.length > 0) {
    const current = pending.pop()
    if (!current || typeof current !== 'object' || seen.has(current)) continue
    seen.add(current)

    const { code, message, cause, meta } = current as {
      code?: unknown
      message?: unknown
      cause?: unknown
      meta?: { driverAdapterError?: unknown }
    }
    if (typeof code === 'string' && TRANSIENT_DB_CODES.has(code)) return true
    if (typeof message === 'string') {
      // Matches also live on driverAdapterError.cause, where Prisma stores the pg error.
      if (TRANSIENT_MESSAGES.some((fragment) => message.includes(fragment))) return true
      if (isEmptyPrismaInvocation(message)) return true
    }
    pending.push(cause, meta?.driverAdapterError)
  }

  return false
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10_000,
    keepAlive: true,
  })

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  }).$extends({
    query: {
      async $allOperations({ operation, args, query }) {
        if (!READ_OPERATIONS.has(operation)) return query(args)
        for (let attempt = 1; ; attempt += 1) {
          try {
            return await query(args)
          } catch (error) {
            // Only reads are retried: a lost socket on a write may already have committed.
            if (attempt >= READ_RETRIES || !isTransientDbError(error)) throw error
            // Neon wakes a suspended compute in bursts; an immediate retry hits the same wall.
            await sleep(RETRY_DELAYS_MS[attempt - 1] ?? 750)
          }
        }
      },
    },
  }) as PrismaClient
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

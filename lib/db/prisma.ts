import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const TRANSIENT_DB_CODES = new Set([
  'ETIMEDOUT',
  'ECONNRESET',
  'ECONNREFUSED',
  'ENOTFOUND',
  'P1001',
  'P1002',
  'P1017',
])

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
  const { code, message } = (error ?? {}) as { code?: string; message?: string }
  if (code && TRANSIENT_DB_CODES.has(code)) return true
  // Neon drops idle sockets while its compute is suspended; the next query reconnects.
  return (
    message?.includes('Connection terminated') === true ||
    message?.includes('timeout exceeded when trying to connect') === true
  )
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
        try {
          return await query(args)
        } catch (error) {
          // Only reads are retried: a lost socket on a write may already have committed.
          if (!isTransientDbError(error)) throw error
          return query(args)
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

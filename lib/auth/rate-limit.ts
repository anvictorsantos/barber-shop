import { prisma } from '@/lib/db/prisma'

interface Bucket {
  count: number
  resetAt: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterMs: number
}

const MAX_BUCKETS = 10_000
const PRUNE_AFTER_MS = 24 * 60 * 60 * 1000
const buckets = new Map<string, Bucket>()

function prune(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }

  while (buckets.size >= MAX_BUCKETS) {
    const oldest = buckets.keys().next().value
    if (oldest === undefined) break
    buckets.delete(oldest)
  }
}

export function takeRateLimitInMemory(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): RateLimitResult {
  if (buckets.size >= MAX_BUCKETS) prune(now)

  const current = buckets.get(key)
  if (!current || current.resetAt <= now) {
    const resetAt = now + windowMs
    buckets.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: Math.max(0, limit - 1), retryAfterMs: windowMs }
  }

  if (current.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterMs: current.resetAt - now }
  }

  current.count += 1
  return {
    allowed: true,
    remaining: Math.max(0, limit - current.count),
    retryAfterMs: current.resetAt - now,
  }
}

export async function takeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const now = Date.now()
  const resetAt = new Date(now + windowMs)
  const nowDate = new Date(now)

  const rows = await prisma.$queryRaw<{ count: number; resetAt: Date }[]>`
    INSERT INTO "rate_limits" ("key", "count", "reset_at")
    VALUES (${key}, 1, ${resetAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "rate_limits"."reset_at" <= ${nowDate} THEN 1
        ELSE "rate_limits"."count" + 1
      END,
      "reset_at" = CASE
        WHEN "rate_limits"."reset_at" <= ${nowDate} THEN ${resetAt}
        ELSE "rate_limits"."reset_at"
      END
    RETURNING "count", "reset_at" AS "resetAt"
  `

  const row = rows[0]
  if (!row) throw new Error('rate limit upsert returned no row')

  if (Math.random() < 0.01) {
    await prisma.$executeRaw`DELETE FROM "rate_limits" WHERE "reset_at" < ${new Date(now - PRUNE_AFTER_MS)}`
  }

  return {
    allowed: row.count <= limit,
    remaining: Math.max(0, limit - row.count),
    retryAfterMs: Math.max(0, row.resetAt.getTime() - now),
  }
}

export function resetRateLimits(prefix?: string): void {
  if (!prefix) {
    buckets.clear()
    return
  }

  for (const key of buckets.keys()) {
    if (key.startsWith(prefix)) buckets.delete(key)
  }
}

export async function peekRateLimit(key: string): Promise<{ count: number; resetAt: Date } | null> {
  return prisma.rateLimit.findUnique({ where: { key } })
}

export async function resetRateLimit(key: string): Promise<void> {
  buckets.delete(key)
  await prisma.rateLimit.deleteMany({ where: { key } })
}

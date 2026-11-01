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

export function takeRateLimit(
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

export function resetRateLimits(prefix?: string): void {
  if (!prefix) {
    buckets.clear()
    return
  }

  for (const key of buckets.keys()) {
    if (key.startsWith(prefix)) buckets.delete(key)
  }
}

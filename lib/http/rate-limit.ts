import { takeRateLimit } from '@/lib/auth/rate-limit'
import { AppError } from '@/lib/http/errors'

export async function enforceRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<void> {
  const result = await takeRateLimit(key, limit, windowMs)
  if (!result.allowed) {
    throw new AppError(429, 'rate_limited', 'Muitas tentativas. Tente novamente em instantes.')
  }
}

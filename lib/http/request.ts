import { getServerEnv } from '@/lib/env'

interface HeaderSource {
  headers: { get(name: string): string | null }
}

function trustedClientIp(request: HeaderSource): string | null {
  const secret = getServerEnv().ORIGIN_SHARED_SECRET
  if (!secret) return null
  if (request.headers.get('x-origin-secret') !== secret) return null
  return request.headers.get('x-client-ip')?.trim() || null
}

export function clientIp(request: HeaderSource): string {
  const trusted = trustedClientIp(request)
  if (trusted) return trusted

  const forwarded = request.headers.get('x-forwarded-for')
  const last = forwarded
    ?.split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .at(-1)

  return last || 'unknown'
}

export function requestMeta(request: Request): { ip: string | null; userAgent: string | null } {
  const ip = clientIp(request)
  return {
    ip: ip === 'unknown' ? null : ip,
    userAgent: request.headers.get('user-agent') || null,
  }
}

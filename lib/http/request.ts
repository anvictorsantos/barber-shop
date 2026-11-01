export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
}

export function requestMeta(request: Request): { ip: string | null; userAgent: string | null } {
  const ip = clientIp(request)
  return {
    ip: ip === 'unknown' ? null : ip,
    userAgent: request.headers.get('user-agent') || null,
  }
}

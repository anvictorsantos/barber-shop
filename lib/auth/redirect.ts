import type { Role } from '@prisma/client'

const PLACEHOLDER_ORIGIN = 'https://placeholder.invalid'

export function safeNextPath(value: string | null | undefined): string | null {
  if (!value) return null
  if (!value.startsWith('/') || value.startsWith('//')) return null
  if (value.includes('\\') || /%5c/i.test(value)) return null
  if ([...value].some((char) => char.charCodeAt(0) < 0x20)) return null

  try {
    const url = new URL(value, PLACEHOLDER_ORIGIN)
    if (url.origin !== PLACEHOLDER_ORIGIN) return null
    return url.pathname + url.search + url.hash
  } catch {
    return null
  }
}

export function postAuthPath(role: Role, next?: string | null): string {
  const target = safeNextPath(next)

  if (target) {
    if (role === 'CUSTOMER' && target.startsWith('/admin')) return '/conta/agendamentos'
    if (role !== 'CUSTOMER' && target.startsWith('/conta')) return '/admin'
    return target
  }

  return role === 'CUSTOMER' ? '/conta/agendamentos' : '/admin'
}

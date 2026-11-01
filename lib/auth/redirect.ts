import type { Role } from '@prisma/client'

export function safeNextPath(value: string | null | undefined): string | null {
  if (!value) return null
  if (!value.startsWith('/') || value.startsWith('//')) return null
  return value
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

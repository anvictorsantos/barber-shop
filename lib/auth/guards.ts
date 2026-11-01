import type { SessionUser } from '@/lib/auth/session'
import { AppError } from '@/lib/http/errors'

import type { Role } from '@prisma/client'

export function requireUser(user: SessionUser | null): SessionUser {
  if (!user) {
    throw new AppError(401, 'unauthorized', 'Faça login para continuar.')
  }
  return user
}

export function requireRole(user: SessionUser | null, roles: readonly Role[]): SessionUser {
  const current = requireUser(user)
  if (!roles.includes(current.role)) {
    throw new AppError(403, 'forbidden', 'Acesso negado.')
  }
  return current
}

export function requireOwner(user: SessionUser | null): SessionUser {
  return requireRole(user, ['OWNER'])
}

export function requireStaff(user: SessionUser | null): SessionUser {
  return requireRole(user, ['OWNER', 'BARBER'])
}

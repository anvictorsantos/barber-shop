import type { SessionUser } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { AppError } from '@/lib/http/errors'

import type { Role } from '@prisma/client'

export interface AdminScope {
  userId: string
  role: Role
  barberId: string | null
}

export async function resolveAdminScope(user: SessionUser): Promise<AdminScope> {
  if (user.role === 'OWNER') return { userId: user.id, role: user.role, barberId: null }

  if (user.role === 'BARBER') {
    const profile = await prisma.barberProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!profile) throw new AppError(403, 'forbidden', 'Perfil de barbeiro não encontrado.')
    return { userId: user.id, role: user.role, barberId: profile.id }
  }

  throw new AppError(403, 'forbidden', 'Acesso negado.')
}

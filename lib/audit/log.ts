import { prisma } from '@/lib/db/prisma'

import type { Prisma } from '@prisma/client'

export interface AuditInput {
  actorId: string | null
  action: string
  entity: string
  entityId?: string | null
  detail?: unknown
}

export async function recordAudit(input: AuditInput): Promise<void> {
  try {
    const detail =
      input.detail === undefined
        ? undefined
        : (JSON.parse(JSON.stringify(input.detail)) as Prisma.InputJsonValue)

    await prisma.auditLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        ...(detail === undefined ? {} : { detail }),
      },
    })
  } catch (error) {
    console.warn('[audit] failed:', error instanceof Error ? error.name : 'unknown')
  }
}

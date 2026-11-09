import { randomBytes, randomInt } from 'node:crypto'

import { prisma } from '@/lib/db/prisma'
import { AppError } from '@/lib/http/errors'

export function createOrderPublicToken(): string {
  return randomBytes(32).toString('base64url')
}

export async function uniqueOrderCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = `BL-${randomInt(10000, 100000)}`
    const existing = await prisma.order.findUnique({ where: { code }, select: { id: true } })
    if (!existing) return code
  }

  throw new AppError(500, 'code_generation_failed', 'Não foi possível gerar o código do pedido.')
}

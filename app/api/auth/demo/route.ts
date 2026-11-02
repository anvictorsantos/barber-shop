import { z } from 'zod'

import { createSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { getServerEnv } from '@/lib/env'
import { AppError, errorResponse } from '@/lib/http/errors'
import { assertSameOrigin } from '@/lib/http/origin'
import { enforceRateLimit } from '@/lib/http/rate-limit'
import { clientIp, requestMeta } from '@/lib/http/request'
import { parseJson } from '@/lib/http/validation'

export const runtime = 'nodejs'

const DEMO_USERS = {
  customer: 'joao.silva@example.com',
  barber: 'hinner@barbeariadoluiz.com.br',
  owner: 'luiz@barbeariadoluiz.com.br',
} as const

const demoSchema = z.object({
  role: z.enum(['customer', 'barber', 'owner']),
})

export async function POST(request: Request) {
  try {
    if (!getServerEnv().DEMO_MODE) {
      throw new AppError(404, 'not_found', 'Demonstração desativada.')
    }

    assertSameOrigin(request)
    enforceRateLimit(`demo:${clientIp(request)}`, 20, 60 * 1000)

    const input = await parseJson(request, demoSchema)
    const user = await prisma.user.findUnique({
      where: { email: DEMO_USERS[input.role] },
      select: { id: true, role: true },
    })

    if (!user) {
      throw new AppError(404, 'not_found', 'Usuário de demonstração não encontrado.')
    }

    await createSession(user.id, requestMeta(request))
    return Response.json({ user })
  } catch (error) {
    return errorResponse(error)
  }
}

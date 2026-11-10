import { z } from 'zod'

import { getSessionUser } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { getServerEnv } from '@/lib/env'
import { AppError, errorResponse } from '@/lib/http/errors'
import { assertSameOrigin } from '@/lib/http/origin'

export const runtime = 'nodejs'

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
})

async function requireStaff() {
  const user = await getSessionUser()
  if (!user || user.role === 'CUSTOMER') {
    throw new AppError(401, 'unauthorized', 'Sessão inválida.')
  }
  return user
}

export async function GET() {
  try {
    await requireStaff()
    return Response.json({ publicKey: getServerEnv().VAPID_PUBLIC_KEY })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request)
    const user = await requireStaff()
    const parsed = subscriptionSchema.safeParse(await request.json())
    if (!parsed.success) throw new AppError(400, 'invalid_subscription', 'Inscrição inválida.')

    await prisma.pushSubscription.upsert({
      where: { endpoint: parsed.data.endpoint },
      create: {
        userId: user.id,
        endpoint: parsed.data.endpoint,
        p256dh: parsed.data.keys.p256dh,
        auth: parsed.data.keys.auth,
      },
      update: {
        userId: user.id,
        p256dh: parsed.data.keys.p256dh,
        auth: parsed.data.keys.auth,
      },
    })

    return Response.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}

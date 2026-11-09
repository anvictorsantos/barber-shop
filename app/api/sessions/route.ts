import { requireUser } from '@/lib/auth/guards'
import {
  destroySession,
  getCurrentSessionId,
  getSessionUser,
  revokeOtherSessions,
  revokeSession,
} from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { AppError, errorResponse } from '@/lib/http/errors'
import { assertSameOrigin } from '@/lib/http/origin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = requireUser(await getSessionUser())
    const currentId = await getCurrentSessionId()

    const sessions = await prisma.session.findMany({
      where: { userId: user.id, expiresAt: { gt: new Date() } },
      select: { id: true, ip: true, userAgent: true, createdAt: true, lastUsedAt: true },
      orderBy: { lastUsedAt: 'desc' },
      take: 50,
    })

    return Response.json({
      sessions: sessions.map((session) => ({ ...session, current: session.id === currentId })),
    })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request)
    const user = requireUser(await getSessionUser())
    const currentId = await getCurrentSessionId()
    const id = new URL(request.url).searchParams.get('id')

    if (id) {
      await revokeSession(user.id, id)
      if (id === currentId) await destroySession()
    } else {
      if (!currentId) throw new AppError(401, 'unauthorized', 'Faça login para continuar.')
      await revokeOtherSessions(user.id, currentId)
    }

    return new Response(null, { status: 204 })
  } catch (error) {
    return errorResponse(error)
  }
}

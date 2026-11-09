import { cookies } from 'next/headers'

import { ADMIN_NOTIFICATIONS_READ_COOKIE } from '@/lib/admin/notifications'
import { getSessionUser } from '@/lib/auth/session'
import { AppError, errorResponse } from '@/lib/http/errors'
import { assertSameOrigin } from '@/lib/http/origin'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    assertSameOrigin(request)

    const user = await getSessionUser()
    if (!user || user.role === 'CUSTOMER') {
      throw new AppError(401, 'unauthorized', 'Sessão inválida.')
    }

    const store = await cookies()
    store.set(ADMIN_NOTIFICATIONS_READ_COOKIE, new Date().toISOString(), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      secure: process.env.NODE_ENV === 'production',
    })

    return Response.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}

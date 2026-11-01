import { destroySession } from '@/lib/auth/session'
import { errorResponse } from '@/lib/http/errors'
import { assertSameOrigin } from '@/lib/http/origin'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    assertSameOrigin(request)
    await destroySession()
    return new Response(null, { status: 204 })
  } catch (error) {
    return errorResponse(error)
  }
}

import { registerUser } from '@/lib/auth/service'
import { createSession } from '@/lib/auth/session'
import { errorResponse } from '@/lib/http/errors'
import { assertSameOrigin } from '@/lib/http/origin'
import { enforceRateLimit } from '@/lib/http/rate-limit'
import { clientIp, requestMeta } from '@/lib/http/request'
import { parseJson } from '@/lib/http/validation'
import { registerSchema } from '@/lib/validation/auth'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    assertSameOrigin(request)
    enforceRateLimit(`register:${clientIp(request)}`, 5, 10 * 60 * 1000)

    const input = await parseJson(request, registerSchema)
    const result = await registerUser(input)

    if (!result.requiresPhoneVerification) {
      await createSession(result.user.id, requestMeta(request))
    }

    return Response.json(result, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}

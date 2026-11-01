import { verifyPhoneSignup } from '@/lib/auth/service'
import { createSession } from '@/lib/auth/session'
import { errorResponse } from '@/lib/http/errors'
import { assertSameOrigin } from '@/lib/http/origin'
import { enforceRateLimit } from '@/lib/http/rate-limit'
import { clientIp, requestMeta } from '@/lib/http/request'
import { parseJson } from '@/lib/http/validation'
import { verifyPhoneSchema } from '@/lib/validation/auth'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    assertSameOrigin(request)

    const input = await parseJson(request, verifyPhoneSchema)
    enforceRateLimit(`verify-phone:${clientIp(request)}:${input.phone}`, 10, 10 * 60 * 1000)

    const user = await verifyPhoneSignup(input.phone, input.code)
    await createSession(user.id, requestMeta(request))

    return Response.json({ user })
  } catch (error) {
    return errorResponse(error)
  }
}

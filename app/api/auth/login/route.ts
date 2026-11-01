import { loginUser } from '@/lib/auth/service'
import { createSession } from '@/lib/auth/session'
import { errorResponse } from '@/lib/http/errors'
import { assertSameOrigin } from '@/lib/http/origin'
import { enforceRateLimit } from '@/lib/http/rate-limit'
import { clientIp, requestMeta } from '@/lib/http/request'
import { parseJson } from '@/lib/http/validation'
import { loginSchema } from '@/lib/validation/auth'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    assertSameOrigin(request)

    const input = await parseJson(request, loginSchema)
    enforceRateLimit(
      `login:${clientIp(request)}:${input.identifier.toLowerCase()}`,
      10,
      10 * 60 * 1000,
    )

    const user = await loginUser(input.identifier, input.password)
    await createSession(user.id, requestMeta(request))

    return Response.json({ user })
  } catch (error) {
    return errorResponse(error)
  }
}

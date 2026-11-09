import { activateAccountWithOtp, activateAccountWithToken } from '@/lib/auth/service'
import { createSession } from '@/lib/auth/session'
import { errorResponse } from '@/lib/http/errors'
import { assertSameOrigin } from '@/lib/http/origin'
import { enforceRateLimit } from '@/lib/http/rate-limit'
import { clientIp, requestMeta } from '@/lib/http/request'
import { parseJson } from '@/lib/http/validation'
import { activateAccountSchema } from '@/lib/validation/auth'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    assertSameOrigin(request)
    const input = await parseJson(request, activateAccountSchema)
    const identifier = 'token' in input ? input.token : input.phone
    await enforceRateLimit(`activate:${clientIp(request)}:${identifier}`, 10, 10 * 60 * 1000)

    const user =
      'token' in input
        ? await activateAccountWithToken(input.token, input.password)
        : await activateAccountWithOtp(input.phone, input.code, input.password)

    await createSession(user.id, requestMeta(request))

    return Response.json({ user })
  } catch (error) {
    return errorResponse(error)
  }
}

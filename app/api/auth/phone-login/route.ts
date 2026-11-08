import { requestPhoneLogin } from '@/lib/auth/service'
import { errorResponse } from '@/lib/http/errors'
import { assertSameOrigin } from '@/lib/http/origin'
import { enforceRateLimit } from '@/lib/http/rate-limit'
import { clientIp } from '@/lib/http/request'
import { parseJson } from '@/lib/http/validation'
import { phoneLoginSchema } from '@/lib/validation/auth'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    assertSameOrigin(request)

    const input = await parseJson(request, phoneLoginSchema)
    enforceRateLimit(`phone-login:${clientIp(request)}:${input.phone}`, 10, 10 * 60 * 1000)

    await requestPhoneLogin(input.phone)

    return Response.json({ ok: true }, { status: 202 })
  } catch (error) {
    return errorResponse(error)
  }
}

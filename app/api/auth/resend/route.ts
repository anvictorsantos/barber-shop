import { resendVerification } from '@/lib/auth/service'
import { errorResponse } from '@/lib/http/errors'
import { assertSameOrigin } from '@/lib/http/origin'
import { enforceRateLimit } from '@/lib/http/rate-limit'
import { clientIp } from '@/lib/http/request'
import { parseJson } from '@/lib/http/validation'
import { resendSchema } from '@/lib/validation/auth'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    assertSameOrigin(request)
    enforceRateLimit(`resend:${clientIp(request)}`, 5, 10 * 60 * 1000)

    const input = await parseJson(request, resendSchema)
    await resendVerification(input.identifier)

    return Response.json({ ok: true }, { status: 202 })
  } catch (error) {
    return errorResponse(error)
  }
}

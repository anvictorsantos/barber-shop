import { resetPasswordWithOtp, resetPasswordWithToken } from '@/lib/auth/service'
import { errorResponse } from '@/lib/http/errors'
import { assertSameOrigin } from '@/lib/http/origin'
import { enforceRateLimit } from '@/lib/http/rate-limit'
import { clientIp } from '@/lib/http/request'
import { parseJson } from '@/lib/http/validation'
import { resetPasswordSchema } from '@/lib/validation/auth'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    assertSameOrigin(request)
    enforceRateLimit(`reset-password:${clientIp(request)}`, 10, 10 * 60 * 1000)

    const input = await parseJson(request, resetPasswordSchema)

    if ('token' in input) {
      await resetPasswordWithToken(input.token, input.password)
    } else {
      await resetPasswordWithOtp(input.phone, input.code, input.password)
    }

    return Response.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}

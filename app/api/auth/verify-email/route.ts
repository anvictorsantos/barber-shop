import { verifyEmailToken } from '@/lib/auth/service'
import { errorResponse } from '@/lib/http/errors'
import { assertSameOrigin } from '@/lib/http/origin'
import { enforceRateLimit } from '@/lib/http/rate-limit'
import { clientIp } from '@/lib/http/request'
import { parseJson } from '@/lib/http/validation'
import { verifyEmailSchema } from '@/lib/validation/auth'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    assertSameOrigin(request)
    enforceRateLimit(`verify-email:${clientIp(request)}`, 10, 10 * 60 * 1000)

    const input = await parseJson(request, verifyEmailSchema)
    const user = await verifyEmailToken(input.token)

    return Response.json({ user })
  } catch (error) {
    return errorResponse(error)
  }
}

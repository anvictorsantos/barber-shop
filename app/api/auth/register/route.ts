import { registerUser } from '@/lib/auth/service'
import { errorResponse } from '@/lib/http/errors'
import { assertSameOrigin } from '@/lib/http/origin'
import { enforceRateLimit } from '@/lib/http/rate-limit'
import { clientIp } from '@/lib/http/request'
import { parseJson } from '@/lib/http/validation'
import { registerSchema } from '@/lib/validation/auth'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    assertSameOrigin(request)
    await enforceRateLimit(`register:${clientIp(request)}`, 5, 10 * 60 * 1000)

    const input = await parseJson(request, registerSchema)
    const result = await registerUser(input)

    return Response.json({ ok: true, ...result }, { status: 202 })
  } catch (error) {
    return errorResponse(error)
  }
}

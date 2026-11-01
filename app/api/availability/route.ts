import { z } from 'zod'

import { getAvailability } from '@/lib/availability/queries'
import { AppError, errorResponse } from '@/lib/http/errors'
import { enforceRateLimit } from '@/lib/http/rate-limit'
import { clientIp } from '@/lib/http/request'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const querySchema = z.object({
  serviceId: z.string().min(1),
  barberId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.'),
})

export async function GET(request: Request) {
  try {
    enforceRateLimit(`availability:${clientIp(request)}`, 120, 60 * 1000)

    const url = new URL(request.url)
    const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams))
    if (!parsed.success) {
      throw new AppError(
        400,
        'invalid_input',
        parsed.error.issues[0]?.message ?? 'Dados inválidos.',
      )
    }

    const result = await getAvailability(parsed.data)
    return Response.json({ slots: result.slots, timezone: result.timezone })
  } catch (error) {
    return errorResponse(error)
  }
}

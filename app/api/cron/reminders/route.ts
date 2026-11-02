import { isCronAuthorized } from '@/lib/http/cron'
import { errorResponse } from '@/lib/http/errors'
import { sendDueReminders } from '@/lib/notifications/reminders'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function run(request: Request) {
  try {
    if (!isCronAuthorized(request)) {
      return Response.json(
        { error: { code: 'unauthorized', message: 'Não autorizado.' } },
        { status: 401 },
      )
    }

    const result = await sendDueReminders()
    return Response.json(result)
  } catch (error) {
    return errorResponse(error)
  }
}

export async function GET(request: Request) {
  return run(request)
}

export async function POST(request: Request) {
  return run(request)
}

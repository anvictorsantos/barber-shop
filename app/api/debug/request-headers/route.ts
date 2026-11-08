import { isCronAuthorized } from '@/lib/http/cron'
import { clientIp } from '@/lib/http/request'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const HEADERS = [
  'cf-connecting-ip',
  'x-client-ip',
  'x-origin-secret',
  'x-forwarded-for',
  'x-real-ip',
  'x-render-origin-server',
]

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return Response.json(
      { error: { code: 'unauthorized', message: 'Não autorizado.' } },
      { status: 401 },
    )
  }

  const headers: Record<string, string | null> = {}
  for (const name of HEADERS) {
    const value = request.headers.get(name)
    headers[name] = name === 'x-origin-secret' && value ? '<present>' : value
  }

  return Response.json({ headers, trustedIp: clientIp(request) })
}

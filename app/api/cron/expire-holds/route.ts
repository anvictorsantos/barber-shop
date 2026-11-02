import { timingSafeEqual } from 'node:crypto'

import { getServerEnv } from '@/lib/env'
import { errorResponse } from '@/lib/http/errors'
import { expireOverdueOrders } from '@/lib/orders/create-order'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function isAuthorized(request: Request, secret: string): boolean {
  const header = request.headers.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : ''
  const received = Buffer.from(token)
  const expected = Buffer.from(secret)
  return received.length === expected.length && timingSafeEqual(received, expected)
}

async function run(request: Request) {
  try {
    const env = getServerEnv()

    if (!isAuthorized(request, env.CRON_SECRET)) {
      return Response.json(
        { error: { code: 'unauthorized', message: 'Não autorizado.' } },
        { status: 401 },
      )
    }

    const result = await expireOverdueOrders()
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

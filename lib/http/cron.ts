import { timingSafeEqual } from 'node:crypto'

import { getServerEnv } from '@/lib/env'

export function isCronAuthorized(request: Request): boolean {
  const header = request.headers.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : ''
  const received = Buffer.from(token)
  const expected = Buffer.from(getServerEnv().CRON_SECRET)
  return received.length === expected.length && timingSafeEqual(received, expected)
}

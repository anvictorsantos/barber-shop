import type { DataCollection, ErrorEvent } from '@sentry/core'

export const sentryDataCollection = {
  userInfo: false,
  cookies: false,
  httpHeaders: {
    request: { deny: ['authorization', 'cookie', 'set-cookie'] },
    response: false,
  },
  httpBodies: [],
  urlQueryParams: false,
  stackFrameVariables: false,
} satisfies DataCollection

export function parseSampleRate(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(1, Math.max(0, parsed))
}

export function parseIgnoreErrors(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

export function scrubSentryEvent(event: ErrorEvent): ErrorEvent {
  const headers = event.request?.headers
  if (headers) {
    delete headers.Authorization
    delete headers.authorization
    delete headers.Cookie
    delete headers.cookie
    delete headers['set-cookie']
  }

  if (event.user) {
    delete event.user.email
    delete event.user.ip_address
  }

  return event
}

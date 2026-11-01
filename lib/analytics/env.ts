export const GTM_ID_PATTERN = /^GTM-[A-Z0-9]+$/

export function isValidGtmId(value: string | null): value is string {
  return typeof value === 'string' && GTM_ID_PATTERN.test(value)
}

export const analyticsDebug = process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === 'true'

export type StaffPushKind = 'NEW_BOOKING' | 'APPOINTMENT_SOON' | 'CLIENT_LATE'

export const SOON_WINDOW_MS = 10 * 60 * 1000
export const LATE_AFTER_MS = 10 * 60 * 1000
export const LOOKBACK_MS = 2 * 60 * 60 * 1000

export function pushAlertFor(startAt: Date, now: Date): StaffPushKind | null {
  const diff = startAt.getTime() - now.getTime()
  if (diff > 0 && diff <= SOON_WINDOW_MS) return 'APPOINTMENT_SOON'
  if (diff <= -LATE_AFTER_MS && diff >= -LOOKBACK_MS) return 'CLIENT_LATE'
  return null
}

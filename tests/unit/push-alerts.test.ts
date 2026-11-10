import { describe, expect, it } from 'vitest'

import { LATE_AFTER_MS, LOOKBACK_MS, SOON_WINDOW_MS, pushAlertFor } from '@/lib/push/windows'

const NOW = new Date('2026-11-10T15:00:00-03:00')

function at(offsetMs: number): Date {
  return new Date(NOW.getTime() + offsetMs)
}

describe('pushAlertFor', () => {
  it('alerts when the appointment starts within the soon window', () => {
    expect(pushAlertFor(at(SOON_WINDOW_MS), NOW)).toBe('APPOINTMENT_SOON')
    expect(pushAlertFor(at(60_000), NOW)).toBe('APPOINTMENT_SOON')
  })

  it('does not alert for appointments further out or already starting', () => {
    expect(pushAlertFor(at(SOON_WINDOW_MS + 1), NOW)).toBeNull()
    expect(pushAlertFor(at(0), NOW)).toBeNull()
  })

  it('alerts late once the grace period passed, within the lookback', () => {
    expect(pushAlertFor(at(-LATE_AFTER_MS), NOW)).toBe('CLIENT_LATE')
    expect(pushAlertFor(at(-LOOKBACK_MS), NOW)).toBe('CLIENT_LATE')
  })

  it('does not alert during the grace period or beyond the lookback', () => {
    expect(pushAlertFor(at(-LATE_AFTER_MS + 1), NOW)).toBeNull()
    expect(pushAlertFor(at(-LOOKBACK_MS - 1), NOW)).toBeNull()
  })
})

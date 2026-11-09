import { fromZonedTime } from 'date-fns-tz'
import { describe, expect, it } from 'vitest'

import {
  BUSINESS_TIMEZONE,
  getAvailableSlots,
  getNextOpening,
  isShopOpen,
  type AvailabilityInput,
} from '@/lib/availability/slots'

const now = fromZonedTime('2026-11-02 09:10:00', BUSINESS_TIMEZONE)
const date = '2026-11-02'

function input(overrides: Partial<AvailabilityInput> = {}): AvailabilityInput {
  return {
    date,
    durationMin: 30,
    shopHours: { weekday: 1, openMinute: 540, closeMinute: 720, closed: false },
    timeBlocks: [],
    appointments: [],
    now,
    ...overrides,
  }
}

function availableTimes(result: ReturnType<typeof getAvailableSlots>): string[] {
  return result.filter((slot) => slot.available).map((slot) => slot.time)
}

describe('slot engine', () => {
  it('drops slots inside the lead time', () => {
    const slots = getAvailableSlots(input())
    expect(slots[0]?.time).toBe('09:45')
    expect(slots.at(-1)?.time).toBe('11:30')
    expect(availableTimes(slots)).not.toContain('09:30')
  })

  it('blocks recurring time ranges', () => {
    const slots = getAvailableSlots(
      input({
        timeBlocks: [
          {
            recurring: true,
            weekday: 1,
            date: null,
            startMinute: 600,
            endMinute: 630,
            active: true,
          },
        ],
      }),
    )

    expect(slots.find((slot) => slot.time === '09:45')?.reason).toBe('blocked')
    expect(slots.find((slot) => slot.time === '10:00')?.reason).toBe('blocked')
    expect(slots.find((slot) => slot.time === '10:15')?.reason).toBe('blocked')
    expect(slots.find((slot) => slot.time === '10:30')?.available).toBe(true)
  })

  it('blocks overlapping active appointments', () => {
    const slots = getAvailableSlots(
      input({
        appointments: [
          {
            startAt: fromZonedTime('2026-11-02 09:45:00', BUSINESS_TIMEZONE),
            endAt: fromZonedTime('2026-11-02 10:15:00', BUSINESS_TIMEZONE),
            status: 'CONFIRMED',
          },
        ],
      }),
    )

    expect(slots.find((slot) => slot.time === '09:45')?.reason).toBe('booked')
    expect(slots.find((slot) => slot.time === '10:00')?.reason).toBe('booked')
    expect(slots.find((slot) => slot.time === '10:15')?.available).toBe(true)
  })

  it('ignores canceled appointments', () => {
    const slots = getAvailableSlots(
      input({
        appointments: [
          {
            startAt: fromZonedTime('2026-11-02 09:45:00', BUSINESS_TIMEZONE),
            endAt: fromZonedTime('2026-11-02 10:15:00', BUSINESS_TIMEZONE),
            status: 'CANCELED',
          },
        ],
      }),
    )

    expect(slots.find((slot) => slot.time === '09:45')?.available).toBe(true)
  })

  it('respects a 90 minute duration', () => {
    const slots = getAvailableSlots(input({ durationMin: 90 }))
    expect(availableTimes(slots)).toEqual(['09:45', '10:00', '10:15', '10:30'])
  })

  it('returns nothing for a closed day', () => {
    const slots = getAvailableSlots(
      input({
        shopHours: { weekday: 1, openMinute: 540, closeMinute: 720, closed: true },
      }),
    )
    expect(slots).toEqual([])
  })

  it('returns nothing outside the horizon', () => {
    const slots = getAvailableSlots(input({ date: '2027-02-01' }))
    expect(slots).toEqual([])
  })

  it('returns nothing on a past date', () => {
    const slots = getAvailableSlots(input({ date: '2026-10-30' }))
    expect(slots).toEqual([])
  })
})

describe('shop open state', () => {
  const mondayHours = { weekday: 1, openMinute: 540, closeMinute: 1200, closed: false }

  it('is open inside business hours', () => {
    expect(
      isShopOpen({
        shopHours: mondayHours,
        now: fromZonedTime('2026-11-02 09:10:00', BUSINESS_TIMEZONE),
      }),
    ).toBe(true)
  })

  it('is closed before opening and after closing', () => {
    expect(
      isShopOpen({
        shopHours: mondayHours,
        now: fromZonedTime('2026-11-02 08:59:00', BUSINESS_TIMEZONE),
      }),
    ).toBe(false)
    expect(
      isShopOpen({
        shopHours: mondayHours,
        now: fromZonedTime('2026-11-02 20:00:00', BUSINESS_TIMEZONE),
      }),
    ).toBe(false)
  })

  it('is closed on a day without hours', () => {
    expect(
      isShopOpen({
        shopHours: mondayHours,
        now: fromZonedTime('2026-11-03 09:10:00', BUSINESS_TIMEZONE),
      }),
    ).toBe(false)
    expect(isShopOpen({ shopHours: null })).toBe(false)
  })

  it('is closed when the day is marked closed', () => {
    expect(
      isShopOpen({
        shopHours: { ...mondayHours, closed: true },
        now: fromZonedTime('2026-11-02 09:10:00', BUSINESS_TIMEZONE),
      }),
    ).toBe(false)
  })
})

describe('next opening', () => {
  const week = [
    { weekday: 0, openMinute: 0, closeMinute: 0, closed: true },
    { weekday: 1, openMinute: 540, closeMinute: 1200, closed: false },
    { weekday: 2, openMinute: 540, closeMinute: 1200, closed: false },
    { weekday: 3, openMinute: 540, closeMinute: 1200, closed: false },
    { weekday: 4, openMinute: 540, closeMinute: 1200, closed: false },
    { weekday: 5, openMinute: 540, closeMinute: 1200, closed: false },
    { weekday: 6, openMinute: 540, closeMinute: 1080, closed: false },
  ]

  it('skips a closed today and points to tomorrow', () => {
    expect(
      getNextOpening({
        shopHours: week,
        now: fromZonedTime('2026-11-08 13:00:00', BUSINESS_TIMEZONE),
      }),
    ).toEqual({ dayOffset: 1, weekday: 1, openMinute: 540 })
  })

  it('points to today before opening', () => {
    expect(
      getNextOpening({
        shopHours: week,
        now: fromZonedTime('2026-11-02 08:00:00', BUSINESS_TIMEZONE),
      }),
    ).toEqual({ dayOffset: 0, weekday: 1, openMinute: 540 })
  })

  it('points to tomorrow after closing', () => {
    expect(
      getNextOpening({
        shopHours: week,
        now: fromZonedTime('2026-11-02 21:00:00', BUSINESS_TIMEZONE),
      }),
    ).toEqual({ dayOffset: 1, weekday: 2, openMinute: 540 })
  })

  it('returns null when every day is closed', () => {
    expect(
      getNextOpening({
        shopHours: week.map((row) => ({ ...row, closed: true })),
        now: fromZonedTime('2026-11-02 09:10:00', BUSINESS_TIMEZONE),
      }),
    ).toBeNull()
  })
})

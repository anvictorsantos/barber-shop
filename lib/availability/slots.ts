import { differenceInCalendarDays, parseISO } from 'date-fns'
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'

import { minutesToTime } from '@/lib/time/schedule'

export const BUSINESS_TIMEZONE = 'America/Sao_Paulo'
export const SLOT_STEP_MINUTES = 15
export const DEFAULT_LEAD_MINUTES = 30
export const DEFAULT_HORIZON_DAYS = 60

export interface SlotShopHours {
  weekday: number
  openMinute: number
  closeMinute: number
  closed: boolean
}

export interface SlotTimeBlock {
  recurring: boolean
  weekday: number | null
  date: string | null
  startMinute: number
  endMinute: number
  active: boolean
}

export interface SlotAppointment {
  startAt: Date
  endAt: Date
  status: string
}

export type SlotReason = 'booked' | 'blocked'

export interface AvailabilitySlot {
  time: string
  startAt: string
  available: boolean
  reason?: SlotReason
}

export interface AvailabilityInput {
  date: string
  durationMin: number
  shopHours: SlotShopHours | null
  timeBlocks: SlotTimeBlock[]
  appointments: SlotAppointment[]
  now: Date
  timezone?: string
  leadMinutes?: number
  horizonDays?: number
}

const ACTIVE_STATUSES = new Set(['PENDING', 'CONFIRMED'])

export function isShopOpen({
  shopHours,
  now = new Date(),
  timezone = BUSINESS_TIMEZONE,
}: {
  shopHours: SlotShopHours | null | undefined
  now?: Date
  timezone?: string
}): boolean {
  if (!shopHours || shopHours.closed) return false

  const weekday = Number(formatInTimeZone(now, timezone, 'i')) % 7
  if (shopHours.weekday !== weekday) return false

  const [hour = '0', minute = '0'] = formatInTimeZone(now, timezone, 'H:m').split(':')
  const currentMinute = Number(hour) * 60 + Number(minute)

  return currentMinute >= shopHours.openMinute && currentMinute < shopHours.closeMinute
}

export interface NextOpening {
  dayOffset: number
  weekday: number
  openMinute: number
}

export function getNextOpening({
  shopHours,
  now = new Date(),
  timezone = BUSINESS_TIMEZONE,
}: {
  shopHours: readonly SlotShopHours[]
  now?: Date
  timezone?: string
}): NextOpening | null {
  const weekday = Number(formatInTimeZone(now, timezone, 'i')) % 7
  const [hour = '0', minute = '0'] = formatInTimeZone(now, timezone, 'H:m').split(':')
  const currentMinute = Number(hour) * 60 + Number(minute)

  for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
    const day = (weekday + dayOffset) % 7
    const row = shopHours.find((item) => item.weekday === day)
    if (!row || row.closed) continue
    if (dayOffset === 0 && currentMinute >= row.openMinute) continue
    return { dayOffset, weekday: day, openMinute: row.openMinute }
  }

  return null
}

function overlaps(start: Date, end: Date, otherStart: Date, otherEnd: Date): boolean {
  return start.getTime() < otherEnd.getTime() && end.getTime() > otherStart.getTime()
}

export function getAvailableSlots(input: AvailabilityInput): AvailabilitySlot[] {
  const timezone = input.timezone ?? BUSINESS_TIMEZONE
  const leadMinutes = input.leadMinutes ?? DEFAULT_LEAD_MINUTES
  const horizonDays = input.horizonDays ?? DEFAULT_HORIZON_DAYS

  if (!input.shopHours || input.shopHours.closed) return []
  if (input.durationMin <= 0) return []

  const today = formatInTimeZone(input.now, timezone, 'yyyy-MM-dd')
  const dayOffset = differenceInCalendarDays(parseISO(input.date), parseISO(today))
  if (dayOffset < 0 || dayOffset > horizonDays) return []

  const localMidnight = fromZonedTime(`${input.date}T00:00:00`, timezone)
  const weekday = parseISO(input.date).getDay()
  const leadCutoff = input.now.getTime() + leadMinutes * 60_000
  const slots: AvailabilitySlot[] = []

  for (
    let startMinute = input.shopHours.openMinute;
    startMinute + input.durationMin <= input.shopHours.closeMinute;
    startMinute += SLOT_STEP_MINUTES
  ) {
    const start = new Date(localMidnight.getTime() + startMinute * 60_000)
    const end = new Date(start.getTime() + input.durationMin * 60_000)

    if (start.getTime() < leadCutoff) continue

    let reason: SlotReason | undefined

    const blocked = input.timeBlocks.some((block) => {
      if (!block.active) return false
      const applies = block.recurring ? block.weekday === weekday : block.date === input.date
      if (!applies) return false

      const blockStart = new Date(localMidnight.getTime() + block.startMinute * 60_000)
      const blockEnd = new Date(localMidnight.getTime() + block.endMinute * 60_000)
      return overlaps(start, end, blockStart, blockEnd)
    })

    if (blocked) {
      reason = 'blocked'
    } else {
      const booked = input.appointments.some(
        (appointment) =>
          ACTIVE_STATUSES.has(appointment.status) &&
          overlaps(start, end, appointment.startAt, appointment.endAt),
      )
      if (booked) reason = 'booked'
    }

    slots.push({
      time: minutesToTime(startMinute),
      startAt: start.toISOString(),
      available: reason === undefined,
      ...(reason ? { reason } : {}),
    })
  }

  return slots
}

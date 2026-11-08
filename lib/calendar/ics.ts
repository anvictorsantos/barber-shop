import { formatInTimeZone } from 'date-fns-tz'
import { createEvent } from 'ics'

import { BUSINESS_TIMEZONE } from '@/lib/availability/slots'

export interface CalendarEventInput {
  uid: string
  title: string
  description: string
  location: string
  startAt: Date
  endAt: Date
  organizerName: string
  organizerEmail?: string | null
}

function utcParts(date: Date): [number, number, number, number, number] {
  const [year, month, day, hour, minute] = formatInTimeZone(date, 'UTC', 'yyyy MM dd HH mm')
    .split(' ')
    .map(Number)

  return [year!, month!, day!, hour!, minute!]
}

export function buildAppointmentIcs(input: CalendarEventInput): string {
  const { error, value } = createEvent({
    uid: input.uid,
    start: utcParts(input.startAt),
    startInputType: 'utc',
    end: utcParts(input.endAt),
    endInputType: 'utc',
    title: input.title,
    description: input.description,
    location: input.location,
    status: 'CONFIRMED',
    busyStatus: 'BUSY',
    ...(input.organizerEmail
      ? { organizer: { name: input.organizerName, email: input.organizerEmail } }
      : {}),
  })

  if (error || !value) {
    throw error ?? new Error('Falha ao gerar o calendário.')
  }

  return value
}

export function buildGoogleCalendarUrl(input: CalendarEventInput): string {
  const dates = `${formatInTimeZone(input.startAt, 'UTC', "yyyyMMdd'T'HHmmss'Z'")}/${formatInTimeZone(
    input.endAt,
    'UTC',
    "yyyyMMdd'T'HHmmss'Z'",
  )}`

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: input.title,
    dates,
    details: input.description,
    location: input.location,
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function buildOutlookCalendarUrl(input: CalendarEventInput): string {
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: input.title,
    startdt: input.startAt.toISOString(),
    enddt: input.endAt.toISOString(),
    location: input.location,
    body: input.description,
    allday: 'false',
  })

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`
}

export function appointmentTimesInShop(iso: string): string {
  return formatInTimeZone(new Date(iso), BUSINESS_TIMEZONE, "dd/MM/yyyy 'às' HH:mm")
}

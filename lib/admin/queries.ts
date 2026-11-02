import { parseISO } from 'date-fns'
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'

import type { AdminScope } from '@/lib/admin/context'
import { BUSINESS_TIMEZONE } from '@/lib/availability/slots'
import { prisma } from '@/lib/db/prisma'

import type { AppointmentStatus, AppointmentSource } from '@prisma/client'

export interface AgendaAppointment {
  id: string
  startAtIso: string
  timeLabel: string
  endLabel: string
  customerId: string | null
  customerName: string
  customerPhone: string | null
  serviceName: string
  barberId: string
  barberName: string
  priceCents: number
  status: AppointmentStatus
  source: AppointmentSource
  order: {
    code: string
    status: string
    totalCents: number
    paid: boolean
  }
}

export interface AgendaBlock {
  id: string
  label: string
  barberName: string
  startLabel: string
  endLabel: string
}

export interface AgendaDay {
  date: string
  appointments: AgendaAppointment[]
  blocks: AgendaBlock[]
}

export function minutesToLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
}

export async function getAgendaDay(
  scope: AdminScope,
  input: { date: string; barberId: string | null },
): Promise<AgendaDay> {
  const timezone = BUSINESS_TIMEZONE
  const dayStart = fromZonedTime(`${input.date}T00:00:00`, timezone)
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
  const weekday = parseISO(input.date).getDay()
  const dateValue = new Date(`${input.date}T00:00:00.000Z`)
  const barberFilter = scope.barberId ?? input.barberId

  const [appointments, blocks] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        startAt: { gte: dayStart, lt: dayEnd },
        ...(barberFilter ? { barberId: barberFilter } : {}),
      },
      orderBy: { startAt: 'asc' },
      include: {
        service: { select: { name: true } },
        barber: { select: { id: true, displayName: true } },
        customer: { select: { id: true, name: true, phone: true } },
        order: {
          select: {
            code: true,
            status: true,
            totalCents: true,
            customerName: true,
            customerPhone: true,
            payments: { select: { status: true } },
          },
        },
      },
    }),
    prisma.timeBlock.findMany({
      where: {
        active: true,
        OR: [{ recurring: true, weekday }, { date: dateValue }],
        ...(barberFilter ? { barberId: barberFilter } : {}),
      },
      orderBy: { startMinute: 'asc' },
      include: { barber: { select: { displayName: true } } },
    }),
  ])

  return {
    date: input.date,
    appointments: appointments.map((appointment) => ({
      id: appointment.id,
      startAtIso: appointment.startAt.toISOString(),
      timeLabel: formatInTimeZone(appointment.startAt, timezone, 'HH:mm'),
      endLabel: formatInTimeZone(appointment.endAt, timezone, 'HH:mm'),
      customerId: appointment.customer?.id ?? null,
      customerName: appointment.customer?.name ?? appointment.order.customerName,
      customerPhone: appointment.customer?.phone ?? appointment.order.customerPhone,
      serviceName: appointment.service.name,
      barberId: appointment.barber.id,
      barberName: appointment.barber.displayName,
      priceCents: appointment.priceCents,
      status: appointment.status,
      source: appointment.source,
      order: {
        code: appointment.order.code,
        status: appointment.order.status,
        totalCents: appointment.order.totalCents,
        paid: appointment.order.payments.some(
          (payment) => payment.status === 'PAID' || payment.status === 'PARTIALLY_REFUNDED',
        ),
      },
    })),
    blocks: blocks.map((block) => ({
      id: block.id,
      label: block.label,
      barberName: block.barber.displayName,
      startLabel: minutesToLabel(block.startMinute),
      endLabel: minutesToLabel(block.endMinute),
    })),
  }
}

export async function getAgendaFormOptions() {
  const [barbers, services] = await Promise.all([
    prisma.barberProfile.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { displayName: 'asc' }],
      select: { id: true, displayName: true },
    }),
    prisma.service.findMany({
      where: { active: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, durationMin: true, priceCents: true },
    }),
  ])

  return { barbers, services }
}

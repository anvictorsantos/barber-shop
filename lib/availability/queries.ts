import { parseISO } from 'date-fns'
import { fromZonedTime } from 'date-fns-tz'

import {
  BUSINESS_TIMEZONE,
  getAvailableSlots,
  type AvailabilitySlot,
} from '@/lib/availability/slots'
import { prisma } from '@/lib/db/prisma'
import { AppError } from '@/lib/http/errors'

import type { BarberProfile, Service } from '@prisma/client'

export interface AvailabilityResult {
  service: Service
  barber: BarberProfile
  timezone: string
  slots: AvailabilitySlot[]
}

export async function getAvailability({
  serviceId,
  barberId,
  date,
  now = new Date(),
}: {
  serviceId: string
  barberId: string
  date: string
  now?: Date
}): Promise<AvailabilityResult> {
  const [service, barber, shop] = await Promise.all([
    prisma.service.findFirst({ where: { id: serviceId, active: true } }),
    prisma.barberProfile.findFirst({ where: { id: barberId, active: true } }),
    prisma.shop.findFirst({ select: { timezone: true } }),
  ])

  if (!service) throw new AppError(404, 'not_found', 'Serviço não encontrado.')
  if (!barber) throw new AppError(404, 'not_found', 'Profissional não encontrado.')

  const timezone = shop?.timezone || BUSINESS_TIMEZONE
  const weekday = parseISO(date).getDay()
  const dayStart = fromZonedTime(`${date}T00:00:00`, timezone)
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
  const dateValue = new Date(`${date}T00:00:00.000Z`)

  const [hours, blocks, appointments] = await Promise.all([
    prisma.shopHours.findUnique({ where: { weekday } }),
    prisma.timeBlock.findMany({
      where: {
        barberId,
        active: true,
        OR: [{ recurring: true, weekday }, { date: dateValue }],
      },
      select: {
        recurring: true,
        weekday: true,
        date: true,
        startMinute: true,
        endMinute: true,
        active: true,
      },
    }),
    prisma.appointment.findMany({
      where: {
        barberId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        startAt: { lt: dayEnd },
        endAt: { gt: dayStart },
      },
      select: { startAt: true, endAt: true, status: true },
    }),
  ])

  const slots = getAvailableSlots({
    date,
    durationMin: service.durationMin,
    shopHours: hours
      ? {
          weekday: hours.weekday,
          openMinute: hours.openMinute,
          closeMinute: hours.closeMinute,
          closed: hours.closed,
        }
      : null,
    timeBlocks: blocks.map((block) => ({
      ...block,
      date: block.date ? block.date.toISOString().slice(0, 10) : null,
    })),
    appointments,
    now,
    timezone,
  })

  return { service, barber, timezone, slots }
}

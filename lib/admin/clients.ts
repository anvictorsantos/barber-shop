import { formatInTimeZone } from 'date-fns-tz'

import type { AdminScope } from '@/lib/admin/context'
import { BUSINESS_TIMEZONE } from '@/lib/availability/slots'
import { prisma } from '@/lib/db/prisma'

import type { AppointmentStatus, Prisma } from '@prisma/client'

export interface ClientRow {
  id: string
  name: string
  email: string | null
  phone: string | null
  noShowCount: number
  bookingBlocked: boolean
  visits: number
  spentCents: number
  lastVisitLabel: string | null
}

export interface ClientAppointment {
  id: string
  startAtLabel: string
  serviceName: string
  barberName: string
  priceCents: number
  status: AppointmentStatus
  orderCode: string
}

export interface ClientDetail {
  id: string
  name: string
  email: string | null
  phone: string | null
  noShowCount: number
  bookingBlocked: boolean
  visits: number
  spentCents: number
  lastVisitLabel: string | null
  appointments: ClientAppointment[]
}

export async function getClients(scope: AdminScope, search: string): Promise<ClientRow[]> {
  const filters: Prisma.UserWhereInput[] = [{ role: 'CUSTOMER' }]

  if (search) {
    filters.push({
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ],
    })
  }

  if (scope.barberId) {
    filters.push({ appointments: { some: { barberId: scope.barberId } } })
  }

  const users = await prisma.user.findMany({
    where: { AND: filters },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      noShowCount: true,
      bookingBlocked: true,
    },
  })

  if (users.length === 0) return []

  const stats = await prisma.appointment.groupBy({
    by: ['customerId'],
    where: {
      customerId: { in: users.map((user) => user.id) },
      status: 'COMPLETED',
      ...(scope.barberId ? { barberId: scope.barberId } : {}),
    },
    _count: { _all: true },
    _sum: { priceCents: true },
    _max: { startAt: true },
  })

  const byCustomer = new Map(stats.map((stat) => [stat.customerId, stat]))

  return users.map((user) => {
    const stat = byCustomer.get(user.id)
    return {
      ...user,
      visits: stat?._count._all ?? 0,
      spentCents: stat?._sum.priceCents ?? 0,
      lastVisitLabel: stat?._max.startAt
        ? formatInTimeZone(stat._max.startAt, BUSINESS_TIMEZONE, 'dd/MM/yyyy')
        : null,
    }
  })
}

export async function getClientDetail(
  scope: AdminScope,
  userId: string,
): Promise<ClientDetail | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      noShowCount: true,
      bookingBlocked: true,
    },
  })

  if (!user || user.role !== 'CUSTOMER') return null

  if (scope.barberId) {
    const linked = await prisma.appointment.count({
      where: { customerId: user.id, barberId: scope.barberId },
    })
    if (linked === 0) return null
  }

  const [appointments, stats] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        customerId: user.id,
        ...(scope.barberId ? { barberId: scope.barberId } : {}),
      },
      orderBy: { startAt: 'desc' },
      take: 50,
      select: {
        id: true,
        startAt: true,
        priceCents: true,
        status: true,
        service: { select: { name: true } },
        barber: { select: { displayName: true } },
        order: { select: { code: true } },
      },
    }),
    prisma.appointment.aggregate({
      where: {
        customerId: user.id,
        status: 'COMPLETED',
        ...(scope.barberId ? { barberId: scope.barberId } : {}),
      },
      _count: { _all: true },
      _sum: { priceCents: true },
      _max: { startAt: true },
    }),
  ])

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    noShowCount: user.noShowCount,
    bookingBlocked: user.bookingBlocked,
    visits: stats._count._all,
    spentCents: stats._sum.priceCents ?? 0,
    lastVisitLabel: stats._max.startAt
      ? formatInTimeZone(stats._max.startAt, BUSINESS_TIMEZONE, 'dd/MM/yyyy')
      : null,
    appointments: appointments.map((appointment) => ({
      id: appointment.id,
      startAtLabel: formatInTimeZone(
        appointment.startAt,
        BUSINESS_TIMEZONE,
        "dd/MM/yyyy 'às' HH:mm",
      ),
      serviceName: appointment.service.name,
      barberName: appointment.barber.displayName,
      priceCents: appointment.priceCents,
      status: appointment.status,
      orderCode: appointment.order.code,
    })),
  }
}

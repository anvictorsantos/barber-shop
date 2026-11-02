import { formatInTimeZone } from 'date-fns-tz'

import { BUSINESS_TIMEZONE } from '@/lib/availability/slots'
import { prisma } from '@/lib/db/prisma'

import type { AppointmentStatus } from '@prisma/client'

export interface AppointmentCard {
  id: string
  startAtIso: string
  startLabel: string
  endLabel: string
  serviceName: string
  serviceSlug: string
  barberName: string
  priceCents: number
  status: AppointmentStatus
  orderCode: string
  paid: boolean
  reviewed: boolean
}

function toCard(appointment: {
  id: string
  startAt: Date
  endAt: Date
  priceCents: number
  status: AppointmentStatus
  service: { name: string; slug: string }
  barber: { displayName: string }
  order: {
    code: string
    payments: { status: string }[]
  }
  review: { id: string } | null
}): AppointmentCard {
  return {
    id: appointment.id,
    startAtIso: appointment.startAt.toISOString(),
    startLabel: formatInTimeZone(appointment.startAt, BUSINESS_TIMEZONE, "dd/MM/yyyy 'às' HH:mm"),
    endLabel: formatInTimeZone(appointment.endAt, BUSINESS_TIMEZONE, 'HH:mm'),
    serviceName: appointment.service.name,
    serviceSlug: appointment.service.slug,
    barberName: appointment.barber.displayName,
    priceCents: appointment.priceCents,
    status: appointment.status,
    orderCode: appointment.order.code,
    paid: appointment.order.payments.some(
      (payment) => payment.status === 'PAID' || payment.status === 'PARTIALLY_REFUNDED',
    ),
    reviewed: appointment.review !== null,
  }
}

const cardInclude = {
  service: { select: { name: true, slug: true } },
  barber: { select: { displayName: true } },
  order: {
    select: {
      code: true,
      payments: { select: { status: true } },
    },
  },
  review: { select: { id: true } },
} as const

export async function getUpcomingAppointments(userId: string): Promise<AppointmentCard[]> {
  const appointments = await prisma.appointment.findMany({
    where: {
      customerId: userId,
      status: { in: ['PENDING', 'CONFIRMED'] },
      startAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
    },
    orderBy: { startAt: 'asc' },
    include: cardInclude,
  })

  return appointments.map(toCard)
}

export async function getAppointmentHistory(userId: string): Promise<AppointmentCard[]> {
  const appointments = await prisma.appointment.findMany({
    where: {
      customerId: userId,
      status: { in: ['COMPLETED', 'NO_SHOW', 'CANCELED', 'CANCELED_LATE'] },
    },
    orderBy: { startAt: 'desc' },
    take: 60,
    include: cardInclude,
  })

  return appointments.map(toCard)
}

export async function getCustomerProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerifiedAt: true,
      phone: true,
      phoneVerifiedAt: true,
      cpf: true,
      birthDate: true,
      addressLine: true,
      city: true,
      state: true,
      postalCode: true,
      notifyEmail: true,
      notifyWhatsapp: true,
    },
  })
}

export async function getFavorites(userId: string) {
  const [barbers, services, products] = await Promise.all([
    prisma.favoriteBarber.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        barber: {
          select: { id: true, displayName: true, title: true, avatarUrl: true, active: true },
        },
      },
    }),
    prisma.favoriteService.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        service: {
          select: {
            id: true,
            slug: true,
            name: true,
            priceCents: true,
            durationMin: true,
            active: true,
          },
        },
      },
    }),
    prisma.favoriteProduct.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        product: {
          select: {
            id: true,
            name: true,
            description: true,
            priceCents: true,
            stock: true,
            reserved: true,
            active: true,
          },
        },
      },
    }),
  ])

  return {
    barbers: barbers.map((row) => row.barber).filter((barber) => barber.active),
    services: services.map((row) => row.service).filter((service) => service.active),
    products: products.map((row) => row.product).filter((product) => product.active),
  }
}

export async function getFavoriteIds(userId: string | null) {
  if (!userId) {
    return { barbers: new Set<string>(), services: new Set<string>(), products: new Set<string>() }
  }

  const [barbers, services, products] = await Promise.all([
    prisma.favoriteBarber.findMany({ where: { userId }, select: { barberId: true } }),
    prisma.favoriteService.findMany({ where: { userId }, select: { serviceId: true } }),
    prisma.favoriteProduct.findMany({ where: { userId }, select: { productId: true } }),
  ])

  return {
    barbers: new Set(barbers.map((row) => row.barberId)),
    services: new Set(services.map((row) => row.serviceId)),
    products: new Set(products.map((row) => row.productId)),
  }
}

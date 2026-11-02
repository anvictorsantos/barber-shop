import { formatInTimeZone } from 'date-fns-tz'

import { BUSINESS_TIMEZONE } from '@/lib/availability/slots'
import { prisma } from '@/lib/db/prisma'

import type { AppointmentStatus } from '@prisma/client'

export interface AppointmentCard {
  id: string
  startAtIso: string
  startLabel: string
  endLabel: string
  serviceId: string
  serviceName: string
  serviceSlug: string
  serviceImageUrl: string | null
  serviceDurationMin: number
  barberId: string
  barberName: string
  barberAvatarUrl: string | null
  priceCents: number
  status: AppointmentStatus
  orderCode: string
  paid: boolean
  reviewed: boolean
  reviewRating: number | null
}

function toCard(appointment: {
  id: string
  startAt: Date
  endAt: Date
  priceCents: number
  status: AppointmentStatus
  service: { id: string; name: string; slug: string; imageUrl: string | null; durationMin: number }
  barber: { id: string; displayName: string; avatarUrl: string | null }
  order: {
    code: string
    payments: { status: string }[]
  }
  review: { id: string; rating: number } | null
}): AppointmentCard {
  return {
    id: appointment.id,
    startAtIso: appointment.startAt.toISOString(),
    startLabel: formatInTimeZone(appointment.startAt, BUSINESS_TIMEZONE, "dd/MM/yyyy 'às' HH:mm"),
    endLabel: formatInTimeZone(appointment.endAt, BUSINESS_TIMEZONE, 'HH:mm'),
    serviceId: appointment.service.id,
    serviceName: appointment.service.name,
    serviceSlug: appointment.service.slug,
    serviceImageUrl: appointment.service.imageUrl,
    serviceDurationMin: appointment.service.durationMin,
    barberId: appointment.barber.id,
    barberName: appointment.barber.displayName,
    barberAvatarUrl: appointment.barber.avatarUrl,
    priceCents: appointment.priceCents,
    status: appointment.status,
    orderCode: appointment.order.code,
    paid: appointment.order.payments.some(
      (payment) => payment.status === 'PAID' || payment.status === 'PARTIALLY_REFUNDED',
    ),
    reviewed: appointment.review !== null,
    reviewRating: appointment.review?.rating ?? null,
  }
}

const cardInclude = {
  service: { select: { id: true, name: true, slug: true, imageUrl: true, durationMin: true } },
  barber: { select: { id: true, displayName: true, avatarUrl: true } },
  order: {
    select: {
      code: true,
      payments: { select: { status: true } },
    },
  },
  review: { select: { id: true, rating: true } },
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
      createdAt: true,
    },
  })
}

export async function getFavorites(userId: string) {
  const [barbers, services, products, visits, purchases] = await Promise.all([
    prisma.favoriteBarber.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        barber: {
          select: {
            id: true,
            displayName: true,
            title: true,
            avatarUrl: true,
            active: true,
            ratingAvg: true,
            sortOrder: true,
          },
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
            sortOrder: true,
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
            slug: true,
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
    prisma.appointment.findMany({
      where: { customerId: userId, status: 'COMPLETED' },
      select: { barberId: true, serviceId: true },
    }),
    prisma.orderProduct.findMany({
      where: { order: { customerId: userId } },
      select: { productId: true, quantity: true },
    }),
  ])

  const barberVisits = new Map<string, number>()
  const serviceVisits = new Map<string, number>()
  for (const visit of visits) {
    barberVisits.set(visit.barberId, (barberVisits.get(visit.barberId) ?? 0) + 1)
    serviceVisits.set(visit.serviceId, (serviceVisits.get(visit.serviceId) ?? 0) + 1)
  }

  const productPurchases = new Map<string, number>()
  for (const purchase of purchases) {
    productPurchases.set(
      purchase.productId,
      (productPurchases.get(purchase.productId) ?? 0) + purchase.quantity,
    )
  }

  return {
    barbers: barbers
      .map((row) => row.barber)
      .filter((barber) => barber.active)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((barber) => ({
        ...barber,
        ratingAvg: Number(barber.ratingAvg),
        visits: barberVisits.get(barber.id) ?? 0,
      })),
    services: services
      .map((row) => row.service)
      .filter((service) => service.active)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((service) => ({
        ...service,
        timesBooked: serviceVisits.get(service.id) ?? 0,
      })),
    products: products
      .map((row) => row.product)
      .filter((product) => product.active)
      .map((product) => ({
        ...product,
        timesBought: productPurchases.get(product.id) ?? 0,
      })),
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

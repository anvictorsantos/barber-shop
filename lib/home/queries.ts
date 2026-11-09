import { addDays, format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatInTimeZone } from 'date-fns-tz'
import { unstable_cache } from 'next/cache'

import { getAvailability } from '@/lib/availability/queries'
import { BUSINESS_TIMEZONE } from '@/lib/availability/slots'
import { prisma } from '@/lib/db/prisma'
import { formatBRL } from '@/lib/format/money'
import { initials } from '@/lib/format/name'

export interface HomeHeroBooking {
  serviceId: string
  serviceName: string
  durationMin: number
  price: string
  barberId: string
  barberName: string
  barberTitle: string
  barberInitials: string
  dateLabel: string
  slots: { time: string; startAt: string }[]
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export async function getHomeHeroBooking({
  service,
  barber,
  now = new Date(),
  days = 7,
}: {
  service: { id: string; name: string; durationMin: number; priceCents: number }
  barber: { id: string; displayName: string; title: string }
  now?: Date
  days?: number
}): Promise<HomeHeroBooking> {
  const today = formatInTimeZone(now, BUSINESS_TIMEZONE, 'yyyy-MM-dd')
  const base = {
    serviceId: service.id,
    serviceName: service.name,
    durationMin: service.durationMin,
    price: formatBRL(service.priceCents),
    barberId: barber.id,
    barberName: barber.displayName,
    barberTitle: barber.title,
    barberInitials: initials(barber.displayName),
  }

  for (let offset = 0; offset < days; offset += 1) {
    const date = format(addDays(parseISO(today), offset), 'yyyy-MM-dd')
    const availability = await getAvailability({
      serviceId: service.id,
      barberId: barber.id,
      date,
      now,
    }).catch(() => null)
    const slots = availability?.slots.filter((slot) => slot.available).slice(0, 3) ?? []
    if (slots.length === 0) continue

    return {
      ...base,
      dateLabel:
        offset === 0
          ? 'Hoje'
          : offset === 1
            ? 'Amanhã'
            : capitalize(format(parseISO(date), "EEEE, d 'de' MMMM", { locale: ptBR })),
      slots: slots.map((slot) => ({ time: slot.time, startAt: slot.startAt })),
    }
  }

  return { ...base, dateLabel: '', slots: [] }
}

export interface HomeReview {
  id: string
  comment: string
  rating: number
  customerName: string
}

export const getHomeReviews = unstable_cache(
  async (take = 3): Promise<HomeReview[]> => {
    const reviews = await prisma.review.findMany({
      where: { comment: { not: null } },
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        id: true,
        comment: true,
        rating: true,
        customer: { select: { name: true } },
      },
    })

    return reviews.map((review) => ({
      id: review.id,
      comment: review.comment ?? '',
      rating: review.rating,
      customerName: review.customer.name,
    }))
  },
  ['home-reviews'],
  { revalidate: 300 },
)

export const getHomeStats = unstable_cache(
  async () => {
    const [beards, cuts, clients] = await Promise.all([
      prisma.appointment.count({
        where: { status: 'COMPLETED', service: { category: 'BARBA' } },
      }),
      prisma.appointment.count({
        where: { status: 'COMPLETED', service: { category: { in: ['CORTE', 'COMBO'] } } },
      }),
      prisma.appointment
        .groupBy({
          by: ['customerId'],
          where: { status: 'COMPLETED', customerId: { not: null } },
        })
        .then((rows) => rows.length),
    ])

    return { beards, cuts, clients }
  },
  ['home-stats'],
  { revalidate: 3600 },
)

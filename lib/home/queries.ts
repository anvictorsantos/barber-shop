import { prisma } from '@/lib/db/prisma'

export interface HomeReview {
  id: string
  comment: string
  rating: number
  customerName: string
}

export async function getHomeReviews(take = 3): Promise<HomeReview[]> {
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
}

export async function getHomeStats() {
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
}

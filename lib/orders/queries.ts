import { prisma } from '@/lib/db/prisma'

export async function getOrderByCode(code: string) {
  return prisma.order.findUnique({
    where: { code },
    include: {
      appointments: {
        orderBy: { startAt: 'asc' },
        include: {
          service: { select: { name: true, durationMin: true, imageUrl: true } },
          barber: { select: { displayName: true, title: true, avatarUrl: true } },
        },
      },
      products: {
        include: {
          product: { select: { name: true } },
        },
      },
      payments: true,
    },
  })
}

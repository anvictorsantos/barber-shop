import { prisma } from '@/lib/db/prisma'

import type { Service } from '@prisma/client'

export async function getActiveServices(): Promise<Service[]> {
  return prisma.service.findMany({
    where: { active: true },
    orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
  })
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  return prisma.service.findFirst({ where: { slug, active: true } })
}

export async function getServiceById(id: string): Promise<Service | null> {
  return prisma.service.findFirst({ where: { id, active: true } })
}

export async function getActiveProducts() {
  return prisma.product.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
  })
}

export async function getActiveBarbers() {
  return prisma.barberProfile.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      displayName: true,
      title: true,
      avatarUrl: true,
      ratingAvg: true,
      ratingCount: true,
    },
  })
}

export async function getActiveBarberById(id: string) {
  return prisma.barberProfile.findFirst({
    where: { id, active: true },
    select: {
      id: true,
      displayName: true,
      title: true,
      avatarUrl: true,
      ratingAvg: true,
      ratingCount: true,
    },
  })
}

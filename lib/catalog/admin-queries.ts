import type { AdminProduct, AdminService } from '@/lib/catalog/types'
import { prisma } from '@/lib/db/prisma'

export async function getAdminServices(): Promise<AdminService[]> {
  return prisma.service.findMany({
    orderBy: [{ active: 'desc' }, { featured: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      category: true,
      durationMin: true,
      priceCents: true,
      originalPriceCents: true,
      promoLabel: true,
      imageUrl: true,
      active: true,
      featured: true,
      sortOrder: true,
    },
  })
}

export async function getAdminProducts(): Promise<AdminProduct[]> {
  return prisma.product.findMany({
    orderBy: [{ active: 'desc' }, { name: 'asc' }],
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      priceCents: true,
      stock: true,
      reserved: true,
      imageUrl: true,
      active: true,
    },
  })
}

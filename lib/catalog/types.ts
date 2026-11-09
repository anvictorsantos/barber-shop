import type { ServiceCategory } from '@prisma/client'

export interface AdminService {
  id: string
  slug: string
  name: string
  description: string
  category: ServiceCategory
  durationMin: number
  priceCents: number
  originalPriceCents: number | null
  promoLabel: string | null
  imageUrl: string | null
  active: boolean
  featured: boolean
  sortOrder: number
}

export interface AdminProduct {
  id: string
  slug: string
  name: string
  description: string
  priceCents: number
  stock: number
  reserved: number
  imageUrl: string | null
  active: boolean
}

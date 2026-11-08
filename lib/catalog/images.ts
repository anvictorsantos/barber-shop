import type { ServiceCategory } from '@prisma/client'

const BASE = 'https://images.unsplash.com'
const WIDE = '?auto=format&fit=crop&w=1600&q=80'
const CARD = '?auto=format&fit=crop&w=900&q=80'

export const HERO_IMAGE = `${BASE}/photo-1503951914875-452162b0f3f1${WIDE}`

const CATEGORY_IMAGE: Record<ServiceCategory, string> = {
  CORTE: `${BASE}/photo-1599351431202-1e0f0137899a${CARD}`,
  BARBA: `${BASE}/photo-1517832606299-7ae9b720a186${CARD}`,
  COMBO: `${BASE}/photo-1593702288056-7927b442d0fa${CARD}`,
  PEZINHO: `${BASE}/photo-1622286342621-4bd786c2447c${CARD}`,
  QUIMICA: `${BASE}/photo-1621605815971-fbc98d665033${CARD}`,
}

export function serviceImage(service: {
  imageUrl: string | null
  category: ServiceCategory
}): string {
  return service.imageUrl ?? CATEGORY_IMAGE[service.category]
}

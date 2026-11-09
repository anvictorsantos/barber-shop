import type { ServiceCategory } from '@prisma/client'

export const HERO_IMAGE = '/hero.webp'

const CATEGORY_IMAGE: Record<ServiceCategory, string> = {
  CORTE: '/catalogo/corte-tesoura-maquina.webp',
  BARBA: '/catalogo/barba.webp',
  COMBO: '/catalogo/corte-barba.webp',
  PEZINHO: '/catalogo/pezinho.webp',
  QUIMICA: '/catalogo/hidratacao.webp',
}

export function serviceImage(service: {
  imageUrl: string | null
  category: ServiceCategory
}): string {
  return service.imageUrl ?? CATEGORY_IMAGE[service.category]
}

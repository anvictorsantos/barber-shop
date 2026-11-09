import type { ServiceCategory } from '@prisma/client'

const CATALOG = '/catalogo'

export const HERO_IMAGE = '/hero.webp'

const CATEGORY_IMAGE: Record<ServiceCategory, string> = {
  CORTE: `${CATALOG}/corte-tesoura-maquina.webp`,
  BARBA: `${CATALOG}/barba.webp`,
  COMBO: `${CATALOG}/corte-barba.webp`,
  PEZINHO: `${CATALOG}/pezinho.webp`,
  QUIMICA: `${CATALOG}/hidratacao.webp`,
}

export function serviceImage(service: {
  imageUrl: string | null
  category: ServiceCategory
}): string {
  return service.imageUrl ?? CATEGORY_IMAGE[service.category]
}

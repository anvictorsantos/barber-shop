import type { ServiceCategory } from '@prisma/client'

export const HERO_IMAGE = '/hero.webp'

const CATEGORY_IMAGE: Record<ServiceCategory, string> = {
  CORTE: '/galeria/05.webp',
  BARBA: '/galeria/03.webp',
  COMBO: '/galeria/01.webp',
  PEZINHO: '/galeria/06.webp',
  QUIMICA: '/galeria/02.webp',
}

const SERVICE_IMAGE: Record<string, string> = {
  'corte-barba': '/galeria/01.webp',
  'corte-tesoura-maquina': '/galeria/05.webp',
  'corte-kids': '/galeria/04.webp',
  'barba-terapia': '/galeria/03.webp',
  barba: '/galeria/03.webp',
  pezinho: '/galeria/06.webp',
  'progressiva-masculina': '/galeria/04.webp',
  'botox-capilar': '/galeria/02.webp',
  relaxamento: '/galeria/02.webp',
  luzes: '/galeria/04.webp',
  platinado: '/galeria/04.webp',
  tintura: '/galeria/04.webp',
  sobrancelha: '/galeria/02.webp',
}

// /catalogo holds the legacy "Agendamento Automático" promo graphics; curated gallery photos replace them.
const LEGACY_IMAGE_PREFIX = '/catalogo/'

export function serviceImage(service: {
  slug: string
  imageUrl: string | null
  category: ServiceCategory
}): string {
  const curated = SERVICE_IMAGE[service.slug] ?? CATEGORY_IMAGE[service.category]
  if (!service.imageUrl || service.imageUrl.startsWith(LEGACY_IMAGE_PREFIX)) return curated
  return service.imageUrl
}

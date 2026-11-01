import type { Service, ServiceCategory } from '@prisma/client'

export const serviceCategoryOrder: readonly ServiceCategory[] = [
  'CORTE',
  'BARBA',
  'COMBO',
  'PEZINHO',
  'QUIMICA',
]

export const serviceCategoryLabels: Record<ServiceCategory, string> = {
  CORTE: 'Corte',
  BARBA: 'Barba',
  COMBO: 'Corte e Barba',
  PEZINHO: 'Pezinho',
  QUIMICA: 'Químicas e Tratamento Capilar',
}

export interface ServiceGroup {
  category: ServiceCategory
  label: string
  services: Service[]
}

export function groupServicesByCategory(services: Service[]): ServiceGroup[] {
  return serviceCategoryOrder
    .map((category) => ({
      category,
      label: serviceCategoryLabels[category],
      services: services.filter((service) => service.category === category),
    }))
    .filter((group) => group.services.length > 0)
}

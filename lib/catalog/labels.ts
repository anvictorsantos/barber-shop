import type { Product, Service, ServiceCategory } from '@prisma/client'

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

export const productCategoryOrder = [
  'POMADA',
  'OLEO',
  'LOCAO',
  'PERFUME',
  'TRATAMENTO',
  'BEBIDA',
  'OUTROS',
] as const

export type ProductCategory = (typeof productCategoryOrder)[number]

export const productCategoryLabels: Record<ProductCategory, string> = {
  POMADA: 'Pomadas',
  OLEO: 'Óleos',
  LOCAO: 'Loções',
  PERFUME: 'Perfumes',
  TRATAMENTO: 'Tratamento',
  BEBIDA: 'Bebidas',
  OUTROS: 'Outros',
}

export interface ProductGroup {
  category: ProductCategory
  label: string
  products: Product[]
}

export function productCategoryFor(product: Pick<Product, 'slug'>): ProductCategory {
  const slug = product.slug
  if (slug.includes('cerveja') || slug.includes('bebida')) return 'BEBIDA'
  if (slug.includes('oleo')) return 'OLEO'
  if (slug.includes('locao')) return 'LOCAO'
  if (slug.includes('perfume')) return 'PERFUME'
  if (slug.includes('pomada') || slug.includes('cera') || slug.includes('gel')) return 'POMADA'
  if (slug.includes('minoxidil') || slug.includes('shampoo') || slug.includes('tonico')) {
    return 'TRATAMENTO'
  }
  return 'OUTROS'
}

export function groupProductsByCategory(products: Product[]): ProductGroup[] {
  return productCategoryOrder
    .map((category) => ({
      category,
      label: productCategoryLabels[category],
      products: products.filter((product) => productCategoryFor(product) === category),
    }))
    .filter((group) => group.products.length > 0)
}

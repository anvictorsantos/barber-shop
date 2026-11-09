import { slugify } from '@/lib/catalog/slug'
import { prisma } from '@/lib/db/prisma'
import { parseBRLToCents } from '@/lib/format/money'
import { AppError } from '@/lib/http/errors'
import type {
  ProductInput,
  ServiceInput,
  ToggleInput,
  UpdateProductInput,
  UpdateServiceInput,
} from '@/lib/validation/catalog'

function requiredCents(value: string, label: string): number {
  const cents = parseBRLToCents(value)
  if (cents === null) {
    throw new AppError(400, 'invalid_price', `Preço inválido em ${label}.`)
  }
  return cents
}

function optionalCents(value: string, label: string): number | null {
  if (!value.trim()) return null
  return requiredCents(value, label)
}

async function uniqueServiceSlug(name: string): Promise<string> {
  const base = slugify(name) || 'servico'
  let slug = base
  let suffix = 2

  while (await prisma.service.findUnique({ where: { slug } })) {
    slug = `${base}-${suffix}`
    suffix += 1
  }

  return slug
}

async function uniqueProductSlug(name: string): Promise<string> {
  const base = slugify(name) || 'produto'
  let slug = base
  let suffix = 2

  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${base}-${suffix}`
    suffix += 1
  }

  return slug
}

export async function createService(input: ServiceInput) {
  return prisma.service.create({
    data: {
      slug: await uniqueServiceSlug(input.name),
      name: input.name,
      description: input.description,
      category: input.category,
      durationMin: input.durationMin,
      priceCents: requiredCents(input.price, 'serviço'),
      originalPriceCents: optionalCents(input.originalPrice, 'preço original'),
      promoLabel: input.promoLabel || null,
      imageUrl: input.imageUrl || null,
      active: input.active,
      featured: input.featured,
      sortOrder: input.sortOrder,
    },
  })
}

export async function updateService(input: UpdateServiceInput) {
  const existing = await prisma.service.findUnique({ where: { id: input.id } })
  if (!existing) throw new AppError(404, 'not_found', 'Serviço não encontrado.')

  return prisma.service.update({
    where: { id: input.id },
    data: {
      name: input.name,
      description: input.description,
      category: input.category,
      durationMin: input.durationMin,
      priceCents: requiredCents(input.price, 'serviço'),
      originalPriceCents: optionalCents(input.originalPrice, 'preço original'),
      promoLabel: input.promoLabel || null,
      imageUrl: input.imageUrl || null,
      active: input.active,
      featured: input.featured,
      sortOrder: input.sortOrder,
    },
  })
}

export async function toggleService(input: ToggleInput) {
  const existing = await prisma.service.findUnique({ where: { id: input.id } })
  if (!existing) throw new AppError(404, 'not_found', 'Serviço não encontrado.')

  return prisma.service.update({
    where: { id: input.id },
    data: { active: input.active },
  })
}

export async function createProduct(input: ProductInput) {
  const priceCents = requiredCents(input.price, 'produto')
  const slug = await uniqueProductSlug(input.name)

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        slug,
        name: input.name,
        description: input.description,
        priceCents,
        stock: input.stock,
        imageUrl: input.imageUrl || null,
        active: input.active,
      },
    })

    if (input.stock > 0) {
      await tx.inventoryMovement.create({
        data: {
          productId: product.id,
          type: 'ADJUST',
          quantity: input.stock,
          note: 'Estoque inicial',
        },
      })
    }

    return product
  })
}

export async function updateProduct(input: UpdateProductInput) {
  const existing = await prisma.product.findUnique({ where: { id: input.id } })
  if (!existing) throw new AppError(404, 'not_found', 'Produto não encontrado.')
  if (input.stock < existing.reserved) {
    throw new AppError(
      400,
      'stock_below_reserved',
      'O estoque não pode ficar abaixo das reservas ativas.',
    )
  }

  const priceCents = requiredCents(input.price, 'produto')
  const delta = input.stock - existing.stock

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.update({
      where: { id: input.id },
      data: {
        name: input.name,
        description: input.description,
        priceCents,
        stock: input.stock,
        imageUrl: input.imageUrl || null,
        active: input.active,
      },
    })

    if (delta !== 0) {
      await tx.inventoryMovement.create({
        data: {
          productId: product.id,
          type: 'ADJUST',
          quantity: Math.abs(delta),
          note: `Ajuste ${delta > 0 ? '+' : ''}${delta}`,
        },
      })
    }

    return product
  })
}

export async function setServiceFeatured(input: { id: string; featured: boolean }) {
  const existing = await prisma.service.findUnique({ where: { id: input.id } })
  if (!existing) throw new AppError(404, 'not_found', 'Serviço não encontrado.')

  return prisma.service.update({
    where: { id: input.id },
    data: { featured: input.featured },
  })
}

export async function toggleProduct(input: ToggleInput) {
  const existing = await prisma.product.findUnique({ where: { id: input.id } })
  if (!existing) throw new AppError(404, 'not_found', 'Produto não encontrado.')

  return prisma.product.update({
    where: { id: input.id },
    data: { active: input.active },
  })
}

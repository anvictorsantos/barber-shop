import { afterAll, describe, expect, it } from 'vitest'

import {
  createProduct,
  createService,
  toggleService,
  updateProduct,
  updateService,
} from '@/lib/catalog/admin'
import { prisma } from '@/lib/db/prisma'

const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`
const serviceName = `Serviço E2E ${suffix}`
const productName = `Produto E2E ${suffix}`

const serviceIds: string[] = []
const productIds: string[] = []

afterAll(async () => {
  if (productIds.length > 0) {
    await prisma.inventoryMovement.deleteMany({ where: { productId: { in: productIds } } })
    await prisma.product.deleteMany({ where: { id: { in: productIds } } })
  }
  if (serviceIds.length > 0) {
    await prisma.service.deleteMany({ where: { id: { in: serviceIds } } })
  }
})

describe('catalog admin operations', () => {
  it('creates, edits, and toggles a service', async () => {
    const created = await createService({
      name: serviceName,
      description: 'Descrição do serviço de teste.',
      category: 'CORTE',
      durationMin: 30,
      price: '50,00',
      originalPrice: '',
      promoLabel: '',
      imageUrl: '',
      active: true,
      sortOrder: 99,
    })
    serviceIds.push(created.id)

    expect(created.priceCents).toBe(5000)
    expect(created.slug).toContain('servico-e2e')

    const updated = await updateService({
      id: created.id,
      name: serviceName,
      description: 'Descrição atualizada.',
      category: 'CORTE',
      durationMin: 40,
      price: '55,50',
      originalPrice: '60,00',
      promoLabel: 'TESTE',
      imageUrl: '',
      active: true,
      sortOrder: 99,
    })

    expect(updated.priceCents).toBe(5550)
    expect(updated.originalPriceCents).toBe(6000)
    expect(updated.durationMin).toBe(40)

    const toggled = await toggleService({ id: created.id, active: false })
    expect(toggled.active).toBe(false)
  })

  it('creates and adjusts a product with inventory movements', async () => {
    const created = await createProduct({
      name: productName,
      description: 'Descrição do produto de teste.',
      price: '10,00',
      stock: 5,
      imageUrl: '',
      active: true,
    })
    productIds.push(created.id)

    expect(created.stock).toBe(5)

    const updated = await updateProduct({
      id: created.id,
      name: productName,
      description: 'Descrição atualizada.',
      price: '12,00',
      stock: 3,
      imageUrl: '',
      active: true,
    })

    expect(updated.stock).toBe(3)
    expect(updated.priceCents).toBe(1200)

    const movements = await prisma.inventoryMovement.findMany({
      where: { productId: created.id },
    })

    expect(movements).toHaveLength(2)
    expect(movements.every((movement) => movement.type === 'ADJUST')).toBe(true)
    expect(movements.map((movement) => movement.quantity).sort((a, b) => a - b)).toEqual([2, 5])
  })
})

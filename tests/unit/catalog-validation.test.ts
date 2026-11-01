import { describe, expect, it } from 'vitest'

import { productInputSchema, serviceInputSchema } from '@/lib/validation/catalog'

describe('catalog validation', () => {
  it('accepts a valid service', () => {
    const parsed = serviceInputSchema.safeParse({
      name: 'Corte Teste',
      description: 'Descrição do corte.',
      category: 'CORTE',
      durationMin: 30,
      price: '50,00',
      originalPrice: '',
      promoLabel: '',
      imageUrl: '',
      active: true,
      sortOrder: 1,
    })
    expect(parsed.success).toBe(true)
  })

  it('rejects an out-of-range duration', () => {
    const parsed = serviceInputSchema.safeParse({
      name: 'Corte Teste',
      description: 'Descrição do corte.',
      category: 'CORTE',
      durationMin: 5,
      price: '50,00',
    })
    expect(parsed.success).toBe(false)
  })

  it('rejects an invalid image URL', () => {
    const parsed = serviceInputSchema.safeParse({
      name: 'Corte Teste',
      description: 'Descrição do corte.',
      category: 'CORTE',
      durationMin: 30,
      price: '50,00',
      imageUrl: 'not-a-url',
    })
    expect(parsed.success).toBe(false)
  })

  it('rejects negative product stock', () => {
    const parsed = productInputSchema.safeParse({
      name: 'Produto Teste',
      description: 'Descrição.',
      price: '10,00',
      stock: -1,
    })
    expect(parsed.success).toBe(false)
  })
})

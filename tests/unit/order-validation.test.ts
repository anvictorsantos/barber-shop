import { describe, expect, it } from 'vitest'

import { createOrderSchema } from '@/lib/validation/orders'

const line = {
  kind: 'service' as const,
  serviceId: 'service-1',
  barberId: 'barber-1',
  startAt: '2026-11-10T12:00:00.000Z',
}

function parse(customer: { name: string; email?: string; phone?: string }) {
  return createOrderSchema.safeParse({
    paymentMode: 'ON_SITE',
    customer,
    lines: [line],
  })
}

describe('order customer validation', () => {
  it('requires a name', () => {
    expect(parse({ name: '', email: 'cliente@example.com' }).success).toBe(false)
  })

  it('requires at least one contact', () => {
    const result = parse({ name: 'Cliente', email: '', phone: '' })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Informe e-mail ou WhatsApp.')
    }
  })

  it('accepts email only', () => {
    expect(parse({ name: 'Cliente', email: 'cliente@example.com', phone: '' }).success).toBe(true)
  })

  it('accepts WhatsApp only', () => {
    expect(parse({ name: 'Cliente', email: '', phone: '+55 31 98881-5243' }).success).toBe(true)
  })

  it('accepts both contacts', () => {
    expect(
      parse({ name: 'Cliente', email: 'cliente@example.com', phone: '+55 31 98881-5243' }).success,
    ).toBe(true)
  })
})

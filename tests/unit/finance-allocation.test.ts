import { describe, expect, it } from 'vitest'

import { allocateToBarber } from '@/lib/finance/queries'
import type { AllocationPayment } from '@/lib/finance/queries'

function payment(overrides: Partial<AllocationPayment> = {}): AllocationPayment {
  return {
    amountCents: 9000,
    order: {
      serviceCents: 6000,
      productCents: 3000,
      appointments: [
        { barberId: 'ana', priceCents: 4000 },
        { barberId: 'bruno', priceCents: 2000 },
      ],
    },
    refunds: [],
    ...overrides,
  }
}

describe('allocateToBarber', () => {
  it('credits a single-appointment order in full', () => {
    const single = payment({
      amountCents: 5000,
      order: {
        serviceCents: 5000,
        productCents: 0,
        appointments: [{ barberId: 'ana', priceCents: 5000 }],
      },
    })

    expect(allocateToBarber(single, 'ana')).toEqual({ amountCents: 5000, refundedCents: 0 })
  })

  it('splits a multi-barber order by appointment price and leaves products out', () => {
    expect(allocateToBarber(payment(), 'ana').amountCents).toBe(4000)
    expect(allocateToBarber(payment(), 'bruno').amountCents).toBe(2000)
  })

  it('apportions an on-site credit discount across barbers', () => {
    const discounted = payment({
      amountCents: 5000,
      order: {
        serviceCents: 10000,
        productCents: 0,
        appointments: [
          { barberId: 'ana', priceCents: 6000 },
          { barberId: 'bruno', priceCents: 4000 },
        ],
      },
    })

    expect(allocateToBarber(discounted, 'ana').amountCents).toBe(3000)
    expect(allocateToBarber(discounted, 'bruno').amountCents).toBe(2000)
  })

  it('assigns appointment refunds directly and shares untargeted ones', () => {
    const refunded = payment({
      refunds: [
        { amountCents: 2000, orderProductId: null, appointment: { barberId: 'ana' } },
        { amountCents: 1000, orderProductId: 'line-1', appointment: null },
        { amountCents: 900, orderProductId: null, appointment: null },
      ],
    })

    expect(allocateToBarber(refunded, 'ana')).toEqual({ amountCents: 4000, refundedCents: 2400 })
    expect(allocateToBarber(refunded, 'bruno')).toEqual({ amountCents: 2000, refundedCents: 200 })
  })

  it('returns zero for a barber without appointments or an empty order', () => {
    expect(allocateToBarber(payment(), 'carla')).toEqual({ amountCents: 0, refundedCents: 0 })

    const empty = payment({
      order: { serviceCents: 0, productCents: 0, appointments: [] },
    })
    expect(allocateToBarber(empty, 'ana')).toEqual({ amountCents: 0, refundedCents: 0 })
  })
})

import { describe, expect, it } from 'vitest'

import type { SessionUser } from '@/lib/auth/session'
import { canViewOrder } from '@/lib/orders/access'

const order = {
  publicToken: 'secret-token',
  customerId: 'customer-1',
  appointments: [{ barber: { userId: 'barber-1' } }],
}

function user(id: string, role: SessionUser['role']): SessionUser {
  return { id, role } as unknown as SessionUser
}

describe('order access', () => {
  it('accepts the link token for anonymous visitors', () => {
    expect(canViewOrder(order, null, 'secret-token')).toBe(true)
    expect(canViewOrder(order, null, 'wrong-token')).toBe(false)
    expect(canViewOrder(order, null, undefined)).toBe(false)
  })

  it('lets the owning customer, assigned barber, and owner in without the token', () => {
    expect(canViewOrder(order, user('customer-1', 'CUSTOMER'), undefined)).toBe(true)
    expect(canViewOrder(order, user('barber-1', 'BARBER'), undefined)).toBe(true)
    expect(canViewOrder(order, user('owner-1', 'OWNER'), undefined)).toBe(true)
  })

  it('keeps other customers and barbers out', () => {
    expect(canViewOrder(order, user('customer-2', 'CUSTOMER'), undefined)).toBe(false)
    expect(canViewOrder(order, user('barber-2', 'BARBER'), undefined)).toBe(false)
  })
})

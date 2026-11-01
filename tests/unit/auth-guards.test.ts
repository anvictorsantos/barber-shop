import { describe, expect, it } from 'vitest'

import { requireOwner, requireStaff, requireUser } from '@/lib/auth/guards'
import type { SessionUser } from '@/lib/auth/session'
import { AppError } from '@/lib/http/errors'

const owner: SessionUser = {
  id: 'user-owner',
  name: 'Luiz Silva',
  email: 'luiz@example.com',
  emailVerifiedAt: null,
  phone: '+5531988815243',
  phoneVerifiedAt: null,
  role: 'OWNER',
  noShowCount: 0,
  bookingBlocked: false,
}

const barber: SessionUser = {
  ...owner,
  id: 'user-barber',
  name: 'Hinner Santos',
  role: 'BARBER',
}

const customer: SessionUser = {
  ...owner,
  id: 'user-customer',
  name: 'João Silva',
  role: 'CUSTOMER',
}

describe('role guards', () => {
  it('rejects an anonymous user', () => {
    expect(() => requireUser(null)).toThrow(AppError)
    expect(() => requireUser(null)).toThrow('Faça login para continuar.')
  })

  it('allows the owner everywhere', () => {
    expect(requireOwner(owner)).toBe(owner)
    expect(requireStaff(owner)).toBe(owner)
  })

  it('allows staff but not customers into staff routes', () => {
    expect(requireStaff(barber)).toBe(barber)
    expect(() => requireOwner(barber)).toThrow('Acesso negado.')
    expect(() => requireStaff(customer)).toThrow('Acesso negado.')
  })

  it('returns 403 for a forbidden role', () => {
    try {
      requireOwner(customer)
    } catch (error) {
      expect(error).toBeInstanceOf(AppError)
      expect((error as AppError).status).toBe(403)
    }
  })
})

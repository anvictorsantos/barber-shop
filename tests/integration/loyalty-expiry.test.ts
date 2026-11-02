import { addDays, subDays } from 'date-fns'
import { describe, expect, it } from 'vitest'

import { prisma } from '@/lib/db/prisma'
import { expireLoyaltyCredits } from '@/lib/loyalty/expiry'

const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`

describe('loyalty credit expiry', () => {
  it('expires only credits past their date and writes a ledger entry', async () => {
    const user = await prisma.user.create({
      data: {
        name: 'Cliente Expiração',
        email: `loyalty.expiry.${suffix}@example.com`,
        role: 'CUSTOMER',
      },
    })
    const account = await prisma.loyaltyAccount.create({
      data: { userId: user.id, stamps: 15, lifetimeVisits: 15, tier: 'GOLD' },
    })
    const expired = await prisma.loyaltyCredit.create({
      data: {
        accountId: account.id,
        status: 'AVAILABLE',
        expiresAt: subDays(new Date(), 1),
      },
    })

    try {
      const result = await expireLoyaltyCredits()
      expect(result.expired).toBeGreaterThanOrEqual(1)

      const stored = await prisma.loyaltyCredit.findUniqueOrThrow({ where: { id: expired.id } })
      expect(stored.status).toBe('EXPIRED')

      const entry = await prisma.loyaltyEntry.findFirst({
        where: { creditId: expired.id, type: 'ADJUSTMENT' },
      })
      expect(entry?.note).toBe('Crédito expirado')

      const fresh = await prisma.loyaltyCredit.create({
        data: {
          accountId: account.id,
          status: 'AVAILABLE',
          expiresAt: addDays(new Date(), 30),
        },
      })

      const again = await expireLoyaltyCredits()
      expect(again.expired).toBe(0)
      const kept = await prisma.loyaltyCredit.findUniqueOrThrow({ where: { id: fresh.id } })
      expect(kept.status).toBe('AVAILABLE')
      await prisma.loyaltyCredit.delete({ where: { id: fresh.id } }).catch(() => undefined)
    } finally {
      await prisma.loyaltyEntry.deleteMany({ where: { accountId: account.id } })
      await prisma.loyaltyCredit.deleteMany({ where: { accountId: account.id } })
      await prisma.loyaltyAccount.delete({ where: { id: account.id } })
      await prisma.user.delete({ where: { id: user.id } })
    }
  })
})

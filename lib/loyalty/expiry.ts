import { prisma } from '@/lib/db/prisma'

export async function expireLoyaltyCredits(now = new Date()): Promise<{ expired: number }> {
  const credits = await prisma.loyaltyCredit.findMany({
    where: { status: 'AVAILABLE', expiresAt: { lte: now } },
    select: { id: true, accountId: true },
  })

  let expired = 0

  for (const credit of credits) {
    const changed = await prisma.$transaction(async (tx) => {
      const updated = await tx.loyaltyCredit.updateMany({
        where: { id: credit.id, status: 'AVAILABLE' },
        data: { status: 'EXPIRED' },
      })

      if (updated.count === 0) return false

      await tx.loyaltyEntry.create({
        data: {
          accountId: credit.accountId,
          type: 'ADJUSTMENT',
          creditId: credit.id,
          note: 'Crédito expirado',
        },
      })

      return true
    })

    if (changed) expired += 1
  }

  return { expired }
}

import { prisma } from '@/lib/db/prisma'

export async function expireLoyaltyCredits(now = new Date()): Promise<{ expired: number }> {
  const credits = await prisma.loyaltyCredit.findMany({
    where: { status: 'AVAILABLE', expiresAt: { lte: now } },
    select: { id: true, accountId: true },
  })

  for (const credit of credits) {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.loyaltyCredit.updateMany({
        where: { id: credit.id, status: 'AVAILABLE' },
        data: { status: 'EXPIRED' },
      })

      if (updated.count === 0) return

      await tx.loyaltyEntry.create({
        data: {
          accountId: credit.accountId,
          type: 'ADJUSTMENT',
          creditId: credit.id,
          note: 'Crédito expirado',
        },
      })
    })
  }

  return { expired: credits.length }
}

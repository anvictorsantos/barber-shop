import { addDays } from 'date-fns'

import { prisma } from '@/lib/db/prisma'

import type { LoyaltyTier, Prisma } from '@prisma/client'

export const CREDIT_EXPIRY_DAYS = 90
export const STAMPS_FOR_CREDIT = 15

export function tierFor(lifetimeVisits: number): LoyaltyTier {
  if (lifetimeVisits >= 20) return 'PLATINUM'
  if (lifetimeVisits >= 10) return 'GOLD'
  return 'BRONZE'
}

export async function recordCompletedVisit(
  tx: Prisma.TransactionClient,
  appointmentId: string,
): Promise<void> {
  const appointment = await tx.appointment.findUnique({
    where: { id: appointmentId },
    select: { id: true, customerId: true, status: true },
  })

  if (!appointment?.customerId || appointment.status !== 'COMPLETED') return

  const alreadyStamped = await tx.loyaltyEntry.findFirst({
    where: { appointmentId, type: 'STAMP' },
    select: { id: true },
  })
  if (alreadyStamped) return

  const account = await tx.loyaltyAccount.upsert({
    where: { userId: appointment.customerId },
    create: { userId: appointment.customerId },
    update: {},
  })

  const availableCredit = await tx.loyaltyCredit.findFirst({
    where: { accountId: account.id, status: 'AVAILABLE' },
    select: { id: true },
  })

  let stamps = account.stamps

  if (availableCredit) {
    stamps = Math.min(STAMPS_FOR_CREDIT, stamps + 1)
  } else {
    stamps += 1

    if (stamps >= STAMPS_FOR_CREDIT) {
      stamps = 0
      await tx.loyaltyCredit.create({
        data: {
          accountId: account.id,
          status: 'AVAILABLE',
          expiresAt: addDays(new Date(), CREDIT_EXPIRY_DAYS),
        },
      })
      await tx.loyaltyEntry.create({
        data: { accountId: account.id, type: 'CREDIT_ISSUED', note: '15 selos completos' },
      })
    }
  }

  const lifetimeVisits = account.lifetimeVisits + 1
  const tier = tierFor(lifetimeVisits)

  await tx.loyaltyAccount.update({
    where: { id: account.id },
    data: { stamps, lifetimeVisits, tier },
  })

  await tx.loyaltyEntry.create({
    data: {
      accountId: account.id,
      type: 'STAMP',
      deltaStamps: 1,
      appointmentId,
      note: 'Visita concluída',
    },
  })
}

export async function releaseOrderCredit(
  tx: Prisma.TransactionClient,
  orderId: string,
): Promise<void> {
  const credits = await tx.loyaltyCredit.findMany({
    where: { usedOrderId: orderId, status: 'USED' },
    select: { id: true, accountId: true },
  })

  for (const credit of credits) {
    await tx.loyaltyCredit.update({
      where: { id: credit.id },
      data: { status: 'AVAILABLE', usedOrderId: null, usedAt: null },
    })
    await tx.loyaltyEntry.create({
      data: {
        accountId: credit.accountId,
        type: 'ADJUSTMENT',
        creditId: credit.id,
        note: 'Crédito devolvido',
      },
    })
  }
}

export async function findAvailableCredit(userId: string) {
  return prisma.loyaltyCredit.findFirst({
    where: {
      status: 'AVAILABLE',
      expiresAt: { gt: new Date() },
      account: { userId },
    },
    select: { id: true, accountId: true, expiresAt: true },
    orderBy: { createdAt: 'asc' },
  })
}

export async function getLoyaltySummary(userId: string) {
  const account = await prisma.loyaltyAccount.findUnique({
    where: { userId },
    select: {
      stamps: true,
      lifetimeVisits: true,
      tier: true,
      credits: {
        where: { status: 'AVAILABLE' },
        select: { id: true, accountId: true, expiresAt: true },
        take: 1,
      },
      entries: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, type: true, deltaStamps: true, note: true, createdAt: true },
      },
    },
  })

  if (!account) {
    return {
      stamps: 0,
      lifetimeVisits: 0,
      tier: 'BRONZE' as LoyaltyTier,
      credit: null,
      entries: [],
    }
  }

  const [credit] = account.credits

  return {
    stamps: account.stamps,
    lifetimeVisits: account.lifetimeVisits,
    tier: account.tier,
    credit: credit ?? null,
    entries: account.entries,
  }
}

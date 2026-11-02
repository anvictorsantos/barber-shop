import { prisma } from '@/lib/db/prisma'

import type { PaymentMethod } from '@prisma/client'

export interface RevenueQuery {
  from: Date
  to: Date
  barberId?: string | null
}

export interface RevenueSummary {
  grossCents: number
  refundedCents: number
  netCents: number
  paymentsCount: number
  byMethod: Record<PaymentMethod, number>
}

const SETTLED_STATUSES = ['PAID', 'PARTIALLY_REFUNDED', 'REFUNDED'] as const

export async function getRevenueSummary(query: RevenueQuery): Promise<RevenueSummary> {
  const payments = await prisma.payment.findMany({
    where: {
      status: { in: [...SETTLED_STATUSES] },
      paidAt: { gte: query.from, lt: query.to },
      ...(query.barberId ? { appointment: { barberId: query.barberId } } : {}),
    },
    select: { method: true, amountCents: true, refundedCents: true },
  })

  const byMethod: Record<PaymentMethod, number> = {
    PIX: 0,
    CREDIT_CARD: 0,
    DEBIT_CARD: 0,
    CASH: 0,
  }

  let grossCents = 0
  let refundedCents = 0

  for (const payment of payments) {
    grossCents += payment.amountCents
    refundedCents += payment.refundedCents
    byMethod[payment.method] += payment.amountCents - payment.refundedCents
  }

  return {
    grossCents,
    refundedCents,
    netCents: grossCents - refundedCents,
    paymentsCount: payments.length,
    byMethod,
  }
}

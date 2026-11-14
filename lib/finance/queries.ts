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

export interface AttributedPayment {
  id: string
  paidAt: Date
  method: PaymentMethod
  amountCents: number
  refundedCents: number
  orderCode: string
  customerName: string
  barberName: string | null
}

export interface AllocationPayment {
  amountCents: number
  order: {
    serviceCents: number
    productCents: number
    appointments: { barberId: string; priceCents: number }[]
  }
  refunds: {
    amountCents: number
    orderProductId: string | null
    appointment: { barberId: string } | null
  }[]
}

const SETTLED_STATUSES = ['PAID', 'PARTIALLY_REFUNDED', 'REFUNDED'] as const

// A payment covers the whole order, so a barber gets the share of it that their appointment prices represent.
export function allocateToBarber(
  payment: AllocationPayment,
  barberId: string,
): { amountCents: number; refundedCents: number } {
  const itemsTotal = payment.order.serviceCents + payment.order.productCents
  const barberServiceCents = payment.order.appointments.reduce(
    (sum, appointment) => (appointment.barberId === barberId ? sum + appointment.priceCents : sum),
    0,
  )

  if (itemsTotal <= 0 || barberServiceCents <= 0) {
    return { amountCents: 0, refundedCents: 0 }
  }

  const share = barberServiceCents / itemsTotal
  let refundedCents = 0

  for (const refund of payment.refunds) {
    if (refund.appointment) {
      if (refund.appointment.barberId === barberId) refundedCents += refund.amountCents
      continue
    }
    if (refund.orderProductId) continue
    refundedCents += refund.amountCents * share
  }

  return {
    amountCents: Math.round(payment.amountCents * share),
    refundedCents: Math.round(refundedCents),
  }
}

export async function getAttributedPayments(query: RevenueQuery): Promise<AttributedPayment[]> {
  const barberId = query.barberId ?? null

  const payments = await prisma.payment.findMany({
    where: {
      status: { in: [...SETTLED_STATUSES] },
      paidAt: { gte: query.from, lt: query.to },
      ...(barberId ? { order: { appointments: { some: { barberId } } } } : {}),
    },
    select: {
      id: true,
      paidAt: true,
      method: true,
      amountCents: true,
      refundedCents: true,
      appointment: { select: { barber: { select: { displayName: true } } } },
      order: {
        select: {
          code: true,
          customerName: true,
          serviceCents: true,
          productCents: true,
          appointments: {
            select: {
              barberId: true,
              priceCents: true,
              barber: { select: { displayName: true } },
            },
          },
        },
      },
      refunds: {
        where: { status: 'SUCCEEDED' },
        select: {
          amountCents: true,
          orderProductId: true,
          appointment: { select: { barberId: true } },
        },
      },
    },
  })

  const rows: AttributedPayment[] = []

  for (const payment of payments) {
    if (!payment.paidAt) continue

    const scopedBarber = barberId
      ? payment.order.appointments.find((appointment) => appointment.barberId === barberId)
      : undefined
    const barberName =
      payment.appointment?.barber.displayName ??
      scopedBarber?.barber.displayName ??
      (payment.order.appointments.length === 1
        ? payment.order.appointments[0]!.barber.displayName
        : null)

    if (!barberId) {
      rows.push({
        id: payment.id,
        paidAt: payment.paidAt,
        method: payment.method,
        amountCents: payment.amountCents,
        refundedCents: payment.refundedCents,
        orderCode: payment.order.code,
        customerName: payment.order.customerName,
        barberName,
      })
      continue
    }

    const share = allocateToBarber(payment, barberId)
    if (share.amountCents === 0) continue

    rows.push({
      id: payment.id,
      paidAt: payment.paidAt,
      method: payment.method,
      amountCents: share.amountCents,
      refundedCents: share.refundedCents,
      orderCode: payment.order.code,
      customerName: payment.order.customerName,
      barberName,
    })
  }

  return rows
}

export function summarizePayments(payments: readonly AttributedPayment[]): RevenueSummary {
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

export async function getRevenueSummary(query: RevenueQuery): Promise<RevenueSummary> {
  return summarizePayments(await getAttributedPayments(query))
}

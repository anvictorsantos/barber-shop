import { prisma } from '@/lib/db/prisma'
import { AppError } from '@/lib/http/errors'
import { createMercadoPagoRefund } from '@/lib/payments/mercado-pago'

import type { OrderStatus } from '@prisma/client'

export interface RefundOrderInput {
  orderCode: string
  amountCents: number
  reason: string
  appointmentId?: string | null
  orderProductId?: string | null
}

export interface RefundResult {
  refundedCents: number
  orderStatus: OrderStatus
  providerRefundId: string | null
}

const REFUNDABLE_PAYMENT_STATUSES = new Set(['PAID', 'PARTIALLY_REFUNDED'])
const DUPLICATE_WINDOW_MS = 10_000

export async function refundOrderPayment(input: RefundOrderInput): Promise<RefundResult> {
  const order = await prisma.order.findUnique({
    where: { code: input.orderCode },
    include: {
      payments: { orderBy: { createdAt: 'asc' } },
      products: true,
      appointments: true,
    },
  })

  if (!order) throw new AppError(404, 'not_found', 'Pedido não encontrado.')

  const payments = order.payments.filter((payment) =>
    REFUNDABLE_PAYMENT_STATUSES.has(payment.status),
  )
  if (payments.length === 0) {
    throw new AppError(409, 'not_paid', 'Pedido não possui pagamento confirmado.')
  }

  if (input.appointmentId && !order.appointments.some((item) => item.id === input.appointmentId)) {
    throw new AppError(404, 'not_found', 'Agendamento não pertence ao pedido.')
  }

  const productLine = input.orderProductId
    ? order.products.find((line) => line.id === input.orderProductId)
    : null
  if (input.orderProductId && !productLine) {
    throw new AppError(404, 'not_found', 'Item não pertence ao pedido.')
  }

  if (productLine) {
    const alreadyRefunded = await prisma.refund.findFirst({
      where: { orderProductId: productLine.id },
      select: { id: true },
    })
    if (alreadyRefunded) {
      throw new AppError(409, 'already_refunded', 'Este item já foi reembolsado.')
    }
    if (input.amountCents !== productLine.lineTotalCents) {
      throw new AppError(400, 'refund_amount_mismatch', 'Reembolse o valor total do item.')
    }
  }

  const payment = input.appointmentId
    ? (payments.find((item) => item.appointmentId === input.appointmentId) ?? payments[0]!)
    : payments[0]!

  const remaining = payment.amountCents - payment.refundedCents
  if (input.amountCents <= 0 || input.amountCents > remaining) {
    throw new AppError(400, 'invalid_amount', 'Valor de reembolso inválido.')
  }

  const refund = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "payments" WHERE "id" = ${payment.id} FOR UPDATE`

    const current = await tx.payment.findUniqueOrThrow({ where: { id: payment.id } })

    const duplicate = await tx.refund.findFirst({
      where: {
        paymentId: current.id,
        amountCents: input.amountCents,
        reason: input.reason,
        createdAt: { gt: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
      },
      select: { id: true },
    })
    if (duplicate) {
      throw new AppError(409, 'duplicate_refund', 'Reembolso já registrado há instantes.')
    }

    const claimed = await tx.payment.updateMany({
      where: {
        id: current.id,
        refundedCents: { lte: current.amountCents - input.amountCents },
      },
      data: { refundedCents: { increment: input.amountCents } },
    })
    if (claimed.count === 0) {
      throw new AppError(400, 'invalid_amount', 'Valor de reembolso inválido.')
    }

    return tx.refund.create({
      data: {
        paymentId: current.id,
        appointmentId: input.appointmentId ?? null,
        orderProductId: productLine?.id ?? null,
        amountCents: input.amountCents,
        reason: input.reason,
        status: 'PENDING',
      },
      select: { id: true },
    })
  })

  let providerRefundId: string | null = null
  if (payment.provider === 'MERCADO_PAGO' && payment.providerPaymentId) {
    try {
      providerRefundId = await createMercadoPagoRefund(payment.providerPaymentId, input.amountCents)
    } catch (error) {
      await failRefund(refund.id, payment.id, input.amountCents)
      console.error(
        '[payments] provider refund failed:',
        error instanceof Error ? error.name : 'unknown',
      )
      throw new AppError(502, 'provider_refund_failed', 'Não foi possível reembolsar no provedor.')
    }
  }

  // shortcut: a provider-accepted refund whose settle transaction fails stays PENDING; reconcile by hand.
  return prisma.$transaction(async (tx) => {
    await tx.refund.update({
      where: { id: refund.id },
      data: { status: 'SUCCEEDED', providerRefundId },
    })

    const current = await tx.payment.findUniqueOrThrow({ where: { id: payment.id } })
    await tx.payment.update({
      where: { id: current.id },
      data: {
        status: current.refundedCents >= current.amountCents ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
      },
    })

    if (productLine) {
      await tx.$executeRaw`
        UPDATE "products"
        SET "stock" = "stock" + ${productLine.quantity}, "updated_at" = NOW()
        WHERE "id" = ${productLine.productId}
      `

      await tx.inventoryMovement.create({
        data: {
          productId: productLine.productId,
          orderId: order.id,
          type: 'REFUND',
          quantity: productLine.quantity,
          note: 'Reembolso de produto',
        },
      })
    }

    const totals = await tx.payment.aggregate({
      where: { orderId: order.id },
      _sum: { refundedCents: true },
    })
    const refundedTotal = totals._sum.refundedCents ?? 0
    const orderStatus: OrderStatus =
      refundedTotal >= order.totalCents ? 'REFUNDED' : 'PARTIALLY_REFUNDED'

    await tx.order.update({ where: { id: order.id }, data: { status: orderStatus } })

    return { refundedCents: input.amountCents, orderStatus, providerRefundId }
  })
}

async function failRefund(refundId: string, paymentId: string, amountCents: number): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.refund.update({
      where: { id: refundId },
      data: { status: 'FAILED', failedReason: 'provider_error' },
    })

    const current = await tx.payment.findUniqueOrThrow({ where: { id: paymentId } })
    const refundedCents = Math.max(0, current.refundedCents - amountCents)
    await tx.payment.update({
      where: { id: paymentId },
      data: {
        refundedCents,
        status: refundedCents === 0 ? 'PAID' : 'PARTIALLY_REFUNDED',
      },
    })
  })
}

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

  let providerRefundId: string | null = null
  if (payment.provider === 'MERCADO_PAGO' && payment.providerPaymentId) {
    providerRefundId = await createMercadoPagoRefund(payment.providerPaymentId, input.amountCents)
  }

  return prisma.$transaction(async (tx) => {
    const current = await tx.payment.findUniqueOrThrow({ where: { id: payment.id } })
    const available = current.amountCents - current.refundedCents
    if (input.amountCents > available) {
      throw new AppError(400, 'invalid_amount', 'Valor de reembolso inválido.')
    }

    await tx.refund.create({
      data: {
        paymentId: current.id,
        appointmentId: input.appointmentId ?? null,
        orderProductId: productLine?.id ?? null,
        amountCents: input.amountCents,
        reason: input.reason,
        providerRefundId,
      },
    })

    const refundedCents = current.refundedCents + input.amountCents
    await tx.payment.update({
      where: { id: current.id },
      data: {
        refundedCents,
        status: refundedCents >= current.amountCents ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
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

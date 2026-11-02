import { prisma } from '@/lib/db/prisma'
import { AppError } from '@/lib/http/errors'

import type { PaymentMethod, PaymentProvider } from '@prisma/client'

export interface SettlePaymentInput {
  orderCode: string
  provider: PaymentProvider
  providerPaymentId?: string | null
  method: PaymentMethod
  amountCents: number
  paidAt?: Date | null
}

const SETTLED_PAYMENT_STATUSES = new Set(['PAID', 'PARTIALLY_REFUNDED', 'REFUNDED'])

export async function settleOrderPayment(input: SettlePaymentInput) {
  if (input.amountCents <= 0) {
    throw new AppError(400, 'invalid_amount', 'Valor de pagamento inválido.')
  }

  return prisma.$transaction(
    async (tx) => {
      const order = await tx.order.findUnique({
        where: { code: input.orderCode },
        include: { products: true },
      })

      if (!order) throw new AppError(404, 'not_found', 'Pedido não encontrado.')

      if (input.providerPaymentId) {
        const existing = await tx.payment.findUnique({
          where: { providerPaymentId: input.providerPaymentId },
        })
        if (existing && SETTLED_PAYMENT_STATUSES.has(existing.status)) {
          return { orderId: order.id, paymentId: existing.id, alreadySettled: true }
        }
      }

      if (SETTLED_PAYMENT_STATUSES.has(order.status)) {
        throw new AppError(409, 'order_already_settled', 'Pedido já foi pago.')
      }

      if (order.status === 'CANCELED' || order.status === 'EXPIRED') {
        throw new AppError(409, 'order_not_payable', 'Pedido não está mais ativo.')
      }

      const paidAt = input.paidAt ?? new Date()
      const data = {
        orderId: order.id,
        provider: input.provider,
        method: input.method,
        status: 'PAID' as const,
        amountCents: input.amountCents,
        paidAt,
      }

      const payment = input.providerPaymentId
        ? await tx.payment.upsert({
            where: { providerPaymentId: input.providerPaymentId },
            create: { ...data, providerPaymentId: input.providerPaymentId },
            update: data,
          })
        : await tx.payment.create({ data })

      await tx.order.update({
        where: { id: order.id },
        data: { status: 'PAID', paidAt },
      })

      await tx.appointment.updateMany({
        where: { orderId: order.id, status: 'PENDING' },
        data: { status: 'CONFIRMED' },
      })

      for (const line of order.products) {
        const updated = await tx.$executeRaw`
          UPDATE "products"
          SET "stock" = "stock" - ${line.quantity},
              "reserved" = GREATEST("reserved" - ${line.quantity}, 0),
              "updated_at" = NOW()
          WHERE "id" = ${line.productId} AND "stock" >= ${line.quantity}
        `

        if (updated === 0) {
          throw new AppError(
            409,
            'stock_unavailable',
            'Estoque insuficiente para confirmar o pedido.',
          )
        }

        await tx.inventoryMovement.create({
          data: {
            productId: line.productId,
            orderId: order.id,
            type: 'SALE',
            quantity: line.quantity,
            note: 'Pedido pago',
          },
        })
      }

      return { orderId: order.id, paymentId: payment.id, alreadySettled: false }
    },
    { isolationLevel: 'Serializable' },
  )
}

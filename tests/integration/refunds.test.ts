import { addDays, format, parseISO } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { describe, expect, it } from 'vitest'

import { getAvailability } from '@/lib/availability/queries'
import { BUSINESS_TIMEZONE } from '@/lib/availability/slots'
import { prisma } from '@/lib/db/prisma'
import { getRevenueSummary } from '@/lib/finance/queries'
import { createOrder } from '@/lib/orders/create-order'
import { buildOrderReceiptPdf } from '@/lib/payments/receipt'
import { refundOrderPayment } from '@/lib/payments/refund'
import { settleOrderPayment } from '@/lib/payments/settle'

const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`

async function cleanupOrder(code: string, email: string): Promise<void> {
  const existing = await prisma.order.findUnique({ where: { code }, select: { id: true } })

  if (existing) {
    await prisma.refund.deleteMany({ where: { payment: { orderId: existing.id } } })
    await prisma.inventoryMovement.deleteMany({ where: { orderId: existing.id } })
    await prisma.orderProduct.deleteMany({ where: { orderId: existing.id } })
    await prisma.payment.deleteMany({ where: { orderId: existing.id } })
    await prisma.appointment.deleteMany({ where: { orderId: existing.id } })
    await prisma.order.delete({ where: { id: existing.id } })
  }

  const user = await prisma.user.findFirst({ where: { email } })
  if (user) {
    await prisma.session.deleteMany({ where: { userId: user.id } })
    await prisma.verificationToken.deleteMany({ where: { userId: user.id } })
    await prisma.user.delete({ where: { id: user.id } })
  }
}

async function firstAvailableSlot() {
  const service = await prisma.service.findFirst({ where: { active: true } })
  const barber = await prisma.barberProfile.findFirst({ where: { active: true } })
  if (!service || !barber) throw new Error('seed missing')

  const today = parseISO(formatInTimeZone(new Date(), BUSINESS_TIMEZONE, 'yyyy-MM-dd'))

  for (let index = 0; index < 8; index += 1) {
    const date = format(addDays(today, index), 'yyyy-MM-dd')
    const availability = await getAvailability({ serviceId: service.id, barberId: barber.id, date })
    const slot = availability.slots.find((item) => item.available)
    if (slot) return { service, barber, slot }
  }

  throw new Error('no available slot')
}

describe('refunds and revenue', () => {
  it('refunds in parts, nets revenue, and issues a receipt', async () => {
    const { service, barber, slot } = await firstAvailableSlot()
    const email = `refund.order.${suffix}@example.com`
    const order = await createOrder(
      {
        paymentMode: 'ONLINE',
        customer: { name: 'Reembolso Teste', email, phone: '' },
        lines: [
          { kind: 'service', serviceId: service.id, barberId: barber.id, startAt: slot.startAt },
        ],
        note: '',
      },
      null,
    )
    const paidAt = new Date()

    try {
      await settleOrderPayment({
        orderCode: order.code,
        provider: 'MANUAL',
        method: 'CASH',
        amountCents: order.totalCents,
        paidAt,
      })

      const half = Math.floor(order.totalCents / 2)
      const first = await refundOrderPayment({
        orderCode: order.code,
        amountCents: half,
        reason: 'Cliente desistiu de parte do serviço',
      })
      expect(first.orderStatus).toBe('PARTIALLY_REFUNDED')

      const revenue = await getRevenueSummary({
        from: paidAt,
        to: new Date(paidAt.getTime() + 1),
        barberId: barber.id,
      })
      expect(revenue.grossCents).toBe(order.totalCents)
      expect(revenue.refundedCents).toBe(half)
      expect(revenue.netCents).toBe(order.totalCents - half)
      expect(revenue.byMethod.CASH).toBe(order.totalCents - half)

      const second = await refundOrderPayment({
        orderCode: order.code,
        amountCents: order.totalCents - half,
        reason: 'Reembolso do restante',
      })
      expect(second.orderStatus).toBe('REFUNDED')

      const stored = await prisma.order.findUnique({
        where: { code: order.code },
        include: { payments: true },
      })
      expect(stored?.status).toBe('REFUNDED')
      expect(stored?.payments[0]?.status).toBe('REFUNDED')
      expect(stored?.payments[0]?.refundedCents).toBe(order.totalCents)

      await expect(
        refundOrderPayment({
          orderCode: order.code,
          amountCents: 100,
          reason: 'Tentativa indevida',
        }),
      ).rejects.toThrow()

      const detailed = await prisma.order.findUniqueOrThrow({
        where: { code: order.code },
        include: {
          appointments: {
            include: {
              service: { select: { name: true, durationMin: true } },
              barber: { select: { displayName: true, title: true } },
            },
          },
          products: { include: { product: { select: { name: true } } } },
          payments: true,
        },
      })
      const shop = await prisma.shop.findFirstOrThrow()

      const pdf = await buildOrderReceiptPdf(detailed, shop)
      expect(pdf.byteLength).toBeGreaterThan(1_000)
      expect(new TextDecoder().decode(pdf.slice(0, 5))).toBe('%PDF-')
    } finally {
      await cleanupOrder(order.code, email)
    }
  })

  it('restocks a product line once when it is refunded', async () => {
    const product = await prisma.product.findFirst({
      where: { active: true, stock: { gt: 1 } },
    })
    if (!product) throw new Error('product seed missing')

    const email = `refund.product.${suffix}@example.com`
    const beforeStock = product.stock
    const order = await createOrder(
      {
        paymentMode: 'ONLINE',
        customer: { name: 'Produto Reembolso', email, phone: '' },
        lines: [{ kind: 'product', productId: product.id, quantity: 1 }],
        note: '',
      },
      null,
    )

    try {
      await settleOrderPayment({
        orderCode: order.code,
        provider: 'MANUAL',
        method: 'PIX',
        amountCents: order.totalCents,
      })

      const line = await prisma.orderProduct.findFirstOrThrow({ where: { orderId: order.id } })

      await refundOrderPayment({
        orderCode: order.code,
        amountCents: line.lineTotalCents,
        reason: 'Produto devolvido',
        orderProductId: line.id,
      })

      const after = await prisma.product.findUnique({ where: { id: product.id } })
      expect(after?.stock).toBe(beforeStock)

      const movement = await prisma.inventoryMovement.findFirst({
        where: { orderId: order.id, type: 'REFUND' },
      })
      expect(movement?.quantity).toBe(1)

      await expect(
        refundOrderPayment({
          orderCode: order.code,
          amountCents: line.lineTotalCents,
          reason: 'Duplicado',
          orderProductId: line.id,
        }),
      ).rejects.toThrow()
    } finally {
      await cleanupOrder(order.code, email)
    }
  })
})

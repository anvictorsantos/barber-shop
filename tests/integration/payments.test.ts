import { addDays, format, parseISO } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { describe, expect, it } from 'vitest'

import { getAvailability } from '@/lib/availability/queries'
import { BUSINESS_TIMEZONE } from '@/lib/availability/slots'
import { prisma } from '@/lib/db/prisma'
import { createOrder, expireOverdueOrders } from '@/lib/orders/create-order'
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

describe('payment settlement', () => {
  it('marks an online order paid and confirms the appointment', async () => {
    const { service, barber, slot } = await firstAvailableSlot()
    const email = `paid.order.${suffix}@example.com`
    const order = await createOrder(
      {
        paymentMode: 'ONLINE',
        customer: { name: 'Pago Teste', email, phone: '' },
        lines: [
          { kind: 'service', serviceId: service.id, barberId: barber.id, startAt: slot.startAt },
        ],
        note: '',
      },
      null,
    )

    try {
      const result = await settleOrderPayment({
        orderCode: order.code,
        provider: 'MERCADO_PAGO',
        providerPaymentId: `mp-${suffix}-1`,
        method: 'PIX',
        amountCents: order.totalCents,
      })

      expect(result.alreadySettled).toBe(false)

      const paid = await prisma.order.findUnique({
        where: { code: order.code },
        include: { appointments: true, payments: true },
      })
      expect(paid?.status).toBe('PAID')
      expect(paid?.payments).toHaveLength(1)
      expect(paid?.payments[0]?.amountCents).toBe(order.totalCents)
      expect(paid?.appointments[0]?.status).toBe('CONFIRMED')

      const again = await settleOrderPayment({
        orderCode: order.code,
        provider: 'MERCADO_PAGO',
        providerPaymentId: `mp-${suffix}-1`,
        method: 'PIX',
        amountCents: order.totalCents,
      })
      expect(again.alreadySettled).toBe(true)

      const payments = await prisma.payment.count({ where: { orderId: order.id } })
      expect(payments).toBe(1)
    } finally {
      await cleanupOrder(order.code, email)
    }
  })

  it('decrements stock and releases the hold once a product order is paid', async () => {
    const product = await prisma.product.findFirst({
      where: { active: true, stock: { gt: 1 } },
    })
    if (!product) throw new Error('product seed missing')

    const email = `paid.product.${suffix}@example.com`
    const before = { stock: product.stock, reserved: product.reserved }
    const order = await createOrder(
      {
        paymentMode: 'ONLINE',
        customer: { name: 'Produto Pago', email, phone: '' },
        lines: [{ kind: 'product', productId: product.id, quantity: 1 }],
        note: '',
      },
      null,
    )

    try {
      await settleOrderPayment({
        orderCode: order.code,
        provider: 'MERCADO_PAGO',
        providerPaymentId: `mp-${suffix}-2`,
        method: 'CREDIT_CARD',
        amountCents: order.totalCents,
      })

      const after = await prisma.product.findUnique({ where: { id: product.id } })
      expect(after?.stock).toBe(before.stock - 1)
      expect(after?.reserved).toBe(before.reserved)

      const sale = await prisma.inventoryMovement.findFirst({
        where: { orderId: order.id, type: 'SALE' },
      })
      expect(sale?.quantity).toBe(1)
    } finally {
      await prisma.$executeRaw`UPDATE "products" SET "stock" = "stock" + 1 WHERE "id" = ${product.id}`
      await cleanupOrder(order.code, email)
    }
  })

  it('refuses to settle an expired order', async () => {
    const product = await prisma.product.findFirst({ where: { active: true, stock: { gt: 0 } } })
    if (!product) throw new Error('product seed missing')

    const email = `late.payment.${suffix}@example.com`
    const order = await createOrder(
      {
        paymentMode: 'ONLINE',
        customer: { name: 'Tarde Demais', email, phone: '' },
        lines: [{ kind: 'product', productId: product.id, quantity: 1 }],
        note: '',
      },
      null,
    )

    try {
      await prisma.order.update({
        where: { code: order.code },
        data: { expiresAt: new Date(Date.now() - 60_000) },
      })

      const sweep = await expireOverdueOrders()
      expect(sweep.expired).toBeGreaterThanOrEqual(1)

      const expired = await prisma.order.findUnique({ where: { code: order.code } })
      expect(expired?.status).toBe('EXPIRED')

      await expect(
        settleOrderPayment({
          orderCode: order.code,
          provider: 'MERCADO_PAGO',
          providerPaymentId: `mp-${suffix}-3`,
          method: 'PIX',
          amountCents: order.totalCents,
        }),
      ).rejects.toThrow()
    } finally {
      await cleanupOrder(order.code, email)
    }
  })
})

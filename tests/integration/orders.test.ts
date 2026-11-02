import { addDays, format, parseISO } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { describe, expect, it } from 'vitest'

import { getAvailability } from '@/lib/availability/queries'
import { BUSINESS_TIMEZONE } from '@/lib/availability/slots'
import { prisma } from '@/lib/db/prisma'
import { createOrder, expirePendingOrder } from '@/lib/orders/create-order'

const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`

async function cleanupOrder(code: string, email: string): Promise<void> {
  const existing = await prisma.order.findUnique({ where: { code }, select: { id: true } })

  if (existing) {
    await prisma.orderProduct.deleteMany({ where: { orderId: existing.id } })
    await prisma.inventoryMovement.deleteMany({ where: { orderId: existing.id } })
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

describe('order creation', () => {
  it('creates an on-site service order and rejects the same slot again', async () => {
    const { service, barber, slot } = await firstAvailableSlot()
    const email = `order.test.${suffix}@example.com`

    const order = await createOrder(
      {
        paymentMode: 'ON_SITE',
        customer: { name: 'Pedido Teste', email, phone: '' },
        lines: [
          {
            kind: 'service',
            serviceId: service.id,
            barberId: barber.id,
            startAt: slot.startAt,
          },
        ],
        note: '',
      },
      null,
    )

    try {
      expect(order.status).toBe('OPEN')
      expect(order.totalCents).toBe(service.priceCents)

      const appointment = await prisma.appointment.findFirst({
        where: { orderId: order.id },
      })
      expect(appointment?.status).toBe('PENDING')

      await expect(
        createOrder(
          {
            paymentMode: 'ON_SITE',
            customer: { name: 'Outro Cliente', email: `other.${email}`, phone: '' },
            lines: [
              {
                kind: 'service',
                serviceId: service.id,
                barberId: barber.id,
                startAt: slot.startAt,
              },
            ],
            note: '',
          },
          null,
        ),
      ).rejects.toThrow()
    } finally {
      await cleanupOrder(order.code, email)
      await prisma.user.deleteMany({ where: { email: `other.${email}` } })
    }
  })

  it('reserves and releases product stock on expiry', async () => {
    const product = await prisma.product.findFirst({ where: { active: true, stock: { gt: 0 } } })
    if (!product) throw new Error('product seed missing')
    const email = `product.order.${suffix}@example.com`
    const before = product.reserved

    const order = await createOrder(
      {
        paymentMode: 'ONLINE',
        customer: { name: 'Produto Teste', email, phone: '' },
        lines: [{ kind: 'product', productId: product.id, quantity: 1 }],
        note: '',
      },
      null,
    )

    try {
      expect(order.status).toBe('PENDING_PAYMENT')
      const held = await prisma.product.findUnique({ where: { id: product.id } })
      expect(held?.reserved).toBe(before + 1)

      await expirePendingOrder(order.code)

      const released = await prisma.product.findUnique({ where: { id: product.id } })
      expect(released?.reserved).toBe(before)

      const expired = await prisma.order.findUnique({ where: { code: order.code } })
      expect(expired?.status).toBe('EXPIRED')
    } finally {
      await cleanupOrder(order.code, email)
    }
  })
})

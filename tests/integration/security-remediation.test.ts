import { addDays, format, parseISO } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { describe, expect, it } from 'vitest'

import { markAppointmentNoShow } from '@/lib/admin/appointments'
import type { AdminScope } from '@/lib/admin/context'
import { peekRateLimit, resetRateLimit, takeRateLimit } from '@/lib/auth/rate-limit'
import { getAvailability } from '@/lib/availability/queries'
import { BUSINESS_TIMEZONE } from '@/lib/availability/slots'
import { prisma } from '@/lib/db/prisma'
import { createOrder } from '@/lib/orders/create-order'
import { refundOrderPayment } from '@/lib/payments/refund'
import { settleOrderPayment } from '@/lib/payments/settle'

const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`
const ownerScope: AdminScope = { userId: 'test-owner', role: 'OWNER', barberId: null }

async function firstAvailableSlot() {
  const service = await prisma.service.findFirst({ where: { active: true } })
  const barber = await prisma.barberProfile.findFirst({ where: { active: true } })
  if (!service || !barber) throw new Error('seed missing')

  const today = parseISO(formatInTimeZone(new Date(), BUSINESS_TIMEZONE, 'yyyy-MM-dd'))

  for (let index = 1; index <= 9; index += 1) {
    const date = format(addDays(today, index), 'yyyy-MM-dd')
    const availability = await getAvailability({ serviceId: service.id, barberId: barber.id, date })
    const slot = availability.slots.find((item) => item.available)
    if (slot) return { service, barber, slot }
  }

  throw new Error('no available slot')
}

async function cleanupOrder(code: string, email: string): Promise<void> {
  const order = await prisma.order.findUnique({ where: { code }, select: { id: true } })

  if (order) {
    await prisma.refund.deleteMany({ where: { payment: { orderId: order.id } } })
    await prisma.inventoryMovement.deleteMany({ where: { orderId: order.id } })
    await prisma.orderProduct.deleteMany({ where: { orderId: order.id } })
    await prisma.payment.deleteMany({ where: { orderId: order.id } })
    await prisma.appointment.deleteMany({ where: { orderId: order.id } })
    await prisma.order.delete({ where: { id: order.id } })
  }

  const user = await prisma.user.findFirst({ where: { email } })
  if (user) {
    await prisma.session.deleteMany({ where: { userId: user.id } })
    await prisma.verificationToken.deleteMany({ where: { userId: user.id } })
    await prisma.user.delete({ where: { id: user.id } })
  }
}

async function paidOrder() {
  const { service, barber, slot } = await firstAvailableSlot()
  const email = `security.${suffix}@example.com`
  const order = await createOrder(
    {
      paymentMode: 'ONLINE',
      customer: { name: 'Segurança Teste', email, phone: '' },
      lines: [
        { kind: 'service', serviceId: service.id, barberId: barber.id, startAt: slot.startAt },
      ],
      note: '',
    },
    null,
  )

  await settleOrderPayment({
    orderCode: order.code,
    provider: 'MANUAL',
    method: 'CASH',
    amountCents: order.totalCents,
  })

  return { order, email }
}

describe('security remediation', () => {
  it('never refunds more than the payment under concurrency', async () => {
    const { order, email } = await paidOrder()
    const amount = Math.ceil(order.totalCents / 3)

    try {
      const results = await Promise.allSettled(
        Array.from({ length: 5 }, (_, index) =>
          refundOrderPayment({
            orderCode: order.code,
            amountCents: amount,
            reason: `corrida ${index}`,
          }),
        ),
      )

      const succeeded = results.filter((result) => result.status === 'fulfilled').length
      expect(succeeded).toBeGreaterThan(0)
      expect(succeeded).toBeLessThanOrEqual(3)

      const payment = await prisma.payment.findFirstOrThrow({
        where: { orderId: order.id },
      })
      const refunds = await prisma.refund.findMany({
        where: { paymentId: payment.id, status: 'SUCCEEDED' },
      })
      const refundSum = refunds.reduce((total, refund) => total + refund.amountCents, 0)

      expect(payment.refundedCents).toBe(succeeded * amount)
      expect(payment.refundedCents).toBe(refundSum)
      expect(payment.refundedCents).toBeLessThanOrEqual(payment.amountCents)
    } finally {
      await cleanupOrder(order.code, email)
    }
  })

  it('rejects a duplicate refund submitted within the window', async () => {
    const { order, email } = await paidOrder()
    const amount = Math.floor(order.totalCents / 2)

    try {
      await refundOrderPayment({ orderCode: order.code, amountCents: amount, reason: 'duplicado' })
      await expect(
        refundOrderPayment({ orderCode: order.code, amountCents: amount, reason: 'duplicado' }),
      ).rejects.toThrow(/já registrado/)
    } finally {
      await cleanupOrder(order.code, email)
    }
  })

  it('increments the no-show counter once under concurrency', async () => {
    const { service, slot } = await firstAvailableSlot()
    const barberUser = await prisma.user.create({
      data: { name: 'Barbeiro Teste', email: `barber.${suffix}@example.com`, role: 'BARBER' },
    })
    const profile = await prisma.barberProfile.create({
      data: { userId: barberUser.id, displayName: 'Barbeiro Teste', title: 'Barbeiro' },
    })
    const customer = await prisma.user.create({
      data: {
        name: 'Cliente Teste',
        email: `noshow.${suffix}@example.com`,
        noShowCount: 1,
      },
    })
    const order = await prisma.order.create({
      data: {
        code: `NS-${suffix}`,
        customerId: customer.id,
        customerName: customer.name,
        status: 'OPEN',
        paymentMode: 'ON_SITE',
        serviceCents: service.priceCents,
        totalCents: service.priceCents,
      },
    })
    const startAt = new Date(slot.startAt)
    const appointment = await prisma.appointment.create({
      data: {
        orderId: order.id,
        customerId: customer.id,
        barberId: profile.id,
        serviceId: service.id,
        startAt,
        endAt: new Date(startAt.getTime() + service.durationMin * 60_000),
        status: 'CONFIRMED',
        source: 'ONLINE',
        priceCents: service.priceCents,
      },
    })

    try {
      const results = await Promise.allSettled([
        markAppointmentNoShow(appointment.id, ownerScope),
        markAppointmentNoShow(appointment.id, ownerScope),
      ])

      expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)

      const stored = await prisma.user.findUniqueOrThrow({ where: { id: customer.id } })
      expect(stored.noShowCount).toBe(2)
      expect(stored.bookingBlocked).toBe(false)
    } finally {
      await prisma.appointment.delete({ where: { id: appointment.id } })
      await prisma.order.delete({ where: { id: order.id } })
      await prisma.barberProfile.delete({ where: { id: profile.id } })
      await prisma.user.deleteMany({ where: { id: { in: [customer.id, barberUser.id] } } })
    }
  })

  it('shares rate-limit counters and resets one key', async () => {
    const key = `test:shared:${suffix}`

    expect((await takeRateLimit(key, 2, 60_000)).allowed).toBe(true)
    expect((await takeRateLimit(key, 2, 60_000)).allowed).toBe(true)
    expect((await takeRateLimit(key, 2, 60_000)).allowed).toBe(false)
    expect((await peekRateLimit(key))?.count).toBe(3)

    await resetRateLimit(key)
    expect((await takeRateLimit(key, 2, 60_000)).allowed).toBe(true)
    await resetRateLimit(key)
  })
})

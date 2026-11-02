import { describe, expect, it } from 'vitest'

import {
  cancelCustomerAppointment,
  submitAppointmentReview,
  updateCustomerProfile,
  updateNotificationPreferences,
} from '@/lib/customer/appointments'
import { toggleFavorite } from '@/lib/customer/favorites'
import { getFavoriteIds } from '@/lib/customer/queries'
import { prisma } from '@/lib/db/prisma'

const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`

async function makeFixture() {
  const unique = `${suffix}.${Math.random().toString(36).slice(2, 8)}`
  const service = await prisma.service.findFirstOrThrow({ where: { active: true } })

  const barberUser = await prisma.user.create({
    data: { name: 'Barbeiro Conta', email: `account.barber.${unique}@example.com`, role: 'BARBER' },
  })
  const barber = await prisma.barberProfile.create({
    data: { userId: barberUser.id, displayName: 'Barbeiro Conta', title: 'Barbeiro' },
  })
  const customer = await prisma.user.create({
    data: {
      name: 'Cliente Conta',
      email: `account.customer.${unique}@example.com`,
      phone: `+55319${String(Date.now()).slice(-8)}`,
      role: 'CUSTOMER',
    },
  })

  return { service, barberUser, barber, customer }
}

async function makeOrder(input: {
  customerId: string
  barberId: string
  serviceId: string
  priceCents: number
  startAt: Date
  status: 'PAID' | 'OPEN' | 'COMPLETED' | 'CANCELED'
  appointmentStatus: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELED'
  withPayment?: boolean
}) {
  const service = await prisma.service.findUniqueOrThrow({ where: { id: input.serviceId } })

  const order = await prisma.order.create({
    data: {
      code: `BL-${String(10000 + (Date.now() % 80000))}`,
      customerId: input.customerId,
      customerName: 'Cliente Conta',
      status: input.status === 'COMPLETED' ? 'PAID' : input.status,
      paymentMode: 'ON_SITE',
      serviceCents: input.priceCents,
      totalCents: input.priceCents,
      paidAt: input.withPayment ? new Date() : null,
    },
  })

  const appointment = await prisma.appointment.create({
    data: {
      orderId: order.id,
      customerId: input.customerId,
      barberId: input.barberId,
      serviceId: service.id,
      startAt: input.startAt,
      endAt: new Date(input.startAt.getTime() + service.durationMin * 60_000),
      status: input.appointmentStatus,
      source: 'MANUAL',
      priceCents: input.priceCents,
    },
  })

  if (input.withPayment) {
    await prisma.payment.create({
      data: {
        orderId: order.id,
        appointmentId: appointment.id,
        provider: 'MANUAL',
        method: 'CASH',
        status: 'PAID',
        amountCents: input.priceCents,
        paidAt: new Date(),
      },
    })
  }

  return { order, appointment }
}

async function cleanup(userIds: string[], orderIds: string[]) {
  await prisma.notificationLog.deleteMany({ where: { orderId: { in: orderIds } } })
  await prisma.favoriteService.deleteMany({ where: { userId: { in: userIds } } })
  await prisma.favoriteBarber.deleteMany({ where: { userId: { in: userIds } } })
  await prisma.favoriteProduct.deleteMany({ where: { userId: { in: userIds } } })
  await prisma.review.deleteMany({ where: { customerId: { in: userIds } } })
  await prisma.refund.deleteMany({ where: { payment: { orderId: { in: orderIds } } } })
  await prisma.payment.deleteMany({ where: { orderId: { in: orderIds } } })
  await prisma.appointment.deleteMany({ where: { orderId: { in: orderIds } } })
  await prisma.order.deleteMany({ where: { id: { in: orderIds } } })
  await prisma.timeBlock.deleteMany({ where: { barber: { userId: { in: userIds } } } })
  await prisma.barberProfile.deleteMany({ where: { userId: { in: userIds } } })
  await prisma.user.deleteMany({ where: { id: { in: userIds } } })
}

describe('customer account', () => {
  it('cancels with refund more than two hours ahead', async () => {
    const { service, barberUser, barber, customer } = await makeFixture()
    const { order, appointment } = await makeOrder({
      customerId: customer.id,
      barberId: barber.id,
      serviceId: service.id,
      priceCents: 6000,
      startAt: new Date(Date.now() + 3 * 60 * 60 * 1000),
      status: 'PAID',
      appointmentStatus: 'CONFIRMED',
      withPayment: true,
    })

    try {
      const result = await cancelCustomerAppointment(appointment.id, customer.id)
      expect(result.late).toBe(false)
      expect(result.refunded).toBe(true)

      const stored = await prisma.appointment.findUniqueOrThrow({
        where: { id: appointment.id },
      })
      expect(stored.status).toBe('CANCELED')

      const payment = await prisma.payment.findFirstOrThrow({ where: { orderId: order.id } })
      expect(payment.refundedCents).toBe(6000)
      expect(payment.status).toBe('REFUNDED')

      const refundedOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id } })
      expect(refundedOrder.status).toBe('REFUNDED')
    } finally {
      await cleanup([customer.id, barberUser.id], [order.id])
    }
  })

  it('marks a late cancellation without refunding', async () => {
    const { service, barberUser, barber, customer } = await makeFixture()
    const { order, appointment } = await makeOrder({
      customerId: customer.id,
      barberId: barber.id,
      serviceId: service.id,
      priceCents: 6000,
      startAt: new Date(Date.now() + 60 * 60 * 1000),
      status: 'PAID',
      appointmentStatus: 'CONFIRMED',
      withPayment: true,
    })

    try {
      const result = await cancelCustomerAppointment(appointment.id, customer.id)
      expect(result.late).toBe(true)
      expect(result.refunded).toBe(false)

      const stored = await prisma.appointment.findUniqueOrThrow({
        where: { id: appointment.id },
      })
      expect(stored.status).toBe('CANCELED_LATE')

      const payment = await prisma.payment.findFirstOrThrow({ where: { orderId: order.id } })
      expect(payment.refundedCents).toBe(0)
    } finally {
      await cleanup([customer.id, barberUser.id], [order.id])
    }
  })

  it('reviews a completed visit once and updates the barber rating', async () => {
    const { service, barberUser, barber, customer } = await makeFixture()
    const { order, appointment } = await makeOrder({
      customerId: customer.id,
      barberId: barber.id,
      serviceId: service.id,
      priceCents: 5000,
      startAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      status: 'COMPLETED',
      appointmentStatus: 'COMPLETED',
    })

    try {
      await submitAppointmentReview(
        { appointmentId: appointment.id, rating: 4, comment: 'Bom atendimento' },
        customer.id,
      )

      const review = await prisma.review.findUniqueOrThrow({
        where: { appointmentId: appointment.id },
      })
      expect(review.rating).toBe(4)

      const rated = await prisma.barberProfile.findUniqueOrThrow({ where: { id: barber.id } })
      expect(Number(rated.ratingAvg)).toBe(4)
      expect(rated.ratingCount).toBe(1)

      await expect(
        submitAppointmentReview(
          { appointmentId: appointment.id, rating: 5, comment: '' },
          customer.id,
        ),
      ).rejects.toThrow()
    } finally {
      await prisma.review.deleteMany({ where: { customerId: customer.id } })
      await cleanup([customer.id, barberUser.id], [order.id])
    }
  })

  it('toggles favorites, updates profile, and saves notification preferences', async () => {
    const { service, barberUser, customer } = await makeFixture()

    try {
      const saved = await toggleFavorite(customer.id, 'service', service.id)
      expect(saved).toBe(true)

      const ids = await getFavoriteIds(customer.id)
      expect(ids.services.has(service.id)).toBe(true)

      const removed = await toggleFavorite(customer.id, 'service', service.id)
      expect(removed).toBe(false)
      expect((await getFavoriteIds(customer.id)).services.has(service.id)).toBe(false)

      await updateCustomerProfile(customer.id, {
        name: 'Cliente Atualizado',
        phone: customer.phone ?? '',
        cpf: '12345678901',
        birthDate: '1990-05-10',
        addressLine: 'Rua A, 10',
        city: 'Belo Horizonte',
        state: 'MG',
        postalCode: '30100-000',
      })

      const profile = await prisma.user.findUniqueOrThrow({ where: { id: customer.id } })
      expect(profile.name).toBe('Cliente Atualizado')
      expect(profile.cpf).toBe('12345678901')
      expect(profile.birthDate?.toISOString().slice(0, 10)).toBe('1990-05-10')

      await updateNotificationPreferences(customer.id, { email: false, whatsapp: true })
      const prefs = await prisma.user.findUniqueOrThrow({ where: { id: customer.id } })
      expect(prefs.notifyEmail).toBe(false)
      expect(prefs.notifyWhatsapp).toBe(true)
    } finally {
      await cleanup([customer.id, barberUser.id], [])
    }
  })
})

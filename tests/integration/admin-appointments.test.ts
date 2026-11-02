import { addDays, format, parseISO } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { describe, expect, it } from 'vitest'

import {
  cancelAppointment,
  createManualBooking,
  markAppointmentNoShow,
} from '@/lib/admin/appointments'
import type { AdminScope } from '@/lib/admin/context'
import { getAvailability } from '@/lib/availability/queries'
import { BUSINESS_TIMEZONE } from '@/lib/availability/slots'
import { prisma } from '@/lib/db/prisma'
import { createOrder } from '@/lib/orders/create-order'

const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`

const ownerScope: AdminScope = { userId: 'test-owner', role: 'OWNER', barberId: null }

async function cleanupOrder(code: string, emails: string[]): Promise<void> {
  const existing = await prisma.order.findUnique({ where: { code }, select: { id: true } })

  if (existing) {
    await prisma.inventoryMovement.deleteMany({ where: { orderId: existing.id } })
    await prisma.orderProduct.deleteMany({ where: { orderId: existing.id } })
    await prisma.payment.deleteMany({ where: { orderId: existing.id } })
    await prisma.appointment.deleteMany({ where: { orderId: existing.id } })
    await prisma.order.delete({ where: { id: existing.id } })
  }

  const users = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: { id: true },
  })
  if (users.length > 0) {
    const ids = users.map((user) => user.id)
    await prisma.session.deleteMany({ where: { userId: { in: ids } } })
    await prisma.verificationToken.deleteMany({ where: { userId: { in: ids } } })
    await prisma.user.deleteMany({ where: { id: { in: ids } } })
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
    if (slot) return { service, barber, date, slot }
  }

  throw new Error('no available slot')
}

describe('admin appointments', () => {
  it('books a customer manually and rejects the same slot twice', async () => {
    const { service, barber, date, slot } = await firstAvailableSlot()
    const email = `manual.booking.${suffix}@example.com`

    const booking = await createManualBooking(
      {
        serviceId: service.id,
        barberId: barber.id,
        date,
        startAt: slot.startAt,
        source: 'MANUAL',
        customer: { name: 'Cliente Manual', email, phone: '' },
        note: '',
      },
      ownerScope,
    )

    try {
      const stored = await prisma.order.findUnique({
        where: { code: booking.orderCode },
        include: { appointments: true },
      })
      expect(stored?.status).toBe('OPEN')
      expect(stored?.appointments[0]?.status).toBe('CONFIRMED')
      expect(stored?.appointments[0]?.source).toBe('MANUAL')

      await expect(
        createManualBooking(
          {
            serviceId: service.id,
            barberId: barber.id,
            date,
            startAt: slot.startAt,
            source: 'WALK_IN',
            customer: { name: 'Outro Cliente', email: `other.${email}`, phone: '' },
            note: '',
          },
          ownerScope,
        ),
      ).rejects.toThrow()
    } finally {
      await cleanupOrder(booking.orderCode, [email, `other.${email}`])
    }
  })

  it('blocks a barber from booking another barber agenda', async () => {
    const { service, barber, date, slot } = await firstAvailableSlot()
    const otherBarber = await prisma.barberProfile.findFirst({
      where: { active: true, id: { not: barber.id } },
    })
    if (!otherBarber) throw new Error('second barber missing')

    const barberScope: AdminScope = {
      userId: 'barber-user',
      role: 'BARBER',
      barberId: otherBarber.id,
    }

    await expect(
      createManualBooking(
        {
          serviceId: service.id,
          barberId: barber.id,
          date,
          startAt: slot.startAt,
          source: 'MANUAL',
          customer: { name: 'Cliente Alheio', email: `foreign.${suffix}@example.com`, phone: '' },
          note: '',
        },
        barberScope,
      ),
    ).rejects.toThrow('sua própria agenda')
  })

  it('blocks a customer after three no-shows', async () => {
    const service = await prisma.service.findFirstOrThrow({ where: { active: true } })
    const barberUser = await prisma.user.create({
      data: {
        name: 'Barbeiro Falta',
        email: `noshow.barber.${suffix}@example.com`,
        role: 'BARBER',
      },
    })
    const barber = await prisma.barberProfile.create({
      data: { userId: barberUser.id, displayName: 'Barbeiro Falta', title: 'Barbeiro' },
    })
    const customer = await prisma.user.create({
      data: {
        name: 'Cliente Falta',
        email: `noshow.customer.${suffix}@example.com`,
        role: 'CUSTOMER',
        noShowCount: 2,
      },
    })

    const startAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    const order = await prisma.order.create({
      data: {
        code: `BL-${String(20000 + (Date.now() % 70000))}`,
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email,
        status: 'OPEN',
        paymentMode: 'ON_SITE',
        serviceCents: service.priceCents,
        totalCents: service.priceCents,
      },
    })

    const appointment = await prisma.appointment.create({
      data: {
        orderId: order.id,
        customerId: customer.id,
        barberId: barber.id,
        serviceId: service.id,
        startAt,
        endAt: new Date(startAt.getTime() + service.durationMin * 60_000),
        status: 'CONFIRMED',
        source: 'MANUAL',
        priceCents: service.priceCents,
      },
    })

    try {
      const result = await markAppointmentNoShow(appointment.id, ownerScope)
      expect(result.blocked).toBe(true)

      const blocked = await prisma.user.findUnique({ where: { id: customer.id } })
      expect(blocked?.noShowCount).toBe(3)
      expect(blocked?.bookingBlocked).toBe(true)
    } finally {
      await prisma.appointment.delete({ where: { id: appointment.id } })
      await prisma.order.delete({ where: { id: order.id } })
      await prisma.barberProfile.delete({ where: { id: barber.id } })
      await prisma.user.deleteMany({ where: { id: { in: [customer.id, barberUser.id] } } })
    }
  })

  it('refuses online checkout for a blocked customer', async () => {
    const { service, barber, slot } = await firstAvailableSlot()
    const email = `blocked.checkout.${suffix}@example.com`

    const customer = await prisma.user.create({
      data: {
        name: 'Cliente Bloqueado',
        email,
        role: 'CUSTOMER',
        noShowCount: 3,
        bookingBlocked: true,
        blockedAt: new Date(),
      },
    })

    try {
      await expect(
        createOrder(
          {
            paymentMode: 'ON_SITE',
            customer: { name: customer.name, email, phone: '' },
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
      ).rejects.toThrow('bloqueada')
    } finally {
      await prisma.user.delete({ where: { id: customer.id } })
    }
  })

  it('cancels an appointment and closes an unpaid order', async () => {
    const { service, barber, date, slot } = await firstAvailableSlot()
    const email = `cancel.booking.${suffix}@example.com`

    const booking = await createManualBooking(
      {
        serviceId: service.id,
        barberId: barber.id,
        date,
        startAt: slot.startAt,
        source: 'MANUAL',
        customer: { name: 'Cliente Cancelar', email, phone: '' },
        note: '',
      },
      ownerScope,
    )

    try {
      const result = await cancelAppointment(booking.appointmentId, ownerScope, 'Cliente pediu')
      expect(result.late).toBe(false)

      const appointment = await prisma.appointment.findUnique({
        where: { id: booking.appointmentId },
      })
      expect(appointment?.status).toBe('CANCELED')
      expect(appointment?.note).toBe('Cliente pediu')

      const order = await prisma.order.findUnique({ where: { code: booking.orderCode } })
      expect(order?.status).toBe('CANCELED')
    } finally {
      await cleanupOrder(booking.orderCode, [email])
    }
  })
})

import { describe, expect, it } from 'vitest'

import { prisma } from '@/lib/db/prisma'
import { notifyAppointment } from '@/lib/notifications/dispatch'
import { sendDueReminders } from '@/lib/notifications/reminders'
import { ConsoleWhatsAppSender } from '@/lib/notifications/whatsapp/console'

const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`

async function buildFixture(contacts: { email?: boolean; phone?: boolean } = {}) {
  const withEmail = contacts.email ?? true
  const withPhone = contacts.phone ?? true
  const service = await prisma.service.findFirstOrThrow({ where: { active: true } })

  const customer = await prisma.user.create({
    data: {
      name: 'Cliente Notificação',
      email: withEmail ? `notify.customer.${suffix}@example.com` : null,
      phone: withPhone ? `+55319${String(Date.now()).slice(-8)}` : null,
      role: 'CUSTOMER',
    },
  })

  const barberUser = await prisma.user.create({
    data: {
      name: 'Barbeiro Notificação',
      email: `notify.barber.${suffix}@example.com`,
      role: 'BARBER',
    },
  })

  const barber = await prisma.barberProfile.create({
    data: { userId: barberUser.id, displayName: 'Barbeiro Notificação', title: 'Barbeiro' },
  })

  const startAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const endAt = new Date(startAt.getTime() + service.durationMin * 60_000)
  const code = `BL-${String(10000 + (Date.now() % 89999))}`

  const order = await prisma.order.create({
    data: {
      code,
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
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
      endAt,
      status: 'CONFIRMED',
      source: 'ONLINE',
      priceCents: service.priceCents,
    },
  })

  return { customer, barberUser, barber, order, appointment }
}

async function cleanup(fixture: Awaited<ReturnType<typeof buildFixture>>): Promise<void> {
  await prisma.notificationLog.deleteMany({ where: { appointmentId: fixture.appointment.id } })
  await prisma.appointment.delete({ where: { id: fixture.appointment.id } })
  await prisma.order.delete({ where: { id: fixture.order.id } })
  await prisma.barberProfile.delete({ where: { id: fixture.barber.id } })
  await prisma.user.deleteMany({
    where: { id: { in: [fixture.customer.id, fixture.barberUser.id] } },
  })
}

describe('appointment notifications', () => {
  it('logs one confirmation per channel and sends only once', async () => {
    const fixture = await buildFixture()

    try {
      const first = await notifyAppointment('BOOKING_CONFIRMATION', fixture.appointment.id)
      expect(first.sent).toBe(2)
      expect(first.failed).toBe(0)

      const logs = await prisma.notificationLog.findMany({
        where: { appointmentId: fixture.appointment.id },
      })
      expect(logs).toHaveLength(2)
      expect(logs.every((log) => log.status === 'SENT')).toBe(true)
      expect(new Set(logs.map((log) => log.channel))).toEqual(new Set(['EMAIL', 'WHATSAPP']))

      const second = await notifyAppointment('BOOKING_CONFIRMATION', fixture.appointment.id)
      expect(second.skipped).toBe(true)
      expect(second.sent).toBe(0)

      const after = await prisma.notificationLog.count({
        where: { appointmentId: fixture.appointment.id },
      })
      expect(after).toBe(2)
    } finally {
      await cleanup(fixture)
    }
  })

  it('reminds confirmed appointments once inside the 24h window', async () => {
    const fixture = await buildFixture()

    try {
      await sendDueReminders()

      const reminders = await prisma.notificationLog.findMany({
        where: { appointmentId: fixture.appointment.id, kind: 'REMINDER' },
      })
      expect(reminders).toHaveLength(2)
      expect(reminders.every((log) => log.status === 'SENT')).toBe(true)

      const again = await sendDueReminders()
      expect(again.skipped).toBeGreaterThanOrEqual(1)

      const after = await prisma.notificationLog.count({
        where: { appointmentId: fixture.appointment.id, kind: 'REMINDER' },
      })
      expect(after).toBe(2)
    } finally {
      await cleanup(fixture)
    }
  })

  it('sends only email when the customer has only an email', async () => {
    const fixture = await buildFixture({ phone: false })

    try {
      const result = await notifyAppointment('BOOKING_CONFIRMATION', fixture.appointment.id)
      expect(result.sent).toBe(1)

      const logs = await prisma.notificationLog.findMany({
        where: { appointmentId: fixture.appointment.id },
      })
      expect(logs.map((log) => log.channel)).toEqual(['EMAIL'])
    } finally {
      await cleanup(fixture)
    }
  })

  it('sends only WhatsApp when the customer has only a phone', async () => {
    const fixture = await buildFixture({ email: false })

    try {
      const result = await notifyAppointment('BOOKING_CONFIRMATION', fixture.appointment.id)
      expect(result.sent).toBe(1)

      const logs = await prisma.notificationLog.findMany({
        where: { appointmentId: fixture.appointment.id },
      })
      expect(logs.map((log) => log.channel)).toEqual(['WHATSAPP'])
    } finally {
      await cleanup(fixture)
    }
  })

  it('records a provider failure without failing the appointment', async () => {
    const fixture = await buildFixture({ email: false })
    const original = ConsoleWhatsAppSender.prototype.sendText

    ConsoleWhatsAppSender.prototype.sendText = async () => {
      throw new Error('provider down')
    }

    try {
      const result = await notifyAppointment('BOOKING_CONFIRMATION', fixture.appointment.id)
      expect(result.sent).toBe(0)
      expect(result.failed).toBe(1)

      const logs = await prisma.notificationLog.findMany({
        where: { appointmentId: fixture.appointment.id },
      })
      expect(logs).toHaveLength(1)
      expect(logs[0]?.status).toBe('FAILED')

      const stillThere = await prisma.appointment.count({
        where: { id: fixture.appointment.id },
      })
      expect(stillThere).toBe(1)
    } finally {
      ConsoleWhatsAppSender.prototype.sendText = original
      await cleanup(fixture)
    }
  })
})

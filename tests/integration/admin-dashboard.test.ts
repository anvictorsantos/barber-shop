import { describe, expect, it } from 'vitest'

import { getClientDetail, getClients } from '@/lib/admin/clients'
import type { AdminScope } from '@/lib/admin/context'
import { getDashboard, getFinanceReport } from '@/lib/admin/dashboard'
import { prisma } from '@/lib/db/prisma'

const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`

async function cleanup(ids: {
  userIds: string[]
  orderIds: string[]
  appointmentIds: string[]
  barberId: string | null
}) {
  await prisma.notificationLog.deleteMany({ where: { appointmentId: { in: ids.appointmentIds } } })
  await prisma.payment.deleteMany({ where: { orderId: { in: ids.orderIds } } })
  await prisma.appointment.deleteMany({ where: { id: { in: ids.appointmentIds } } })
  await prisma.order.deleteMany({ where: { id: { in: ids.orderIds } } })
  if (ids.barberId) await prisma.barberProfile.delete({ where: { id: ids.barberId } })
  await prisma.user.deleteMany({ where: { id: { in: ids.userIds } } })
}

describe('admin dashboard, finance, and clients', () => {
  it('scopes metrics, finance, and clients to the barber', async () => {
    const service = await prisma.service.findFirstOrThrow({ where: { active: true } })

    const barberUser = await prisma.user.create({
      data: {
        name: 'Barbeiro Painel',
        email: `panel.barber.${suffix}@example.com`,
        role: 'BARBER',
      },
    })
    const barber = await prisma.barberProfile.create({
      data: { userId: barberUser.id, displayName: 'Barbeiro Painel', title: 'Barbeiro' },
    })
    const customer = await prisma.user.create({
      data: {
        name: 'Cliente Painel',
        email: `panel.customer.${suffix}@example.com`,
        role: 'CUSTOMER',
      },
    })
    const outsider = await prisma.user.create({
      data: {
        name: 'Cliente Fora',
        email: `panel.outsider.${suffix}@example.com`,
        role: 'CUSTOMER',
      },
    })

    const now = new Date()
    const paidOrder = await prisma.order.create({
      data: {
        code: `BL-${String(10000 + (Date.now() % 40000))}`,
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email,
        status: 'PAID',
        paymentMode: 'ON_SITE',
        serviceCents: 5000,
        totalCents: 5000,
        paidAt: now,
      },
    })
    const completedAppointment = await prisma.appointment.create({
      data: {
        orderId: paidOrder.id,
        customerId: customer.id,
        barberId: barber.id,
        serviceId: service.id,
        startAt: now,
        endAt: new Date(now.getTime() + service.durationMin * 60_000),
        status: 'COMPLETED',
        source: 'MANUAL',
        priceCents: 5000,
        completedAt: now,
      },
    })
    await prisma.payment.create({
      data: {
        orderId: paidOrder.id,
        appointmentId: completedAppointment.id,
        provider: 'MANUAL',
        method: 'PIX',
        status: 'PAID',
        amountCents: 5000,
        paidAt: now,
      },
    })

    const openOrder = await prisma.order.create({
      data: {
        code: `BL-${String(50000 + (Date.now() % 49999))}`,
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email,
        status: 'OPEN',
        paymentMode: 'ON_SITE',
        serviceCents: service.priceCents,
        totalCents: service.priceCents,
      },
    })
    const pendingAppointment = await prisma.appointment.create({
      data: {
        orderId: openOrder.id,
        customerId: customer.id,
        barberId: barber.id,
        serviceId: service.id,
        startAt: new Date(now.getTime() + 90 * 60 * 1000),
        endAt: new Date(now.getTime() + (90 + service.durationMin) * 60 * 1000),
        status: 'CONFIRMED',
        source: 'MANUAL',
        priceCents: service.priceCents,
      },
    })

    const scope: AdminScope = { userId: barberUser.id, role: 'BARBER', barberId: barber.id }

    try {
      const dashboard = await getDashboard(scope)
      expect(dashboard.todayAppointments).toBe(2)
      expect(dashboard.awaitingPayment).toBe(1)
      expect(dashboard.revenueTodayCents).toBe(5000)
      expect(dashboard.blockedCustomers).toBeNull()

      const finance = await getFinanceReport(scope, 7)
      expect(finance.summary.netCents).toBe(5000)
      expect(finance.summary.byMethod.PIX).toBe(5000)
      expect(finance.completedAppointments).toBe(1)
      expect(finance.ticketCents).toBe(5000)
      expect(finance.methodTotals).toEqual([{ method: 'PIX', netCents: 5000 }])
      expect(finance.recentPayments[0]?.orderCode).toBe(paidOrder.code)

      const clients = await getClients(scope, 'panel.customer')
      expect(clients.map((client) => client.id)).toEqual([customer.id])
      expect(clients[0]?.visits).toBe(1)
      expect(clients[0]?.spentCents).toBe(5000)

      const outsiders = await getClients(scope, 'panel.outsider')
      expect(outsiders).toHaveLength(0)

      const detail = await getClientDetail(scope, customer.id)
      expect(detail?.visits).toBe(1)
      expect(detail?.appointments).toHaveLength(2)

      expect(await getClientDetail(scope, outsider.id)).toBeNull()
    } finally {
      await cleanup({
        userIds: [barberUser.id, customer.id, outsider.id],
        orderIds: [paidOrder.id, openOrder.id],
        appointmentIds: [completedAppointment.id, pendingAppointment.id],
        barberId: barber.id,
      })
    }
  })
})

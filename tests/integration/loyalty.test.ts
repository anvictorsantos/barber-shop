import { addDays } from 'date-fns'
import { describe, expect, it } from 'vitest'

import { cancelAppointment, completeAppointment } from '@/lib/admin/appointments'
import type { AdminScope } from '@/lib/admin/context'
import { getAvailability } from '@/lib/availability/queries'
import { prisma } from '@/lib/db/prisma'
import { createOrder } from '@/lib/orders/create-order'

import type { LoyaltyTier } from '@prisma/client'

const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`
const ownerScope: AdminScope = { userId: 'loyalty-owner', role: 'OWNER', barberId: null }

async function makeBarber(label: string) {
  const user = await prisma.user.create({
    data: { name: label, email: `${label}.${suffix}@example.com`, role: 'BARBER' },
  })
  const profile = await prisma.barberProfile.create({
    data: { userId: user.id, displayName: label, title: 'Barbeiro' },
  })
  return { user, profile }
}

async function makeCustomer(
  label: string,
  loyalty?: { stamps: number; visits: number; tier: LoyaltyTier },
) {
  const user = await prisma.user.create({
    data: {
      name: label,
      email: `${label}.${suffix}@example.com`,
      role: 'CUSTOMER',
    },
  })

  if (loyalty) {
    await prisma.loyaltyAccount.create({
      data: {
        userId: user.id,
        stamps: loyalty.stamps,
        lifetimeVisits: loyalty.visits,
        tier: loyalty.tier,
      },
    })
  }

  return user
}

async function makeAppointment(input: {
  customerId: string
  barberId: string
  serviceId: string
  status?: 'CONFIRMED' | 'COMPLETED'
  priceCents?: number
}) {
  const service = await prisma.service.findUniqueOrThrow({ where: { id: input.serviceId } })
  const startAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)

  const order = await prisma.order.create({
    data: {
      code: `BL-${String(10000 + (Date.now() % 80000))}`,
      customerId: input.customerId,
      customerName: 'Cliente Fidelidade',
      status: 'OPEN',
      paymentMode: 'ON_SITE',
      serviceCents: input.priceCents ?? service.priceCents,
      totalCents: input.priceCents ?? service.priceCents,
    },
  })

  const appointment = await prisma.appointment.create({
    data: {
      orderId: order.id,
      customerId: input.customerId,
      barberId: input.barberId,
      serviceId: service.id,
      startAt,
      endAt: new Date(startAt.getTime() + service.durationMin * 60_000),
      status: input.status ?? 'CONFIRMED',
      source: 'MANUAL',
      priceCents: input.priceCents ?? service.priceCents,
    },
  })

  return { order, appointment }
}

async function cleanup(input: { userIds: string[]; orderIds: string[]; barberId: string | null }) {
  const accounts = await prisma.loyaltyAccount.findMany({
    where: { userId: { in: input.userIds } },
    select: { id: true },
  })
  const accountIds = accounts.map((account) => account.id)
  await prisma.loyaltyEntry.deleteMany({ where: { accountId: { in: accountIds } } })
  await prisma.loyaltyCredit.deleteMany({ where: { accountId: { in: accountIds } } })
  await prisma.loyaltyAccount.deleteMany({ where: { id: { in: accountIds } } })
  await prisma.notificationLog.deleteMany({ where: { orderId: { in: input.orderIds } } })
  await prisma.appointment.deleteMany({ where: { orderId: { in: input.orderIds } } })
  await prisma.order.deleteMany({ where: { id: { in: input.orderIds } } })
  if (input.barberId) await prisma.barberProfile.delete({ where: { id: input.barberId } })
  await prisma.user.deleteMany({ where: { id: { in: input.userIds } } })
}

async function firstSlot(serviceId: string, barberId: string) {
  const today = new Date()
  for (let index = 0; index < 8; index += 1) {
    const date = new Date(today.getTime() + index * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const availability = await getAvailability({ serviceId, barberId, date })
    const slot = availability.slots.find((item) => item.available)
    if (slot) return { service: availability.service, barber: availability.barber, date, slot }
  }
  throw new Error('no available slot')
}

describe('loyalty', () => {
  it('earns one stamp per completed visit, idempotently', async () => {
    const service = await prisma.service.findFirstOrThrow({ where: { active: true } })
    const barber = await makeBarber('Loyalty Barber A')
    const customer = await makeCustomer('loyalty.customer.a')
    const { order, appointment } = await makeAppointment({
      customerId: customer.id,
      barberId: barber.profile.id,
      serviceId: service.id,
    })

    try {
      await completeAppointment(appointment.id, ownerScope)

      let account = await prisma.loyaltyAccount.findUniqueOrThrow({
        where: { userId: customer.id },
      })
      expect(account.stamps).toBe(1)
      expect(account.lifetimeVisits).toBe(1)
      expect(account.tier).toBe('BRONZE')

      const entries = await prisma.loyaltyEntry.findMany({ where: { accountId: account.id } })
      expect(entries.filter((entry) => entry.type === 'STAMP')).toHaveLength(1)

      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { status: 'CONFIRMED' },
      })
      await completeAppointment(appointment.id, ownerScope)

      account = await prisma.loyaltyAccount.findUniqueOrThrow({ where: { userId: customer.id } })
      expect(account.stamps).toBe(1)
      expect(account.lifetimeVisits).toBe(1)
    } finally {
      await cleanup({
        userIds: [customer.id, barber.user.id],
        orderIds: [order.id],
        barberId: barber.profile.id,
      })
    }
  })

  it('issues exactly one credit on the 15th stamp and moves the tier', async () => {
    const service = await prisma.service.findFirstOrThrow({ where: { active: true } })
    const barber = await makeBarber('Loyalty Barber B')
    const customer = await makeCustomer('loyalty.customer.b', {
      stamps: 14,
      visits: 9,
      tier: 'BRONZE',
    })
    const { order, appointment } = await makeAppointment({
      customerId: customer.id,
      barberId: barber.profile.id,
      serviceId: service.id,
    })

    try {
      await completeAppointment(appointment.id, ownerScope)

      const account = await prisma.loyaltyAccount.findUniqueOrThrow({
        where: { userId: customer.id },
      })
      expect(account.stamps).toBe(0)
      expect(account.lifetimeVisits).toBe(10)
      expect(account.tier).toBe('GOLD')

      const credits = await prisma.loyaltyCredit.findMany({ where: { accountId: account.id } })
      expect(credits).toHaveLength(1)
      expect(credits[0]?.status).toBe('AVAILABLE')
      expect(credits[0]!.expiresAt.getTime()).toBeGreaterThan(addDays(new Date(), 88).getTime())

      const issued = await prisma.loyaltyEntry.findMany({
        where: { accountId: account.id, type: 'CREDIT_ISSUED' },
      })
      expect(issued).toHaveLength(1)
    } finally {
      await cleanup({
        userIds: [customer.id, barber.user.id],
        orderIds: [order.id],
        barberId: barber.profile.id,
      })
    }
  })

  it('holds stamps at 15 while a credit is available', async () => {
    const service = await prisma.service.findFirstOrThrow({ where: { active: true } })
    const barber = await makeBarber('Loyalty Barber C')
    const customer = await makeCustomer('loyalty.customer.c', {
      stamps: 15,
      visits: 5,
      tier: 'BRONZE',
    })
    const account = await prisma.loyaltyAccount.findUniqueOrThrow({
      where: { userId: customer.id },
    })
    await prisma.loyaltyCredit.create({
      data: { accountId: account.id, expiresAt: addDays(new Date(), 30), status: 'AVAILABLE' },
    })
    const { order, appointment } = await makeAppointment({
      customerId: customer.id,
      barberId: barber.profile.id,
      serviceId: service.id,
    })

    try {
      await completeAppointment(appointment.id, ownerScope)

      const after = await prisma.loyaltyAccount.findUniqueOrThrow({
        where: { userId: customer.id },
      })
      expect(after.stamps).toBe(15)
      expect(await prisma.loyaltyCredit.count({ where: { accountId: account.id } })).toBe(1)
    } finally {
      await cleanup({
        userIds: [customer.id, barber.user.id],
        orderIds: [order.id],
        barberId: barber.profile.id,
      })
    }
  })

  it('uses a credit on an on-site order and restores it when canceled', async () => {
    const barber = await makeBarber('Loyalty Barber D')
    const customer = await makeCustomer('loyalty.customer.d', {
      stamps: 0,
      visits: 3,
      tier: 'BRONZE',
    })
    const account = await prisma.loyaltyAccount.findUniqueOrThrow({
      where: { userId: customer.id },
    })
    const credit = await prisma.loyaltyCredit.create({
      data: { accountId: account.id, expiresAt: addDays(new Date(), 30), status: 'AVAILABLE' },
    })
    const { service, slot } = await firstSlot(
      (await prisma.service.findFirstOrThrow({ where: { active: true } })).id,
      barber.profile.id,
    )

    const order = await createOrder(
      {
        paymentMode: 'ON_SITE',
        customer: { name: customer.name, email: customer.email ?? '', phone: '' },
        lines: [
          {
            kind: 'service',
            serviceId: service.id,
            barberId: barber.profile.id,
            startAt: slot.startAt,
          },
        ],
        note: '',
        useCredit: true,
      },
      {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
    )

    try {
      expect(order.creditCents).toBe(service.priceCents)
      expect(order.totalCents).toBe(0)

      const used = await prisma.loyaltyCredit.findUniqueOrThrow({ where: { id: credit.id } })
      expect(used.status).toBe('USED')
      expect(used.usedOrderId).toBe(order.id)

      const appointment = await prisma.appointment.findFirstOrThrow({
        where: { orderId: order.id },
      })
      await cancelAppointment(appointment.id, ownerScope, 'Teste')

      const restored = await prisma.loyaltyCredit.findUniqueOrThrow({ where: { id: credit.id } })
      expect(restored.status).toBe('AVAILABLE')
      expect(restored.usedOrderId).toBeNull()
    } finally {
      await cleanup({
        userIds: [customer.id, barber.user.id],
        orderIds: [order.id],
        barberId: barber.profile.id,
      })
    }
  })

  it('refuses to use a credit on online prepayment', async () => {
    const barber = await makeBarber('Loyalty Barber E')
    const customer = await makeCustomer('loyalty.customer.e', {
      stamps: 0,
      visits: 1,
      tier: 'BRONZE',
    })
    const account = await prisma.loyaltyAccount.findUniqueOrThrow({
      where: { userId: customer.id },
    })
    await prisma.loyaltyCredit.create({
      data: { accountId: account.id, expiresAt: addDays(new Date(), 30), status: 'AVAILABLE' },
    })
    const service = await prisma.service.findFirstOrThrow({ where: { active: true } })
    const { slot } = await firstSlot(service.id, barber.profile.id)

    try {
      await expect(
        createOrder(
          {
            paymentMode: 'ONLINE',
            customer: { name: customer.name, email: customer.email ?? '', phone: '' },
            lines: [
              {
                kind: 'service',
                serviceId: service.id,
                barberId: barber.profile.id,
                startAt: slot.startAt,
              },
            ],
            note: '',
            useCredit: true,
          },
          {
            id: customer.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
          },
        ),
      ).rejects.toThrow('pagamento na barbearia')
    } finally {
      await cleanup({
        userIds: [customer.id, barber.user.id],
        orderIds: [],
        barberId: barber.profile.id,
      })
    }
  })
})

import { afterAll, describe, expect, it } from 'vitest'

import { prisma } from '@/lib/db/prisma'

const CODE = 'BL-CONSTRAINT'

async function cleanup() {
  await prisma.appointment.deleteMany({ where: { order: { code: CODE } } })
  await prisma.order.deleteMany({ where: { code: CODE } })
}

describe('appointment exclusion constraint', () => {
  it('rejects an overlapping active appointment for the same barber', async () => {
    await cleanup()

    const source = await prisma.appointment.findFirst({
      where: { status: { in: ['PENDING', 'CONFIRMED'] } },
      include: { customer: true },
    })

    expect(source).not.toBeNull()
    if (!source) return

    const order = await prisma.order.create({
      data: {
        code: CODE,
        customerId: source.customerId,
        customerName: source.customer?.name ?? 'Constraint Test',
        customerPhone: source.customer?.phone ?? null,
        customerEmail: source.customer?.email ?? null,
        status: 'OPEN',
        paymentMode: 'ON_SITE',
        serviceCents: source.priceCents,
        productCents: 0,
        creditCents: 0,
        totalCents: source.priceCents,
      },
    })

    await expect(
      prisma.appointment.create({
        data: {
          orderId: order.id,
          customerId: source.customerId,
          barberId: source.barberId,
          serviceId: source.serviceId,
          startAt: new Date(source.startAt.getTime() + 5 * 60_000),
          endAt: new Date(source.startAt.getTime() + 35 * 60_000),
          status: 'PENDING',
          source: 'ONLINE',
          priceCents: source.priceCents,
        },
      }),
    ).rejects.toThrow(/appointments_active_no_overlap|conflicting key|exclusion/i)
  })

  afterAll(async () => {
    await cleanup()
    await prisma.$disconnect()
  })
})

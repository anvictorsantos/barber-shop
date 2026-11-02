import { formatInTimeZone } from 'date-fns-tz'

import { normalizeEmail, normalizePhone } from '@/lib/auth/identity'
import { getAvailability } from '@/lib/availability/queries'
import { BUSINESS_TIMEZONE } from '@/lib/availability/slots'
import { prisma } from '@/lib/db/prisma'
import { AppError } from '@/lib/http/errors'
import { uniqueOrderCode } from '@/lib/orders/code'
import { isExclusionError } from '@/lib/orders/conflict'
import type { OrderActor } from '@/lib/orders/types'
import type { CreateOrderInput } from '@/lib/validation/orders'

import type { BarberProfile, Product, Service } from '@prisma/client'

interface PreparedService {
  service: Service
  barber: BarberProfile
  startAt: Date
  endAt: Date
}

interface PreparedProduct {
  product: Product
  quantity: number
}

async function resolveCustomer(input: CreateOrderInput, actor: OrderActor | null) {
  if (actor) {
    return {
      customerId: actor.id,
      customerName: actor.name,
      customerEmail: actor.email,
      customerPhone: actor.phone,
    }
  }

  const email = input.customer.email ? normalizeEmail(input.customer.email) : null
  if (input.customer.email && !email) {
    throw new AppError(400, 'invalid_email', 'E-mail inválido.')
  }

  const phone = input.customer.phone ? normalizePhone(input.customer.phone) : null
  if (input.customer.phone && !phone) {
    throw new AppError(400, 'invalid_phone', 'Telefone inválido.')
  }

  if (!email && !phone) {
    throw new AppError(400, 'missing_contact', 'Informe e-mail ou WhatsApp.')
  }

  const existing = await prisma.user.findFirst({
    where: {
      OR: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])],
    },
  })

  if (existing?.bookingBlocked) {
    throw new AppError(
      403,
      'booking_blocked',
      'Sua conta está bloqueada para agendamentos online. Fale com a barbearia.',
    )
  }

  if (existing) {
    return {
      customerId: existing.id,
      customerName: existing.name,
      customerEmail: existing.email,
      customerPhone: existing.phone,
    }
  }

  const user = await prisma.user.create({
    data: {
      name: input.customer.name,
      email,
      phone,
      passwordHash: null,
      role: 'CUSTOMER',
    },
  })

  return {
    customerId: user.id,
    customerName: user.name,
    customerEmail: user.email,
    customerPhone: user.phone,
  }
}

async function prepareServices(input: CreateOrderInput): Promise<PreparedService[]> {
  const serviceLines = input.lines.filter((line) => line.kind === 'service')
  const prepared: PreparedService[] = []

  for (const line of serviceLines) {
    const startAt = new Date(line.startAt)
    if (Number.isNaN(startAt.getTime())) {
      throw new AppError(400, 'invalid_slot', 'Horário inválido.')
    }

    const date = formatInTimeZone(startAt, BUSINESS_TIMEZONE, 'yyyy-MM-dd')
    const availability = await getAvailability({
      serviceId: line.serviceId,
      barberId: line.barberId,
      date,
    })

    const slot = availability.slots.find(
      (item) => new Date(item.startAt).getTime() === startAt.getTime() && item.available,
    )

    if (!slot) {
      throw new AppError(409, 'slot_unavailable', 'Um dos horários não está mais disponível.')
    }

    prepared.push({
      service: availability.service,
      barber: availability.barber,
      startAt,
      endAt: new Date(startAt.getTime() + availability.service.durationMin * 60_000),
    })
  }

  const byBarber = new Map<string, PreparedService[]>()
  for (const line of prepared) {
    const list = byBarber.get(line.barber.id) ?? []
    list.push(line)
    byBarber.set(line.barber.id, list)
  }

  for (const list of byBarber.values()) {
    list.sort((a, b) => a.startAt.getTime() - b.startAt.getTime())
    for (let index = 1; index < list.length; index += 1) {
      const previous = list[index - 1]
      const current = list[index]
      if (previous && current && previous.endAt.getTime() > current.startAt.getTime()) {
        throw new AppError(409, 'slots_overlap', 'Dois serviços do pedido se sobrepõem.')
      }
    }
  }

  return prepared
}

async function prepareProducts(input: CreateOrderInput): Promise<PreparedProduct[]> {
  const productLines = input.lines.filter((line) => line.kind === 'product')
  if (productLines.length === 0) return []

  const quantities = new Map<string, number>()
  for (const line of productLines) {
    quantities.set(line.productId, (quantities.get(line.productId) ?? 0) + line.quantity)
  }

  const products = await prisma.product.findMany({
    where: { id: { in: [...quantities.keys()] }, active: true },
  })
  const byId = new Map(products.map((product) => [product.id, product]))

  const prepared: PreparedProduct[] = []
  for (const [productId, quantity] of quantities) {
    const product = byId.get(productId)
    if (!product) throw new AppError(404, 'not_found', 'Produto não encontrado.')
    if (product.stock - product.reserved < quantity) {
      throw new AppError(409, 'stock_unavailable', 'Estoque insuficiente para um dos produtos.')
    }
    prepared.push({ product, quantity })
  }

  return prepared
}

export async function createOrder(input: CreateOrderInput, actor: OrderActor | null) {
  const hasProducts = input.lines.some((line) => line.kind === 'product')
  if (input.paymentMode === 'ON_SITE' && hasProducts) {
    throw new AppError(400, 'online_required', 'Produtos exigem pagamento online.')
  }

  const preparedServices = await prepareServices(input)
  const preparedProducts = await prepareProducts(input)
  const customer = await resolveCustomer(input, actor)

  const serviceCents = preparedServices.reduce((sum, line) => sum + line.service.priceCents, 0)
  const productCents = preparedProducts.reduce(
    (sum, line) => sum + line.product.priceCents * line.quantity,
    0,
  )
  const totalCents = serviceCents + productCents
  const code = await uniqueOrderCode()
  const online = input.paymentMode === 'ONLINE'
  const now = new Date()

  try {
    return await prisma.$transaction(
      async (tx) => {
        const order = await tx.order.create({
          data: {
            code,
            customerId: customer.customerId,
            customerName: customer.customerName,
            customerPhone: customer.customerPhone,
            customerEmail: customer.customerEmail,
            status: online ? 'PENDING_PAYMENT' : 'OPEN',
            paymentMode: input.paymentMode,
            serviceCents,
            productCents,
            creditCents: 0,
            totalCents,
            expiresAt: online ? new Date(now.getTime() + 15 * 60 * 1000) : null,
            note: input.note || null,
          },
        })

        for (const line of preparedServices) {
          await tx.appointment.create({
            data: {
              orderId: order.id,
              customerId: customer.customerId,
              barberId: line.barber.id,
              serviceId: line.service.id,
              startAt: line.startAt,
              endAt: line.endAt,
              status: 'PENDING',
              source: 'ONLINE',
              priceCents: line.service.priceCents,
            },
          })
        }

        for (const line of preparedProducts) {
          const updated = await tx.$executeRaw`
            UPDATE "products"
            SET "reserved" = "reserved" + ${line.quantity}, "updated_at" = NOW()
            WHERE "id" = ${line.product.id}
              AND "stock" - "reserved" >= ${line.quantity}
          `

          if (updated === 0) {
            throw new AppError(
              409,
              'stock_unavailable',
              'Estoque insuficiente para um dos produtos.',
            )
          }

          await tx.orderProduct.create({
            data: {
              orderId: order.id,
              productId: line.product.id,
              quantity: line.quantity,
              unitPriceCents: line.product.priceCents,
              lineTotalCents: line.product.priceCents * line.quantity,
            },
          })

          await tx.inventoryMovement.create({
            data: {
              productId: line.product.id,
              orderId: order.id,
              type: 'RESERVE',
              quantity: line.quantity,
              note: 'Reserva de pedido',
            },
          })
        }

        return order
      },
      { isolationLevel: 'Serializable' },
    )
  } catch (error) {
    if (error instanceof AppError) throw error
    if (isExclusionError(error)) {
      throw new AppError(409, 'slot_taken', 'Um dos horários acabou de ser reservado.')
    }
    throw error
  }
}

export async function expirePendingOrder(code: string): Promise<boolean> {
  const order = await prisma.order.findUnique({
    where: { code },
    include: { products: true },
  })

  if (!order || order.status !== 'PENDING_PAYMENT') return false

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: { status: 'EXPIRED', canceledAt: new Date() },
    })

    await tx.appointment.updateMany({
      where: { orderId: order.id, status: 'PENDING' },
      data: { status: 'CANCELED', canceledAt: new Date() },
    })

    for (const line of order.products) {
      await tx.$executeRaw`
        UPDATE "products"
        SET "reserved" = GREATEST("reserved" - ${line.quantity}, 0), "updated_at" = NOW()
        WHERE "id" = ${line.productId}
      `

      await tx.inventoryMovement.create({
        data: {
          productId: line.productId,
          orderId: order.id,
          type: 'RELEASE',
          quantity: line.quantity,
          note: 'Pedido expirado',
        },
      })
    }
  })

  return true
}

export async function expireOverdueOrders(limit = 100): Promise<{ expired: number }> {
  const overdue = await prisma.order.findMany({
    where: { status: 'PENDING_PAYMENT', expiresAt: { lt: new Date() } },
    select: { code: true },
    orderBy: { expiresAt: 'asc' },
    take: limit,
  })

  let expired = 0
  for (const order of overdue) {
    if (await expirePendingOrder(order.code)) expired += 1
  }

  return { expired }
}

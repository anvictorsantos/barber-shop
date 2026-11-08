import type { AdminScope } from '@/lib/admin/context'
import { normalizeEmail, normalizePhone } from '@/lib/auth/identity'
import { getAvailability } from '@/lib/availability/queries'
import { prisma } from '@/lib/db/prisma'
import { AppError } from '@/lib/http/errors'
import { recordCompletedVisit, releaseOrderCredit } from '@/lib/loyalty/service'
import { createOrderPublicToken, uniqueOrderCode } from '@/lib/orders/code'
import { isExclusionError } from '@/lib/orders/conflict'
import type { ManualBookingInput } from '@/lib/validation/admin'

export const NO_SHOW_BLOCK_THRESHOLD = 3
const LATE_CANCEL_WINDOW_MS = 4 * 60 * 60 * 1000

async function findOrCreateCustomer(input: ManualBookingInput['customer']) {
  const email = input.email ? normalizeEmail(input.email) : null
  if (input.email && !email) throw new AppError(400, 'invalid_email', 'E-mail inválido.')

  const phone = input.phone ? normalizePhone(input.phone) : null
  if (input.phone && !phone) throw new AppError(400, 'invalid_phone', 'Telefone inválido.')

  if (!email && !phone) {
    throw new AppError(400, 'missing_contact', 'Informe e-mail ou WhatsApp do cliente.')
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])] },
    select: { id: true },
  })
  if (existing) return existing

  return prisma.user.create({
    data: { name: input.name, email, phone, role: 'CUSTOMER' },
    select: { id: true },
  })
}

export async function createManualBooking(input: ManualBookingInput, scope: AdminScope) {
  if (scope.barberId && scope.barberId !== input.barberId) {
    throw new AppError(403, 'forbidden', 'Você só pode agendar na sua própria agenda.')
  }

  const availability = await getAvailability({
    serviceId: input.serviceId,
    barberId: input.barberId,
    date: input.date,
  })

  const startAt = new Date(input.startAt)
  const slot = availability.slots.find(
    (item) => new Date(item.startAt).getTime() === startAt.getTime() && item.available,
  )
  if (!slot) {
    throw new AppError(409, 'slot_unavailable', 'Horário indisponível para este profissional.')
  }

  const customer = await findOrCreateCustomer(input.customer)
  const endAt = new Date(startAt.getTime() + availability.service.durationMin * 60_000)
  const code = await uniqueOrderCode()

  try {
    return await prisma.$transaction(
      async (tx) => {
        const order = await tx.order.create({
          data: {
            code,
            publicToken: createOrderPublicToken(),
            customerId: customer.id,
            customerName: input.customer.name,
            customerEmail: input.customer.email || null,
            customerPhone: input.customer.phone || null,
            status: 'OPEN',
            paymentMode: 'ON_SITE',
            serviceCents: availability.service.priceCents,
            totalCents: availability.service.priceCents,
            note: input.note || null,
          },
        })

        const appointment = await tx.appointment.create({
          data: {
            orderId: order.id,
            customerId: customer.id,
            barberId: availability.barber.id,
            serviceId: availability.service.id,
            startAt,
            endAt,
            status: 'CONFIRMED',
            source: input.source,
            priceCents: availability.service.priceCents,
            note: input.note || null,
            createdById: scope.userId,
          },
        })

        return { orderCode: order.code, appointmentId: appointment.id }
      },
      { isolationLevel: 'Serializable' },
    )
  } catch (error) {
    if (isExclusionError(error)) {
      throw new AppError(409, 'slot_taken', 'Este horário acabou de ser reservado.')
    }
    throw error
  }
}

async function loadScopedAppointment(appointmentId: string, scope: AdminScope) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { order: { select: { id: true, status: true } } },
  })

  if (!appointment) throw new AppError(404, 'not_found', 'Agendamento não encontrado.')
  if (scope.barberId && appointment.barberId !== scope.barberId) {
    throw new AppError(403, 'forbidden', 'Acesso negado.')
  }

  return appointment
}

export async function completeAppointment(appointmentId: string, scope: AdminScope) {
  const appointment = await loadScopedAppointment(appointmentId, scope)
  if (appointment.status !== 'PENDING' && appointment.status !== 'CONFIRMED') {
    throw new AppError(409, 'invalid_status', 'Este agendamento não pode ser concluído.')
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.appointment.update({
      where: { id: appointment.id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    })

    await recordCompletedVisit(tx, appointment.id)
    return updated
  })
}

export async function markAppointmentNoShow(appointmentId: string, scope: AdminScope) {
  const appointment = await loadScopedAppointment(appointmentId, scope)
  if (appointment.status !== 'PENDING' && appointment.status !== 'CONFIRMED') {
    throw new AppError(409, 'invalid_status', 'Este agendamento não pode ser marcado como falta.')
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.appointment.updateMany({
      where: { id: appointment.id, status: { in: ['PENDING', 'CONFIRMED'] } },
      data: { status: 'NO_SHOW', noShowAt: new Date() },
    })

    if (updated.count === 0) {
      throw new AppError(409, 'invalid_status', 'Este agendamento não pode ser marcado como falta.')
    }

    if (!appointment.customerId) return { customerId: null, blocked: false }

    const customer = await tx.user.update({
      where: { id: appointment.customerId },
      data: { noShowCount: { increment: 1 } },
      select: { id: true, noShowCount: true, bookingBlocked: true },
    })

    const shouldBlock = !customer.bookingBlocked && customer.noShowCount >= NO_SHOW_BLOCK_THRESHOLD

    if (shouldBlock) {
      await tx.user.update({
        where: { id: customer.id },
        data: { bookingBlocked: true, blockedAt: new Date() },
      })
    }

    return { customerId: customer.id, blocked: shouldBlock }
  })
}

export async function cancelAppointment(appointmentId: string, scope: AdminScope, reason: string) {
  const appointment = await loadScopedAppointment(appointmentId, scope)
  if (appointment.status !== 'PENDING' && appointment.status !== 'CONFIRMED') {
    throw new AppError(409, 'invalid_status', 'Este agendamento não pode ser cancelado.')
  }

  const now = new Date()
  const late = appointment.startAt.getTime() - now.getTime() < LATE_CANCEL_WINDOW_MS

  return prisma.$transaction(async (tx) => {
    await tx.appointment.update({
      where: { id: appointment.id },
      data: {
        status: late ? 'CANCELED_LATE' : 'CANCELED',
        canceledAt: now,
        ...(reason ? { note: reason } : {}),
      },
    })

    if (appointment.order.status === 'OPEN') {
      const active = await tx.appointment.count({
        where: {
          orderId: appointment.orderId,
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
      })

      if (active === 0) {
        await tx.order.update({
          where: { id: appointment.orderId },
          data: { status: 'CANCELED', canceledAt: now },
        })
        await releaseOrderCredit(tx, appointment.orderId)
      }
    }

    return { appointmentId: appointment.id, late }
  })
}

export async function blockCustomer(userId: string, scope: AdminScope) {
  if (scope.role !== 'OWNER') throw new AppError(403, 'forbidden', 'Acesso negado.')

  return prisma.user.update({
    where: { id: userId },
    data: { bookingBlocked: true, blockedAt: new Date() },
    select: { id: true },
  })
}

export async function unblockCustomer(userId: string, scope: AdminScope) {
  if (scope.role !== 'OWNER') throw new AppError(403, 'forbidden', 'Acesso negado.')

  return prisma.user.update({
    where: { id: userId },
    data: { bookingBlocked: false, blockedAt: null, noShowCount: 0 },
    select: { id: true },
  })
}

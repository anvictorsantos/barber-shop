import { normalizePhone } from '@/lib/auth/identity'
import { toggleFavorite } from '@/lib/customer/favorites'
import type { FavoriteKind } from '@/lib/customer/favorites'
import { prisma } from '@/lib/db/prisma'
import { AppError } from '@/lib/http/errors'
import { releaseOrderCredit } from '@/lib/loyalty/service'
import { isUniqueConstraintError } from '@/lib/orders/conflict'
import { refundOrderPayment } from '@/lib/payments/refund'
import type { CustomerProfileInput, ReviewInput } from '@/lib/validation/customer'

const CUSTOMER_CANCEL_WINDOW_MS = 2 * 60 * 60 * 1000

export async function cancelCustomerAppointment(appointmentId: string, userId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { order: { select: { id: true, code: true, status: true } } },
  })

  if (!appointment || appointment.customerId !== userId) {
    throw new AppError(404, 'not_found', 'Agendamento não encontrado.')
  }
  if (appointment.status !== 'PENDING' && appointment.status !== 'CONFIRMED') {
    throw new AppError(409, 'invalid_status', 'Este agendamento não pode ser cancelado.')
  }

  const now = new Date()
  const late = appointment.startAt.getTime() - now.getTime() < CUSTOMER_CANCEL_WINDOW_MS

  await prisma.$transaction(async (tx) => {
    await tx.appointment.update({
      where: { id: appointment.id },
      data: {
        status: late ? 'CANCELED_LATE' : 'CANCELED',
        canceledAt: now,
        note: 'Cancelado pelo cliente',
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
  })

  let refunded = false

  if (!late) {
    const payments = await prisma.payment.findMany({
      where: {
        orderId: appointment.orderId,
        status: { in: ['PAID', 'PARTIALLY_REFUNDED'] },
      },
    })
    const payment =
      payments.find((item) => item.appointmentId === appointment.id) ??
      (payments.length === 1 ? payments[0] : undefined)

    if (payment) {
      const amount = Math.min(appointment.priceCents, payment.amountCents - payment.refundedCents)

      if (amount > 0) {
        try {
          await refundOrderPayment({
            orderCode: appointment.order.code,
            amountCents: amount,
            reason: 'Cancelamento pelo cliente',
            appointmentId: appointment.id,
            orderProductId: null,
          })
          refunded = true
        } catch (error) {
          console.warn(
            '[customer-cancel] refund failed',
            error instanceof Error ? error.message : 'unknown',
          )
        }
      }
    }
  }

  return { late, refunded }
}

export async function submitAppointmentReview(input: ReviewInput, userId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: input.appointmentId },
    include: { review: { select: { id: true } } },
  })

  if (!appointment || appointment.customerId !== userId) {
    throw new AppError(404, 'not_found', 'Agendamento não encontrado.')
  }
  if (appointment.status !== 'COMPLETED') {
    throw new AppError(409, 'invalid_status', 'Só é possível avaliar visitas concluídas.')
  }
  if (appointment.review) {
    throw new AppError(409, 'already_reviewed', 'Esta visita já foi avaliada.')
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          appointmentId: appointment.id,
          customerId: userId,
          barberId: appointment.barberId,
          rating: input.rating,
          comment: input.comment || null,
        },
      })

      const aggregate = await tx.review.aggregate({
        where: { barberId: appointment.barberId },
        _avg: { rating: true },
        _count: { _all: true },
      })

      await tx.barberProfile.update({
        where: { id: appointment.barberId },
        data: {
          ratingAvg: aggregate._avg.rating ?? 0,
          ratingCount: aggregate._count._all,
        },
      })

      return review
    })
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError(409, 'already_reviewed', 'Esta visita já foi avaliada.')
    }
    throw error
  }
}

export async function updateCustomerProfile(userId: string, input: CustomerProfileInput) {
  const phone = input.phone ? normalizePhone(input.phone) : null
  if (input.phone && !phone) {
    throw new AppError(400, 'invalid_phone', 'Telefone inválido.')
  }

  if (phone) {
    const owner = await prisma.user.findUnique({ where: { phone }, select: { id: true } })
    if (owner && owner.id !== userId) {
      throw new AppError(409, 'phone_taken', 'Este telefone já está em uso.')
    }
  }

  const current = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { phone: true },
  })

  const cpfDigits = input.cpf.replace(/\D/g, '')
  if (cpfDigits && cpfDigits.length !== 11) {
    throw new AppError(400, 'invalid_cpf', 'CPF inválido.')
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      name: input.name,
      phone,
      ...(phone === current.phone ? {} : { phoneVerifiedAt: null }),
      cpf: cpfDigits || null,
      birthDate: input.birthDate ? new Date(`${input.birthDate}T00:00:00.000Z`) : null,
      addressLine: input.addressLine || null,
      city: input.city || null,
      state: input.state || null,
      postalCode: input.postalCode || null,
    },
  })
}

export async function updateNotificationPreferences(
  userId: string,
  input: { email: boolean; whatsapp: boolean },
) {
  return prisma.user.update({
    where: { id: userId },
    data: { notifyEmail: input.email, notifyWhatsapp: input.whatsapp },
  })
}

export async function setFavorite(
  userId: string,
  kind: FavoriteKind,
  id: string,
): Promise<boolean> {
  return toggleFavorite(userId, kind, id)
}

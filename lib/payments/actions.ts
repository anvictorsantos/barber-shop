'use server'

import { revalidatePath } from 'next/cache'

import { recordAudit } from '@/lib/audit/log'
import { requireOwner, requireStaff } from '@/lib/auth/guards'
import { getSessionUser } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import type { ActionResult } from '@/lib/http/action-result'
import { AppError } from '@/lib/http/errors'
import { refundOrderPayment } from '@/lib/payments/refund'
import { settleOrderPayment } from '@/lib/payments/settle'
import { recordPaymentSchema, refundPaymentSchema } from '@/lib/validation/payments'

function failure(error: unknown): ActionResult {
  if (error instanceof AppError) return { ok: false, error: error.message }
  console.error('[payment-action]', error instanceof Error ? error.name : 'unknown')
  return { ok: false, error: 'Não foi possível concluir a operação.' }
}

export async function recordPaymentAction(input: unknown): Promise<ActionResult> {
  try {
    const user = requireStaff(await getSessionUser())
    const parsed = recordPaymentSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
    }

    const order = await prisma.order.findUnique({
      where: { code: parsed.data.orderCode },
      include: { appointments: { select: { barberId: true } } },
    })
    if (!order) throw new AppError(404, 'not_found', 'Pedido não encontrado.')

    if (user.role === 'BARBER') {
      const profile = await prisma.barberProfile.findUnique({
        where: { userId: user.id },
        select: { id: true },
      })
      const belongsToBarber =
        profile !== null &&
        order.appointments.length > 0 &&
        order.appointments.every((appointment) => appointment.barberId === profile.id)
      if (!belongsToBarber) {
        throw new AppError(403, 'forbidden', 'Acesso negado.')
      }
    }

    await settleOrderPayment({
      orderCode: order.code,
      provider: 'MANUAL',
      method: parsed.data.method,
      amountCents: order.totalCents,
    })

    revalidatePath('/admin/agenda')
    revalidatePath('/admin/financeiro')
    revalidatePath(`/pedido/${order.code}`)

    return { ok: true }
  } catch (error) {
    return failure(error)
  }
}

export async function refundPaymentAction(input: unknown): Promise<ActionResult> {
  try {
    const user = requireOwner(await getSessionUser())
    const parsed = refundPaymentSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
    }

    await refundOrderPayment({
      orderCode: parsed.data.orderCode,
      amountCents: parsed.data.amountCents,
      reason: parsed.data.reason,
      appointmentId: parsed.data.appointmentId ?? null,
      orderProductId: parsed.data.orderProductId ?? null,
    })

    await recordAudit({
      actorId: user.id,
      action: 'refund',
      entity: 'order',
      entityId: parsed.data.orderCode,
      detail: {
        amountCents: parsed.data.amountCents,
        reason: parsed.data.reason,
        appointmentId: parsed.data.appointmentId ?? null,
        orderProductId: parsed.data.orderProductId ?? null,
      },
    })

    revalidatePath('/admin/agenda')
    revalidatePath('/admin/financeiro')
    revalidatePath(`/pedido/${parsed.data.orderCode}`)

    return { ok: true }
  } catch (error) {
    return failure(error)
  }
}

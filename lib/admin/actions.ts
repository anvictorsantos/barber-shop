'use server'

import { revalidatePath } from 'next/cache'
import { after } from 'next/server'

import {
  blockCustomer,
  cancelAppointment,
  completeAppointment,
  createManualBooking,
  markAppointmentNoShow,
  unblockCustomer,
} from '@/lib/admin/appointments'
import { resolveAdminScope } from '@/lib/admin/context'
import { requireOwner, requireStaff } from '@/lib/auth/guards'
import { getSessionUser } from '@/lib/auth/session'
import type { ActionResult } from '@/lib/http/action-result'
import { AppError } from '@/lib/http/errors'
import { notifyAppointment, notifyNoShowBlock } from '@/lib/notifications/dispatch'
import { notifyOrderConfirmation } from '@/lib/notifications/orders'
import {
  appointmentActionSchema,
  customerBlockSchema,
  manualBookingSchema,
} from '@/lib/validation/admin'

export type ManualBookingActionResult = { ok: true; code: string } | { ok: false; error: string }

function failure<T>(error: unknown, message: string): T {
  if (error instanceof AppError) return { ok: false, error: error.message } as T
  console.error('[admin-action]', error instanceof Error ? error.name : 'unknown')
  return { ok: false, error: message } as T
}

function revalidateAgenda(): void {
  revalidatePath('/admin/agenda')
  revalidatePath('/admin')
  revalidatePath('/admin/financeiro')
  revalidatePath('/conta/agendamentos')
}

export async function createManualBookingAction(
  input: unknown,
): Promise<ManualBookingActionResult> {
  try {
    const user = requireStaff(await getSessionUser())
    const scope = await resolveAdminScope(user)
    const parsed = manualBookingSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
    }

    const booking = await createManualBooking(parsed.data, scope)
    after(() => notifyOrderConfirmation(booking.orderCode))
    revalidateAgenda()
    return { ok: true, code: booking.orderCode }
  } catch (error) {
    return failure<ManualBookingActionResult>(error, 'Não foi possível criar o agendamento.')
  }
}

export async function completeAppointmentAction(input: unknown): Promise<ActionResult> {
  try {
    const user = requireStaff(await getSessionUser())
    const scope = await resolveAdminScope(user)
    const parsed = appointmentActionSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
    }

    await completeAppointment(parsed.data.appointmentId, scope)
    revalidateAgenda()
    return { ok: true }
  } catch (error) {
    return failure<ActionResult>(error, 'Não foi possível concluir o agendamento.')
  }
}

export async function markNoShowAction(input: unknown): Promise<ActionResult> {
  try {
    const user = requireStaff(await getSessionUser())
    const scope = await resolveAdminScope(user)
    const parsed = appointmentActionSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
    }

    const result = await markAppointmentNoShow(parsed.data.appointmentId, scope)
    if (result.blocked && result.customerId) {
      after(() => notifyNoShowBlock(result.customerId!))
    }
    revalidatePath('/admin/agenda')
    revalidatePath('/admin/clientes')
    return { ok: true }
  } catch (error) {
    return failure<ActionResult>(error, 'Não foi possível marcar a falta.')
  }
}

export async function cancelAppointmentAction(input: unknown): Promise<ActionResult> {
  try {
    const user = requireStaff(await getSessionUser())
    const scope = await resolveAdminScope(user)
    const parsed = appointmentActionSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
    }

    await cancelAppointment(parsed.data.appointmentId, scope, parsed.data.reason)
    after(() => notifyAppointment('CANCELED', parsed.data.appointmentId))
    revalidateAgenda()
    return { ok: true }
  } catch (error) {
    return failure<ActionResult>(error, 'Não foi possível cancelar o agendamento.')
  }
}

export async function blockCustomerAction(input: unknown): Promise<ActionResult> {
  try {
    const user = requireOwner(await getSessionUser())
    const scope = await resolveAdminScope(user)
    const parsed = customerBlockSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
    }

    await blockCustomer(parsed.data.userId, scope)
    after(() => notifyNoShowBlock(parsed.data.userId))
    revalidatePath('/admin/clientes')
    revalidatePath(`/admin/clientes/${parsed.data.userId}`)
    return { ok: true }
  } catch (error) {
    return failure<ActionResult>(error, 'Não foi possível bloquear o cliente.')
  }
}

export async function unblockCustomerAction(input: unknown): Promise<ActionResult> {
  try {
    const user = requireOwner(await getSessionUser())
    const scope = await resolveAdminScope(user)
    const parsed = customerBlockSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
    }

    await unblockCustomer(parsed.data.userId, scope)
    revalidatePath('/admin/clientes')
    revalidatePath(`/admin/clientes/${parsed.data.userId}`)
    return { ok: true }
  } catch (error) {
    return failure<ActionResult>(error, 'Não foi possível desbloquear o cliente.')
  }
}

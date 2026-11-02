'use server'

import { revalidatePath } from 'next/cache'
import { after } from 'next/server'

import { requireUser } from '@/lib/auth/guards'
import { getSessionUser } from '@/lib/auth/session'
import {
  cancelCustomerAppointment,
  setFavorite,
  submitAppointmentReview,
  updateCustomerProfile,
  updateNotificationPreferences,
} from '@/lib/customer/appointments'
import type { ActionResult } from '@/lib/http/action-result'
import { AppError } from '@/lib/http/errors'
import { notifyAppointment } from '@/lib/notifications/dispatch'
import {
  cancelAppointmentSchema,
  customerProfileSchema,
  favoriteSchema,
  notificationPreferencesSchema,
  reviewSchema,
} from '@/lib/validation/customer'

export type FavoriteActionResult = { ok: true; saved: boolean } | { ok: false; error: string }

function failure<T>(error: unknown, message: string): T {
  if (error instanceof AppError) return { ok: false, error: error.message } as T
  console.error('[customer-action]', error instanceof Error ? error.name : 'unknown')
  return { ok: false, error: message } as T
}

export async function cancelMyAppointmentAction(input: unknown): Promise<ActionResult> {
  try {
    const user = requireUser(await getSessionUser())
    const parsed = cancelAppointmentSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
    }

    await cancelCustomerAppointment(parsed.data.appointmentId, user.id)
    after(() => notifyAppointment('CANCELED', parsed.data.appointmentId))

    revalidatePath('/conta/agendamentos')
    revalidatePath('/conta/historico')
    revalidatePath('/admin/agenda')
    return { ok: true }
  } catch (error) {
    return failure<ActionResult>(error, 'Não foi possível cancelar o agendamento.')
  }
}

export async function updateProfileAction(input: unknown): Promise<ActionResult> {
  try {
    const user = requireUser(await getSessionUser())
    const parsed = customerProfileSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
    }

    await updateCustomerProfile(user.id, parsed.data)
    revalidatePath('/conta/perfil')
    return { ok: true }
  } catch (error) {
    return failure<ActionResult>(error, 'Não foi possível salvar o perfil.')
  }
}

export async function updateNotificationPreferencesAction(input: unknown): Promise<ActionResult> {
  try {
    const user = requireUser(await getSessionUser())
    const parsed = notificationPreferencesSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
    }

    await updateNotificationPreferences(user.id, parsed.data)
    revalidatePath('/conta/perfil')
    return { ok: true }
  } catch (error) {
    return failure<ActionResult>(error, 'Não foi possível salvar as preferências.')
  }
}

export async function toggleFavoriteAction(input: unknown): Promise<FavoriteActionResult> {
  try {
    const user = requireUser(await getSessionUser())
    const parsed = favoriteSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
    }

    const saved = await setFavorite(user.id, parsed.data.kind, parsed.data.id)
    revalidatePath('/conta/favoritos')
    revalidatePath('/servicos')
    revalidatePath('/loja')
    revalidatePath('/servicos/[slug]', 'page')
    return { ok: true, saved }
  } catch (error) {
    return failure<FavoriteActionResult>(error, 'Não foi possível atualizar os favoritos.')
  }
}

export async function submitReviewAction(input: unknown): Promise<ActionResult> {
  try {
    const user = requireUser(await getSessionUser())
    const parsed = reviewSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
    }

    await submitAppointmentReview(parsed.data, user.id)
    revalidatePath('/conta/historico')
    return { ok: true }
  } catch (error) {
    return failure<ActionResult>(error, 'Não foi possível enviar a avaliação.')
  }
}

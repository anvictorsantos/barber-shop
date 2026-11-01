'use server'

import { revalidatePath } from 'next/cache'

import { requireOwner } from '@/lib/auth/guards'
import { getSessionUser } from '@/lib/auth/session'
import type { ActionResult } from '@/lib/http/action-result'
import { AppError } from '@/lib/http/errors'
import {
  createBarber,
  createTimeBlock,
  deleteTimeBlock,
  toggleBarber,
  updateBarber,
  updateHours,
  updateShop,
} from '@/lib/settings/admin'
import {
  createBarberSchema,
  deleteTimeBlockSchema,
  hoursSchema,
  shopSchema,
  timeBlockSchema,
  toggleBarberSchema,
  updateBarberSchema,
} from '@/lib/validation/settings'

async function ownerGuard(): Promise<void> {
  requireOwner(await getSessionUser())
}

function failure(error: unknown): ActionResult {
  if (error instanceof AppError) return { ok: false, error: error.message }
  console.error('[settings-action]', error instanceof Error ? error.name : 'unknown')
  return { ok: false, error: 'Não foi possível salvar. Tente novamente.' }
}

function revalidateSettings(): void {
  revalidatePath('/admin/configuracoes')
  revalidatePath('/admin')
  revalidatePath('/admin/agenda')
  revalidatePath('/')
  revalidatePath('/servicos')
}

export async function updateShopAction(input: unknown): Promise<ActionResult> {
  try {
    await ownerGuard()
    const parsed = shopSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
    }

    await updateShop(parsed.data)
    revalidateSettings()
    return { ok: true }
  } catch (error) {
    return failure(error)
  }
}

export async function updateHoursAction(input: unknown): Promise<ActionResult> {
  try {
    await ownerGuard()
    const parsed = hoursSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
    }

    await updateHours(parsed.data)
    revalidateSettings()
    return { ok: true }
  } catch (error) {
    return failure(error)
  }
}

export async function createBarberAction(input: unknown): Promise<ActionResult> {
  try {
    await ownerGuard()
    const parsed = createBarberSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
    }

    await createBarber(parsed.data)
    revalidateSettings()
    return { ok: true }
  } catch (error) {
    return failure(error)
  }
}

export async function updateBarberAction(input: unknown): Promise<ActionResult> {
  try {
    await ownerGuard()
    const parsed = updateBarberSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
    }

    await updateBarber(parsed.data)
    revalidateSettings()
    return { ok: true }
  } catch (error) {
    return failure(error)
  }
}

export async function toggleBarberAction(input: unknown): Promise<ActionResult> {
  try {
    await ownerGuard()
    const parsed = toggleBarberSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
    }

    await toggleBarber(parsed.data)
    revalidateSettings()
    return { ok: true }
  } catch (error) {
    return failure(error)
  }
}

export async function createTimeBlockAction(input: unknown): Promise<ActionResult> {
  try {
    await ownerGuard()
    const parsed = timeBlockSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
    }

    await createTimeBlock(parsed.data)
    revalidateSettings()
    return { ok: true }
  } catch (error) {
    return failure(error)
  }
}

export async function deleteTimeBlockAction(input: unknown): Promise<ActionResult> {
  try {
    await ownerGuard()
    const parsed = deleteTimeBlockSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
    }

    await deleteTimeBlock(parsed.data)
    revalidateSettings()
    return { ok: true }
  } catch (error) {
    return failure(error)
  }
}

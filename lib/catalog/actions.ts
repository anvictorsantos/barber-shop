'use server'

import { revalidatePath } from 'next/cache'

import { requireOwner } from '@/lib/auth/guards'
import { getSessionUser } from '@/lib/auth/session'
import {
  createProduct,
  createService,
  toggleProduct,
  toggleService,
  updateProduct,
  updateService,
} from '@/lib/catalog/admin'
import type { ActionResult } from '@/lib/http/action-result'
import { AppError } from '@/lib/http/errors'
import {
  productInputSchema,
  serviceInputSchema,
  toggleSchema,
  updateProductSchema,
  updateServiceSchema,
} from '@/lib/validation/catalog'

async function ownerGuard(): Promise<void> {
  requireOwner(await getSessionUser())
}

function failure(error: unknown): ActionResult {
  if (error instanceof AppError) return { ok: false, error: error.message }
  console.error('[catalog-action]', error instanceof Error ? error.name : 'unknown')
  return { ok: false, error: 'Não foi possível salvar. Tente novamente.' }
}

function revalidateCatalog(): void {
  revalidatePath('/admin/catalogo')
  revalidatePath('/servicos')
  revalidatePath('/servicos/[slug]', 'page')
  revalidatePath('/loja')
  revalidatePath('/')
}

export async function createServiceAction(input: unknown): Promise<ActionResult> {
  try {
    await ownerGuard()
    const parsed = serviceInputSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
    }

    await createService(parsed.data)
    revalidateCatalog()
    return { ok: true }
  } catch (error) {
    return failure(error)
  }
}

export async function updateServiceAction(input: unknown): Promise<ActionResult> {
  try {
    await ownerGuard()
    const parsed = updateServiceSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
    }

    await updateService(parsed.data)
    revalidateCatalog()
    return { ok: true }
  } catch (error) {
    return failure(error)
  }
}

export async function toggleServiceAction(input: unknown): Promise<ActionResult> {
  try {
    await ownerGuard()
    const parsed = toggleSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
    }

    await toggleService(parsed.data)
    revalidateCatalog()
    return { ok: true }
  } catch (error) {
    return failure(error)
  }
}

export async function createProductAction(input: unknown): Promise<ActionResult> {
  try {
    await ownerGuard()
    const parsed = productInputSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
    }

    await createProduct(parsed.data)
    revalidateCatalog()
    return { ok: true }
  } catch (error) {
    return failure(error)
  }
}

export async function updateProductAction(input: unknown): Promise<ActionResult> {
  try {
    await ownerGuard()
    const parsed = updateProductSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
    }

    await updateProduct(parsed.data)
    revalidateCatalog()
    return { ok: true }
  } catch (error) {
    return failure(error)
  }
}

export async function toggleProductAction(input: unknown): Promise<ActionResult> {
  try {
    await ownerGuard()
    const parsed = toggleSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
    }

    await toggleProduct(parsed.data)
    revalidateCatalog()
    return { ok: true }
  } catch (error) {
    return failure(error)
  }
}

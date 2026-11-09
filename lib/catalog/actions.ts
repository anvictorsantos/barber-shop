'use server'

import { revalidatePath } from 'next/cache'

import { recordAudit } from '@/lib/audit/log'
import { requireOwner } from '@/lib/auth/guards'
import { getSessionUser } from '@/lib/auth/session'
import {
  createProduct,
  createService,
  setServiceFeatured,
  toggleProduct,
  toggleService,
  updateProduct,
  updateService,
} from '@/lib/catalog/admin'
import type { ActionResult } from '@/lib/http/action-result'
import { AppError } from '@/lib/http/errors'
import {
  featureSchema,
  productInputSchema,
  serviceInputSchema,
  toggleSchema,
  updateProductSchema,
  updateServiceSchema,
} from '@/lib/validation/catalog'

async function ownerGuard(): Promise<string> {
  const user = requireOwner(await getSessionUser())
  return user.id
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
    const actorId = await ownerGuard()
    const parsed = updateServiceSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
    }

    await updateService(parsed.data)
    await recordAudit({
      actorId,
      action: 'service_update',
      entity: 'service',
      entityId: parsed.data.id,
      detail: parsed.data,
    })
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

export async function toggleServiceFeaturedAction(input: unknown): Promise<ActionResult> {
  try {
    const actorId = await ownerGuard()
    const parsed = featureSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
    }

    await setServiceFeatured(parsed.data)
    await recordAudit({
      actorId,
      action: 'service_update',
      entity: 'service',
      entityId: parsed.data.id,
      detail: { featured: parsed.data.featured },
    })
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
    const actorId = await ownerGuard()
    const parsed = updateProductSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
    }

    await updateProduct(parsed.data)
    await recordAudit({
      actorId,
      action: 'product_update',
      entity: 'product',
      entityId: parsed.data.id,
      detail: parsed.data,
    })
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

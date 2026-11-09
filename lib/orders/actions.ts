'use server'

import { headers } from 'next/headers'
import { after } from 'next/server'

import { sendAccountActivation } from '@/lib/auth/service'
import { getSessionUser } from '@/lib/auth/session'
import { AppError } from '@/lib/http/errors'
import { enforceRateLimit } from '@/lib/http/rate-limit'
import { clientIp } from '@/lib/http/request'
import { notifyOrderConfirmation } from '@/lib/notifications/orders'
import { createOrder, expirePendingOrder } from '@/lib/orders/create-order'
import { getOrderByCode } from '@/lib/orders/queries'
import type { OrderActor, CreateOrderActionResult } from '@/lib/orders/types'
import { createMercadoPagoPreference } from '@/lib/payments/mercado-pago'
import { createOrderSchema } from '@/lib/validation/orders'

function failure(error: unknown): CreateOrderActionResult {
  if (error instanceof AppError) return { ok: false, error: error.message }
  console.error('[create-order]', error instanceof Error ? error.name : 'unknown')
  return { ok: false, error: 'Não foi possível criar o pedido. Tente novamente.' }
}

export async function createOrderAction(input: unknown): Promise<CreateOrderActionResult> {
  try {
    const headerList = await headers()
    await enforceRateLimit(`checkout:${clientIp({ headers: headerList })}`, 10, 10 * 60 * 1000)

    const parsed = createOrderSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
    }

    const sessionUser = await getSessionUser()
    if (sessionUser?.bookingBlocked) {
      return {
        ok: false,
        error: 'Sua conta está bloqueada para agendamentos online. Fale com a barbearia.',
      }
    }

    const actor: OrderActor | null = sessionUser
      ? {
          id: sessionUser.id,
          name: sessionUser.name,
          email: sessionUser.email,
          phone: sessionUser.phone,
        }
      : null

    const order = await createOrder(parsed.data, actor)

    const queueActivation = () => {
      if (actor || !order.customerId) return
      const customerId = order.customerId
      const { email, phone } = parsed.data.customer
      after(() =>
        sendAccountActivation(customerId, {
          email: email || null,
          phone: phone || null,
        }).catch((error) => {
          console.warn(
            '[create-order] activation failed:',
            error instanceof Error ? error.name : 'unknown',
          )
        }),
      )
    }

    if (parsed.data.paymentMode === 'ONLINE') {
      try {
        const detailed = await getOrderByCode(order.code)
        if (!detailed) throw new AppError(500, 'order_missing', 'Pedido não encontrado.')
        const preference = await createMercadoPagoPreference(detailed)
        queueActivation()
        return {
          ok: true,
          code: order.code,
          publicToken: order.publicToken,
          initPoint: preference.initPoint,
        }
      } catch (error) {
        await expirePendingOrder(order.code).catch(() => undefined)
        return failure(error)
      }
    }

    after(() => notifyOrderConfirmation(order.code))
    queueActivation()

    return { ok: true, code: order.code, publicToken: order.publicToken }
  } catch (error) {
    return failure(error)
  }
}

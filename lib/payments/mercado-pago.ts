import { getServerEnv } from '@/lib/env'
import { AppError } from '@/lib/http/errors'
import type { getOrderByCode } from '@/lib/orders/queries'

type OrderWithLines = NonNullable<Awaited<ReturnType<typeof getOrderByCode>>>

const MP_ENDPOINT = 'https://api.mercadopago.com/checkout/preferences'

export async function createMercadoPagoPreference(order: OrderWithLines): Promise<{
  initPoint: string
}> {
  const env = getServerEnv()

  if (!env.MERCADO_PAGO_ENABLED || !env.MERCADO_PAGO_ACCESS_TOKEN) {
    throw new AppError(503, 'payment_unavailable', 'Pagamento online indisponível no momento.')
  }

  const items = [
    ...order.appointments.map((appointment) => ({
      title: appointment.service.name,
      description: `${appointment.barber.displayName} · ${appointment.startAt.toISOString()}`,
      quantity: 1,
      unit_price: appointment.priceCents / 100,
      currency_id: 'BRL',
    })),
    ...order.products.map((line) => ({
      title: line.product.name,
      quantity: line.quantity,
      unit_price: line.unitPriceCents / 100,
      currency_id: 'BRL',
    })),
  ]

  if (items.length === 0) {
    throw new AppError(400, 'empty_order', 'Pedido sem itens.')
  }

  const appUrl = env.APP_URL.replace(/\/+$/, '')
  const callback = `${appUrl}/pedido/${order.code}`

  const response = await fetch(MP_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.MERCADO_PAGO_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items,
      external_reference: order.code,
      back_urls: { success: callback, pending: callback, failure: callback },
      auto_return: 'approved',
      notification_url: `${appUrl}/api/webhooks/mercadopago`,
      statement_descriptor: 'BARBEARIA LUIZ',
      ...(order.customerEmail ? { payer: { email: order.customerEmail } } : {}),
    }),
    signal: AbortSignal.timeout(15_000),
  })

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 200)
    throw new AppError(
      502,
      'payment_error',
      `Mercado Pago recusou o pedido (${response.status}): ${detail}`,
    )
  }

  const body = (await response.json()) as { init_point?: unknown }
  if (typeof body.init_point !== 'string' || !body.init_point) {
    throw new AppError(502, 'payment_error', 'Mercado Pago não retornou o link de pagamento.')
  }

  return { initPoint: body.init_point }
}

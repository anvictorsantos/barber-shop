import { getServerEnv } from '@/lib/env'
import { AppError } from '@/lib/http/errors'
import type { getOrderByCode } from '@/lib/orders/queries'

import type { PaymentMethod } from '@prisma/client'

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

const MP_PAYMENT_ENDPOINT = 'https://api.mercadopago.com/v1/payments'

interface PaymentApiResponse {
  id?: unknown
  status?: unknown
  status_detail?: unknown
  external_reference?: unknown
  transaction_amount?: unknown
  payment_type_id?: unknown
  payment_method_id?: unknown
  date_approved?: unknown
}

export interface MercadoPagoPayment {
  id: string
  status: string
  statusDetail: string
  orderCode: string | null
  amountCents: number
  method: PaymentMethod
  paidAt: Date | null
}

export function mapMercadoPagoMethod(
  paymentTypeId: string | null,
  paymentMethodId: string | null,
): PaymentMethod {
  if (paymentMethodId === 'pix' || paymentTypeId === 'bank_transfer') return 'PIX'
  if (paymentTypeId === 'debit_card') return 'DEBIT_CARD'
  return 'CREDIT_CARD'
}

export async function fetchMercadoPagoPayment(paymentId: string): Promise<MercadoPagoPayment> {
  const env = getServerEnv()

  if (!env.MERCADO_PAGO_ENABLED || !env.MERCADO_PAGO_ACCESS_TOKEN) {
    throw new AppError(503, 'payment_unavailable', 'Pagamento online indisponível no momento.')
  }

  const response = await fetch(`${MP_PAYMENT_ENDPOINT}/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${env.MERCADO_PAGO_ACCESS_TOKEN}` },
    signal: AbortSignal.timeout(15_000),
  })

  if (!response.ok) {
    throw new AppError(
      502,
      'payment_error',
      `Mercado Pago recusou a consulta (${response.status}).`,
    )
  }

  const body = (await response.json()) as PaymentApiResponse
  const amount = typeof body.transaction_amount === 'number' ? body.transaction_amount : null

  if (body.id === undefined || typeof body.status !== 'string' || amount === null) {
    throw new AppError(502, 'payment_error', 'Mercado Pago retornou um pagamento inválido.')
  }

  return {
    id: String(body.id),
    status: body.status,
    statusDetail: typeof body.status_detail === 'string' ? body.status_detail : '',
    orderCode: typeof body.external_reference === 'string' ? body.external_reference : null,
    amountCents: Math.round(amount * 100),
    method: mapMercadoPagoMethod(
      typeof body.payment_type_id === 'string' ? body.payment_type_id : null,
      typeof body.payment_method_id === 'string' ? body.payment_method_id : null,
    ),
    paidAt: typeof body.date_approved === 'string' ? new Date(body.date_approved) : null,
  }
}

export async function createMercadoPagoRefund(
  providerPaymentId: string,
  amountCents: number,
): Promise<string> {
  const env = getServerEnv()

  if (!env.MERCADO_PAGO_ENABLED || !env.MERCADO_PAGO_ACCESS_TOKEN) {
    throw new AppError(503, 'payment_unavailable', 'Reembolso online indisponível no momento.')
  }

  const response = await fetch(
    `${MP_PAYMENT_ENDPOINT}/${encodeURIComponent(providerPaymentId)}/refunds`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.MERCADO_PAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `refund-${providerPaymentId}-${amountCents}`,
      },
      body: JSON.stringify({ amount: amountCents / 100 }),
      signal: AbortSignal.timeout(15_000),
    },
  )

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 200)
    throw new AppError(
      502,
      'refund_error',
      `Mercado Pago recusou o reembolso (${response.status}): ${detail}`,
    )
  }

  const body = (await response.json()) as { id?: unknown }
  if (body.id === undefined) {
    throw new AppError(502, 'refund_error', 'Mercado Pago não retornou o reembolso.')
  }

  return String(body.id)
}

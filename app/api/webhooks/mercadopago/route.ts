import { after } from 'next/server'

import { getServerEnv } from '@/lib/env'
import { AppError, errorResponse } from '@/lib/http/errors'
import { notifyOrderConfirmation } from '@/lib/notifications/orders'
import { fetchMercadoPagoPayment } from '@/lib/payments/mercado-pago'
import { settleOrderPayment } from '@/lib/payments/settle'
import { verifyMercadoPagoSignature } from '@/lib/payments/signature'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface NotificationBody {
  type?: unknown
  data?: { id?: unknown }
}

function notificationId(body: NotificationBody, url: URL): string | null {
  const fromBody = body.data?.id
  if (typeof fromBody === 'string' || typeof fromBody === 'number') return String(fromBody)
  return url.searchParams.get('data.id') ?? url.searchParams.get('id')
}

export async function POST(request: Request) {
  const env = getServerEnv()
  const url = new URL(request.url)

  let body: NotificationBody = {}
  try {
    body = (await request.json()) as NotificationBody
  } catch {
    body = {}
  }

  const topic = typeof body.type === 'string' ? body.type : url.searchParams.get('type')
  const paymentId = notificationId(body, url)

  if (topic !== 'payment' || !paymentId) {
    return Response.json({ ignored: true })
  }

  if (!env.MERCADO_PAGO_WEBHOOK_SECRET) {
    if (env.NODE_ENV === 'production') {
      console.error('[webhook:mercadopago] MERCADO_PAGO_WEBHOOK_SECRET is missing; rejecting.')
      return Response.json(
        { error: { code: 'webhook_unconfigured', message: 'Webhook indisponível.' } },
        { status: 503 },
      )
    }
  } else {
    const valid = verifyMercadoPagoSignature({
      xSignature: request.headers.get('x-signature'),
      xRequestId: request.headers.get('x-request-id'),
      dataId: paymentId,
      secret: env.MERCADO_PAGO_WEBHOOK_SECRET,
    })

    if (!valid) {
      return Response.json(
        { error: { code: 'invalid_signature', message: 'Assinatura inválida.' } },
        { status: 400 },
      )
    }
  }

  try {
    const payment = await fetchMercadoPagoPayment(paymentId)

    if (!payment.orderCode) {
      return Response.json({ ignored: true, reason: 'missing_reference' })
    }

    if (payment.status !== 'approved') {
      return Response.json({ ok: true, ignored: true, status: payment.status })
    }

    const result = await settleOrderPayment({
      orderCode: payment.orderCode,
      provider: 'MERCADO_PAGO',
      providerPaymentId: payment.id,
      method: payment.method,
      amountCents: payment.amountCents,
      paidAt: payment.paidAt,
    })

    if (!result.alreadySettled) {
      after(() => notifyOrderConfirmation(payment.orderCode!))
    }

    return Response.json({
      ok: true,
      orderCode: payment.orderCode,
      alreadySettled: result.alreadySettled,
    })
  } catch (error) {
    if (error instanceof AppError && error.status < 500) {
      // Retrying cannot fix a rejected notification, so acknowledge it and log for review.
      console.warn(`[webhook:mercadopago] ${error.code}: ${error.message}`)
      return Response.json({ ok: false, error: { code: error.code } })
    }

    return errorResponse(error)
  }
}

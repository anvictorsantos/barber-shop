import { CalendarCheck, Clock, Scissors, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PublicShell } from '@/components/layout/PublicShell'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusPill } from '@/components/ui/StatusPill'
import { getSessionUser } from '@/lib/auth/session'
import { formatBRL } from '@/lib/format/money'
import { getOrderByCode } from '@/lib/orders/queries'
import { orderStatusLabel, orderStatusTone } from '@/lib/orders/status'
import { formatBookingDateTime } from '@/lib/time/format'

import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Pedido — Barbearia do Luiz',
  robots: { index: false, follow: false },
}

export default async function OrderPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const order = await getOrderByCode(code)
  if (!order) notFound()

  const user = await getSessionUser()
  const settled = order.payments.some((payment) => payment.paidAt !== null)

  const title =
    order.status === 'PAID'
      ? 'Pagamento confirmado'
      : order.status === 'OPEN'
        ? 'Reserva recebida'
        : order.status === 'PENDING_PAYMENT'
          ? 'Pedido recebido'
          : orderStatusLabel(order.status)

  return (
    <PublicShell>
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-10 sm:px-6">
        <PageHeader
          title={title}
          description={`Guarde o código do pedido: #${order.code}`}
        />

        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-label uppercase tracking-wider text-muted">Status</span>
            <StatusPill tone={orderStatusTone(order.status)}>
              {orderStatusLabel(order.status)}
            </StatusPill>
          </div>

          {order.appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="flex flex-col gap-1 border-t border-border pt-3"
            >
              <p className="flex items-center gap-2 text-caption font-bold text-text">
                <Scissors
                  className="h-4 w-4 text-accent"
                  aria-hidden
                />
                {appointment.service.name}
              </p>
              <p className="text-caption text-muted">
                {appointment.barber.displayName} ·{' '}
                {formatBookingDateTime(appointment.startAt.toISOString())}
              </p>
              <p className="text-body font-bold text-accent">{formatBRL(appointment.priceCents)}</p>
            </div>
          ))}

          {order.products.map((line) => (
            <div
              key={line.id}
              className="flex flex-col gap-1 border-t border-border pt-3"
            >
              <p className="flex items-center gap-2 text-caption font-bold text-text">
                <ShoppingBag
                  className="h-4 w-4 text-accent"
                  aria-hidden
                />
                {line.product.name} × {line.quantity}
              </p>
              <p className="text-body font-bold text-accent">{formatBRL(line.lineTotalCents)}</p>
            </div>
          ))}

          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="text-caption uppercase tracking-wider text-muted">Total</span>
            <span className="text-metric font-extrabold text-accent">
              {formatBRL(order.totalCents)}
            </span>
          </div>

          <p className="flex items-center gap-2 text-caption text-muted">
            <Clock
              className="h-4 w-4 text-accent"
              aria-hidden
            />
            {order.paymentMode === 'ONLINE'
              ? 'Pagamento online pelo Mercado Pago.'
              : 'Pagamento na barbearia ao finalizar o atendimento.'}
          </p>
        </Card>

        <div className="flex flex-col gap-3">
          {settled && user ? (
            <a
              href={`/api/pedidos/${order.code}/recibo`}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-5 py-3 text-body font-bold text-text hover:border-accent"
            >
              Baixar recibo
            </a>
          ) : null}
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-body font-bold text-white hover:bg-primary-hover"
          >
            <CalendarCheck
              className="h-4 w-4"
              aria-hidden
            />
            Voltar ao início
          </Link>
          <Link
            href="/conta/agendamentos"
            className="text-center text-caption font-semibold text-muted hover:text-text"
          >
            Ver meus agendamentos
          </Link>
        </div>
      </div>
    </PublicShell>
  )
}

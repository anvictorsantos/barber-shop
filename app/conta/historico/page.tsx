import { History, Receipt, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { ReviewForm } from '@/components/customer/ReviewForm'
import { buttonClasses } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusPill, type StatusTone } from '@/components/ui/StatusPill'
import { getSessionUser } from '@/lib/auth/session'
import { getAppointmentHistory } from '@/lib/customer/queries'
import { formatBRL } from '@/lib/format/money'

import type { AppointmentStatus } from '@prisma/client'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Histórico — Barbearia do Luiz',
  robots: { index: false, follow: false },
}

const STATUS_LABELS: Record<AppointmentStatus, { label: string; tone: StatusTone }> = {
  PENDING: { label: 'Pendente', tone: 'warning' },
  CONFIRMED: { label: 'Confirmado', tone: 'success' },
  COMPLETED: { label: 'Concluído', tone: 'success' },
  NO_SHOW: { label: 'Falta', tone: 'danger' },
  CANCELED: { label: 'Cancelado', tone: 'neutral' },
  CANCELED_LATE: { label: 'Cancelado em cima da hora', tone: 'danger' },
}

export default async function CustomerHistoryPage() {
  const user = await getSessionUser()
  if (!user) redirect('/entrar?next=/conta/historico')
  if (user.role !== 'CUSTOMER') redirect('/admin')

  const history = await getAppointmentHistory(user.id)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Histórico"
        description="Visitas concluídas, avaliações e recibos."
      />

      {history.length === 0 ? (
        <Card>
          <EmptyState
            icon={History}
            title="Nenhuma visita ainda"
            description="Seu histórico aparece depois do primeiro atendimento."
          />
        </Card>
      ) : (
        history.map((appointment) => {
          const status = STATUS_LABELS[appointment.status]

          return (
            <Card
              key={appointment.id}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lead font-bold text-text">{appointment.serviceName}</h2>
                    <StatusPill tone={status.tone}>{status.label}</StatusPill>
                    {appointment.paid ? <StatusPill tone="success">Pago</StatusPill> : null}
                  </div>
                  <p className="text-caption text-muted">
                    {appointment.startLabel} · {appointment.barberName}
                  </p>
                  <p className="text-caption font-bold text-accent">
                    {formatBRL(appointment.priceCents)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {appointment.paid ? (
                    <a
                      href={`/api/pedidos/${appointment.orderCode}/recibo`}
                      className={buttonClasses({ variant: 'outline', size: 'sm' })}
                    >
                      <Receipt
                        className="h-4 w-4"
                        aria-hidden
                      />
                      Recibo
                    </a>
                  ) : null}
                  <Link
                    href={`/servicos/${appointment.serviceSlug}`}
                    className={buttonClasses({ variant: 'ghost', size: 'sm' })}
                  >
                    <RotateCcw
                      className="h-4 w-4"
                      aria-hidden
                    />
                    Agendar de novo
                  </Link>
                </div>
              </div>

              {appointment.status === 'COMPLETED' && !appointment.reviewed ? (
                <ReviewForm appointmentId={appointment.id} />
              ) : null}

              {appointment.status === 'COMPLETED' && appointment.reviewed ? (
                <p className="text-caption text-success">
                  Visita avaliada. Obrigado pelo feedback.
                </p>
              ) : null}
            </Card>
          )
        })
      )}
    </div>
  )
}

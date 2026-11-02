import { CalendarCheck, Receipt, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { CancelAppointmentButton } from '@/components/customer/CancelAppointmentButton'
import { buttonClasses } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusPill } from '@/components/ui/StatusPill'
import { getSessionUser } from '@/lib/auth/session'
import { getUpcomingAppointments } from '@/lib/customer/queries'
import { formatBRL } from '@/lib/format/money'

import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Meus Agendamentos — Barbearia do Luiz',
  robots: { index: false, follow: false },
}

export default async function CustomerAppointmentsPage() {
  const user = await getSessionUser()
  if (!user) redirect('/entrar?next=/conta/agendamentos')
  if (user.role !== 'CUSTOMER') redirect('/admin')

  const appointments = await getUpcomingAppointments(user.id)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Meus Agendamentos"
        description="Próximos horários, confirmação e reagendamento."
        actions={
          <Link
            href="/servicos"
            className={buttonClasses({ variant: 'gold', size: 'sm' })}
          >
            Novo agendamento
          </Link>
        }
      />

      {appointments.length === 0 ? (
        <Card>
          <EmptyState
            icon={CalendarCheck}
            title="Nenhum horário marcado"
            description="Escolha um serviço para agendar seu próximo corte."
            action={
              <Link
                href="/servicos"
                className={buttonClasses({ size: 'sm' })}
              >
                Ver serviços
              </Link>
            }
          />
        </Card>
      ) : (
        appointments.map((appointment) => (
          <Card
            key={appointment.id}
            className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lead font-bold text-text">{appointment.serviceName}</h2>
                <StatusPill tone={appointment.status === 'CONFIRMED' ? 'success' : 'warning'}>
                  {appointment.status === 'CONFIRMED' ? 'Confirmado' : 'Aguardando'}
                </StatusPill>
                {appointment.paid ? <StatusPill tone="success">Pago</StatusPill> : null}
              </div>
              <p className="text-caption text-muted">
                {appointment.startLabel}–{appointment.endLabel} · {appointment.barberName}
              </p>
              <p className="text-caption font-bold text-accent">
                {formatBRL(appointment.priceCents)}
              </p>
              <p className="text-micro text-subtle">Pedido #{appointment.orderCode}</p>
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
              <CancelAppointmentButton
                appointmentId={appointment.id}
                startAtIso={appointment.startAtIso}
              />
            </div>
          </Card>
        ))
      )}
    </div>
  )
}

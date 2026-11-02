import { ArrowLeft, CalendarDays, Mail, Phone } from 'lucide-react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { BlockCustomerButton } from '@/components/admin/clients/BlockCustomerButton'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusPill, type StatusTone } from '@/components/ui/StatusPill'
import { getClientDetail } from '@/lib/admin/clients'
import { resolveAdminScope } from '@/lib/admin/context'
import { getSessionUser } from '@/lib/auth/session'
import { formatBRL } from '@/lib/format/money'

import type { AppointmentStatus } from '@prisma/client'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Cliente — Barbearia do Luiz',
  robots: { index: false, follow: false },
}

const STATUS_LABELS: Record<AppointmentStatus, { label: string; tone: StatusTone }> = {
  PENDING: { label: 'Pendente', tone: 'warning' },
  CONFIRMED: { label: 'Confirmado', tone: 'success' },
  COMPLETED: { label: 'Concluído', tone: 'neutral' },
  NO_SHOW: { label: 'Falta', tone: 'danger' },
  CANCELED: { label: 'Cancelado', tone: 'neutral' },
  CANCELED_LATE: { label: 'Cancelado tarde', tone: 'danger' },
}

export default async function AdminClientPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) redirect('/entrar?next=/admin/clientes')
  if (user.role === 'CUSTOMER') redirect('/conta/agendamentos')

  const scope = await resolveAdminScope(user)
  const { id } = await params
  const client = await getClientDetail(scope, id)
  if (!client) notFound()

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/clientes"
        className="inline-flex w-fit items-center gap-2 text-caption font-semibold text-muted hover:text-text"
      >
        <ArrowLeft
          className="h-4 w-4"
          aria-hidden
        />
        Voltar para clientes
      </Link>

      <PageHeader
        title={client.name}
        description="Histórico e consumo do cliente."
        actions={
          <BlockCustomerButton
            userId={client.id}
            blocked={client.bookingBlocked}
            canManage={scope.role === 'OWNER'}
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="flex flex-col gap-1">
          <span className="text-caption text-muted">Visitas concluídas</span>
          <span className="text-metric font-extrabold text-text">{client.visits}</span>
        </Card>
        <Card className="flex flex-col gap-1">
          <span className="text-caption text-muted">Total gasto</span>
          <span className="text-metric font-extrabold text-accent">
            {formatBRL(client.spentCents)}
          </span>
        </Card>
        <Card className="flex flex-col gap-1">
          <span className="text-caption text-muted">Última visita</span>
          <span className="text-lead font-bold text-text">{client.lastVisitLabel ?? '—'}</span>
        </Card>
        <Card className="flex flex-col gap-2">
          <span className="text-caption text-muted">Situação</span>
          <span className="flex items-center gap-2">
            {client.bookingBlocked ? (
              <StatusPill tone="danger">Bloqueado</StatusPill>
            ) : (
              <StatusPill tone="success">Ativo</StatusPill>
            )}
            <span className="text-micro text-muted">
              {client.noShowCount} falta{client.noShowCount === 1 ? '' : 's'}
            </span>
          </span>
        </Card>
      </div>

      <Card className="flex flex-col gap-3">
        <h2 className="text-caption font-bold uppercase tracking-wider text-muted">Contato</h2>
        <div className="flex flex-wrap gap-6 text-caption text-text">
          <span className="flex items-center gap-2">
            <Mail
              className="h-4 w-4 text-accent"
              aria-hidden
            />
            {client.email ?? 'Sem e-mail'}
          </span>
          <span className="flex items-center gap-2">
            <Phone
              className="h-4 w-4 text-accent"
              aria-hidden
            />
            {client.phone ?? 'Sem telefone'}
          </span>
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-lead font-bold text-text">Histórico</h2>

        {client.appointments.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Sem atendimentos"
            description="Este cliente ainda não tem histórico."
          />
        ) : (
          <div className="flex flex-col">
            {client.appointments.map((appointment) => {
              const status = STATUS_LABELS[appointment.status]
              return (
                <div
                  key={appointment.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-t border-border py-3 first:border-0 first:pt-0"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="text-caption font-bold text-text">
                      {appointment.serviceName}
                    </span>
                    <span className="text-micro text-muted">
                      {appointment.startAtLabel} · {appointment.barberName} · #
                      {appointment.orderCode}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusPill tone={status.tone}>{status.label}</StatusPill>
                    <span className="text-caption font-bold text-text">
                      {formatBRL(appointment.priceCents)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

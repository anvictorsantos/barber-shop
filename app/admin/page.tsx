import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  CircleDollarSign,
  Clock,
  TrendingUp,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { RevenueChart } from '@/components/admin/dashboard/RevenueChart'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusPill } from '@/components/ui/StatusPill'
import { resolveAdminScope } from '@/lib/admin/context'
import { getDashboard, getRevenueSeries } from '@/lib/admin/dashboard'
import { getSessionUser } from '@/lib/auth/session'
import { formatBRL } from '@/lib/format/money'

import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Visão geral — Barbearia do Luiz',
  robots: { index: false, follow: false },
}

export default async function AdminDashboardPage() {
  const user = await getSessionUser()
  if (!user) redirect('/entrar?next=/admin')
  if (user.role === 'CUSTOMER') redirect('/conta/agendamentos')

  const scope = await resolveAdminScope(user)
  const [data, revenue] = await Promise.all([getDashboard(scope), getRevenueSeries(scope, 14)])

  const metrics = [
    {
      label: 'Agendamentos hoje',
      value: String(data.todayAppointments),
      hint: `${data.todayCompleted} concluídos · ${data.todayNoShow} faltas`,
      icon: CalendarCheck,
    },
    {
      label: 'Receita hoje',
      value: formatBRL(data.revenueTodayCents),
      hint: 'líquida de reembolsos',
      icon: CircleDollarSign,
    },
    {
      label: 'Últimos 7 dias',
      value: formatBRL(data.revenueWeekCents),
      hint: 'receita líquida',
      icon: TrendingUp,
    },
    {
      label: 'Aguardando pagamento',
      value: String(data.awaitingPayment),
      hint: 'pedidos em aberto',
      icon: Clock,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Visão geral"
        description={format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
        actions={
          <Link
            href="/admin/agenda"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-caption font-bold text-background hover:bg-accent-hover"
          >
            Abrir agenda
            <ArrowRight
              className="h-4 w-4"
              aria-hidden
            />
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Card
              key={metric.label}
              className="flex flex-col gap-2"
            >
              <span className="flex items-center gap-2 text-caption font-semibold text-muted">
                <Icon
                  className="h-4 w-4 text-accent"
                  aria-hidden
                />
                {metric.label}
              </span>
              <span className="text-metric font-extrabold text-text">{metric.value}</span>
              <span className="text-micro text-subtle">{metric.hint}</span>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lead font-bold text-text">Receita — 14 dias</h2>
            <Link
              href="/admin/financeiro"
              className="text-caption font-semibold text-accent hover:underline"
            >
              Ver financeiro
            </Link>
          </div>
          <RevenueChart data={revenue.series} />
        </Card>

        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lead font-bold text-text">Próximos horários</h2>
            <StatusPill tone="neutral">{String(data.nextAppointments.length)}</StatusPill>
          </div>

          {data.nextAppointments.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="Nada mais hoje"
              description="Sem próximos atendimentos para hoje."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {data.nextAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between gap-3 border-t border-border pt-3 first:border-0 first:pt-0"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-caption font-bold text-text">
                      {appointment.customerName}
                    </span>
                    <span className="truncate text-micro text-muted">
                      {appointment.serviceName} · {appointment.barberName}
                    </span>
                  </div>
                  <span className="text-caption font-bold text-accent">
                    {appointment.timeLabel}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {scope.role === 'OWNER' && data.blockedCustomers !== null ? (
        <Link
          href="/admin/clientes"
          className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface p-5 transition hover:border-accent"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-danger/10 text-danger">
              <AlertTriangle
                className="h-5 w-5"
                aria-hidden
              />
            </span>
            <span className="flex flex-col">
              <span className="text-caption font-bold text-text">Clientes bloqueados</span>
              <span className="text-micro text-muted">
                {data.blockedCustomers} cliente{data.blockedCustomers === 1 ? '' : 's'} sem
                agendamento online
              </span>
            </span>
          </span>
          <Users
            className="h-5 w-5 text-muted"
            aria-hidden
          />
        </Link>
      ) : null}
    </div>
  )
}

import { ArrowDownRight, ArrowUpRight, CircleDollarSign, Receipt, Scissors } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { RevenueChart } from '@/components/admin/dashboard/RevenueChart'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { resolveAdminScope } from '@/lib/admin/context'
import { getFinanceReport } from '@/lib/admin/dashboard'
import { getSessionUser } from '@/lib/auth/session'
import { PAYMENT_METHOD_LABELS } from '@/lib/finance/methods'
import { formatBRL } from '@/lib/format/money'
import { cn } from '@/lib/utils'

import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Financeiro — Barbearia do Luiz',
  robots: { index: false, follow: false },
}

const PERIODS = [
  { days: 7, label: '7 dias' },
  { days: 30, label: '30 dias' },
  { days: 90, label: '90 dias' },
] as const

export default async function AdminFinancePage({
  searchParams,
}: {
  searchParams: Promise<{ dias?: string | string[] }>
}) {
  const user = await getSessionUser()
  if (!user) redirect('/entrar?next=/admin/financeiro')
  if (user.role === 'CUSTOMER') redirect('/conta/agendamentos')

  const scope = await resolveAdminScope(user)
  const query = await searchParams
  const requested = Number(typeof query.dias === 'string' ? query.dias : '30')
  const days = PERIODS.some((period) => period.days === requested) ? requested : 30

  const report = await getFinanceReport(scope, days)

  const metrics = [
    {
      label: 'Receita líquida',
      value: formatBRL(report.summary.netCents),
      hint: `${report.summary.paymentsCount} pagamentos`,
      icon: CircleDollarSign,
    },
    {
      label: 'Bruto recebido',
      value: formatBRL(report.summary.grossCents),
      hint: 'antes de reembolsos',
      icon: ArrowUpRight,
    },
    {
      label: 'Reembolsos',
      value: formatBRL(report.summary.refundedCents),
      hint: 'no período',
      icon: ArrowDownRight,
    },
    {
      label: 'Ticket médio',
      value: formatBRL(report.ticketCents),
      hint: `${report.completedAppointments} atendimentos concluídos`,
      icon: Scissors,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Financeiro"
        description={
          scope.role === 'OWNER' ? 'Receita da barbearia no período.' : 'Sua receita no período.'
        }
        actions={
          <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
            {PERIODS.map((period) => (
              <Link
                key={period.days}
                href={`/admin/financeiro?dias=${period.days}`}
                className={cn(
                  'rounded-md px-3 py-1.5 text-caption font-bold transition',
                  days === period.days ? 'bg-accent text-background' : 'text-muted hover:text-text',
                )}
              >
                {period.label}
              </Link>
            ))}
          </div>
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
          <h2 className="text-lead font-bold text-text">Receita por dia</h2>
          <RevenueChart data={report.series} />
        </Card>

        <Card className="flex h-fit flex-col gap-4">
          <h2 className="text-lead font-bold text-text">Por forma de pagamento</h2>
          {report.methodTotals.length === 0 ? (
            <p className="text-caption text-subtle">Nenhum pagamento no período.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {report.methodTotals.map((item) => (
                <div
                  key={item.method}
                  className="flex items-center justify-between border-t border-border pt-3 first:border-0 first:pt-0"
                >
                  <span className="text-caption text-muted">
                    {PAYMENT_METHOD_LABELS[item.method]}
                  </span>
                  <span className="text-caption font-bold text-text">
                    {formatBRL(item.netCents)}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-caption text-muted">Faltas no período</span>
                <span className="text-caption font-bold text-danger">
                  {report.noShowAppointments}
                </span>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Card className="flex flex-col gap-4">
        <h2 className="flex items-center gap-2 text-lead font-bold text-text">
          <Receipt
            className="h-4 w-4 text-accent"
            aria-hidden
          />
          Pagamentos recentes
        </h2>

        {report.recentPayments.length === 0 ? (
          <p className="text-caption text-subtle">Nenhum pagamento registrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-border text-micro uppercase tracking-wider text-muted">
                  <th className="py-2 font-semibold">Pedido</th>
                  <th className="py-2 font-semibold">Cliente</th>
                  <th className="py-2 font-semibold">Profissional</th>
                  <th className="py-2 font-semibold">Forma</th>
                  <th className="py-2 text-right font-semibold">Valor</th>
                  <th className="py-2 text-right font-semibold">Quando</th>
                </tr>
              </thead>
              <tbody>
                {report.recentPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-border/60 text-caption text-text last:border-0"
                  >
                    <td className="py-3 font-bold text-accent">#{payment.orderCode}</td>
                    <td className="py-3">{payment.customerName}</td>
                    <td className="py-3 text-muted">{payment.barberName ?? '—'}</td>
                    <td className="py-3 text-muted">{PAYMENT_METHOD_LABELS[payment.method]}</td>
                    <td className="py-3 text-right font-bold">
                      {formatBRL(payment.amountCents - payment.refundedCents)}
                    </td>
                    <td className="py-3 text-right text-muted">{payment.paidAtLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

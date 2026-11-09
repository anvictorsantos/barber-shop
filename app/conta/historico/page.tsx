import { ptBR } from 'date-fns/locale'
import { formatInTimeZone } from 'date-fns-tz'
import { Download } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { HistoryFilters } from '@/components/customer/HistoryFilters'
import { ReviewForm } from '@/components/customer/ReviewForm'
import { Pagination } from '@/components/ui/Pagination'
import { getSessionUser } from '@/lib/auth/session'
import { BUSINESS_TIMEZONE } from '@/lib/availability/slots'
import { getAppointmentHistory, type AppointmentCard } from '@/lib/customer/queries'
import { formatBRL } from '@/lib/format/money'

import type { Metadata } from 'next'

const PAGE_SIZE = 10

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Histórico — Barbearia do Luiz',
  robots: { index: false, follow: false },
}

function monthLabel(value: string): string {
  return value.replace(/\p{Ll}/u, (char) => char.toUpperCase())
}

function dateLabel(iso: string): string {
  return monthLabel(
    formatInTimeZone(new Date(iso), BUSINESS_TIMEZONE, 'd MMM, yyyy', { locale: ptBR }),
  )
}

function stars(rating: number | null): string {
  if (!rating) return '—'
  return '★'.repeat(rating) + '☆'.repeat(Math.max(0, 5 - rating))
}

function mostFrequent(values: string[]): string | null {
  const counts = new Map<string, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  return (
    [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? null
  )
}

function firstParam(value: string | string[] | undefined): string {
  return typeof value === 'string' ? value : ''
}

export default async function CustomerHistoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const user = await getSessionUser()
  if (!user) redirect('/entrar?next=/conta/historico')
  if (user.role !== 'CUSTOMER') redirect('/admin')

  const params = await searchParams
  const from = firstParam(params.from)
  const to = firstParam(params.to)
  const serviceId = firstParam(params.service)
  const barberId = firstParam(params.barber)
  const query = firstParam(params.q).trim().toLowerCase()

  const history = await getAppointmentHistory(user.id)

  const services = [
    ...new Map(history.map((item) => [item.serviceId, item.serviceName])).entries(),
  ].map(([id, name]) => ({ id, name }))
  const barbers = [
    ...new Map(history.map((item) => [item.barberId, item.barberName])).entries(),
  ].map(([id, name]) => ({ id, name }))

  const dayOf = (iso: string) => formatInTimeZone(new Date(iso), BUSINESS_TIMEZONE, 'yyyy-MM-dd')

  const filtered = history.filter((item) => {
    if (from && dayOf(item.startAtIso) < from) return false
    if (to && dayOf(item.startAtIso) > to) return false
    if (serviceId && item.serviceId !== serviceId) return false
    if (barberId && item.barberId !== barberId) return false
    if (query) {
      const haystack = `${item.serviceName} ${item.barberName}`.toLowerCase()
      if (!haystack.includes(query)) return false
    }
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const requestedPage = Number(firstParam(params.page))
  const currentPage = Math.min(
    Math.max(1, Number.isFinite(requestedPage) ? requestedPage : 1),
    totalPages,
  )
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const pageHref = (page: number) => {
    const next = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      const item = firstParam(value)
      if (item) next.set(key, item)
    }
    if (page > 1) next.set('page', String(page))
    else next.delete('page')
    const qs = next.toString()
    return qs ? `/conta/historico?${qs}` : '/conta/historico'
  }

  const completed = filtered.filter((item) => item.status === 'COMPLETED')
  const totalSpent = completed.reduce((sum, item) => sum + item.priceCents, 0)
  const ratings = filtered
    .map((item) => item.reviewRating)
    .filter((rating): rating is number => rating !== null)
  const averageRating = ratings.length
    ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
    : null
  const frequentService = mostFrequent(completed.map((item) => item.serviceName))
  const favoriteBarber = mostFrequent(completed.map((item) => item.barberName))

  const now = new Date()
  const months = Array.from({ length: 8 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (7 - index), 1)
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: monthLabel(
        formatInTimeZone(date, BUSINESS_TIMEZONE, 'MMM', { locale: ptBR }).replace('.', ''),
      ),
      spentCents: 0,
    }
  })
  const monthIndex = new Map(months.map((month, index) => [month.key, index]))
  for (const item of completed) {
    const key = formatInTimeZone(new Date(item.startAtIso), BUSINESS_TIMEZONE, 'yyyy-MM')
    const index = monthIndex.get(key)
    if (index !== undefined) months[index]!.spentCents += item.priceCents
  }
  const maxSpent = Math.max(1, ...months.map((month) => month.spentCents))
  const monthlyAverage = Math.round(
    months.reduce((sum, month) => sum + month.spentCents, 0) / months.length,
  )

  const pendingReview = completed.find((item) => !item.reviewed) ?? null

  const rateClasses = 'text-[13px] leading-4'

  function ReceiptCell({ item }: { item: AppointmentCard }) {
    if (!item.paid) return <span className="w-[80px] shrink-0" />
    return (
      <span className="flex w-[80px] shrink-0 justify-end">
        <Link
          href={`/api/pedidos/${item.orderCode}/recibo`}
          aria-label={`Baixar recibo de ${item.serviceName}`}
          className="flex h-[26px] w-[26px] items-center justify-center rounded-xs bg-white/[0.03] text-primary transition hover:bg-white/[0.08]"
        >
          <Download
            aria-hidden
            strokeWidth={2}
            className="h-3.5 w-3.5"
          />
        </Link>
      </span>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-6 px-4 pb-24 pt-6 sm:px-6 lg:px-10 lg:py-10">
        <h1 className="sr-only">Histórico</h1>

        <HistoryFilters
          services={services}
          barbers={barbers}
        />

        <section className="flex flex-col rounded-xl border border-white/[0.07] bg-surface p-5">
          <div className="hidden items-center gap-0 rounded-xs bg-white/[0.012] px-2 py-3 md:flex">
            <span className="w-[110px] shrink-0 text-[13px] font-bold leading-4 text-muted">
              Data
            </span>
            <span className="min-w-0 flex-1 text-[13px] font-bold leading-4 text-muted">
              Serviço
            </span>
            <span className="w-[140px] shrink-0 text-[13px] font-bold leading-4 text-muted">
              Barbeiro
            </span>
            <span className="w-[90px] shrink-0 text-[13px] font-bold leading-4 text-muted">
              Duração
            </span>
            <span className="w-[90px] shrink-0 text-[13px] font-bold leading-4 text-muted">
              Preço
            </span>
            <span className="w-[100px] shrink-0 text-[13px] font-bold leading-4 text-muted">
              Avaliação
            </span>
            <span className="w-[80px] shrink-0 text-right text-[13px] font-bold leading-4 text-muted">
              Recibo
            </span>
          </div>

          {paginated.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-0 border-b border-white/[0.07] px-2 py-3.5 last:border-b-0"
            >
              <span className={`hidden w-[110px] shrink-0 text-white md:block ${rateClasses}`}>
                {dateLabel(item.startAtIso)}
              </span>

              <span className="flex min-w-0 flex-1 flex-col gap-1 md:block">
                <span className="block truncate text-[13px] font-bold leading-4 text-white">
                  {item.serviceName}
                </span>
                <span className="block text-caption leading-[15px] text-muted md:hidden">
                  {dateLabel(item.startAtIso)} · {item.barberName} · {item.serviceDurationMin} min
                </span>
              </span>

              <span className={`hidden w-[140px] shrink-0 text-muted md:block ${rateClasses}`}>
                {item.barberName}
              </span>
              <span className={`hidden w-[90px] shrink-0 text-muted md:block ${rateClasses}`}>
                {item.serviceDurationMin} min
              </span>
              <span className="w-[80px] shrink-0 text-right text-[13px] font-bold leading-4 text-accent md:w-[90px] md:text-left">
                {formatBRL(item.priceCents)}
              </span>
              <span className={`hidden w-[100px] shrink-0 text-accent md:block ${rateClasses}`}>
                {stars(item.reviewRating)}
              </span>

              <span className="hidden w-[80px] shrink-0 md:flex md:justify-end">
                <ReceiptCell item={item} />
              </span>
            </div>
          ))}

          {filtered.length === 0 ? (
            <p className="px-2 py-6 text-center text-caption text-muted">
              Nenhuma visita encontrada com esses filtros.
            </p>
          ) : null}
        </section>

        <Pagination
          page={currentPage}
          totalPages={totalPages}
          hrefFor={pageHref}
          label="Paginação do histórico"
        />

        {pendingReview ? (
          <section className="flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-surface p-5">
            <h2 className="text-[15px] font-bold leading-[18px] text-text">
              Avalie sua visita de {pendingReview.serviceName}
            </h2>
            <ReviewForm appointmentId={pendingReview.id} />
          </section>
        ) : null}
      </div>

      <aside className="w-full shrink-0 border-t border-white/[0.07] bg-shell p-6 lg:w-[360px] lg:border-l lg:border-t-0">
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-4 rounded-xl border border-white/[0.07] bg-surface p-5">
            <h2 className="text-sm font-extrabold leading-[17px] text-text">Resumo do período</h2>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-4 text-[13px] leading-4">
                <span className="text-muted">Visitas realizadas</span>
                <span className="font-bold text-text">{completed.length}</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-[13px] leading-4">
                <span className="text-muted">Total gasto</span>
                <span className="font-bold text-accent">{formatBRL(totalSpent)}</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-[13px] leading-4">
                <span className="shrink-0 text-muted">Serviço mais frequente</span>
                <span className="truncate text-right font-bold text-text">
                  {frequentService ?? '—'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 text-[13px] leading-4">
                <span className="text-muted">Barbeiro favorito</span>
                <span className="truncate text-right font-bold text-primary">
                  {favoriteBarber ?? '—'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 text-[13px] leading-4">
                <span className="text-muted">Avaliação média</span>
                <span className="font-bold text-accent">
                  {averageRating ? `${averageRating.toFixed(1).replace('.', ',')} ★` : '—'}
                </span>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-4 rounded-xl border border-white/[0.07] bg-surface p-5">
            <h2 className="text-sm font-extrabold leading-[17px] text-text">Gastos por mês</h2>

            <div className="flex h-[100px] items-end justify-between pb-0">
              {months.map((month) => (
                <div
                  key={month.key}
                  className="flex w-7 flex-col items-center justify-end gap-1.5"
                >
                  <span
                    className={
                      month.spentCents > 0
                        ? 'w-3.5 rounded-t-[3px] bg-primary'
                        : 'w-3.5 rounded-t-[3px] bg-white/[0.07]'
                    }
                    style={{
                      height: `${Math.max(2, Math.round((month.spentCents / maxSpent) * 70))}px`,
                    }}
                  />
                  <span className="text-[10px] leading-3 text-muted">{month.label}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-white/[0.07] pt-2 text-caption leading-[15px]">
              <span className="text-muted">Média mensal</span>
              <span className="font-bold text-accent">{formatBRL(monthlyAverage)}</span>
            </div>
          </section>
        </div>
      </aside>
    </div>
  )
}

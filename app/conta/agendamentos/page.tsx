import { ptBR } from 'date-fns/locale'
import { formatInTimeZone } from 'date-fns-tz'
import { Award, CalendarDays, Check, Clock, RefreshCw, Scissors, UserRound } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { CancelAppointmentButton } from '@/components/customer/CancelAppointmentButton'
import { getSessionUser } from '@/lib/auth/session'
import { BUSINESS_TIMEZONE } from '@/lib/availability/slots'
import {
  getAppointmentHistory,
  getFavorites,
  getUpcomingAppointments,
} from '@/lib/customer/queries'
import { formatBRL } from '@/lib/format/money'
import { getLoyaltySummary, STAMPS_FOR_CREDIT } from '@/lib/loyalty/service'
import { cn } from '@/lib/utils'

import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Meus Agendamentos — Barbearia do Luiz',
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

function dateTimeLabel(iso: string): string {
  return monthLabel(
    formatInTimeZone(new Date(iso), BUSINESS_TIMEZONE, "d MMM, yyyy 'às' HH:mm", {
      locale: ptBR,
    }),
  )
}

function stars(rating: number | null): string {
  if (!rating) return '—'
  return '★'.repeat(rating) + '☆'.repeat(Math.max(0, 5 - rating))
}

export default async function CustomerAppointmentsPage() {
  const user = await getSessionUser()
  if (!user) redirect('/entrar?next=/conta/agendamentos')
  if (user.role !== 'CUSTOMER') redirect('/admin')

  const [appointments, history, loyalty, favorites] = await Promise.all([
    getUpcomingAppointments(user.id),
    getAppointmentHistory(user.id),
    getLoyaltySummary(user.id),
    getFavorites(user.id),
  ])

  const next = appointments[0] ?? null
  const lastVisit = history[0] ?? null
  const favoriteBarber = favorites.barbers[0] ?? null

  const serviceCounts = new Map<string, number>()
  for (const item of history) {
    serviceCounts.set(item.serviceName, (serviceCounts.get(item.serviceName) ?? 0) + 1)
  }
  const topService =
    [...serviceCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ??
    null

  const stamps = Math.min(loyalty.stamps, STAMPS_FOR_CREDIT)
  const remaining = Math.max(0, STAMPS_FOR_CREDIT - stamps)
  const progress = (stamps / STAMPS_FOR_CREDIT) * 100
  const loyaltyCaption = loyalty.credit
    ? 'Você tem um serviço grátis disponível!'
    : remaining > 0
      ? `Faltam apenas ${remaining} ${remaining === 1 ? 'visita' : 'visitas'} para seu corte de barba gratuito!`
      : 'Seu corte de barba gratuito está disponível!'

  return (
    <div className="px-4 pb-24 pt-6 sm:px-6 lg:px-10 lg:py-10">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <h1 className="sr-only">Meus Agendamentos</h1>

        <div className="flex min-w-0 flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/servicos"
              className="flex items-center gap-3 rounded-xl bg-primary p-5 transition hover:bg-primary-hover"
            >
              <Scissors
                aria-hidden
                strokeWidth={2}
                className="h-6 w-6 shrink-0 text-white"
              />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-base font-extrabold leading-[19px] text-white">
                  Agendar Novo Horário
                </span>
                <span className="text-caption leading-[15px] text-[#E5E7EB]/80">
                  Garanta sua vaga hoje mesmo
                </span>
              </span>
            </Link>

            <Link
              href={lastVisit ? `/servicos/${lastVisit.serviceSlug}` : '/servicos'}
              className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-surface p-5 transition hover:border-white/20"
            >
              <RefreshCw
                aria-hidden
                strokeWidth={2}
                className="h-6 w-6 shrink-0 text-accent"
              />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-base font-extrabold leading-[19px] text-text">
                  Repetir Último Serviço
                </span>
                <span className="truncate text-caption leading-[15px] text-muted">
                  {lastVisit
                    ? `${lastVisit.serviceName} com ${lastVisit.barberName}`
                    : 'Escolha um serviço para começar'}
                </span>
              </span>
            </Link>
          </div>

          <section className="flex flex-col gap-5 rounded-[20px] border-[1.5px] border-primary bg-surface p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CalendarDays
                  aria-hidden
                  strokeWidth={2}
                  className="h-[18px] w-[18px] text-primary"
                />
                <span className="text-sm uppercase leading-[17px] font-extrabold tracking-[1px] text-accent">
                  Seu próximo agendamento
                </span>
              </div>
              {next ? (
                <span
                  className={cn(
                    'inline-flex items-center rounded-xs px-3 py-1 text-label font-extrabold',
                    next.status === 'CONFIRMED'
                      ? 'bg-success/15 text-success'
                      : 'bg-accent/15 text-accent',
                  )}
                >
                  {next.status === 'CONFIRMED' ? 'CONFIRMADO' : 'AGUARDANDO'}
                </span>
              ) : null}
            </div>

            {next ? (
              <>
                <div className="flex items-center gap-6">
                  <div className="relative h-[90px] w-[120px] shrink-0 overflow-hidden rounded-lg bg-surface-input">
                    {next.serviceImageUrl ? (
                      <Image
                        src={next.serviceImageUrl}
                        alt={next.serviceName}
                        fill
                        sizes="120px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center">
                        <Scissors
                          aria-hidden
                          className="h-6 w-6 text-muted"
                        />
                      </span>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <span className="text-xl font-extrabold leading-6 text-text">
                      {next.serviceName}
                    </span>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                      <span className="flex items-center gap-2">
                        <span className="relative flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-input">
                          {next.barberAvatarUrl ? (
                            <Image
                              src={next.barberAvatarUrl}
                              alt={next.barberName}
                              fill
                              sizes="24px"
                              className="object-cover"
                            />
                          ) : (
                            <UserRound
                              aria-hidden
                              className="h-3.5 w-3.5 text-muted"
                            />
                          )}
                        </span>
                        <span className="text-[13px] leading-4 text-muted">
                          Profissional: {next.barberName}
                        </span>
                      </span>
                      <span className="flex items-center gap-2">
                        <Clock
                          aria-hidden
                          strokeWidth={2}
                          className="h-4 w-4 text-primary"
                        />
                        <span className="text-[13px] leading-4 text-muted">
                          Data: {dateTimeLabel(next.startAtIso)}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="h-px w-full bg-white/[0.07]" />

                <div className="flex flex-wrap items-center justify-end gap-3">
                  <CancelAppointmentButton
                    appointmentId={next.id}
                    startAtIso={next.startAtIso}
                  />
                  <Link
                    href={`/agendar/${next.serviceId}/horario?barberId=${next.barberId}`}
                    className="inline-flex h-9 items-center rounded-sm bg-primary px-5 text-[13px] font-bold leading-4 text-white transition hover:bg-primary-hover"
                  >
                    Reagendar
                  </Link>
                </div>
              </>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-muted">
                  Nenhum horário marcado. Que tal garantir o próximo?
                </p>
                <Link
                  href="/servicos"
                  className="inline-flex h-9 items-center rounded-sm bg-primary px-5 text-[13px] font-bold leading-4 text-white transition hover:bg-primary-hover"
                >
                  Agendar agora
                </Link>
              </div>
            )}
          </section>

          <section className="flex flex-col gap-5 rounded-xl border border-white/[0.07] bg-surface p-6">
            <h2 className="text-base font-extrabold leading-[19px] text-text">
              Histórico de Serviços Realizados
            </h2>

            <div className="flex flex-col">
              <div className="hidden items-center gap-0 rounded-xs bg-white/[0.012] px-2 py-3 text-caption font-bold leading-[15px] text-muted md:flex">
                <span className="w-[120px] shrink-0">Data</span>
                <span className="min-w-0 flex-1">Serviço</span>
                <span className="w-[140px] shrink-0">Barbeiro</span>
                <span className="w-[100px] shrink-0">Preço</span>
                <span className="w-[120px] shrink-0">Avaliação</span>
              </div>

              {history.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-0 border-b border-white/[0.04] px-2 py-3.5 last:border-b-0 md:border-0 md:py-3.5"
                >
                  <span className="hidden w-[120px] shrink-0 text-[13px] leading-4 text-text md:block">
                    {dateLabel(item.startAtIso)}
                  </span>

                  <span className="flex min-w-0 flex-1 flex-col gap-1 md:block">
                    <span className="block truncate text-[13px] font-bold leading-4 text-text">
                      {item.serviceName}
                    </span>
                    <span className="block text-caption leading-[15px] text-muted md:hidden">
                      {dateLabel(item.startAtIso)} · {item.barberName}
                    </span>
                  </span>

                  <span className="hidden w-[140px] shrink-0 text-[13px] leading-4 text-text-secondary md:block">
                    {item.barberName}
                  </span>
                  <span className="w-[80px] shrink-0 text-right text-[13px] font-bold leading-4 text-accent md:w-[100px] md:text-left">
                    {formatBRL(item.priceCents)}
                  </span>
                  <span className="hidden w-[120px] shrink-0 text-[13px] leading-4 text-accent md:block">
                    {stars(item.reviewRating)}
                  </span>
                </div>
              ))}

              {history.length === 0 ? (
                <p className="px-2 py-4 text-caption text-muted">Nenhuma visita concluída ainda.</p>
              ) : null}
            </div>
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <section className="flex flex-col gap-5 rounded-[20px] bg-loyalty p-6 shadow-[0_10px_20px_rgba(0,0,0,0.25)]">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[13px] font-extrabold uppercase leading-4 tracking-[1px] text-white">
                Cartão Fidelidade
              </span>
              <Award
                aria-hidden
                strokeWidth={2}
                className="h-5 w-5 text-accent"
              />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[28px] font-black leading-[34px] text-white">
                {stamps} / {STAMPS_FOR_CREDIT}
              </span>
              <span className="text-[13px] leading-4 text-[#E5E7EB]/90">
                Visitas registradas para resgatar prêmio
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-label leading-[13px] text-[#E5E7EB]/80">{loyaltyCaption}</span>
            </div>
          </section>

          <section className="flex flex-col gap-4 rounded-xl border border-white/[0.07] bg-surface p-6">
            <h2 className="text-sm font-extrabold leading-[17px] tracking-[0.5px] text-text">
              Selo de Visitas
            </h2>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: STAMPS_FOR_CREDIT }, (_, index) => {
                const done = index < stamps
                return (
                  <span
                    key={index}
                    className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-full border-[1.5px] text-caption font-bold',
                      done
                        ? 'border-primary bg-primary/15 text-primary'
                        : 'border-white/[0.07] bg-background text-inactive',
                    )}
                  >
                    {done ? (
                      <Check
                        aria-hidden
                        strokeWidth={2.5}
                        className="h-3.5 w-3.5"
                      />
                    ) : (
                      index + 1
                    )}
                  </span>
                )
              })}
            </div>
          </section>

          <section className="flex flex-col gap-4 rounded-xl border border-white/[0.07] bg-surface p-6">
            <h2 className="text-[15px] font-bold leading-[18px] text-text">Suas Preferências</h2>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-input">
                  {favoriteBarber?.avatarUrl ? (
                    <Image
                      src={favoriteBarber.avatarUrl}
                      alt={favoriteBarber.displayName}
                      fill
                      sizes="36px"
                      className="object-cover"
                    />
                  ) : (
                    <UserRound
                      aria-hidden
                      className="h-4 w-4 text-muted"
                    />
                  )}
                </span>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-caption leading-[15px] text-muted">Barbeiro Favorito</span>
                  <span className="truncate text-sm font-bold leading-[17px] text-text">
                    {favoriteBarber?.displayName ?? 'Ainda não escolhido'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-accent/[0.08]">
                  <Scissors
                    aria-hidden
                    strokeWidth={2}
                    className="h-[18px] w-[18px] text-accent"
                  />
                </span>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-caption leading-[15px] text-muted">
                    Serviço mais solicitado
                  </span>
                  <span className="truncate text-sm font-bold leading-[17px] text-text">
                    {topService ?? 'Nenhuma visita ainda'}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

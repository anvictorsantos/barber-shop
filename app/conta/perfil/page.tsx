import { ptBR } from 'date-fns/locale'
import { formatInTimeZone } from 'date-fns-tz'
import { ArrowLeft, Camera, Clock, Scissors, UserRound } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { ActiveSessions } from '@/components/auth/ActiveSessions'
import { AddressForm } from '@/components/customer/AddressForm'
import { NotificationPreferencesForm } from '@/components/customer/NotificationPreferencesForm'
import { ProfileForm } from '@/components/customer/ProfileForm'
import { getSessionUser } from '@/lib/auth/session'
import { BUSINESS_TIMEZONE } from '@/lib/availability/slots'
import { getAppointmentHistory, getCustomerProfile, getFavorites } from '@/lib/customer/queries'
import { formatBRL } from '@/lib/format/money'
import { getLoyaltySummary } from '@/lib/loyalty/service'

import type { LoyaltyTier } from '@prisma/client'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Perfil — Barbearia do Luiz',
  robots: { index: false, follow: false },
}

const TIER_LABEL: Record<LoyaltyTier, string> = {
  BRONZE: 'Bronze',
  GOLD: 'Gold',
  PLATINUM: 'Platinum',
}

const NEXT_TIER_VISITS: Record<LoyaltyTier, number | null> = {
  BRONZE: 10,
  GOLD: 20,
  PLATINUM: null,
}

const WEEKDAYS = ['Domingos', 'Segundas', 'Terças', 'Quartas', 'Quintas', 'Sextas', 'Sábados']

function monthLabel(value: string): string {
  return value.replace(/\p{Ll}/u, (char) => char.toUpperCase())
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function mostFrequent(values: string[]): string | null {
  const counts = new Map<string, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  return (
    [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? null
  )
}

function periodBucket(iso: string): string {
  const hour = Number(formatInTimeZone(new Date(iso), BUSINESS_TIMEZONE, 'H'))
  if (hour < 12) return 'Manhãs (9h-12h)'
  if (hour < 18) return 'Tardes (14h-17h)'
  return 'Noites (18h-21h)'
}

function weekdayName(iso: string): string {
  const isoDay = Number(formatInTimeZone(new Date(iso), BUSINESS_TIMEZONE, 'i'))
  return WEEKDAYS[isoDay === 7 ? 0 : isoDay] ?? ''
}

function membershipDuration(from: Date, to: Date): string {
  let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
  if (to.getDate() < from.getDate()) months -= 1
  if (months < 1) return 'menos de um mês'
  const years = Math.floor(months / 12)
  const rest = months % 12
  const parts: string[] = []
  if (years) parts.push(`${years} ano${years > 1 ? 's' : ''}`)
  if (rest) parts.push(`${rest} ${rest > 1 ? 'meses' : 'mês'}`)
  return parts.join(' e ')
}

export default async function CustomerProfilePage() {
  const user = await getSessionUser()
  if (!user) redirect('/entrar?next=/conta/perfil')
  if (user.role !== 'CUSTOMER') redirect('/admin')

  const [profile, loyalty, history, favorites] = await Promise.all([
    getCustomerProfile(user.id),
    getLoyaltySummary(user.id),
    getAppointmentHistory(user.id),
    getFavorites(user.id),
  ])

  if (!profile) redirect('/entrar')

  const completed = history.filter((item) => item.status === 'COMPLETED')
  const totalSpent = completed.reduce((sum, item) => sum + item.priceCents, 0)

  const now = new Date()
  const memberSince = monthLabel(
    formatInTimeZone(profile.createdAt, BUSINESS_TIMEZONE, "MMMM 'de' yyyy", { locale: ptBR }),
  ).replace(' de ', ' ')
  const memberFor = membershipDuration(profile.createdAt, now)

  const tier = loyalty.tier
  const nextTierVisits = NEXT_TIER_VISITS[tier]
  const progress =
    tier === 'PLATINUM' ? 1 : Math.min(1, loyalty.lifetimeVisits / (nextTierVisits ?? 10))
  const nextTierText =
    tier === 'PLATINUM'
      ? 'Nível máximo atingido'
      : `${Math.max(0, (nextTierVisits ?? 10) - loyalty.lifetimeVisits)} visitas para nível ${tier === 'GOLD' ? 'Platinum' : 'Gold'}`

  const favoriteBarberProfile = favorites.barbers[0] ?? null
  const favoriteBarber =
    favoriteBarberProfile?.displayName ?? mostFrequent(completed.map((item) => item.barberName))
  const favoriteService =
    favorites.services[0]?.name ?? mostFrequent(completed.map((item) => item.serviceName))
  const bucket = mostFrequent(completed.map((item) => periodBucket(item.startAtIso)))
  const weekday = mostFrequent(completed.map((item) => weekdayName(item.startAtIso)))
  const preferredPeriod = bucket && weekday ? `${bucket} • ${weekday}` : null

  const personal = {
    name: profile.name,
    phone: profile.phone ?? '',
    cpf: profile.cpf ?? '',
    birthDate: profile.birthDate ? profile.birthDate.toISOString().slice(0, 10) : '',
  }

  return (
    <div className="flex flex-col gap-6 px-4 pb-24 pt-6 sm:px-6 lg:flex-row lg:items-start lg:px-10 lg:py-10">
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <h1 className="sr-only">Perfil</h1>

        <section className="flex items-center gap-6 rounded-[20px] border border-white/[0.07] bg-surface p-6">
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary/15 text-2xl font-black text-accent">
            {initials(profile.name)}
            <span
              aria-hidden
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary"
            >
              <Camera
                strokeWidth={2}
                className="h-4 w-4 text-white"
              />
            </span>
          </div>

          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-black leading-[29px] text-text">{profile.name}</h2>
              <span className="rounded-xl border border-primary bg-primary/10 px-2.5 py-1 text-label font-extrabold uppercase leading-[13px] text-primary">
                {TIER_LABEL[tier]} Member
              </span>
            </div>
            <p className="text-sm leading-[17px] text-muted">
              Membro desde {memberSince} • ID: #{profile.id.slice(-5).toUpperCase()}
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-6 rounded-[20px] border border-white/[0.07] bg-surface p-8">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-extrabold leading-[22px] tracking-[0.5px] text-text">
              Dados Pessoais
            </h2>
            <p className="text-[13px] leading-4 text-muted">
              Mantenha suas informações de contato atualizadas para agendamentos
            </p>
          </div>

          <ProfileForm
            initial={{
              ...personal,
              addressLine: profile.addressLine ?? '',
              city: profile.city ?? '',
              state: profile.state ?? '',
              postalCode: profile.postalCode ?? '',
            }}
            email={profile.email}
          />
        </section>

        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="min-w-0 flex-1">
            <AddressForm
              initial={{
                addressLine: profile.addressLine ?? '',
                city: profile.city ?? '',
                state: profile.state ?? '',
                postalCode: profile.postalCode ?? '',
              }}
              personal={personal}
            />
          </div>
        </div>

        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 text-caption font-semibold text-primary transition hover:text-primary-hover"
        >
          <ArrowLeft
            aria-hidden
            className="h-4 w-4"
          />
          Voltar para o site
        </Link>
      </div>

      <div className="flex w-full shrink-0 flex-col gap-6 lg:w-[380px]">
        <section className="flex flex-col gap-5 rounded-[20px] border border-white/[0.07] bg-surface p-6">
          <h2 className="text-base font-extrabold leading-[19px] text-text">
            Estatísticas de Visitas
          </h2>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4 text-[13px] leading-4">
              <span className="text-muted">Total de Visitas</span>
              <span className="text-sm font-bold leading-[17px] text-text">
                {loyalty.lifetimeVisits} Visitas
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 text-[13px] leading-4">
              <span className="text-muted">Total Gasto</span>
              <span className="text-sm font-bold leading-[17px] text-accent">
                {formatBRL(totalSpent)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 text-[13px] leading-4">
              <span className="text-muted">Membro há</span>
              <span className="text-sm font-bold leading-[17px] text-text">{memberFor}</span>
            </div>
          </div>

          <div className="h-px w-full bg-white/[0.07]" />

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-caption font-bold leading-[15px] text-primary">
                NÍVEL {TIER_LABEL[tier].toUpperCase()}
              </span>
              <span className="text-label leading-[13px] text-muted">{nextTierText}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-subtle">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-[20px] border border-white/[0.07] bg-surface p-6">
          <h2 className="text-base font-extrabold leading-[19px] text-text">Minhas Preferências</h2>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-input">
                {favoriteBarberProfile?.avatarUrl ? (
                  <Image
                    src={favoriteBarberProfile.avatarUrl}
                    alt={favoriteBarberProfile.displayName}
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
                <span className="text-caption leading-[15px] text-muted">Barbeiro Preferido</span>
                <span className="truncate text-sm font-bold leading-[17px] text-text">
                  {favoriteBarber ?? 'Ainda não escolhido'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Scissors
                  aria-hidden
                  strokeWidth={2}
                  className="h-[18px] w-[18px] text-primary"
                />
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-caption leading-[15px] text-muted">Serviço Favorito</span>
                <span className="truncate text-sm font-bold leading-[17px] text-text">
                  {favoriteService ?? 'Nenhuma visita ainda'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Clock
                  aria-hidden
                  strokeWidth={2}
                  className="h-[18px] w-[18px] text-primary"
                />
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-caption leading-[15px] text-muted">
                  Período e Dia Preferido
                </span>
                <span className="truncate text-sm font-bold leading-[17px] text-text">
                  {preferredPeriod ?? 'Sem histórico'}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-[20px] border border-white/[0.07] bg-surface p-6">
          <h2 className="text-base font-extrabold leading-[19px] text-text">
            Preferências de Alerta
          </h2>
          <NotificationPreferencesForm
            initial={{ email: profile.notifyEmail, whatsapp: profile.notifyWhatsapp }}
            hasEmail={Boolean(profile.email)}
            hasWhatsapp={Boolean(profile.phone)}
          />
        </section>

        <ActiveSessions />
      </div>
    </div>
  )
}

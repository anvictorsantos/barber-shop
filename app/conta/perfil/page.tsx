import { formatInTimeZone } from 'date-fns-tz'
import { Award, BadgeCheck, Gift, Mail, Stamp } from 'lucide-react'
import { redirect } from 'next/navigation'

import { NotificationPreferencesForm } from '@/components/customer/NotificationPreferencesForm'
import { ProfileForm } from '@/components/customer/ProfileForm'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusPill } from '@/components/ui/StatusPill'
import { getSessionUser } from '@/lib/auth/session'
import { BUSINESS_TIMEZONE } from '@/lib/availability/slots'
import { getCustomerProfile } from '@/lib/customer/queries'
import { getLoyaltySummary, STAMPS_FOR_CREDIT } from '@/lib/loyalty/service'

import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Perfil — Barbearia do Luiz',
  robots: { index: false, follow: false },
}

const TIER_LABELS = {
  BRONZE: 'Bronze',
  GOLD: 'Ouro',
  PLATINUM: 'Platina',
} as const

export default async function CustomerProfilePage() {
  const user = await getSessionUser()
  if (!user) redirect('/entrar?next=/conta/perfil')
  if (user.role !== 'CUSTOMER') redirect('/admin')

  const [profile, loyalty] = await Promise.all([
    getCustomerProfile(user.id),
    getLoyaltySummary(user.id),
  ])

  if (!profile) redirect('/entrar')

  const stampSlots = Array.from({ length: STAMPS_FOR_CREDIT }, (_, index) => index < loyalty.stamps)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Perfil"
        description="Dados de contato, fidelidade e preferências."
      />

      <Card className="flex flex-col gap-3">
        <h2 className="text-caption font-bold uppercase tracking-wider text-muted">
          Programa de fidelidade
        </h2>

        <div className="flex flex-wrap items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Award
              className="h-6 w-6"
              aria-hidden
            />
          </span>
          <div className="flex flex-col">
            <span className="text-lead font-bold text-text">Nível {TIER_LABELS[loyalty.tier]}</span>
            <span className="text-caption text-muted">
              {loyalty.lifetimeVisits} visita{loyalty.lifetimeVisits === 1 ? '' : 's'} ·{' '}
              {loyalty.stamps}/{STAMPS_FOR_CREDIT} selos
            </span>
          </div>
          {loyalty.credit ? (
            <StatusPill tone="success">
              {`Crédito grátis até ${formatInTimeZone(loyalty.credit.expiresAt, BUSINESS_TIMEZONE, 'dd/MM/yyyy')}`}
            </StatusPill>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {stampSlots.map((filled, index) => (
            <span
              key={index}
              className={
                filled
                  ? 'flex h-8 w-8 items-center justify-center rounded-md bg-accent text-background'
                  : 'flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface-input text-muted'
              }
            >
              <Stamp
                className="h-4 w-4"
                aria-hidden
              />
            </span>
          ))}
        </div>

        <p className="flex items-center gap-2 text-caption text-muted">
          <Gift
            className="h-4 w-4 text-accent"
            aria-hidden
          />
          A cada 15 visitas concluídas você ganha um serviço grátis, válido por 90 dias.
        </p>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-lead font-bold text-text">Dados pessoais</h2>

        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface-input px-4 py-3">
          <Mail
            className="h-4 w-4 text-accent"
            aria-hidden
          />
          <span className="text-caption text-text">{profile.email ?? 'Sem e-mail'}</span>
          {profile.emailVerifiedAt ? (
            <StatusPill tone="success">Verificado</StatusPill>
          ) : profile.email ? (
            <StatusPill tone="warning">Não verificado</StatusPill>
          ) : null}
          <span className="flex items-center gap-1 text-micro text-subtle">
            <BadgeCheck
              className="h-3.5 w-3.5"
              aria-hidden
            />
            E-mail não pode ser alterado aqui.
          </span>
        </div>

        <ProfileForm
          initial={{
            name: profile.name,
            phone: profile.phone ?? '',
            cpf: profile.cpf ?? '',
            birthDate: profile.birthDate ? profile.birthDate.toISOString().slice(0, 10) : '',
            addressLine: profile.addressLine ?? '',
            city: profile.city ?? '',
            state: profile.state ?? '',
            postalCode: profile.postalCode ?? '',
          }}
        />
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-lead font-bold text-text">Notificações</h2>
        <NotificationPreferencesForm
          initial={{ email: profile.notifyEmail, whatsapp: profile.notifyWhatsapp }}
          hasEmail={Boolean(profile.email)}
          hasWhatsapp={Boolean(profile.phone)}
        />
      </Card>
    </div>
  )
}

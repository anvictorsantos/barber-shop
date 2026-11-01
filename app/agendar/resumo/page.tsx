import { formatInTimeZone } from 'date-fns-tz'
import { ArrowLeft, Clock, Scissors, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AddToCartButton } from '@/components/cart/AddToCartButton'
import { PublicShell } from '@/components/layout/PublicShell'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { getAvailability } from '@/lib/availability/queries'
import { BUSINESS_TIMEZONE } from '@/lib/availability/slots'
import { getActiveBarberById, getServiceById } from '@/lib/catalog/queries'
import { formatBRL } from '@/lib/format/money'
import { formatBookingDateTime } from '@/lib/time/format'

import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Resumo do agendamento — Barbearia do Luiz',
  robots: { index: false, follow: false },
}

export default async function BookingSummaryPage({
  searchParams,
}: {
  searchParams: Promise<{
    serviceId?: string | string[]
    barberId?: string | string[]
    startAt?: string | string[]
  }>
}) {
  const query = await searchParams
  const serviceId = typeof query.serviceId === 'string' ? query.serviceId : null
  const barberId = typeof query.barberId === 'string' ? query.barberId : null
  const startAt = typeof query.startAt === 'string' ? query.startAt : null
  if (!serviceId || !barberId || !startAt) notFound()

  const [service, barber] = await Promise.all([
    getServiceById(serviceId),
    getActiveBarberById(barberId),
  ])
  if (!service || !barber) notFound()

  const startDate = new Date(startAt)
  if (Number.isNaN(startDate.getTime())) notFound()

  const date = formatInTimeZone(startDate, BUSINESS_TIMEZONE, 'yyyy-MM-dd')
  const availability = await getAvailability({ serviceId, barberId, date }).catch(() => null)
  const slot = availability?.slots.find((item) => item.startAt === startAt && item.available)

  if (!slot) {
    return (
      <PublicShell>
        <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-10 sm:px-6">
          <PageHeader
            title="Horário indisponível"
            description="Este horário acabou de ser reservado."
          />
          <Card className="text-body text-muted">Escolha outro horário para continuar.</Card>
          <Link
            href={`/agendar/${serviceId}/horario?barberId=${barberId}`}
            className="font-semibold text-accent hover:text-accent-hover"
          >
            Ver outros horários
          </Link>
        </div>
      </PublicShell>
    )
  }

  return (
    <PublicShell>
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-10 sm:px-6">
        <Link
          href={`/agendar/${service.id}/horario?barberId=${barber.id}`}
          className="inline-flex items-center gap-2 text-caption font-semibold text-muted hover:text-text"
        >
          <ArrowLeft
            className="h-4 w-4"
            aria-hidden
          />
          Voltar para horários
        </Link>

        <PageHeader
          title="Resumo do Agendamento"
          description="Revise os dados antes de adicionar ao carrinho."
        />

        <Card className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-label uppercase tracking-wider text-accent">Serviço</span>
            <p className="text-title font-extrabold text-text">{service.name}</p>
            <p className="text-body font-bold text-accent">{formatBRL(service.priceCents)}</p>
          </div>

          <div className="h-px w-full bg-border" />

          <div className="flex flex-col gap-1">
            <span className="text-label uppercase tracking-wider text-accent">Profissional</span>
            <p className="text-lead font-bold text-text">{barber.displayName}</p>
          </div>

          <div className="h-px w-full bg-border" />

          <div className="flex flex-col gap-1">
            <span className="text-label uppercase tracking-wider text-accent">Data e horário</span>
            <p className="flex items-center gap-2 text-lead font-bold text-text">
              <Clock
                className="h-4 w-4 text-accent"
                aria-hidden
              />
              {formatBookingDateTime(slot.startAt)}
            </p>
          </div>

          <p className="flex items-center gap-2 text-caption text-muted">
            <ShieldCheck
              className="h-4 w-4 text-success"
              aria-hidden
            />
            Cancelamento gratuito com até 2h de antecedência.
          </p>
        </Card>

        <AddToCartButton
          item={{
            serviceId: service.id,
            serviceName: service.name,
            barberId: barber.id,
            barberName: barber.displayName,
            startAt: slot.startAt,
            durationMin: service.durationMin,
            priceCents: service.priceCents,
          }}
        />

        <Link
          href={`/servicos/${service.slug}`}
          className="inline-flex items-center justify-center gap-2 text-caption font-semibold text-muted hover:text-text"
        >
          <Scissors
            className="h-4 w-4"
            aria-hidden
          />
          Ver detalhes do serviço
        </Link>
      </div>
    </PublicShell>
  )
}

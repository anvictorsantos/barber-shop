import { addDays, format, parseISO } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { SlotPicker } from '@/components/booking/SlotPicker'
import { PublicShell } from '@/components/layout/PublicShell'
import { PageHeader } from '@/components/ui/PageHeader'
import { BUSINESS_TIMEZONE } from '@/lib/availability/slots'
import { getActiveBarberById, getServiceById } from '@/lib/catalog/queries'

import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Data e horário — Barbearia do Luiz',
  robots: { index: false, follow: false },
}

export default async function SelectTimePage({
  params,
  searchParams,
}: {
  params: Promise<{ serviceId: string }>
  searchParams: Promise<{ barberId?: string | string[] }>
}) {
  const { serviceId } = await params
  const query = await searchParams
  const barberId = typeof query.barberId === 'string' ? query.barberId : null
  if (!barberId) redirect(`/agendar/${serviceId}/profissional`)

  const [service, barber] = await Promise.all([
    getServiceById(serviceId),
    getActiveBarberById(barberId),
  ])
  if (!service || !barber) notFound()

  const today = formatInTimeZone(new Date(), BUSINESS_TIMEZONE, 'yyyy-MM-dd')
  const horizonEnd = format(addDays(parseISO(today), 60), 'yyyy-MM-dd')

  return (
    <PublicShell>
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-10 sm:px-6">
        <Link
          href={`/agendar/${service.id}/profissional`}
          className="inline-flex items-center gap-2 text-caption font-semibold text-muted hover:text-text"
        >
          <ArrowLeft
            className="h-4 w-4"
            aria-hidden
          />
          Voltar para profissionais
        </Link>

        <PageHeader
          title="Data e horário"
          description={`${service.name} com ${barber.displayName} · ${service.durationMin} min`}
        />

        <SlotPicker
          serviceId={service.id}
          barberId={barber.id}
          initialDate={today}
          today={today}
          horizonEnd={horizonEnd}
        />
      </div>
    </PublicShell>
  )
}

import { addDays, format, parseISO } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { BookingProgress } from '@/components/booking/BookingProgress'
import { SlotPicker } from '@/components/booking/SlotPicker'
import { PublicDesktopFooter } from '@/components/layout/PublicDesktopFooter'
import { PublicDesktopHeader } from '@/components/layout/PublicDesktopHeader'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SkipLink } from '@/components/layout/SkipLink'
import { getSessionUser } from '@/lib/auth/session'
import { BUSINESS_TIMEZONE } from '@/lib/availability/slots'
import { getActiveBarberById, getServiceById } from '@/lib/catalog/queries'
import { formatBRL } from '@/lib/format/money'
import { getShopSettings } from '@/lib/settings/queries'

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

  const [service, barber, shop, user] = await Promise.all([
    getServiceById(serviceId),
    getActiveBarberById(barberId),
    getShopSettings(),
    getSessionUser(),
  ])
  if (!service || !barber) notFound()

  const today = formatInTimeZone(new Date(), BUSINESS_TIMEZONE, 'yyyy-MM-dd')
  const horizonEnd = format(addDays(parseISO(today), 60), 'yyyy-MM-dd')

  const shopName = shop?.name ?? 'Barbearia do Luiz'
  const city = shop?.city ?? 'Belo Horizonte'
  const state = shop?.state ?? 'MG'
  const whatsapp = (shop?.whatsapp ?? '+5531988815243').replace(/\D/g, '')
  const cityLabel = city === 'Belo Horizonte' ? 'BH' : city
  const address = `${shop?.addressLine ?? 'Rua dos Geólogos, 698 — Alípio de Melo'}, ${cityLabel}`

  return (
    <>
      <SkipLink />
      <main
        id="main-content"
        className="flex min-h-dvh flex-col bg-background"
      >
        <div className="lg:hidden">
          <SiteHeader />
        </div>
        <div className="hidden lg:block">
          <PublicDesktopHeader
            shopName={shopName}
            city={city}
            state={state}
            user={user}
            active="booking"
          />
        </div>

        <section className="flex w-full flex-1 flex-col gap-6 px-5 pb-12 pt-3 lg:px-10 xl:px-20">
          <BookingProgress current="horario" />

          <Link
            href={`/agendar/${service.id}/profissional`}
            className="inline-flex w-fit items-center gap-1.5 text-caption font-semibold text-primary transition hover:text-primary-hover"
          >
            <ChevronLeft
              aria-hidden
              className="h-3 w-3"
            />
            Voltar para profissionais
          </Link>

          <div className="flex flex-col gap-2.5">
            <span className="text-label font-bold uppercase tracking-[1.8px] text-accent">
              Agendamento · Data e hora
            </span>
            <h1 className="font-display text-[32px] font-bold leading-[1.2] text-text lg:text-[38px]">
              Data e horário
            </h1>
            <p className="text-[15px] leading-[1.5] text-muted">
              {service.name} com {barber.displayName} · {service.durationMin} min
            </p>
          </div>

          <SlotPicker
            service={{
              id: service.id,
              name: service.name,
              durationMin: service.durationMin,
              price: formatBRL(service.priceCents),
              promoLabel: service.promoLabel,
              imageUrl: service.imageUrl,
            }}
            barber={{
              displayName: barber.displayName,
              avatarUrl: barber.avatarUrl,
            }}
            address={address}
            barberId={barber.id}
            initialDate={today}
            today={today}
            horizonEnd={horizonEnd}
          />
        </section>

        <PublicDesktopFooter
          shopName={shopName}
          whatsapp={whatsapp}
        />
      </main>
    </>
  )
}

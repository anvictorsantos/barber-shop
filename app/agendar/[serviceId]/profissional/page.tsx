import { ChevronLeft, Scissors } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { BarberSelector } from '@/components/booking/BarberSelector'
import { BookingProgress } from '@/components/booking/BookingProgress'
import { PublicDesktopFooter } from '@/components/layout/PublicDesktopFooter'
import { PublicDesktopHeader } from '@/components/layout/PublicDesktopHeader'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SkipLink } from '@/components/layout/SkipLink'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { getSessionUser } from '@/lib/auth/session'
import { getActiveBarbers, getServiceById } from '@/lib/catalog/queries'
import { formatBRL } from '@/lib/format/money'
import { getShopSettings } from '@/lib/settings/queries'

import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Escolha o profissional — Barbearia do Luiz',
  robots: { index: false, follow: false },
}

export default async function SelectBarberPage({
  params,
}: {
  params: Promise<{ serviceId: string }>
}) {
  const { serviceId } = await params

  const [service, barbers, shop, user] = await Promise.all([
    getServiceById(serviceId),
    getActiveBarbers(),
    getShopSettings(),
    getSessionUser(),
  ])
  if (!service) notFound()

  const shopName = shop?.name ?? 'Barbearia do Luiz'
  const city = shop?.city ?? 'Belo Horizonte'
  const state = shop?.state ?? 'MG'
  const whatsapp = (shop?.whatsapp ?? '+5531988815243').replace(/\D/g, '')
  const cityLabel = city === 'Belo Horizonte' ? 'BH' : city
  const address = `${shop?.addressLine ?? 'Rua dos Geólogos, 698 — Alípio de Melo'}, ${cityLabel}`

  const barberOptions = barbers.map((barber) => ({
    id: barber.id,
    displayName: barber.displayName,
    title: barber.title,
    avatarUrl: barber.avatarUrl,
    rating: Number(barber.ratingAvg.toString()).toFixed(1),
    ratingCount: barber.ratingCount,
  }))

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

        <section className="flex w-full flex-1 flex-col gap-6 px-5 pb-14 pt-3 lg:px-10 xl:px-20">
          <BookingProgress current="profissional" />

          <Link
            href={`/servicos/${service.slug}`}
            className="inline-flex w-fit items-center gap-1.5 text-caption font-semibold text-primary transition hover:text-primary-hover"
          >
            <ChevronLeft
              aria-hidden
              className="h-3 w-3"
            />
            Voltar
          </Link>

          <div className="flex flex-col gap-2.5">
            <span className="text-label font-bold uppercase tracking-[1.8px] text-accent">
              Agendamento · Profissional
            </span>
            <h1 className="font-display text-[32px] font-bold leading-[1.2] text-text lg:text-[38px]">
              Escolha o profissional
            </h1>
            <p className="text-[15px] leading-[1.5] text-muted">
              {service.name} · {service.durationMin} min · {formatBRL(service.priceCents)}
            </p>
          </div>

          {barberOptions.length === 0 ? (
            <Card>
              <EmptyState
                icon={Scissors}
                title="Nenhum profissional disponível"
                description="Ainda não há profissionais por aqui. Volte em breve ou fale com a gente."
              />
            </Card>
          ) : (
            <BarberSelector
              service={{
                id: service.id,
                name: service.name,
                durationMin: service.durationMin,
                price: formatBRL(service.priceCents),
                promoLabel: service.promoLabel,
                imageUrl: service.imageUrl,
              }}
              barbers={barberOptions}
              address={address}
            />
          )}
        </section>

        <PublicDesktopFooter
          shopName={shopName}
          whatsapp={whatsapp}
        />
      </main>
    </>
  )
}

import { ChevronLeft, Scissors } from 'lucide-react'
import Link from 'next/link'

import { BookingCartOverview } from '@/components/booking/BookingCartOverview'
import { ServiceCard } from '@/components/catalog/ServiceCard'
import { PublicDesktopFooter } from '@/components/layout/PublicDesktopFooter'
import { PublicDesktopHeader } from '@/components/layout/PublicDesktopHeader'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SkipLink } from '@/components/layout/SkipLink'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { getSessionUser } from '@/lib/auth/session'
import { groupServicesByCategory } from '@/lib/catalog/labels'
import { getActiveServices } from '@/lib/catalog/queries'
import { getShopHours, getShopSettings } from '@/lib/settings/queries'
import { shopHoursLines } from '@/lib/time/schedule'

import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Serviços — Barbearia do Luiz',
  description: 'Corte, barba e tratamentos. Escolha o serviço e agende seu horário.',
}

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string | string[]; continuar?: string | string[] }>
}) {
  const [user, services, shop, storedHours, params] = await Promise.all([
    getSessionUser(),
    getActiveServices(),
    getShopSettings(),
    getShopHours(),
    searchParams,
  ])

  const shopName = shop?.name ?? 'Barbearia do Luiz'
  const city = shop?.city ?? 'Belo Horizonte'
  const state = shop?.state ?? 'MG'
  const whatsapp = (shop?.whatsapp ?? '+5531988815243').replace(/\D/g, '')
  const cityLabel = city === 'Belo Horizonte' ? 'BH' : city
  const address = `${shop?.addressLine ?? 'Rua dos Geólogos, 698 — Alípio de Melo'}, ${cityLabel}`

  const groups = groupServicesByCategory(services)
  const requested = typeof params.categoria === 'string' ? params.categoria : undefined
  const continuar = params.continuar === '1'
  const activeCategory = groups.find((group) => group.category === requested)?.category
  const visibleServices = activeCategory
    ? services.filter((service) => service.category === activeCategory)
    : services

  const hoursLines = shopHoursLines(storedHours)
  const businessHours = hoursLines.length > 0 ? hoursLines.join(' · ') : 'Horários em breve'

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
            active="services"
          />
        </div>

        <section className="flex w-full flex-1 flex-col gap-6 px-5 py-8 lg:px-10 lg:pb-14 lg:pt-8 xl:px-20">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-1.5 text-caption font-semibold text-primary transition hover:text-primary-hover"
          >
            <ChevronLeft
              aria-hidden
              className="h-3 w-3"
            />
            Voltar ao início
          </Link>

          <div className="flex flex-col gap-2.5">
            <span className="text-label font-bold uppercase tracking-[1.8px] text-accent">
              Catálogo de serviços
            </span>
            <h1 className="font-display text-[32px] font-bold leading-[1.2] text-text lg:text-[38px]">
              Serviços
            </h1>
            <p className="text-[15px] leading-[1.5] text-muted">
              Escolha o serviço, o profissional e o horário. Confirmação em poucos minutos.
            </p>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start xl:gap-8">
            <div className="flex min-w-0 flex-col gap-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-2.5">
                  <Link
                    href="/servicos"
                    className={
                      activeCategory === undefined
                        ? 'rounded-full border border-primary bg-primary/15 px-[18px] py-3 text-caption font-semibold text-accent'
                        : 'rounded-full border border-white/10 bg-surface px-[18px] py-3 text-caption font-semibold text-muted transition hover:text-text'
                    }
                  >
                    Todos
                  </Link>
                  {groups.map((group) => (
                    <Link
                      key={group.category}
                      href={`/servicos?categoria=${group.category}`}
                      className={
                        activeCategory === group.category
                          ? 'rounded-full border border-primary bg-primary/15 px-[18px] py-3 text-caption font-semibold text-accent'
                          : 'rounded-full border border-white/10 bg-surface px-[18px] py-3 text-caption font-semibold text-muted transition hover:text-text'
                      }
                    >
                      {group.label}
                    </Link>
                  ))}
                </div>

                <span className="text-caption text-muted">
                  {visibleServices.length}{' '}
                  {visibleServices.length === 1 ? 'serviço disponível' : 'serviços disponíveis'}
                </span>
              </div>

              {visibleServices.length === 0 ? (
                <Card>
                  <EmptyState
                    icon={Scissors}
                    title="Nenhum serviço disponível"
                    description="A barbearia ainda não cadastrou serviços ativos."
                  />
                </Card>
              ) : (
                <div className="grid gap-5 md:grid-cols-2">
                  {visibleServices.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      continuar={continuar}
                    />
                  ))}
                </div>
              )}

              <div className="flex flex-col justify-between gap-2 text-caption text-muted lg:flex-row lg:items-center">
                <span>Agende como visitante. Crie sua conta depois, se quiser.</span>
                <span>{businessHours}</span>
              </div>
            </div>

            <div className="xl:sticky xl:top-6">
              <BookingCartOverview address={address} />
            </div>
          </div>
        </section>

        <PublicDesktopFooter
          shopName={shopName}
          whatsapp={whatsapp}
        />
      </main>
    </>
  )
}

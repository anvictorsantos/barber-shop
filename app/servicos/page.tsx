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
import { SectionLabel } from '@/components/ui/SectionLabel'
import { getSessionUser } from '@/lib/auth/session'
import { groupServicesByCategory } from '@/lib/catalog/labels'
import { getActiveServices } from '@/lib/catalog/queries'
import { getShopHours, getShopSettings } from '@/lib/settings/queries'
import { shopHoursLines } from '@/lib/time/schedule'
import { cn } from '@/lib/utils'

import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Serviços — Barbearia do Luiz',
  description:
    'Do corte ao acabamento, cada serviço é feito com atenção para você sair satisfeito.',
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

        <section className="flex w-full flex-1 flex-col gap-8 px-6 pb-16 pt-8 lg:px-10 lg:pt-10 xl:px-10">
          <div className="flex flex-col gap-8">
            <Link
              href="/"
              className="inline-flex w-fit items-center gap-1.5 text-caption text-muted transition-colors hover:text-text"
            >
              <ChevronLeft
                aria-hidden
                className="h-3.5 w-3.5"
              />
              Voltar ao início
            </Link>

            <div className="flex flex-col gap-4">
              <SectionLabel>Catálogo</SectionLabel>
              <h1 className="font-display text-[40px] font-semibold leading-[1.05] text-text lg:text-[48px]">
                O cuidado que seu visual merece.
              </h1>
              <p className="max-w-[560px] text-lead leading-relaxed text-muted">
                Do corte ao acabamento, cada serviço é feito com atenção para você sair satisfeito.
              </p>
            </div>
          </div>

          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
            <div className="flex min-w-0 flex-col gap-6">
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-b border-border">
                <div className="flex flex-wrap items-center gap-x-6">
                  <Link
                    href="/servicos"
                    className={cn(
                      '-mb-px border-b-2 py-3 text-body transition-colors',
                      activeCategory === undefined
                        ? 'border-accent text-text'
                        : 'border-transparent text-muted hover:text-text',
                    )}
                  >
                    Todos
                  </Link>
                  {groups.map((group) => (
                    <Link
                      key={group.category}
                      href={`/servicos?categoria=${group.category}`}
                      className={cn(
                        '-mb-px border-b-2 py-3 text-body transition-colors',
                        activeCategory === group.category
                          ? 'border-accent text-text'
                          : 'border-transparent text-muted hover:text-text',
                      )}
                    >
                      {group.label}
                    </Link>
                  ))}
                </div>

                <span className="pb-3 text-caption text-muted">
                  {visibleServices.length} {visibleServices.length === 1 ? 'serviço' : 'serviços'}
                </span>
              </div>

              {visibleServices.length === 0 ? (
                <Card>
                  <EmptyState
                    icon={Scissors}
                    title="Nenhum serviço disponível"
                    description="Ainda não há serviços por aqui. Volte em breve para conferir."
                  />
                </Card>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
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
                <span>Agende como visitante. Sua conta é criada ao confirmar.</span>
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

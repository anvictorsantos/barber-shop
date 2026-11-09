import { MapPin, Scissors } from 'lucide-react'
import Link from 'next/link'

import { ServiceRow } from '@/components/catalog/ServiceRow'
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

const navLinkClass = (active: boolean) =>
  cn(
    'flex h-9 shrink-0 items-center gap-2 rounded-full border px-3 text-caption transition-colors lg:h-8 lg:w-full lg:rounded-md lg:px-2.5 lg:text-body',
    active
      ? 'border-accent/50 bg-surface text-text lg:border-transparent lg:shadow-[inset_0_0_0_1px_var(--border)]'
      : 'border-border text-muted hover:text-text lg:border-transparent lg:hover:bg-surface/60',
  )

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

        <div className="mx-auto flex w-full max-w-shell flex-1 flex-col gap-8 px-4 pb-16 pt-6 lg:px-10 lg:pt-10">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10">
            <aside className="flex min-w-0 flex-col gap-5 lg:sticky lg:top-6 lg:gap-6 lg:self-start">
              <div className="flex flex-col gap-2">
                <SectionLabel>Catálogo</SectionLabel>
                <h1 className="text-brand font-medium leading-tight text-text lg:text-[34px] lg:leading-[1.1]">
                  Serviços
                </h1>
                <p className="text-caption tabular-nums text-muted">
                  {services.length} serviços · {groups.length} categorias
                </p>
              </div>

              <nav
                aria-label="Categorias"
                className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:px-0 lg:pb-0"
              >
                <Link
                  href="/servicos"
                  aria-current={activeCategory === undefined ? 'page' : undefined}
                  className={navLinkClass(activeCategory === undefined)}
                >
                  {activeCategory === undefined ? (
                    <span
                      aria-hidden
                      className="h-1 w-1 shrink-0 rotate-45 bg-accent"
                    />
                  ) : null}
                  <span className="flex-1 truncate">Todos</span>
                  <span className="tabular-nums text-subtle">{services.length}</span>
                </Link>

                {groups.map((group) => {
                  const active = activeCategory === group.category
                  return (
                    <Link
                      key={group.category}
                      href={`/servicos?categoria=${group.category}`}
                      aria-current={active ? 'page' : undefined}
                      className={navLinkClass(active)}
                    >
                      {active ? (
                        <span
                          aria-hidden
                          className="h-1 w-1 shrink-0 rotate-45 bg-accent"
                        />
                      ) : null}
                      <span className="flex-1 truncate">{group.label}</span>
                      <span className="tabular-nums text-subtle">{group.services.length}</span>
                    </Link>
                  )
                })}
              </nav>

              <div className="hidden flex-col gap-2 border-t border-border pt-4 text-caption leading-relaxed text-muted lg:flex">
                <span>{businessHours}</span>
                <span className="flex items-start gap-1.5">
                  <MapPin
                    aria-hidden
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-subtle"
                  />
                  {address}
                </span>
              </div>
            </aside>

            <div className="flex min-w-0 flex-col gap-5">
              <p className="max-w-[520px] text-body leading-relaxed text-muted">
                Do corte ao acabamento, cada serviço é feito com atenção para você sair satisfeito.
              </p>

              {visibleServices.length === 0 ? (
                <Card>
                  <EmptyState
                    icon={Scissors}
                    title="Nenhum serviço disponível"
                    description="Ainda não há serviços por aqui. Volte em breve para conferir."
                  />
                </Card>
              ) : (
                <ul className="border-t border-border">
                  {visibleServices.map((service) => (
                    <li
                      key={service.id}
                      className="border-b border-border"
                    >
                      <ServiceRow
                        service={service}
                        continuar={continuar}
                      />
                    </li>
                  ))}
                </ul>
              )}

              <p className="text-caption text-muted">
                Agende como visitante. Sua conta é criada ao confirmar.
              </p>
            </div>
          </div>
        </div>

        <PublicDesktopFooter
          shopName={shopName}
          whatsapp={whatsapp}
        />
      </main>
    </>
  )
}

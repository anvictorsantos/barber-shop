import { Check, ChevronLeft, Clock, ShieldCheck } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ServiceBookingAction } from '@/components/booking/ServiceBookingAction'
import { FavoriteButton } from '@/components/customer/FavoriteButton'
import { PublicDesktopFooter } from '@/components/layout/PublicDesktopFooter'
import { PublicDesktopHeader } from '@/components/layout/PublicDesktopHeader'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SkipLink } from '@/components/layout/SkipLink'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { getSessionUser } from '@/lib/auth/session'
import { serviceImage } from '@/lib/catalog/images'
import { serviceCategoryLabels } from '@/lib/catalog/labels'
import { getServiceBySlug } from '@/lib/catalog/queries'
import { getFavoriteIds } from '@/lib/customer/queries'
import { formatBRL } from '@/lib/format/money'
import { getShopSettings } from '@/lib/settings/queries'

import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

const INCLUSIONS = ['Atendimento dedicado', 'Produtos premium', 'Finalização'] as const

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const service = await getServiceBySlug(slug)

  return {
    title: service ? `${service.name} — Barbearia do Luiz` : 'Serviço — Barbearia do Luiz',
    description: service?.description,
  }
}

export default async function ServiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ continuar?: string | string[] }>
}) {
  const { slug } = await params
  const query = await searchParams
  const continuar = query.continuar === '1'
  const service = await getServiceBySlug(slug)
  if (!service) notFound()

  const [user, shop] = await Promise.all([getSessionUser(), getShopSettings()])
  const favoriteIds =
    user?.role === 'CUSTOMER'
      ? await getFavoriteIds(user.id)
      : { barbers: new Set<string>(), services: new Set<string>(), products: new Set<string>() }

  const shopName = shop?.name ?? 'Barbearia do Luiz'
  const city = shop?.city ?? 'Belo Horizonte'
  const state = shop?.state ?? 'MG'
  const whatsapp = (shop?.whatsapp ?? '+5531988815243').replace(/\D/g, '')

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

        <section className="flex w-full flex-1 flex-col gap-8 px-6 py-8 lg:px-10 lg:pb-16 lg:pt-10 xl:px-10">
          <Link
            href="/servicos"
            className="inline-flex w-fit items-center gap-1.5 text-caption text-muted transition-colors hover:text-text"
          >
            <ChevronLeft
              aria-hidden
              className="h-3.5 w-3.5"
            />
            Voltar para serviços
          </Link>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-14">
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-4">
                <SectionLabel>{serviceCategoryLabels[service.category]}</SectionLabel>
                <div className="flex items-start justify-between gap-4">
                  <h1 className="font-display text-[40px] font-semibold leading-[1.05] text-text lg:text-[52px]">
                    {service.name}
                  </h1>
                  {user?.role === 'CUSTOMER' ? (
                    <FavoriteButton
                      kind="service"
                      id={service.id}
                      initial={favoriteIds.services.has(service.id)}
                      label={service.name}
                    />
                  ) : null}
                </div>
              </div>

              <div className="relative aspect-[5/4] w-full overflow-hidden rounded-lg border border-border bg-surface-subtle">
                <Image
                  src={serviceImage(service)}
                  alt={service.name}
                  fill
                  priority
                  sizes="(max-width: 1023px) 100vw, 620px"
                  className="object-cover"
                />
              </div>
            </div>

            <div className="flex flex-col gap-7 lg:pt-2">
              {service.promoLabel ? (
                <span className="text-caption font-medium text-accent">{service.promoLabel}</span>
              ) : null}

              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-[32px] font-medium leading-none tabular-nums text-text">
                  {formatBRL(service.priceCents)}
                </span>
                {service.originalPriceCents ? (
                  <span className="text-body tabular-nums text-muted line-through">
                    {formatBRL(service.originalPriceCents)}
                  </span>
                ) : null}
              </div>

              <p className="text-lead leading-relaxed text-text-secondary">{service.description}</p>

              <p className="flex items-center gap-2 text-body text-muted">
                <Clock
                  aria-hidden
                  className="h-4 w-4 shrink-0"
                />
                {service.durationMin} min · duração estimada
              </p>

              <ul className="divide-y divide-border border-y border-border">
                {INCLUSIONS.map((inclusion) => (
                  <li
                    key={inclusion}
                    className="flex items-center gap-3 py-3 text-body text-text-secondary"
                  >
                    <Check
                      aria-hidden
                      className="h-4 w-4 shrink-0 text-accent"
                    />
                    {inclusion}
                  </li>
                ))}
              </ul>

              <div className="flex flex-col gap-4 border-t border-border pt-7">
                <ServiceBookingAction
                  service={{
                    id: service.id,
                    name: service.name,
                    durationMin: service.durationMin,
                    priceCents: service.priceCents,
                  }}
                  continuar={continuar}
                />

                <p className="text-caption text-subtle">Não precisa de conta para agendar.</p>

                <p className="flex items-start gap-2 text-caption leading-relaxed text-muted">
                  <ShieldCheck
                    aria-hidden
                    className="mt-0.5 h-4 w-4 shrink-0"
                  />
                  Cancelamento gratuito com até 2h de antecedência.
                </p>
              </div>
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

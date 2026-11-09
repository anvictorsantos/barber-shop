import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ServiceBookingAction } from '@/components/booking/ServiceBookingAction'
import { FavoriteButton } from '@/components/customer/FavoriteButton'
import { PublicDesktopFooter } from '@/components/layout/PublicDesktopFooter'
import { PublicDesktopHeader } from '@/components/layout/PublicDesktopHeader'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SkipLink } from '@/components/layout/SkipLink'
import { getSessionUser } from '@/lib/auth/session'
import { serviceImage } from '@/lib/catalog/images'
import { serviceInclusions } from '@/lib/catalog/inclusions'
import { serviceCategoryLabels } from '@/lib/catalog/labels'
import { getServiceBySlug } from '@/lib/catalog/queries'
import { getFavoriteIds } from '@/lib/customer/queries'
import { formatBRL } from '@/lib/format/money'
import { getShopSettings } from '@/lib/settings/queries'

import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

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
  const promoLabel = service.promoLabel ? sentenceCase(service.promoLabel) : null
  const inclusions = serviceInclusions(service.slug)
  const isCustomer = user?.role === 'CUSTOMER'
  const favorite = isCustomer ? (
    <FavoriteButton
      kind="service"
      id={service.id}
      initial={favoriteIds.services.has(service.id)}
      label={service.name}
      variant="bare"
    />
  ) : null

  return (
    <>
      <SkipLink />
      <main
        id="main-content"
        className="flex min-h-dvh flex-col bg-background pb-20 lg:pb-0"
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

        <div className="mx-auto grid w-full max-w-shell flex-1 lg:grid-cols-[57%_43%]">
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface-subtle lg:aspect-auto lg:min-h-[640px]">
            <Image
              src={serviceImage(service)}
              alt={service.name}
              fill
              priority
              sizes="(max-width: 1023px) 100vw, 57vw"
              className="object-cover"
            />
            <p className="absolute inset-x-4 bottom-4 text-caption text-[#f2ece1]/85 lg:inset-x-8 lg:bottom-7">
              {shopName} · {city}, {state}
            </p>
          </div>

          <div className="flex flex-col gap-6 px-6 py-8 lg:justify-center lg:gap-7 lg:px-14 lg:py-16">
            <nav
              aria-label="Trilha"
              className="text-caption text-muted"
            >
              <Link
                href={`/servicos${continuar ? '?continuar=1' : ''}`}
                className="transition-colors hover:text-text"
              >
                Serviços
              </Link>
              <span className="mx-2 text-subtle">/</span>
              <span className="text-text-secondary">{serviceCategoryLabels[service.category]}</span>
            </nav>

            <div className="flex items-start justify-between gap-4">
              <h1 className="text-[40px] font-medium leading-[1.03] tracking-[-0.025em] text-text lg:text-[56px]">
                {service.name}
              </h1>
              {favorite ? <div className="lg:hidden">{favorite}</div> : null}
            </div>

            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-[32px] font-medium leading-none tabular-nums text-text lg:text-[34px]">
                {formatBRL(service.priceCents)}
              </span>
              {service.originalPriceCents ? (
                <span className="text-caption tabular-nums text-subtle line-through">
                  {formatBRL(service.originalPriceCents)}
                </span>
              ) : null}
              <span className="text-body text-muted">· {service.durationMin} min</span>
              {promoLabel ? (
                <span className="text-caption font-medium text-accent">{promoLabel}</span>
              ) : null}
            </div>

            <p className="max-w-[430px] text-lead leading-relaxed text-text-secondary">
              {service.description}
            </p>

            {inclusions.length > 0 ? (
              <ul className="max-w-[430px] border-y border-border">
                {inclusions.map((inclusion, index) => (
                  <li
                    key={inclusion}
                    className="flex items-center justify-between gap-4 py-3 text-body text-text-secondary"
                  >
                    <span>{inclusion}</span>
                    <span className="text-caption tabular-nums text-subtle">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="hidden items-center gap-4 lg:flex">
              <ServiceBookingAction
                service={{
                  id: service.id,
                  name: service.name,
                  durationMin: service.durationMin,
                  priceCents: service.priceCents,
                }}
                continuar={continuar}
              />
              {favorite}
            </div>

            <p className="text-caption leading-relaxed text-subtle">
              Sem conta para agendar · Cancelamento gratuito com até 2h de antecedência
            </p>
          </div>
        </div>

        <PublicDesktopFooter
          shopName={shopName}
          whatsapp={whatsapp}
        />
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border-strong bg-surface/95 px-4 pt-2.5 pb-[max(10px,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-shell items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-body font-medium tabular-nums text-text">
              {formatBRL(service.priceCents)}
            </p>
            <p className="truncate text-micro text-muted">
              {service.durationMin} min{promoLabel ? ` · ${promoLabel}` : ''}
            </p>
          </div>
          <ServiceBookingAction
            service={{
              id: service.id,
              name: service.name,
              durationMin: service.durationMin,
              priceCents: service.priceCents,
            }}
            continuar={continuar}
          />
        </div>
      </div>
    </>
  )
}

function sentenceCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

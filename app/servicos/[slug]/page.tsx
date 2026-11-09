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

const SCALE_MINUTES = 90

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
  const scalePercent = Math.min(service.durationMin / SCALE_MINUTES, 1) * 100

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

        <div className="mx-auto flex w-full max-w-shell flex-1 flex-col gap-10 px-6 py-8 lg:flex-row lg:items-center lg:gap-16 lg:px-10 lg:py-10">
          <div className="flex min-w-0 flex-1 flex-col gap-6">
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

            <h1 className="text-[36px] font-medium leading-[1.05] tracking-[-0.02em] text-text lg:text-[52px]">
              {service.name}
            </h1>

            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-[30px] font-medium leading-none tabular-nums text-text lg:text-[40px]">
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

            <p className="max-w-[560px] text-lead leading-relaxed text-text-secondary">
              {service.description}
            </p>

            <div className="max-w-[640px] border-t border-border pt-5">
              <div className="flex items-baseline justify-between gap-4 text-caption text-muted">
                <span>Duração na cadeira</span>
                <span className="tabular-nums">
                  {service.durationMin} de {SCALE_MINUTES} min
                </span>
              </div>
              <div
                role="img"
                aria-label={`${service.durationMin} minutos de um total de ${SCALE_MINUTES}`}
                className="relative mt-3 h-16"
              >
                <span
                  className="absolute left-0 bottom-10 whitespace-nowrap pr-1.5 text-caption font-medium tabular-nums text-accent"
                  style={{ left: `${scalePercent}%`, transform: 'translateX(-100%)' }}
                >
                  {service.durationMin} min
                </span>
                <span
                  className="absolute bottom-4 h-6 w-px bg-accent"
                  style={{ left: `${scalePercent}%` }}
                />
                <span
                  className="absolute left-0 bottom-6 h-3 rounded-xs bg-accent"
                  style={{ width: `${scalePercent}%` }}
                />
                <span className="absolute inset-x-0 bottom-6 h-px bg-border-strong" />
                <span
                  className="absolute inset-x-0 bottom-[18px] h-1.5"
                  style={{
                    backgroundImage:
                      'linear-gradient(90deg, var(--border-strong) 0 1px, transparent 1px)',
                    backgroundSize: 'calc(100% / 18) 6px',
                    backgroundRepeat: 'repeat-x',
                  }}
                />
                <span
                  className="absolute inset-x-0 bottom-3 h-3"
                  style={{
                    backgroundImage: 'linear-gradient(90deg, var(--muted) 0 1px, transparent 1px)',
                    backgroundSize: 'calc(100% / 6) 12px',
                    backgroundRepeat: 'repeat-x',
                    opacity: 0.55,
                  }}
                />
                <span className="absolute bottom-0 left-0 font-mono text-[10px] tabular-nums text-muted">
                  0
                </span>
                <span
                  className="absolute bottom-0 -translate-x-1/2 font-mono text-[10px] tabular-nums text-muted"
                  style={{ left: '33.333%' }}
                >
                  30
                </span>
                <span
                  className="absolute bottom-0 -translate-x-1/2 font-mono text-[10px] tabular-nums text-muted"
                  style={{ left: '66.667%' }}
                >
                  60
                </span>
                <span
                  className="absolute bottom-0 -translate-x-full font-mono text-[10px] tabular-nums text-muted"
                  style={{ left: '100%' }}
                >
                  90
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:hidden">
              <div className="flex items-center gap-4">
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

            {inclusions.length > 0 ? (
              <ul className="grid max-w-[680px] grid-cols-1 gap-x-6 border-t border-border sm:grid-cols-3">
                {inclusions.map((inclusion, index) => (
                  <li
                    key={inclusion}
                    className="flex gap-2.5 border-b border-border py-3 text-body text-text-secondary"
                  >
                    <span className="pt-0.5 font-mono text-[10px] text-accent">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {inclusion}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <aside className="flex w-full flex-col gap-5 lg:w-[380px] lg:shrink-0">
            <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl border border-border bg-surface-subtle">
              <Image
                src={serviceImage(service)}
                alt={service.name}
                fill
                priority
                sizes="(max-width: 1023px) 100vw, 380px"
                className="object-cover"
              />
            </div>

            <div className="hidden flex-col gap-3 rounded-xl border border-border bg-surface p-5 lg:flex">
              <div className="flex flex-col gap-2 border-b border-border pb-3">
                <div className="flex items-baseline justify-between gap-4 text-body">
                  <span className="text-muted">Duração</span>
                  <span className="tabular-nums text-text">{service.durationMin} min</span>
                </div>
                <div className="flex items-baseline justify-between gap-4 text-body">
                  <span className="text-muted">Valor</span>
                  <span className="tabular-nums text-text">{formatBRL(service.priceCents)}</span>
                </div>
                {service.originalPriceCents ? (
                  <div className="flex items-baseline justify-between gap-4 text-body">
                    <span className="text-muted">Antes</span>
                    <span className="tabular-nums text-subtle line-through">
                      {formatBRL(service.originalPriceCents)}
                    </span>
                  </div>
                ) : null}
              </div>

              <ServiceBookingAction
                service={{
                  id: service.id,
                  name: service.name,
                  durationMin: service.durationMin,
                  priceCents: service.priceCents,
                }}
                continuar={continuar}
                className="w-full"
              />

              <p className="text-center text-caption text-subtle">
                Próximo passo: escolher profissional
              </p>

              <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
                <span className="text-caption text-subtle">Sem conta · Cancelamento até 2h</span>
                {favorite}
              </div>
            </div>
          </aside>
        </div>

        <PublicDesktopFooter
          shopName={shopName}
          whatsapp={whatsapp}
        />
      </main>
    </>
  )
}

function sentenceCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

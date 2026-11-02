import { Check, ChevronLeft, ChevronRight, Clock, Scissors, ShieldCheck } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { FavoriteButton } from '@/components/customer/FavoriteButton'
import { PublicDesktopFooter } from '@/components/layout/PublicDesktopFooter'
import { PublicDesktopHeader } from '@/components/layout/PublicDesktopHeader'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SkipLink } from '@/components/layout/SkipLink'
import { buttonClasses } from '@/components/ui/Button'
import { getSessionUser } from '@/lib/auth/session'
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

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
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

        <section className="flex w-full flex-1 flex-col gap-7 px-5 py-8 lg:px-10 lg:pb-16 lg:pt-8 xl:px-20">
          <Link
            href="/servicos"
            className="inline-flex w-fit items-center gap-1.5 text-caption font-semibold text-primary transition hover:text-primary-hover"
          >
            <ChevronLeft
              aria-hidden
              className="h-3 w-3"
            />
            Voltar para serviços
          </Link>

          <div className="flex flex-col gap-2.5">
            <span className="text-label font-bold uppercase tracking-[1.8px] text-accent">
              Serviço
            </span>
            <h1 className="font-display text-[32px] font-bold leading-[1.2] text-text lg:text-[38px]">
              Detalhes do serviço
            </h1>
            <p className="text-[15px] leading-[1.5] text-muted">
              Escolha o profissional e o horário. Confirmação em poucos minutos.
            </p>
          </div>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[650px_minmax(0,1fr)] xl:gap-14">
            <div className="flex flex-col gap-[22px]">
              <div className="relative aspect-[650/402] w-full overflow-hidden rounded-3xl bg-surface-input">
                {service.imageUrl ? (
                  <Image
                    src={service.imageUrl}
                    alt={service.name}
                    fill
                    priority
                    sizes="(max-width: 1023px) 100vw, 650px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Scissors
                      aria-hidden
                      className="h-12 w-12 text-muted"
                    />
                  </div>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {INCLUSIONS.map((inclusion) => (
                  <div
                    key={inclusion}
                    className="flex items-center gap-2 rounded-md bg-surface px-3 py-4"
                  >
                    <Check
                      aria-hidden
                      className="h-3.5 w-3.5 shrink-0 text-accent"
                    />
                    <span className="text-caption font-medium text-text">{inclusion}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {service.promoLabel ? (
                <span className="w-fit rounded-md bg-[#302119] px-3 py-[7px] text-label font-bold uppercase tracking-[1px] text-accent">
                  {service.promoLabel}
                </span>
              ) : null}

              <div className="flex items-start justify-between gap-4">
                <h2 className="font-display text-[30px] font-bold leading-[1.2] text-text lg:text-[38px] xl:text-[44px] xl:leading-[59px]">
                  {service.name}
                </h2>
                {user?.role === 'CUSTOMER' ? (
                  <FavoriteButton
                    kind="service"
                    id={service.id}
                    initial={favoriteIds.services.has(service.id)}
                    label={service.name}
                  />
                ) : null}
              </div>

              <div className="flex items-center gap-4">
                <span className="text-[26px] font-bold leading-none text-accent xl:text-[32px] xl:leading-[39px]">
                  {formatBRL(service.priceCents)}
                </span>
                {service.originalPriceCents ? (
                  <span className="text-[15px] leading-[18px] text-muted underline underline-offset-2">
                    {formatBRL(service.originalPriceCents)}
                  </span>
                ) : null}
              </div>

              <div className="h-px w-full bg-white/10" />

              <div className="flex flex-col gap-3">
                <h3 className="text-[15px] font-bold leading-[18px] text-text">Descrição</h3>
                <p className="text-[15px] leading-[1.75] text-muted">{service.description}</p>
              </div>

              <p className="flex items-center gap-2.5 text-caption font-semibold tracking-[0.5px] text-accent">
                <Clock
                  aria-hidden
                  className="h-[18px] w-[18px]"
                />
                Duração estimada: {service.durationMin} minutos
              </p>

              <Link
                href={`/agendar/${service.id}/profissional`}
                className={buttonClasses({
                  size: 'lg',
                  className: 'h-[52px] w-full gap-2.5 rounded-md px-[22px] text-sm',
                })}
              >
                Agendar este serviço
                <ChevronRight
                  aria-hidden
                  className="h-[18px] w-[18px]"
                />
              </Link>

              <p className="text-caption text-muted">Não precisa de conta para agendar.</p>

              <p className="flex items-start gap-2.5 text-caption leading-[1.6] text-muted">
                <ShieldCheck
                  aria-hidden
                  className="mt-0.5 h-[18px] w-[18px] shrink-0 text-success"
                />
                Cancelamento gratuito com até 2h de antecedência.
              </p>
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

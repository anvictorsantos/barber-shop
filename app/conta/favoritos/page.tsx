import { Package } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { FavoriteButton } from '@/components/customer/FavoriteButton'
import { getSessionUser } from '@/lib/auth/session'
import { getActiveServices } from '@/lib/catalog/queries'
import { getAppointmentHistory, getFavorites } from '@/lib/customer/queries'
import { formatBRL } from '@/lib/format/money'
import { getLoyaltySummary, STAMPS_FOR_CREDIT } from '@/lib/loyalty/service'
import { cn } from '@/lib/utils'

import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Favoritos — Barbearia do Luiz',
  robots: { index: false, follow: false },
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function stars(rating: number): string {
  if (!rating) return '—'
  const filled = Math.floor(rating)
  return '★'.repeat(filled) + '☆'.repeat(Math.max(0, 5 - filled))
}

function times(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}

export default async function CustomerFavoritesPage() {
  const user = await getSessionUser()
  if (!user) redirect('/entrar?next=/conta/favoritos')
  if (user.role !== 'CUSTOMER') redirect('/admin')

  const [favorites, loyalty, history, services] = await Promise.all([
    getFavorites(user.id),
    getLoyaltySummary(user.id),
    getAppointmentHistory(user.id),
    getActiveServices(),
  ])

  const lastVisit = history.find((item) => item.status === 'COMPLETED') ?? null
  const favoriteServiceIds = new Set(favorites.services.map((service) => service.id))
  const bookedServiceIds = new Set(history.map((item) => item.serviceId))
  const recommendations = services
    .filter((service) => !favoriteServiceIds.has(service.id) && !bookedServiceIds.has(service.id))
    .slice(0, 2)

  const stamps = Math.min(loyalty.stamps, STAMPS_FOR_CREDIT)
  const remaining = Math.max(0, STAMPS_FOR_CREDIT - stamps)
  const loyaltyMessage = loyalty.credit
    ? 'Você já pode resgatar seu serviço grátis!'
    : `Você tem ${stamps} selos acumulados. Complete mais ${times(remaining, 'visita', 'visitas')} para resgatar!`

  const recommendationReason = (index: number) => {
    if (index === 0 && lastVisit) return `Baseado no seu histórico de ${lastVisit.serviceName}`
    if (index === 1 && favorites.services[0]) {
      return `Complementa seu ${favorites.services[0].name} favorito`
    }
    return 'Escolhido para você'
  }

  const emptyCard = (message: string) => (
    <p className="rounded-xl border border-dashed border-white/[0.07] p-6 text-center text-caption text-muted">
      {message}
    </p>
  )

  return (
    <div className="flex flex-col lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-8 px-4 pb-24 pt-6 sm:px-6 lg:px-10 lg:py-10">
        <h1 className="sr-only">Favoritos</h1>

        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-extrabold leading-[22px] tracking-[0.5px] text-text">
              Meus Barbeiros Favoritos
            </h2>
            <p className="text-[13px] leading-4 text-muted">
              Seus profissionais de confiança salvos para agendar rápido
            </p>
          </div>

          {favorites.barbers.length === 0 ? (
            emptyCard('Nenhum barbeiro favorito ainda. Salve seus profissionais de confiança.')
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {favorites.barbers.map((barber, index) => (
                <article
                  key={barber.id}
                  className={cn(
                    'flex flex-col gap-3 rounded-xl bg-surface p-5',
                    index === 0 ? 'border-[1.5px] border-primary' : 'border border-white/[0.07]',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-sm font-bold text-accent">
                      {barber.avatarUrl ? (
                        <Image
                          src={barber.avatarUrl}
                          alt={barber.displayName}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : (
                        initials(barber.displayName)
                      )}
                    </span>
                    <FavoriteButton
                      kind="barber"
                      id={barber.id}
                      initial
                      label={barber.displayName}
                      variant="bare"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-base font-extrabold leading-[19px] text-text">
                      {barber.displayName}
                    </span>
                    <span
                      className={cn(
                        'text-caption leading-[15px]',
                        index === 0 ? 'text-accent' : 'text-muted',
                      )}
                    >
                      {barber.title}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-white/[0.07] pt-2 text-caption leading-[15px]">
                    <span className="text-muted">
                      {times(barber.visits, 'visita realizada', 'visitas realizadas')}
                    </span>
                    <span className="font-bold text-accent">{stars(barber.ratingAvg)}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-extrabold leading-[22px] tracking-[0.5px] text-text">
              Serviços Favoritos
            </h2>
            <p className="text-[13px] leading-4 text-muted">
              Agende em poucos cliques os serviços que você mais ama
            </p>
          </div>

          {favorites.services.length === 0 ? (
            emptyCard('Nenhum serviço favorito ainda. Salve os serviços que você mais gosta.')
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {favorites.services.map((service, index) => (
                <article
                  key={service.id}
                  className={cn(
                    'flex flex-col gap-3 rounded-lg bg-surface p-4',
                    index === 0 ? 'border border-primary' : 'border border-white/[0.07]',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/servicos/${service.slug}`}
                      className="truncate text-sm font-extrabold leading-[17px] text-text transition hover:text-accent"
                    >
                      {service.name}
                    </Link>
                    <FavoriteButton
                      kind="service"
                      id={service.id}
                      initial
                      label={service.name}
                      variant="bare"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <span className="text-base font-extrabold leading-[19px] text-accent">
                      {formatBRL(service.priceCents)}
                    </span>
                    <span className="text-caption leading-[15px] text-muted">
                      {service.durationMin} min
                    </span>
                    <span
                      className={cn(
                        'text-label leading-[13px]',
                        index === 0 ? 'text-primary' : 'text-muted',
                      )}
                    >
                      {service.timesBooked > 0
                        ? `Agendado ${times(service.timesBooked, 'vez', 'vezes')}`
                        : 'Ainda não agendado'}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-extrabold leading-[22px] tracking-[0.5px] text-text">
              Produtos Favoritos
            </h2>
            <p className="text-[13px] leading-4 text-muted">
              Cosméticos premium adquiridos na barbearia para o seu dia a dia
            </p>
          </div>

          {favorites.products.length === 0 ? (
            emptyCard('Nenhum produto favorito ainda. Salve os produtos que você usa.')
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {favorites.products.map((product) => (
                <article
                  key={product.id}
                  className="flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-surface p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-sm bg-surface-subtle">
                      <Package
                        aria-hidden
                        strokeWidth={1.5}
                        className="h-6 w-6 text-accent"
                      />
                    </span>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate text-sm font-extrabold leading-[17px] text-text">
                        {product.name}
                      </span>
                      <span className="text-caption leading-[15px] text-muted">
                        {product.timesBought > 0
                          ? `Comprado ${times(product.timesBought, 'vez', 'vezes')}`
                          : 'Ainda não comprado'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-white/[0.07] pt-2">
                    <span className="text-[15px] font-extrabold leading-[18px] text-accent">
                      {formatBRL(product.priceCents)}
                    </span>
                    <Link
                      href="/loja"
                      className="rounded-xs bg-primary/10 px-3 py-1.5 text-label font-bold leading-[13px] text-primary transition hover:bg-primary/20"
                    >
                      Comprar Novamente
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <aside className="w-full shrink-0 border-t border-white/[0.07] bg-shell p-6 lg:w-[360px] lg:border-l lg:border-t-0">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-base font-extrabold leading-[19px] text-text">Recomendações</h2>
            <p className="text-caption leading-[15px] text-muted">
              Selecionados com base no seu histórico
            </p>
          </div>

          {recommendations.map((service, index) => (
            <article
              key={service.id}
              className="flex flex-col gap-3 rounded-xl bg-surface p-4"
            >
              <div className="flex flex-col gap-1">
                <span className="truncate text-sm font-extrabold leading-[17px] text-text">
                  {service.name}
                </span>
                <span className="text-caption leading-[15px] text-muted">
                  {recommendationReason(index)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-extrabold leading-[17px] text-accent">
                  {formatBRL(service.priceCents)}
                </span>
                <Link
                  href={`/servicos/${service.slug}`}
                  className="rounded-xs bg-primary px-3 py-1.5 text-label font-bold leading-[13px] text-accent-ink transition hover:bg-primary-hover"
                >
                  Experimentar
                </Link>
              </div>
            </article>
          ))}

          <section className="flex flex-col gap-3 rounded-xl bg-loyalty p-5">
            <span className="text-[13px] font-extrabold uppercase leading-4 tracking-[1px] text-white">
              Próxima visita grátis!
            </span>
            <p className="text-caption font-normal leading-[15px] text-white/90">
              {loyaltyMessage}
            </p>
          </section>
        </div>
      </aside>
    </div>
  )
}

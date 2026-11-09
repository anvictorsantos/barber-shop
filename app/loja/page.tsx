import { Package } from 'lucide-react'
import Link from 'next/link'

import { ProductRow } from '@/components/catalog/ProductRow'
import { PublicDesktopFooter } from '@/components/layout/PublicDesktopFooter'
import { PublicDesktopHeader } from '@/components/layout/PublicDesktopHeader'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SkipLink } from '@/components/layout/SkipLink'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { getSessionUser } from '@/lib/auth/session'
import { groupProductsByCategory, productCategoryFor } from '@/lib/catalog/labels'
import { getActiveProducts } from '@/lib/catalog/queries'
import { getFavoriteIds } from '@/lib/customer/queries'
import { getShopHours, getShopSettings } from '@/lib/settings/queries'
import { formatHourLabel, hoursRangeFor } from '@/lib/time/schedule'
import { cn } from '@/lib/utils'

import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Loja — Barbearia do Luiz',
  description: 'Pomadas, óleos e bebidas para retirar na barbearia.',
}

export default async function StorePage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string | string[] }>
}) {
  const [user, products, shop, hours, params] = await Promise.all([
    getSessionUser(),
    getActiveProducts(),
    getShopSettings(),
    getShopHours(),
    searchParams,
  ])
  const favoriteIds = await getFavoriteIds(user?.role === 'CUSTOMER' ? user.id : null)
  const canFavorite = user?.role === 'CUSTOMER'

  const shopName = shop?.name ?? 'Barbearia do Luiz'
  const city = shop?.city ?? 'Belo Horizonte'
  const state = shop?.state ?? 'MG'
  const whatsapp = (shop?.whatsapp ?? '+5531988815243').replace(/\D/g, '')
  const address = shop?.addressLine ?? 'Rua dos Geólogos, 698 — Alípio de Melo'

  const weekdayRange = hoursRangeFor(hours, [1, 2, 3, 4, 5])
  const saturdayRange = hoursRangeFor(hours, [6])

  const meta = [
    weekdayRange
      ? {
          label: 'Seg a sex',
          value: `${formatHourLabel(weekdayRange.openMinute)} às ${formatHourLabel(weekdayRange.closeMinute)}`,
        }
      : null,
    saturdayRange
      ? {
          label: 'Sábado',
          value: `${formatHourLabel(saturdayRange.openMinute)} às ${formatHourLabel(saturdayRange.closeMinute)}`,
        }
      : null,
    { label: 'Endereço', value: address },
  ].filter((row): row is { label: string; value: string } => row !== null)

  const groups = groupProductsByCategory(products)
  const requested = typeof params.categoria === 'string' ? params.categoria : undefined
  const activeCategory = groups.find((group) => group.category === requested)?.category
  const visibleProducts = activeCategory
    ? products.filter((product) => productCategoryFor(product) === activeCategory)
    : groups.flatMap((group) => group.products)

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
            active="store"
          />
        </div>

        <section className="flex w-full flex-1 flex-col px-6 pb-16 pt-8 lg:px-10 lg:pb-20 lg:pt-11">
          <div className="flex flex-col gap-7 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end lg:gap-14">
            <div className="flex flex-col gap-4">
              <SectionLabel>Retirada na barbearia</SectionLabel>
              <h1 className="font-display text-[40px] font-semibold leading-[1.05] text-text lg:text-[48px]">
                Loja
              </h1>
              <p className="max-w-[440px] text-lead leading-relaxed text-muted">
                Pomadas, óleos e bebidas para retirar no balcão. Sem entrega, sem taxa.
              </p>
            </div>

            <div className="flex flex-col gap-2 text-caption lg:border-l lg:border-border-strong lg:pl-6">
              {meta.map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between gap-6 border-b border-border pb-2"
                >
                  <span className="text-muted">{row.label}</span>
                  <span className="text-right tabular-nums text-text-secondary">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-b border-border">
            <div className="flex flex-wrap items-center gap-x-6">
              <Link
                href="/loja"
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
                  href={`/loja?categoria=${group.category}`}
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
              {visibleProducts.length} {visibleProducts.length === 1 ? 'produto' : 'produtos'}
            </span>
          </div>

          {visibleProducts.length === 0 ? (
            <Card className="mt-9">
              <EmptyState
                icon={Package}
                title="Nenhum produto disponível"
                description="Ainda não há produtos por aqui. Volte em breve para conferir as novidades."
              />
            </Card>
          ) : (
            <>
              <div>
                {visibleProducts.map((product, index) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    index={index}
                    favorite={{
                      canFavorite,
                      saved: favoriteIds.products.has(product.id),
                    }}
                  />
                ))}
              </div>

              <div className="mt-6 text-caption text-muted">
                Sem entrega: a retirada é no balcão.
              </div>
            </>
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

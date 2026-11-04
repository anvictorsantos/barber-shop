import { MapPin, Package } from 'lucide-react'

import { ProductCard } from '@/components/catalog/ProductCard'
import { PublicDesktopFooter } from '@/components/layout/PublicDesktopFooter'
import { PublicDesktopHeader } from '@/components/layout/PublicDesktopHeader'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SkipLink } from '@/components/layout/SkipLink'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { getSessionUser } from '@/lib/auth/session'
import { getActiveProducts } from '@/lib/catalog/queries'
import { getFavoriteIds } from '@/lib/customer/queries'
import { getShopSettings } from '@/lib/settings/queries'

import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Loja — Barbearia do Luiz',
  description: 'Pomadas, óleos e bebidas para retirar na barbearia.',
}

export default async function StorePage() {
  const [user, products, shop] = await Promise.all([
    getSessionUser(),
    getActiveProducts(),
    getShopSettings(),
  ])
  const favoriteIds = await getFavoriteIds(user?.role === 'CUSTOMER' ? user.id : null)
  const canFavorite = user?.role === 'CUSTOMER'

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
            active="store"
          />
        </div>

        <section className="flex w-full flex-1 flex-col gap-8 px-5 pb-16 pt-6 lg:px-10 lg:pt-10 xl:px-20">
          <div className="flex flex-col gap-2.5">
            <span className="text-label font-bold uppercase tracking-[1.8px] text-accent">
              Loja · Retirada na barbearia
            </span>
            <h1 className="font-display text-[32px] font-bold leading-[1.2] text-text lg:text-[38px]">
              Loja
            </h1>
            <p className="text-[15px] leading-[1.5] text-muted">
              Produtos selecionados para levar no mesmo dia. Retirada na barbearia.
            </p>
          </div>

          <p className="flex items-center gap-2 text-caption text-muted">
            <MapPin
              className="h-4 w-4 text-primary"
              aria-hidden
            />
            Retirada na barbearia, sem custo de entrega.
          </p>

          {products.length === 0 ? (
            <Card>
              <EmptyState
                icon={Package}
                title="Nenhum produto disponível"
                description="A barbearia ainda não cadastrou produtos ativos."
              />
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  favorite={{
                    canFavorite,
                    saved: favoriteIds.products.has(product.id),
                  }}
                />
              ))}
            </div>
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

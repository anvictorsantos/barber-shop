import { Package } from 'lucide-react'

import { ProductCard } from '@/components/catalog/ProductCard'
import { PublicDesktopFooter } from '@/components/layout/PublicDesktopFooter'
import { PublicDesktopHeader } from '@/components/layout/PublicDesktopHeader'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SkipLink } from '@/components/layout/SkipLink'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionLabel } from '@/components/ui/SectionLabel'
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

        <section className="flex w-full flex-1 flex-col gap-10 px-6 pb-16 pt-8 lg:px-10 lg:pb-20 lg:pt-10 xl:px-10">
          <div className="flex flex-col gap-4">
            <SectionLabel>Retirada na barbearia</SectionLabel>
            <h1 className="font-display text-[40px] font-semibold leading-[1.05] text-text lg:text-[48px]">
              Loja
            </h1>
            <p className="max-w-[560px] text-lead leading-relaxed text-muted">
              Pomadas, óleos e bebidas para levar no mesmo dia. Sem custo de entrega.
            </p>
          </div>

          {products.length === 0 ? (
            <Card>
              <EmptyState
                icon={Package}
                title="Nenhum produto disponível"
                description="Ainda não há produtos por aqui. Volte em breve para conferir as novidades."
              />
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
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

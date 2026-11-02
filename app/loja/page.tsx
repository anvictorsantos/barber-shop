import { MapPin, Package } from 'lucide-react'

import { ProductCard } from '@/components/catalog/ProductCard'
import { PublicShell } from '@/components/layout/PublicShell'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { getSessionUser } from '@/lib/auth/session'
import { getActiveProducts } from '@/lib/catalog/queries'
import { getFavoriteIds } from '@/lib/customer/queries'

import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Loja — Barbearia do Luiz',
  description: 'Pomadas, óleos e bebidas para retirar na barbearia.',
}

export default async function StorePage() {
  const user = await getSessionUser()
  const [products, favoriteIds] = await Promise.all([
    getActiveProducts(),
    getFavoriteIds(user?.role === 'CUSTOMER' ? user.id : null),
  ])
  const canFavorite = user?.role === 'CUSTOMER'

  return (
    <PublicShell>
      <div className="mx-auto flex w-full max-w-shell flex-col gap-8 px-4 py-10 sm:px-6">
        <PageHeader
          title="Loja"
          description="Produtos selecionados para levar no mesmo dia."
        />

        <p className="flex items-center gap-2 text-caption text-muted">
          <MapPin
            className="h-4 w-4 text-accent"
            aria-hidden
          />
          Retirada na barbearia.
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
      </div>
    </PublicShell>
  )
}

import { Package } from 'lucide-react'
import Image from 'next/image'

import { FavoriteButton } from '@/components/customer/FavoriteButton'
import { StatusPill } from '@/components/ui/StatusPill'
import { formatBRL } from '@/lib/format/money'

import type { Product } from '@prisma/client'

export function ProductCard({
  product,
  favorite,
}: {
  product: Product
  favorite?: { canFavorite: boolean; saved: boolean }
}) {
  const available = product.stock - product.reserved > 0

  return (
    <article className="relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface">
      {favorite?.canFavorite ? (
        <FavoriteButton
          kind="product"
          id={product.id}
          initial={favorite.saved}
          label={product.name}
          className="absolute right-3 top-3 z-10"
        />
      ) : null}
      <div className="relative aspect-square w-full overflow-hidden bg-surface-input">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted">
            <Package
              className="h-8 w-8"
              aria-hidden
            />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h2 className="text-lead font-bold text-text">{product.name}</h2>
        <p className="text-caption text-muted">{product.description}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <span className="text-lead font-extrabold text-accent">
            {formatBRL(product.priceCents)}
          </span>
          <StatusPill tone={available ? 'success' : 'neutral'}>
            {available ? 'Em estoque' : 'Esgotado'}
          </StatusPill>
        </div>
      </div>
    </article>
  )
}

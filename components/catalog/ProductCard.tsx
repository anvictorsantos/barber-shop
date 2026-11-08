import Image from 'next/image'

import { ProductVisual } from '@/components/catalog/ProductVisual'
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
    <article className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-border-strong">
      {favorite?.canFavorite ? (
        <FavoriteButton
          kind="product"
          id={product.id}
          initial={favorite.saved}
          label={product.name}
          variant="bare"
          className="absolute right-4 top-4 z-10"
        />
      ) : null}

      <div className="relative aspect-[4/5] w-full overflow-hidden">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw"
            className="object-cover"
          />
        ) : (
          <ProductVisual product={product} />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h2 className="text-body font-medium text-text">{product.name}</h2>
        <p className="line-clamp-2 text-caption leading-relaxed text-muted">
          {product.description}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <span className="text-lead font-medium tabular-nums text-text">
            {formatBRL(product.priceCents)}
          </span>
          <StatusPill
            tone={available ? 'success' : 'neutral'}
            className={available ? 'hidden sm:inline-flex' : ''}
          >
            {available ? 'Em estoque' : 'Esgotado'}
          </StatusPill>
        </div>
      </div>
    </article>
  )
}

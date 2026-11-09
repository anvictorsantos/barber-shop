import Image from 'next/image'

import { ProductVisual } from '@/components/catalog/ProductVisual'
import { FavoriteButton } from '@/components/customer/FavoriteButton'
import { formatBRL } from '@/lib/format/money'

import type { Product } from '@prisma/client'

export function ProductRow({
  product,
  index,
  favorite,
}: {
  product: Product
  index: number
  favorite?: { canFavorite: boolean; saved: boolean }
}) {
  const available = product.stock - product.reserved

  return (
    <article className="grid grid-cols-[20px_56px_minmax(0,1fr)_auto_auto] items-center gap-x-3 border-b border-border py-4 lg:grid-cols-[36px_88px_minmax(0,1fr)_132px_104px_40px] lg:gap-5 lg:py-5">
      <span className="text-caption tabular-nums text-accent">
        {String(index + 1).padStart(2, '0')}
      </span>

      <div className="relative h-[58px] w-[56px] overflow-hidden rounded-md bg-[#181511] lg:h-[84px] lg:w-[88px]">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 88px, 56px"
            className="object-cover"
          />
        ) : (
          <div
            aria-hidden
            className="absolute left-1/2 top-1/2 h-[150px] w-[150px] -translate-x-1/2 -translate-y-1/2 scale-[0.42] lg:scale-[0.58]"
          >
            <ProductVisual product={product} />
          </div>
        )}
      </div>

      <div className="min-w-0">
        <h2 className="text-body font-medium leading-snug text-text lg:text-[21px]">
          {product.name}
        </h2>
        <p className="mt-0.5 line-clamp-2 text-caption text-muted lg:text-[13px]">
          {product.description}
        </p>
      </div>

      <span className="hidden font-mono text-caption tabular-nums text-muted lg:block">
        {available > 0 ? `${available} em estoque` : 'Esgotado'}
      </span>

      <span className="text-right text-body tabular-nums text-text lg:text-[20px]">
        {formatBRL(product.priceCents)}
      </span>

      <div className="justify-self-end">
        {favorite?.canFavorite ? (
          <FavoriteButton
            kind="product"
            id={product.id}
            initial={favorite.saved}
            label={product.name}
            variant="badge"
          />
        ) : null}
      </div>
    </article>
  )
}

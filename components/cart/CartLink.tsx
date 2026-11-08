'use client'

import { ShoppingBag } from 'lucide-react'
import Link from 'next/link'

import { useCart } from '@/lib/cart/useCart'

export function CartLink() {
  const items = useCart()

  return (
    <Link
      href="/carrinho"
      aria-label={`Carrinho (${items.length})`}
      className="relative flex h-10 w-10 items-center justify-center rounded-md border border-border-strong text-muted transition-colors hover:border-accent/60 hover:text-accent"
    >
      <ShoppingBag
        className="h-4 w-4"
        aria-hidden
      />
      {items.length > 0 ? (
        <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold tabular-nums text-accent-ink">
          {items.length}
        </span>
      ) : null}
    </Link>
  )
}

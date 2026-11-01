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
      className="relative flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted transition hover:border-accent hover:text-accent"
    >
      <ShoppingBag
        className="h-4 w-4"
        aria-hidden
      />
      {items.length > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
          {items.length}
        </span>
      ) : null}
    </Link>
  )
}

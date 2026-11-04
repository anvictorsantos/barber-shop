'use client'

import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/Button'
import { addCartItem, type CartItem } from '@/lib/cart/store'

export function AddToCartButton({ item }: { item: Omit<CartItem, 'id'> }) {
  const router = useRouter()

  function add() {
    addCartItem(item)
    router.push('/carrinho')
    router.refresh()
  }

  return (
    <Button
      type="button"
      size="lg"
      className="h-[52px] w-fit rounded-md px-[22px] text-sm"
      onClick={add}
    >
      Confirmar e adicionar ao carrinho
    </Button>
  )
}

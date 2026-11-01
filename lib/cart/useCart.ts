'use client'

import { useSyncExternalStore } from 'react'

import type { CartItem } from '@/lib/cart/store'
import { getCartItems, subscribeCart } from '@/lib/cart/store'

const EMPTY: CartItem[] = []

export function useCart(): CartItem[] {
  return useSyncExternalStore(subscribeCart, getCartItems, () => EMPTY)
}

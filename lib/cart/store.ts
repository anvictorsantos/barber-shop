export interface CartItem {
  id: string
  serviceId: string
  serviceName: string
  barberId: string
  barberName: string
  startAt: string
  durationMin: number
  priceCents: number
}

const STORAGE_KEY = 'bl.cart.v1'
const EVENT_NAME = 'bl:cart'
const EMPTY: CartItem[] = []

let cache: CartItem[] | null = null

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return (
    typeof item.id === 'string' &&
    typeof item.serviceId === 'string' &&
    typeof item.serviceName === 'string' &&
    typeof item.barberId === 'string' &&
    typeof item.barberName === 'string' &&
    typeof item.startAt === 'string' &&
    typeof item.durationMin === 'number' &&
    typeof item.priceCents === 'number'
  )
}

function readStorage(): CartItem[] {
  if (typeof window === 'undefined') return EMPTY
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isCartItem) : EMPTY
  } catch {
    return EMPTY
  }
}

export function getCartItems(): CartItem[] {
  cache ??= readStorage()
  return cache
}

export function subscribeCart(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined

  const onCustom = () => listener()
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      cache = null
      listener()
    }
  }

  window.addEventListener(EVENT_NAME, onCustom)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(EVENT_NAME, onCustom)
    window.removeEventListener('storage', onStorage)
  }
}

export function setCartItems(items: CartItem[]): void {
  cache = items
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Storage can be unavailable; the in-memory cart still works for this tab.
  }

  window.dispatchEvent(new Event(EVENT_NAME))
}

export function addCartItem(item: Omit<CartItem, 'id'>): CartItem {
  const withId: CartItem = {
    ...item,
    id: globalThis.crypto?.randomUUID?.() ?? String(Date.now()),
  }
  setCartItems([...getCartItems(), withId])
  return withId
}

export function removeCartItem(id: string): void {
  setCartItems(getCartItems().filter((item) => item.id !== id))
}

export function clearCart(): void {
  setCartItems([])
}

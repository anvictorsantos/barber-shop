export interface OrderActor {
  id: string
  name: string
  email: string | null
  phone: string | null
}

export type CreateOrderActionResult =
  { ok: true; code: string; publicToken: string; initPoint?: string } | { ok: false; error: string }

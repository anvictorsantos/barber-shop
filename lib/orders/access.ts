import type { SessionUser } from '@/lib/auth/session'

interface OrderAccessView {
  publicToken: string
  customerId: string | null
  appointments: { barber: { userId: string } }[]
}

export function canViewOrder(
  order: OrderAccessView,
  user: SessionUser | null,
  token: string | undefined,
): boolean {
  if (token && token === order.publicToken) return true
  if (!user) return false
  if (user.role === 'OWNER') return true
  if (user.role === 'BARBER') {
    return order.appointments.some((item) => item.barber.userId === user.id)
  }
  return order.customerId === user.id
}

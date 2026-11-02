import type { StatusTone } from '@/components/ui/StatusPill'

import type { OrderStatus } from '@prisma/client'

export function orderStatusLabel(status: OrderStatus): string {
  switch (status) {
    case 'PENDING_PAYMENT':
      return 'Aguardando pagamento'
    case 'OPEN':
      return 'Reserva recebida'
    case 'PAID':
      return 'Pago'
    case 'PARTIALLY_REFUNDED':
      return 'Parcialmente reembolsado'
    case 'REFUNDED':
      return 'Reembolsado'
    case 'CANCELED':
      return 'Cancelado'
    case 'EXPIRED':
      return 'Expirado'
    default:
      return status
  }
}

export function orderStatusTone(status: OrderStatus): StatusTone {
  switch (status) {
    case 'PAID':
      return 'success'
    case 'PENDING_PAYMENT':
    case 'PARTIALLY_REFUNDED':
      return 'warning'
    case 'CANCELED':
      return 'danger'
    case 'OPEN':
      return 'primary'
    default:
      return 'neutral'
  }
}

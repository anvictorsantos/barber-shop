import { ptBR } from 'date-fns/locale'
import { formatInTimeZone } from 'date-fns-tz'

import { BUSINESS_TIMEZONE } from '@/lib/availability/slots'

export function formatBookingDateTime(iso: string): string {
  return formatInTimeZone(new Date(iso), BUSINESS_TIMEZONE, "EEE, dd 'de' MMMM 'às' HH:mm", {
    locale: ptBR,
  })
}

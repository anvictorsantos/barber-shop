'use client'

import { ptBR } from 'date-fns/locale'
import { formatInTimeZone } from 'date-fns-tz'

import { BookingOverview } from '@/components/booking/BookingOverview'
import { BUSINESS_TIMEZONE } from '@/lib/availability/slots'
import { useCart } from '@/lib/cart/useCart'
import { formatBRL } from '@/lib/format/money'

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function BookingCartOverview({ address }: { address: string }) {
  const items = useCart()
  const latest = items.at(-1) ?? null

  if (!latest) {
    return (
      <BookingOverview
        service={null}
        address={address}
        emptyMessage="Nenhum serviço no carrinho. Escolha um serviço para começar."
        className="xl:w-[360px]"
      />
    )
  }

  const total = items.reduce((sum, item) => sum + item.priceCents, 0)
  const startAt = new Date(latest.startAt)

  return (
    <BookingOverview
      service={{
        name: latest.serviceName,
        imageUrl: null,
        meta: items.length > 1 ? `${items.length} serviços` : `${latest.durationMin} min`,
      }}
      barber={{ displayName: latest.barberName, avatarUrl: null }}
      dateLabel={capitalize(
        formatInTimeZone(startAt, BUSINESS_TIMEZONE, "EEE, d 'de' MMM", { locale: ptBR }),
      )}
      timeLabel={`${formatInTimeZone(startAt, BUSINESS_TIMEZONE, 'HH:mm')} · ${latest.durationMin} minutos`}
      total={formatBRL(total)}
      address={address}
      actionHref="/carrinho"
      actionLabel="Ver carrinho"
      className="xl:w-[360px]"
    />
  )
}

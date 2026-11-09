'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

import { buttonClasses } from '@/components/ui/Button'
import type { HomeHeroBooking } from '@/lib/home/queries'
import { cn } from '@/lib/utils'

export function HeroBookingCard({ booking }: { booking: HomeHeroBooking }) {
  const [selected, setSelected] = useState(0)
  const slot = booking.slots[selected] ?? booking.slots[0]
  const ctaHref = slot
    ? `/agendar/resumo?serviceId=${encodeURIComponent(booking.serviceId)}&barberId=${encodeURIComponent(booking.barberId)}&startAt=${encodeURIComponent(slot.startAt)}`
    : `/agendar/${booking.serviceId}/profissional`

  return (
    <aside
      aria-label="Agendar horário"
      className="rounded-xl border border-border-strong bg-surface p-5 shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
    >
      <div className="flex items-start justify-between gap-3">
        <Image
          src="/brand/logo.png"
          alt="Barbearia do Luiz"
          width={774}
          height={880}
          className="h-14 w-auto"
        />
        <span className="text-caption text-muted">Agendar</span>
      </div>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-title font-medium text-text">{booking.serviceName}</p>
          <p className="mt-0.5 text-caption text-muted">{booking.durationMin} min</p>
        </div>
        <span className="text-title font-medium tabular-nums text-text">{booking.price}</span>
      </div>

      <div className="mt-4 hidden items-center gap-2.5 sm:flex">
        <span className="grid h-8 w-8 place-items-center rounded-sm border border-accent/40 font-display text-caption text-accent">
          {booking.barberInitials}
        </span>
        <div>
          <p className="text-body font-medium text-text">{booking.barberName}</p>
          <p className="text-caption text-muted">{booking.barberTitle}</p>
        </div>
      </div>

      {booking.slots.length > 0 ? (
        <>
          <p className="mt-4 text-caption text-muted">
            {booking.dateLabel}
            <span className="sm:hidden"> · {booking.barberName}</span>
          </p>
          <div className="mt-2 flex gap-2">
            {booking.slots.map((item, index) => (
              <button
                key={item.startAt}
                type="button"
                aria-pressed={index === selected}
                onClick={() => setSelected(index)}
                className={cn(
                  'h-9 flex-1 cursor-pointer rounded-sm border text-caption tabular-nums transition-colors',
                  index === selected
                    ? 'border-primary bg-primary font-medium text-accent-ink'
                    : 'border-border text-text-secondary hover:border-border-strong hover:text-text',
                )}
              >
                {item.time}
              </button>
            ))}
          </div>
        </>
      ) : (
        <p className="mt-4 text-caption text-muted">
          Sem horários nesse período. Que tal tentar outro dia?
        </p>
      )}

      <Link
        href={ctaHref}
        className={buttonClasses({ size: 'lg', className: 'mt-4 w-full' })}
      >
        {booking.slots.length > 0 ? `Continuar com ${slot?.time ?? ''}`.trim() : 'Ver horários'}
      </Link>

      <p className="mt-3 text-center text-micro text-subtle">
        {booking.slots.length > 0
          ? 'Confirmação pelo WhatsApp'
          : 'Escolha o profissional e o horário'}
      </p>
    </aside>
  )
}

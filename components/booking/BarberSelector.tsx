'use client'

import { ChevronRight, MapPin, Scissors, ShieldCheck, Star, UserRound } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

import { buttonClasses } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export interface SelectableBarber {
  id: string
  displayName: string
  title: string
  avatarUrl: string | null
  rating: string
  ratingCount: number
}

export interface SelectableService {
  id: string
  name: string
  durationMin: number
  price: string
  promoLabel: string | null
  imageUrl: string | null
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function BarberSelector({
  service,
  barbers,
  address,
}: {
  service: SelectableService
  barbers: SelectableBarber[]
  address: string
}) {
  const [selectedId, setSelectedId] = useState(barbers[0]?.id ?? '')
  const selected = barbers.find((barber) => barber.id === selectedId) ?? null
  const scheduleHref = selected
    ? `/agendar/${service.id}/horario?barberId=${selected.id}`
    : `/agendar/${service.id}/profissional`

  return (
    <div className="flex flex-col gap-8 xl:flex-row xl:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 xl:gap-[18px]">
          {barbers.map((barber) => {
            const isSelected = barber.id === selectedId

            return (
              <article
                key={barber.id}
                className={cn(
                  'flex flex-col gap-[22px] rounded-xl bg-surface p-6 transition',
                  isSelected ? 'border-2 border-primary' : 'border border-white/10',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-label font-bold text-accent">
                    <Star
                      aria-hidden
                      className="h-3 w-3 fill-accent"
                    />
                    {barber.rating}
                    <span className="font-normal text-muted">({barber.ratingCount})</span>
                  </span>
                  <span
                    aria-hidden
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full border',
                      isSelected ? 'border-primary bg-primary' : 'border-muted',
                    )}
                  >
                    {isSelected ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
                  </span>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border-2 border-accent bg-surface-input">
                    {barber.avatarUrl ? (
                      <Image
                        src={barber.avatarUrl}
                        alt={barber.displayName}
                        fill
                        sizes="112px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center text-[25px] font-bold text-accent">
                        {initials(barber.displayName)}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <h2 className="text-[25px] font-bold leading-[30px] text-text">
                      {barber.displayName}
                    </h2>
                    <p className="min-h-[40px] text-center text-caption leading-[1.6] text-muted">
                      {barber.title}
                    </p>
                    <span className="flex items-center gap-1.5 text-label font-semibold text-success">
                      <span
                        aria-hidden
                        className="h-1.5 w-1.5 rounded-full bg-success"
                      />
                      Disponível
                    </span>
                  </div>
                </div>

                {isSelected ? (
                  <Link
                    href={scheduleHref}
                    className={buttonClasses({
                      size: 'lg',
                      className: 'h-[52px] w-full rounded-md px-[22px] text-sm',
                    })}
                  >
                    Continuar
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedId(barber.id)}
                    className={buttonClasses({
                      variant: 'outline',
                      size: 'lg',
                      className: 'h-[52px] w-full rounded-md px-[22px] text-sm',
                    })}
                  >
                    Escolher
                  </button>
                )}
              </article>
            )
          })}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-caption text-muted">Escolha um profissional para continuar.</span>
          <Link
            href={scheduleHref}
            className={buttonClasses({
              size: 'lg',
              className: 'h-[52px] w-full gap-2.5 rounded-md px-[22px] text-sm sm:w-[230px]',
            })}
          >
            Continuar para horário
            <ChevronRight
              aria-hidden
              className="h-[18px] w-[18px]"
            />
          </Link>
        </div>
      </div>

      <aside className="flex shrink-0 flex-col gap-[22px] rounded-xl border border-white/10 bg-surface p-7 xl:w-[360px]">
        <h2 className="text-[17px] font-bold leading-[21px] text-text">Seu agendamento</h2>

        <div className="flex items-center gap-3.5">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-input">
            {service.imageUrl ? (
              <Image
                src={service.imageUrl}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <Scissors
                aria-hidden
                className="h-6 w-6 text-muted"
              />
            )}
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className="truncate text-base font-bold leading-[19px] text-text">
              {service.name}
            </span>
            <span className="text-label text-accent">
              {service.promoLabel ?? `${service.durationMin} min`}
            </span>
          </div>
        </div>

        <div className="h-px w-full bg-white/10" />

        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-input">
            {selected?.avatarUrl ? (
              <Image
                src={selected.avatarUrl}
                alt=""
                fill
                sizes="40px"
                className="object-cover"
              />
            ) : (
              <UserRound
                aria-hidden
                className="h-4 w-4 text-muted"
              />
            )}
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-label text-muted">Profissional</span>
            <span className="text-sm font-semibold leading-[17px] text-text">
              {selected?.displayName ?? 'A escolher'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-body text-muted">Total</span>
          <span className="text-[25px] font-bold leading-[30px] text-accent">{service.price}</span>
        </div>

        <p className="flex items-start gap-2.5 text-caption leading-[1.6] text-muted">
          <ShieldCheck
            aria-hidden
            className="mt-0.5 h-[18px] w-[18px] shrink-0 text-success"
          />
          Cancelamento gratuito com até 2h de antecedência.
        </p>

        <div className="h-px w-full bg-white/10" />

        <p className="flex items-start gap-2.5 text-caption leading-[1.6] text-muted">
          <MapPin
            aria-hidden
            className="mt-0.5 h-[18px] w-[18px] shrink-0 text-primary"
          />
          {address}
        </p>

        <p className="text-label leading-[1.5] text-muted">Não precisa de conta para agendar.</p>
      </aside>
    </div>
  )
}

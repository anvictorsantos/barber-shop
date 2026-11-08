import { CalendarDays, MapPin, Scissors, ShieldCheck, UserRound } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { cn } from '@/lib/utils'

import type { ReactNode } from 'react'

export interface OverviewService {
  name: string
  imageUrl: string | null
  meta: string
}

export interface OverviewBarber {
  displayName: string
  avatarUrl: string | null
}

export function BookingOverview({
  service = null,
  barber = null,
  dateLabel = null,
  timeLabel = null,
  total = null,
  address = null,
  title = 'Seu agendamento',
  titleClassName,
  emptyMessage = 'Nenhum serviço no carrinho.',
  actionHref = null,
  actionLabel = null,
  className,
  children,
}: {
  service?: OverviewService | null
  barber?: OverviewBarber | null
  dateLabel?: string | null
  timeLabel?: string | null
  total?: string | null
  address?: string | null
  title?: string
  titleClassName?: string
  emptyMessage?: string
  actionHref?: string | null
  actionLabel?: string | null
  className?: string
  children?: ReactNode
}) {
  return (
    <aside
      className={cn(
        'flex flex-col gap-5 rounded-lg border border-border bg-surface p-6',
        className,
      )}
    >
      <h2 className={cn('text-lead font-medium text-text', titleClassName)}>{title}</h2>

      {children ?? (
        <>
          {service ? (
            <>
              <div className="flex items-center gap-3.5">
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-subtle">
                  {service.imageUrl ? (
                    <Image
                      src={service.imageUrl}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    <Scissors
                      aria-hidden
                      className="h-5 w-5 text-muted"
                    />
                  )}
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="truncate text-body font-medium text-text">{service.name}</span>
                  <span className="text-caption text-muted">{service.meta}</span>
                </div>
              </div>

              <div className="border-t border-border" />

              {barber ? (
                <div className="flex items-center gap-3">
                  <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-subtle">
                    {barber.avatarUrl ? (
                      <Image
                        src={barber.avatarUrl}
                        alt=""
                        fill
                        sizes="36px"
                        className="object-cover"
                      />
                    ) : (
                      <UserRound
                        aria-hidden
                        className="h-4 w-4 text-muted"
                      />
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-caption text-muted">Profissional</span>
                    <span className="text-body font-medium text-text">{barber.displayName}</span>
                  </div>
                </div>
              ) : null}

              {dateLabel ? (
                <div className="flex items-center gap-3">
                  <CalendarDays
                    aria-hidden
                    className="h-4 w-4 shrink-0 text-muted"
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-body font-medium text-text">{dateLabel}</span>
                    {timeLabel ? (
                      <span className="text-caption text-muted">{timeLabel}</span>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {total ? (
                <div className="flex items-baseline justify-between gap-4 border-t border-border pt-4">
                  <span className="text-body text-muted">Total</span>
                  <span className="text-title font-medium tabular-nums text-text">{total}</span>
                </div>
              ) : null}

              <p className="flex items-start gap-2 text-caption leading-relaxed text-muted">
                <ShieldCheck
                  aria-hidden
                  className="mt-0.5 h-4 w-4 shrink-0"
                />
                Cancelamento gratuito com até 2h de antecedência.
              </p>
            </>
          ) : (
            <p className="text-body leading-relaxed text-muted">{emptyMessage}</p>
          )}

          {address ? (
            <p className="flex items-start gap-2 text-caption leading-relaxed text-muted">
              <MapPin
                aria-hidden
                className="mt-0.5 h-4 w-4 shrink-0"
              />
              {address}
            </p>
          ) : null}

          <p className="text-caption text-subtle">Não precisa de conta para agendar.</p>

          {actionHref && actionLabel ? (
            <Link
              href={actionHref}
              className="w-fit text-caption font-medium text-accent transition-colors hover:text-accent-hover"
            >
              {actionLabel}
            </Link>
          ) : null}
        </>
      )}
    </aside>
  )
}

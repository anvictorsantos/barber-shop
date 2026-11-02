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
        'flex flex-col gap-[22px] rounded-xl border border-white/10 bg-surface p-7',
        className,
      )}
    >
      <h2 className={cn('text-[17px] font-bold leading-[21px] text-text', titleClassName)}>
        {title}
      </h2>

      {children ?? (
        <>
          {service ? (
            <>
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
                  <span className="text-label text-accent">{service.meta}</span>
                </div>
              </div>

              <div className="h-px w-full bg-white/10" />

              {barber ? (
                <div className="flex items-center gap-3">
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-input">
                    {barber.avatarUrl ? (
                      <Image
                        src={barber.avatarUrl}
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
                      {barber.displayName}
                    </span>
                  </div>
                </div>
              ) : null}

              {dateLabel ? (
                <div className="flex items-center gap-3">
                  <CalendarDays
                    aria-hidden
                    className="h-5 w-5 shrink-0 text-accent"
                  />
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold leading-[17px] text-text">
                      {dateLabel}
                    </span>
                    {timeLabel ? (
                      <span className="text-caption text-muted">{timeLabel}</span>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {total ? (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-body text-muted">Total</span>
                  <span className="text-[25px] font-bold leading-[30px] text-accent">{total}</span>
                </div>
              ) : null}

              <p className="flex items-start gap-2.5 text-caption leading-[1.6] text-muted">
                <ShieldCheck
                  aria-hidden
                  className="mt-0.5 h-[18px] w-[18px] shrink-0 text-success"
                />
                Cancelamento gratuito com até 2h de antecedência.
              </p>

              <div className="h-px w-full bg-white/10" />
            </>
          ) : (
            <p className="text-caption leading-[1.6] text-muted">{emptyMessage}</p>
          )}

          {address ? (
            <p className="flex items-start gap-2.5 text-caption leading-[1.6] text-muted">
              <MapPin
                aria-hidden
                className="mt-0.5 h-[18px] w-[18px] shrink-0 text-primary"
              />
              {address}
            </p>
          ) : null}

          <p className="text-label leading-[1.5] text-muted">Não precisa de conta para agendar.</p>

          {actionHref && actionLabel ? (
            <Link
              href={actionHref}
              className="w-fit text-caption font-semibold text-primary underline underline-offset-2 transition hover:text-primary-hover"
            >
              {actionLabel}
            </Link>
          ) : null}
        </>
      )}
    </aside>
  )
}

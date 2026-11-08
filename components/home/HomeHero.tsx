import { ChevronRight, MapPin } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { HeroBookingCard } from '@/components/home/HeroBookingCard'
import { HERO_IMAGE } from '@/lib/catalog/images'
import type { HomeHeroBooking } from '@/lib/home/queries'
import { cn } from '@/lib/utils'

export function HomeHero({
  open,
  statusDetail,
  address,
  booking,
}: {
  open: boolean
  statusDetail: string
  address: string
  booking: HomeHeroBooking | null
}) {
  return (
    <section className="relative isolate flex min-h-[calc(100dvh-4rem)] flex-col overflow-hidden bg-shell lg:min-h-dvh">
      <Image
        src={HERO_IMAGE}
        alt="Barbeiro finalizando um corte na Barbearia do Luiz"
        fill
        priority
        sizes="100vw"
        className="object-cover object-[62%_42%]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(12,11,10,0.96)_0%,rgba(12,11,10,0.8)_38%,rgba(12,11,10,0.28)_72%,rgba(12,11,10,0.06)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-[linear-gradient(0deg,rgba(12,11,10,0.94)_0%,rgba(12,11,10,0)_100%)]" />

      <div className="relative mx-auto flex w-full max-w-shell flex-1 flex-col px-6 pb-8 pt-8 lg:px-10 lg:pb-10 lg:pt-48">
        <div className="max-w-[560px]">
          <p className="flex flex-wrap items-center gap-2 text-caption">
            <span
              aria-hidden
              className={cn('h-1.5 w-1.5 rotate-45', open ? 'bg-success' : 'bg-accent')}
            />
            <span className={cn('font-medium', open ? 'text-success' : 'text-text')}>
              {open ? 'Aberto agora' : 'Fechado agora'}
            </span>
            <span className="text-subtle">·</span>
            <span className="text-text-secondary">{statusDetail}</span>
          </p>

          <h1 className="mt-6 font-display text-[44px] font-semibold leading-[1.03] text-text sm:text-[56px] lg:text-[68px]">
            Seu estilo, no capricho.
          </h1>

          <p className="mt-5 max-w-[470px] text-lead leading-relaxed text-text-secondary">
            Corte bem-feito, atenção aos detalhes e aquele atendimento que faz você se sentir em
            casa.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href="/servicos"
              className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-body font-medium text-accent-ink transition-colors hover:bg-primary-hover"
            >
              Agendar meu horário
            </Link>
            <Link
              href="/servicos"
              className="inline-flex items-center gap-1.5 text-body text-text-secondary transition-colors hover:text-text"
            >
              Conhecer os serviços
              <ChevronRight
                aria-hidden
                className="h-4 w-4"
              />
            </Link>
          </div>

          <p className="mt-8 flex items-center gap-2 text-caption text-text-secondary/80">
            <MapPin
              aria-hidden
              className="h-4 w-4 shrink-0 text-accent"
            />
            {address}
          </p>
        </div>

        {booking ? (
          <div className="mt-8 w-full max-w-[420px] lg:absolute lg:bottom-10 lg:right-10 lg:mt-0 lg:w-[380px] lg:max-w-none">
            <HeroBookingCard booking={booking} />
          </div>
        ) : null}
      </div>
    </section>
  )
}

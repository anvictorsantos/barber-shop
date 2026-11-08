import { ChevronRight, MapPin } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { HERO_IMAGE } from '@/lib/catalog/images'

export function HomeHero({
  open,
  todayLabel,
  address,
}: {
  open: boolean
  todayLabel: string
  address: string
}) {
  return (
    <section className="relative isolate flex min-h-[calc(100dvh-4rem)] items-end overflow-hidden bg-shell lg:min-h-[calc(100dvh-5rem)]">
      <Image
        src={HERO_IMAGE}
        alt="Barbeiro finalizando um corte na Barbearia do Luiz"
        fill
        priority
        sizes="100vw"
        className="object-cover object-[62%_42%]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(12,11,10,0.95)_0%,rgba(12,11,10,0.78)_38%,rgba(12,11,10,0.24)_72%,rgba(12,11,10,0.08)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-[linear-gradient(0deg,rgba(12,11,10,0.92)_0%,rgba(12,11,10,0)_100%)]" />

      <div className="relative mx-auto w-full max-w-shell px-6 pb-32 pt-28 lg:px-10 lg:pb-24">
        <div className="max-w-[640px]">
          <p className="flex flex-wrap items-center gap-2 text-caption text-text-secondary">
            <span
              aria-hidden
              className={
                open ? 'h-2 w-2 rounded-full bg-success' : 'h-2 w-2 rounded-full bg-subtle'
              }
            />
            <span className={open ? 'text-success' : 'text-muted'}>
              {open ? 'Aberto agora' : 'Fechado'}
            </span>
            <span className="text-subtle">·</span>
            <span>{todayLabel}</span>
          </p>

          <h1 className="mt-6 font-display text-[44px] font-semibold leading-[1.04] text-text sm:text-[56px] lg:text-[64px]">
            Corte, barba e resenha, no seu horário.
          </h1>

          <p className="mt-5 max-w-[460px] text-lead leading-relaxed text-text-secondary">
            Escolha o serviço, o profissional e o horário. Confirmação em poucos minutos.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href="/servicos"
              className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-body font-medium text-accent-ink transition-colors hover:bg-primary-hover"
            >
              Agendar horário
            </Link>
            <Link
              href="/servicos"
              className="inline-flex items-center gap-1.5 text-body text-text-secondary transition-colors hover:text-text"
            >
              Ver serviços
              <ChevronRight
                aria-hidden
                className="h-4 w-4"
              />
            </Link>
          </div>

          <p className="mt-10 flex items-center gap-2 text-caption text-text-secondary/80">
            <MapPin
              aria-hidden
              className="h-4 w-4 shrink-0 text-accent"
            />
            {address}
          </p>
        </div>
      </div>
    </section>
  )
}

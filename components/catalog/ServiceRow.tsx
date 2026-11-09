import { ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { serviceImage } from '@/lib/catalog/images'
import { formatBRL } from '@/lib/format/money'

import type { Service } from '@prisma/client'

export function ServiceRow({
  service,
  continuar = false,
}: {
  service: Service
  continuar?: boolean
}) {
  return (
    <Link
      href={`/servicos/${service.slug}${continuar ? '?continuar=1' : ''}`}
      className="group -mx-2 flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-surface sm:gap-4"
    >
      <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-surface-subtle sm:h-16 sm:w-[88px]">
        <Image
          src={serviceImage(service)}
          alt=""
          fill
          sizes="88px"
          className="object-cover"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex min-w-0 items-center gap-1.5">
          {service.featured ? (
            <>
              <span
                aria-hidden
                className="h-1.5 w-1.5 shrink-0 rotate-45 bg-accent"
              />
              <span className="sr-only">Destaque: </span>
            </>
          ) : null}
          <span className="truncate text-body font-medium text-text">{service.name}</span>
        </span>
        <span className="hidden truncate text-caption text-muted sm:block">
          {service.description}
        </span>
        <span className="flex items-center gap-1.5 text-caption tabular-nums sm:hidden">
          <span className="text-muted">{service.durationMin} min</span>
          <span className="text-subtle">·</span>
          <span className="text-text-secondary">{formatBRL(service.priceCents)}</span>
        </span>
      </div>

      <span className="hidden w-16 shrink-0 text-right text-caption tabular-nums text-muted sm:block">
        {service.durationMin} min
      </span>

      <span className="hidden w-24 shrink-0 text-right text-body tabular-nums text-text-secondary sm:block">
        {formatBRL(service.priceCents)}
      </span>

      <ChevronRight
        aria-hidden
        className="hidden h-4 w-4 shrink-0 text-subtle transition-colors group-hover:text-accent sm:block"
      />
    </Link>
  )
}

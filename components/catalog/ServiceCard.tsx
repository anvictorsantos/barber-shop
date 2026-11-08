import { ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { serviceImage } from '@/lib/catalog/images'
import { serviceCategoryLabels } from '@/lib/catalog/labels'
import { formatBRL } from '@/lib/format/money'

import type { Service } from '@prisma/client'

export function ServiceCard({
  service,
  continuar = false,
}: {
  service: Service
  continuar?: boolean
}) {
  return (
    <Link
      href={`/servicos/${service.slug}${continuar ? '?continuar=1' : ''}`}
      className="group flex gap-4 rounded-lg border border-border bg-surface p-3 transition-colors hover:border-border-strong"
    >
      <div className="relative h-[120px] w-[104px] shrink-0 overflow-hidden rounded-md bg-surface-subtle">
        <Image
          src={serviceImage(service)}
          alt=""
          fill
          sizes="104px"
          className="object-cover"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col py-1">
        <span className="flex items-center gap-2 text-caption text-muted">
          {serviceCategoryLabels[service.category]}
          {service.promoLabel ? (
            <>
              <span className="text-subtle">·</span>
              <span className="text-accent">{service.promoLabel}</span>
            </>
          ) : null}
        </span>

        <h3 className="mt-1 text-lead font-medium leading-snug text-text">{service.name}</h3>

        <div className="mt-auto flex flex-col gap-2 pt-3 sm:flex-row sm:items-end sm:justify-between">
          <span className="whitespace-nowrap text-body tabular-nums text-text-secondary">
            {formatBRL(service.priceCents)}
            <span className="text-muted"> · {service.durationMin} min</span>
          </span>
          <span className="inline-flex items-center gap-1 text-caption text-accent">
            Agendar
            <ChevronRight
              aria-hidden
              className="h-3.5 w-3.5"
            />
          </span>
        </div>
      </div>
    </Link>
  )
}

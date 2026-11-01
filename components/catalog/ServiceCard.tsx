import { Clock, Scissors } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { formatBRL } from '@/lib/format/money'

import type { Service } from '@prisma/client'

export function ServiceCard({ service }: { service: Service }) {
  return (
    <Link
      href={`/servicos/${service.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition hover:border-accent/40"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-input">
        {service.imageUrl ? (
          <Image
            src={service.imageUrl}
            alt={service.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted">
            <Scissors
              className="h-8 w-8"
              aria-hidden
            />
          </div>
        )}
        {service.promoLabel ? (
          <span className="absolute left-3 top-3 rounded-xs bg-primary px-2 py-1 text-micro font-bold text-white">
            {service.promoLabel}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-lead font-bold text-text">{service.name}</h3>
        <p className="text-caption text-muted">{service.description}</p>

        <div className="mt-auto flex items-center gap-2 pt-2 text-caption text-muted">
          <Clock
            className="h-4 w-4"
            aria-hidden
          />
          {service.durationMin} min
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-lead font-extrabold text-accent">
              {formatBRL(service.priceCents)}
            </span>
            {service.originalPriceCents ? (
              <span className="text-caption text-subtle line-through">
                {formatBRL(service.originalPriceCents)}
              </span>
            ) : null}
          </div>
          <span className="rounded-sm bg-primary px-3 py-2 text-caption font-bold text-white">
            Agendar
          </span>
        </div>
      </div>
    </Link>
  )
}

import { ChevronRight, Scissors } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { buttonClasses } from '@/components/ui/Button'
import { serviceCategoryLabels } from '@/lib/catalog/labels'
import { formatBRL } from '@/lib/format/money'

import type { Service } from '@prisma/client'

export function ServiceCard({ service }: { service: Service }) {
  return (
    <Link
      href={`/servicos/${service.slug}`}
      className={`group flex flex-col gap-4 rounded-xl border bg-surface p-4 transition hover:border-accent/50 lg:min-h-[206px] lg:flex-row lg:gap-5 ${
        service.promoLabel ? 'border-primary' : 'border-white/10'
      }`}
    >
      <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-md bg-surface-input lg:h-[174px] lg:w-[136px]">
        {service.imageUrl ? (
          <Image
            src={service.imageUrl}
            alt={service.name}
            fill
            sizes="(max-width: 1023px) 100vw, 136px"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Scissors
              aria-hidden
              className="h-8 w-8 text-muted"
            />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3.5">
        <span className="text-[9px] font-bold uppercase leading-[11px] tracking-[1.2px] text-accent">
          {serviceCategoryLabels[service.category]}
        </span>
        <h3 className="text-[17px] font-bold leading-[1.3] text-text lg:min-h-[42px]">
          {service.name}
        </h3>
        <span className="text-metric font-bold text-accent">{formatBRL(service.priceCents)}</span>
        <span
          className={buttonClasses({
            size: 'lg',
            className: 'mt-auto h-[52px] w-full gap-2.5 rounded-md px-[22px] text-sm',
          })}
        >
          Agendar
          <ChevronRight
            aria-hidden
            className="h-[18px] w-[18px]"
          />
        </span>
      </div>
    </Link>
  )
}

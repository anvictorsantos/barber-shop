import { ArrowLeft, Clock, Scissors, ShieldCheck } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { FavoriteButton } from '@/components/customer/FavoriteButton'
import { PublicShell } from '@/components/layout/PublicShell'
import { buttonClasses } from '@/components/ui/Button'
import { getSessionUser } from '@/lib/auth/session'
import { getServiceBySlug } from '@/lib/catalog/queries'
import { getFavoriteIds } from '@/lib/customer/queries'
import { formatBRL } from '@/lib/format/money'

import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const service = await getServiceBySlug(slug)

  return {
    title: service ? `${service.name} — Barbearia do Luiz` : 'Serviço — Barbearia do Luiz',
    description: service?.description,
  }
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const service = await getServiceBySlug(slug)
  if (!service) notFound()

  const user = await getSessionUser()
  const favoriteIds =
    user?.role === 'CUSTOMER'
      ? await getFavoriteIds(user.id)
      : { barbers: new Set<string>(), services: new Set<string>(), products: new Set<string>() }

  return (
    <PublicShell>
      <div className="mx-auto w-full max-w-shell px-4 py-10 sm:px-6">
        <Link
          href="/servicos"
          className="mb-6 inline-flex items-center gap-2 text-caption font-semibold text-muted hover:text-text"
        >
          <ArrowLeft
            className="h-4 w-4"
            aria-hidden
          />
          Voltar para serviços
        </Link>

        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-surface-input">
            {service.imageUrl ? (
              <Image
                src={service.imageUrl}
                alt={service.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted">
                <Scissors
                  className="h-10 w-10"
                  aria-hidden
                />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-brand font-extrabold text-text">{service.name}</h1>
                {service.promoLabel ? (
                  <span className="rounded-xs bg-primary px-2 py-1 text-micro font-bold text-white">
                    {service.promoLabel}
                  </span>
                ) : null}
              </div>
              {user?.role === 'CUSTOMER' ? (
                <FavoriteButton
                  kind="service"
                  id={service.id}
                  initial={favoriteIds.services.has(service.id)}
                  label={service.name}
                />
              ) : null}
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <span className="text-metric font-extrabold text-accent">
                {formatBRL(service.priceCents)}
              </span>
              {service.originalPriceCents ? (
                <span className="pb-1 text-body text-subtle line-through">
                  {formatBRL(service.originalPriceCents)}
                </span>
              ) : null}
            </div>

            <div className="h-px w-full bg-border" />

            <div className="flex flex-col gap-2">
              <h2 className="text-lead font-bold text-text">Descrição</h2>
              <p className="text-body leading-relaxed text-muted">{service.description}</p>
            </div>

            <p className="flex items-center gap-2 text-caption font-bold uppercase tracking-wider text-accent">
              <Clock
                className="h-4 w-4"
                aria-hidden
              />
              Tempo estimado: {service.durationMin} minutos
            </p>

            <Link
              href={`/agendar/${service.id}/profissional`}
              className={buttonClasses({ size: 'lg', className: 'w-full sm:w-auto' })}
            >
              Agendar este serviço
            </Link>

            <p className="flex items-center gap-2 text-caption text-muted">
              <ShieldCheck
                className="h-4 w-4 text-success"
                aria-hidden
              />
              Cancelamento gratuito com até 2h de antecedência.
            </p>
          </div>
        </div>
      </div>
    </PublicShell>
  )
}

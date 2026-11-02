import { Heart, Package, Scissors, Users } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { FavoriteButton } from '@/components/customer/FavoriteButton'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusPill } from '@/components/ui/StatusPill'
import { getSessionUser } from '@/lib/auth/session'
import { getFavorites } from '@/lib/customer/queries'
import { formatBRL } from '@/lib/format/money'

import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Favoritos — Barbearia do Luiz',
  robots: { index: false, follow: false },
}

export default async function CustomerFavoritesPage() {
  const user = await getSessionUser()
  if (!user) redirect('/entrar?next=/conta/favoritos')
  if (user.role !== 'CUSTOMER') redirect('/admin')

  const favorites = await getFavorites(user.id)
  const total = favorites.barbers.length + favorites.services.length + favorites.products.length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Favoritos"
        description="Barbeiros, serviços e produtos salvos."
      />

      {total === 0 ? (
        <Card>
          <EmptyState
            icon={Heart}
            title="Nada salvo ainda"
            description="Toque no coração em um serviço, profissional ou produto."
          />
        </Card>
      ) : null}

      {favorites.services.length > 0 ? (
        <Card className="flex flex-col gap-4">
          <h2 className="flex items-center gap-2 text-lead font-bold text-text">
            <Scissors
              className="h-4 w-4 text-accent"
              aria-hidden
            />
            Serviços
          </h2>
          {favorites.services.map((service) => (
            <div
              key={service.id}
              className="flex items-center justify-between gap-3 border-t border-border pt-3 first:border-0 first:pt-0"
            >
              <div className="flex min-w-0 flex-col">
                <Link
                  href={`/servicos/${service.slug}`}
                  className="truncate text-caption font-bold text-text hover:text-accent"
                >
                  {service.name}
                </Link>
                <span className="text-micro text-muted">
                  {service.durationMin} min · {formatBRL(service.priceCents)}
                </span>
              </div>
              <FavoriteButton
                kind="service"
                id={service.id}
                initial
                label={service.name}
              />
            </div>
          ))}
        </Card>
      ) : null}

      {favorites.barbers.length > 0 ? (
        <Card className="flex flex-col gap-4">
          <h2 className="flex items-center gap-2 text-lead font-bold text-text">
            <Users
              className="h-4 w-4 text-accent"
              aria-hidden
            />
            Profissionais
          </h2>
          {favorites.barbers.map((barber) => (
            <div
              key={barber.id}
              className="flex items-center justify-between gap-3 border-t border-border pt-3 first:border-0 first:pt-0"
            >
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-caption font-bold text-text">
                  {barber.displayName}
                </span>
                <span className="text-micro text-muted">{barber.title}</span>
              </div>
              <FavoriteButton
                kind="barber"
                id={barber.id}
                initial
                label={barber.displayName}
              />
            </div>
          ))}
        </Card>
      ) : null}

      {favorites.products.length > 0 ? (
        <Card className="flex flex-col gap-4">
          <h2 className="flex items-center gap-2 text-lead font-bold text-text">
            <Package
              className="h-4 w-4 text-accent"
              aria-hidden
            />
            Produtos
          </h2>
          {favorites.products.map((product) => {
            const available = product.stock - product.reserved > 0
            return (
              <div
                key={product.id}
                className="flex items-center justify-between gap-3 border-t border-border pt-3 first:border-0 first:pt-0"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-caption font-bold text-text">{product.name}</span>
                  <span className="flex items-center gap-2 text-micro text-muted">
                    {formatBRL(product.priceCents)}
                    <StatusPill tone={available ? 'success' : 'neutral'}>
                      {available ? 'Em estoque' : 'Esgotado'}
                    </StatusPill>
                  </span>
                </div>
                <FavoriteButton
                  kind="product"
                  id={product.id}
                  initial
                  label={product.name}
                />
              </div>
            )
          })}
        </Card>
      ) : null}
    </div>
  )
}

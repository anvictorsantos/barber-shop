import { Scissors } from 'lucide-react'

import { BarberCard } from '@/components/catalog/BarberCard'
import { ServiceCard } from '@/components/catalog/ServiceCard'
import { PublicShell } from '@/components/layout/PublicShell'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { getSessionUser } from '@/lib/auth/session'
import { groupServicesByCategory } from '@/lib/catalog/labels'
import { getActiveBarbers, getActiveServices } from '@/lib/catalog/queries'
import { getFavoriteIds } from '@/lib/customer/queries'

import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Serviços — Barbearia do Luiz',
  description: 'Corte, barba e tratamentos. Escolha o serviço e agende seu horário.',
}

export default async function ServicesPage() {
  const user = await getSessionUser()
  const [services, barbers, favoriteIds] = await Promise.all([
    getActiveServices(),
    getActiveBarbers(),
    getFavoriteIds(user?.role === 'CUSTOMER' ? user.id : null),
  ])
  const groups = groupServicesByCategory(services)
  const canFavorite = user?.role === 'CUSTOMER'

  return (
    <PublicShell>
      <div className="mx-auto flex w-full max-w-shell flex-col gap-10 px-4 py-10 sm:px-6">
        <PageHeader
          title="Serviços"
          description="Escolha o serviço, o profissional e o horário. Confirmação em poucos minutos."
        />

        {groups.length === 0 ? (
          <Card>
            <EmptyState
              icon={Scissors}
              title="Nenhum serviço disponível"
              description="A barbearia ainda não cadastrou serviços ativos."
            />
          </Card>
        ) : (
          groups.map((group) => (
            <section
              key={group.category}
              className="flex flex-col gap-4"
            >
              <div className="flex items-end justify-between gap-4">
                <h2 className="text-label font-bold uppercase tracking-widest text-accent">
                  {group.label}
                </h2>
                <span className="text-caption text-subtle">
                  {group.services.length} {group.services.length === 1 ? 'serviço' : 'serviços'}
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.services.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                  />
                ))}
              </div>
            </section>
          ))
        )}

        {barbers.length > 0 ? (
          <section className="flex flex-col gap-4">
            <h2 className="text-label font-bold uppercase tracking-widest text-accent">Equipe</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {barbers.map((barber) => (
                <BarberCard
                  key={barber.id}
                  barber={barber}
                  favorite={{
                    canFavorite,
                    saved: favoriteIds.barbers.has(barber.id),
                  }}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </PublicShell>
  )
}

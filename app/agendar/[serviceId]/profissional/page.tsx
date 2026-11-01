import { ArrowLeft, Scissors } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { BarberChoiceCard } from '@/components/booking/BarberChoiceCard'
import { PublicShell } from '@/components/layout/PublicShell'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { getActiveBarbers, getServiceById } from '@/lib/catalog/queries'
import { formatBRL } from '@/lib/format/money'

import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Escolha o profissional — Barbearia do Luiz',
  robots: { index: false, follow: false },
}

export default async function SelectBarberPage({
  params,
}: {
  params: Promise<{ serviceId: string }>
}) {
  const { serviceId } = await params
  const [service, barbers] = await Promise.all([getServiceById(serviceId), getActiveBarbers()])
  if (!service) notFound()

  return (
    <PublicShell>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
        <Link
          href={`/servicos/${service.slug}`}
          className="inline-flex items-center gap-2 text-caption font-semibold text-muted hover:text-text"
        >
          <ArrowLeft
            className="h-4 w-4"
            aria-hidden
          />
          Voltar para o serviço
        </Link>

        <PageHeader
          title="Escolha o profissional"
          description={`${service.name} · ${service.durationMin} min · ${formatBRL(service.priceCents)}`}
        />

        {barbers.length === 0 ? (
          <Card>
            <EmptyState
              icon={Scissors}
              title="Nenhum profissional disponível"
              description="A barbearia ainda não cadastrou barbeiros ativos."
            />
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {barbers.map((barber) => (
              <BarberChoiceCard
                key={barber.id}
                serviceId={service.id}
                barber={barber}
              />
            ))}
          </div>
        )}
      </div>
    </PublicShell>
  )
}

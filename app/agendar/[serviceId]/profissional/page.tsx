import { CalendarDays } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PublicShell } from '@/components/layout/PublicShell'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { getServiceById } from '@/lib/catalog/queries'

import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Agendar — Barbearia do Luiz',
  robots: { index: false, follow: false },
}

export default async function SelectBarberPage({
  params,
}: {
  params: Promise<{ serviceId: string }>
}) {
  const { serviceId } = await params
  const service = await getServiceById(serviceId)
  if (!service) notFound()

  return (
    <PublicShell>
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-10 sm:px-6">
        <PageHeader
          title={`Agendar ${service.name}`}
          description="Escolha o profissional e o horário."
        />
        <Card>
          <EmptyState
            icon={CalendarDays}
            title="Agendamento em breve"
            description="A escolha de profissional, data e horário entra na próxima fase."
          />
        </Card>
        <Link
          href={`/servicos/${service.slug}`}
          className="text-center text-caption font-semibold text-muted hover:text-text"
        >
          Voltar para o serviço
        </Link>
      </div>
    </PublicShell>
  )
}

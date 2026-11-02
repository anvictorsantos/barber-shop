import { formatInTimeZone } from 'date-fns-tz'
import { redirect } from 'next/navigation'

import { AgendaView } from '@/components/admin/agenda/AgendaView'
import { PageHeader } from '@/components/ui/PageHeader'
import { resolveAdminScope } from '@/lib/admin/context'
import { getAgendaDay, getAgendaFormOptions } from '@/lib/admin/queries'
import { getSessionUser } from '@/lib/auth/session'
import { BUSINESS_TIMEZONE } from '@/lib/availability/slots'

import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Agenda — Barbearia do Luiz',
  robots: { index: false, follow: false },
}

export default async function AdminAgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string | string[]; barber?: string | string[] }>
}) {
  const user = await getSessionUser()
  if (!user) redirect('/entrar?next=/admin/agenda')
  if (user.role === 'CUSTOMER') redirect('/conta/agendamentos')

  const scope = await resolveAdminScope(user)
  const query = await searchParams
  const today = formatInTimeZone(new Date(), BUSINESS_TIMEZONE, 'yyyy-MM-dd')

  const dateParam = typeof query.date === 'string' ? query.date : ''
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : today
  const barberId = typeof query.barber === 'string' && query.barber ? query.barber : null

  const [day, options] = await Promise.all([
    getAgendaDay(scope, { date, barberId }),
    getAgendaFormOptions(),
  ])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Agenda"
        description="Agendamentos, encaixes e bloqueios do dia."
      />
      <AgendaView
        day={day}
        today={today}
        isOwner={scope.role === 'OWNER'}
        scopeBarberId={scope.barberId}
        selectedBarberId={barberId}
        barbers={options.barbers}
        services={options.services}
      />
    </div>
  )
}

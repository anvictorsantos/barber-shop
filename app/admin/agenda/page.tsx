import { CalendarDays } from 'lucide-react'

import { PhasePlaceholder } from '@/components/ui/PhasePlaceholder'

export default function AdminAgendaPage() {
  return (
    <PhasePlaceholder
      title="Agenda"
      description="Calendário, bloqueios e novos agendamentos."
      icon={CalendarDays}
      phase="fase 6"
    />
  )
}

import { CalendarCheck } from 'lucide-react'

import { PhasePlaceholder } from '@/components/ui/PhasePlaceholder'

export default function CustomerAppointmentsPage() {
  return (
    <PhasePlaceholder
      title="Meus Agendamentos"
      description="Próximos horários, confirmação e reagendamento."
      icon={CalendarCheck}
      phase="fase 7"
    />
  )
}

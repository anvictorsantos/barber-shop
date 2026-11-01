import { Users } from 'lucide-react'

import { PhasePlaceholder } from '@/components/ui/PhasePlaceholder'

export default function AdminClientsPage() {
  return (
    <PhasePlaceholder
      title="Clientes"
      description="Fichas, histórico e faturamento por cliente."
      icon={Users}
      phase="fase 6"
    />
  )
}

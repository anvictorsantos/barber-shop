import { LayoutDashboard } from 'lucide-react'

import { PhasePlaceholder } from '@/components/ui/PhasePlaceholder'

export default function AdminDashboardPage() {
  return (
    <PhasePlaceholder
      title="Dashboard"
      description="Visão do dia, fila e faturamento."
      icon={LayoutDashboard}
      phase="fase 6"
    />
  )
}

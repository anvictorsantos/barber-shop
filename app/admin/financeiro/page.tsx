import { DollarSign } from 'lucide-react'

import { PhasePlaceholder } from '@/components/ui/PhasePlaceholder'

export default function AdminFinancePage() {
  return (
    <PhasePlaceholder
      title="Financeiro"
      description="Receita, ticket médio e desempenho."
      icon={DollarSign}
      phase="fase 6"
    />
  )
}

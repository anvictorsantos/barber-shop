import { History } from 'lucide-react'

import { PhasePlaceholder } from '@/components/ui/PhasePlaceholder'

export default function CustomerHistoryPage() {
  return (
    <PhasePlaceholder
      title="Histórico"
      description="Visitas concluídas, avaliações e recibos."
      icon={History}
      phase="fase 7"
    />
  )
}

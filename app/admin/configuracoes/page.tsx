import { Settings } from 'lucide-react'

import { PhasePlaceholder } from '@/components/ui/PhasePlaceholder'

export default function AdminSettingsPage() {
  return (
    <PhasePlaceholder
      title="Configurações"
      description="Dados da barbearia, horários, equipe e integrações."
      icon={Settings}
      phase="fase 6"
    />
  )
}

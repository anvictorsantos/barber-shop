import { UserRound } from 'lucide-react'

import { PhasePlaceholder } from '@/components/ui/PhasePlaceholder'

export default function CustomerProfilePage() {
  return (
    <PhasePlaceholder
      title="Perfil"
      description="Dados de contato, segurança e preferências."
      icon={UserRound}
      phase="fase 7"
    />
  )
}

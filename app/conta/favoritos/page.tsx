import { Heart } from 'lucide-react'

import { PhasePlaceholder } from '@/components/ui/PhasePlaceholder'

export default function CustomerFavoritesPage() {
  return (
    <PhasePlaceholder
      title="Favoritos"
      description="Barbeiros, serviços e produtos salvos."
      icon={Heart}
      phase="fase 7"
    />
  )
}

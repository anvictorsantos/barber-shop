import { Scissors } from 'lucide-react'

import { PhasePlaceholder } from '@/components/ui/PhasePlaceholder'

export default function AdminCatalogPage() {
  return (
    <PhasePlaceholder
      title="Serviços e Produtos"
      description="Catálogo, preços, duração e estoque."
      icon={Scissors}
      phase="fase 2"
    />
  )
}

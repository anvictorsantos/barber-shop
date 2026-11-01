import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'

import type { LucideIcon } from 'lucide-react'

export function PhasePlaceholder({
  title,
  description,
  icon,
  phase,
}: {
  title: string
  description: string
  icon: LucideIcon
  phase: string
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={title}
        description={description}
      />
      <Card>
        <EmptyState
          icon={icon}
          title="Em construção"
          description={`Esta tela entra na ${phase}.`}
        />
      </Card>
    </div>
  )
}

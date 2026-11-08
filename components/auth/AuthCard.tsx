import { Card } from '@/components/ui/Card'

import type { ReactNode } from 'react'

export function AuthCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <Card className="p-6 sm:p-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-page font-semibold text-text">{title}</h1>
        {description ? <p className="text-body text-muted">{description}</p> : null}
      </div>
      <div className="mt-6">{children}</div>
    </Card>
  )
}

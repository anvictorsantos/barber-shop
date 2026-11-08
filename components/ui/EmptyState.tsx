import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-md border border-border text-muted">
        <Icon
          className="h-5 w-5"
          aria-hidden
        />
      </span>
      <p className="text-lead font-medium text-text">{title}</p>
      {description ? <p className="max-w-sm text-body text-muted">{description}</p> : null}
      {action}
    </div>
  )
}

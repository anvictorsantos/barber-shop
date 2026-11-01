import { cn } from '@/lib/utils'

import type { SelectHTMLAttributes } from 'react'

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'h-10 w-full rounded-sm border border-border-strong bg-surface-input px-3 text-body text-text transition focus:border-accent',
        className,
      )}
      {...props}
    />
  )
}

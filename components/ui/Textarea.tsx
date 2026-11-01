import { cn } from '@/lib/utils'

import type { TextareaHTMLAttributes } from 'react'

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'min-h-24 w-full rounded-sm border border-border-strong bg-surface-input px-3 py-2 text-body text-text placeholder:text-subtle transition focus:border-accent',
        className,
      )}
      {...props}
    />
  )
}

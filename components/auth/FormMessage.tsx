import { cn } from '@/lib/utils'

import type { ReactNode } from 'react'

const tones = {
  error: 'border-danger/30 bg-danger/10 text-danger',
  success: 'border-success/30 bg-success/10 text-success',
  info: 'border-border-strong bg-white/5 text-muted',
} as const

export function FormMessage({
  tone = 'error',
  children,
}: {
  tone?: keyof typeof tones
  children: ReactNode
}) {
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live="polite"
      className={cn('rounded-md border px-3 py-2 text-caption', tones[tone])}
    >
      {children}
    </p>
  )
}

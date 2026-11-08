import { cn } from '@/lib/utils'

import type { ReactNode } from 'react'

export function SectionLabel({
  children,
  className,
  tone = 'default',
}: {
  children: ReactNode
  className?: string
  tone?: 'default' | 'paper'
}) {
  return (
    <span
      className={cn(
        'flex items-center gap-3 text-caption font-medium',
        tone === 'paper' ? 'text-[#6b6255]' : 'text-muted',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn('relative h-px w-7', tone === 'paper' ? 'bg-[#a8792f]/70' : 'bg-accent/70')}
      >
        <span
          className={cn(
            'absolute -right-1 -top-[2px] h-[5px] w-[5px] rotate-45',
            tone === 'paper' ? 'bg-[#a8792f]' : 'bg-accent',
          )}
        />
      </span>
      {children}
    </span>
  )
}

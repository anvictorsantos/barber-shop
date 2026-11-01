import { cn } from '@/lib/utils'

export type StatusTone = 'success' | 'warning' | 'danger' | 'primary' | 'neutral'

const tones: Record<StatusTone, string> = {
  success: 'bg-success/10 text-success',
  warning: 'bg-accent/10 text-accent',
  danger: 'bg-danger/10 text-danger',
  primary: 'bg-primary/10 text-primary',
  neutral: 'bg-white/5 text-muted',
}

export function StatusPill({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: StatusTone
  children: string
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-xs px-2 py-1 text-micro font-bold',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

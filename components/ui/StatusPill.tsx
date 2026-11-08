import { cn } from '@/lib/utils'

export type StatusTone = 'success' | 'warning' | 'danger' | 'primary' | 'neutral'

const tones: Record<StatusTone, string> = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  primary: 'text-accent',
  neutral: 'text-muted',
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
        'inline-flex items-center gap-1.5 text-micro font-medium',
        tones[tone],
        className,
      )}
    >
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-full bg-current"
      />
      {children}
    </span>
  )
}

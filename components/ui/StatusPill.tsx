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
  pulse = false,
  children,
  className,
}: {
  tone?: StatusTone
  pulse?: boolean
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
        className="relative flex h-1.5 w-1.5"
      >
        {pulse ? (
          <span className="absolute inset-0 animate-ping rounded-full bg-current opacity-60" />
        ) : null}
        <span className="relative h-1.5 w-1.5 rounded-full bg-current" />
      </span>
      {children}
    </span>
  )
}

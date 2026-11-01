import { cn } from '@/lib/utils'

import type { ButtonHTMLAttributes } from 'react'

export type ButtonVariant = 'primary' | 'gold' | 'outline' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover',
  gold: 'bg-accent text-background hover:bg-accent-hover',
  outline: 'border border-border-strong bg-transparent text-text hover:border-white/30',
  ghost: 'bg-white/10 text-text hover:bg-white/15',
  danger: 'border border-danger text-danger hover:bg-danger/10',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-caption',
  md: 'h-11 px-5 text-body',
  lg: 'h-12 px-6 text-lead',
}

export function buttonClasses({
  variant = 'primary',
  size = 'md',
  className,
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string | undefined
} = {}): string {
  return cn(
    'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-bold transition disabled:pointer-events-none disabled:opacity-40',
    variants[variant],
    sizes[size],
    className,
  )
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, className })}
      {...props}
    />
  )
}

import { cn } from '@/lib/utils'

import type { InputHTMLAttributes, ReactNode } from 'react'

export const authFieldClass =
  'h-11 w-full rounded-sm border border-border-strong bg-surface-input px-3.5 text-body text-text placeholder:text-subtle transition-colors focus:border-accent'

export function AuthInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(authFieldClass, className)}
      {...props}
    />
  )
}

export function AuthField({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string
  htmlFor: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={htmlFor}
        className="text-caption font-medium text-muted"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p
          id={`${htmlFor}-error`}
          role="alert"
          className="text-caption text-danger"
        >
          {error}
        </p>
      ) : hint ? (
        <p
          id={`${htmlFor}-hint`}
          className="text-caption text-subtle"
        >
          {hint}
        </p>
      ) : null}
    </div>
  )
}

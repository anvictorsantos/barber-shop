import { cn } from '@/lib/utils'

import type { InputHTMLAttributes, ReactNode } from 'react'

export function Input({
  className,
  invalid,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        'h-10 w-full rounded-sm border border-border-strong bg-surface-input px-3 text-body text-text placeholder:text-subtle transition focus:border-accent',
        invalid && 'border-danger',
        className,
      )}
      {...props}
    />
  )
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-caption font-semibold text-muted"
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

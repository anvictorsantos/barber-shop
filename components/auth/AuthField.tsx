import { cn } from '@/lib/utils'

import type { InputHTMLAttributes, ReactNode } from 'react'

export const authFieldClass =
  'h-[52px] w-full rounded-md border border-white/10 bg-background px-4 text-sm text-text placeholder:text-muted transition focus:border-accent'

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
    <div className="flex flex-col gap-2.5">
      <label
        htmlFor={htmlFor}
        className="text-[13px] font-medium leading-4 text-text"
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
          className="text-caption text-muted"
        >
          {hint}
        </p>
      ) : null}
    </div>
  )
}

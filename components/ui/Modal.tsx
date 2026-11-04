'use client'

import { X } from 'lucide-react'
import { useEffect } from 'react'

import { cn } from '@/lib/utils'

import type { ReactNode } from 'react'

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string | undefined
  children: ReactNode
  className?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative w-full max-w-md rounded-xl border border-white/10 bg-surface p-6',
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-bold leading-[22px] text-text">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted transition hover:bg-white/5 hover:text-text"
          >
            <X
              aria-hidden
              className="h-4 w-4"
            />
          </button>
        </div>

        {description ? (
          <p className="mt-2 text-caption leading-[1.6] text-muted">{description}</p>
        ) : null}

        {children}
      </div>
    </div>
  )
}

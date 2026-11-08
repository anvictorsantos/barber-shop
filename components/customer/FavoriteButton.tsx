'use client'

import { Heart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { toggleFavoriteAction } from '@/lib/customer/actions'
import type { FavoriteKind } from '@/lib/customer/favorites'
import { cn } from '@/lib/utils'

export function FavoriteButton({
  kind,
  id,
  initial,
  label,
  className,
  variant = 'badge',
}: {
  kind: FavoriteKind
  id: string
  initial: boolean
  label: string
  className?: string
  variant?: 'badge' | 'bare'
}) {
  const router = useRouter()
  const [saved, setSaved] = useState(initial)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function toggle() {
    setPending(true)
    setError(null)
    const result = await toggleFavoriteAction({ kind, id })
    setPending(false)

    if (result.ok) {
      setSaved(result.saved)
      router.refresh()
      return
    }

    if (result.error.includes('login')) {
      router.push(`/entrar?next=${encodeURIComponent(window.location.pathname)}`)
      return
    }

    setError(result.error)
  }

  return (
    <div className={cn('flex flex-col items-end gap-1', className)}>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={saved}
        aria-label={saved ? `Remover ${label} dos favoritos` : `Salvar ${label} nos favoritos`}
        title={saved ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
        className={cn(
          'flex cursor-pointer items-center justify-center transition-colors',
          variant === 'bare' ? 'h-5 w-5 hover:text-accent' : 'h-9 w-9 rounded-md border',
          variant === 'bare' && (saved ? 'text-accent' : 'text-muted'),
          variant === 'badge' &&
            (saved
              ? 'border-accent/40 bg-accent/10 text-accent'
              : 'border-border text-muted hover:border-border-strong hover:text-text'),
          pending && 'opacity-50',
        )}
      >
        <Heart
          className={variant === 'bare' ? 'h-5 w-5' : 'h-4 w-4'}
          fill={saved ? 'currentColor' : 'none'}
          aria-hidden
        />
      </button>
      {error ? (
        <p
          role="alert"
          className="text-micro text-danger"
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}

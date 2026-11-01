'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { readConsent, writeConsent } from '@/lib/analytics/consent'
import { cn } from '@/lib/utils'

export function ConsentBanner() {
  const [decided, setDecided] = useState(true)
  const pathname = usePathname()
  const hasBottomNav = pathname.startsWith('/conta')

  useEffect(() => {
    setDecided(readConsent() !== null)
  }, [])

  if (decided) return null

  function decide(value: 'granted' | 'denied') {
    writeConsent(value)
    setDecided(true)
  }

  return (
    <div
      role="region"
      aria-labelledby="consent-title"
      className={cn(
        'fixed inset-x-0 z-50 border-t border-border bg-surface/95 px-4 py-4 backdrop-blur sm:px-6',
        hasBottomNav ? 'bottom-[calc(4rem+env(safe-area-inset-bottom))] lg:bottom-0' : 'bottom-0',
      )}
    >
      <div className="mx-auto flex max-w-shell flex-col gap-3 md:flex-row md:items-center md:gap-5">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p
            id="consent-title"
            className="text-label font-bold uppercase tracking-wide text-text"
          >
            Cookies e medição
          </p>
          <p className="text-body leading-relaxed text-text-secondary">
            Usamos cookies para medir o uso do site e melhorar a experiência. Você pode aceitar ou
            recusar.
          </p>
          <Link
            href="/privacidade"
            className="self-start text-label font-semibold text-muted underline transition hover:text-text"
          >
            Privacidade
          </Link>
        </div>
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => decide('denied')}
            className="min-h-touch cursor-pointer rounded-lg border border-border-strong bg-transparent px-5 font-bold text-body text-text-secondary transition hover:border-white/30 hover:text-text"
          >
            Recusar
          </button>
          <button
            type="button"
            onClick={() => decide('granted')}
            className="min-h-touch cursor-pointer rounded-lg border border-primary/60 bg-primary/20 px-5 font-bold text-body text-text transition hover:bg-primary/30"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  )
}

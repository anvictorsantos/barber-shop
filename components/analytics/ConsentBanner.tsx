'use client'

import { X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { readConsent, writeConsent } from '@/lib/analytics/consent'
import { cn } from '@/lib/utils'

export function ConsentBanner() {
  const [decided, setDecided] = useState(true)
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const pathname = usePathname()
  const hasBottomNav = pathname.startsWith('/conta')

  useEffect(() => {
    setDecided(readConsent() !== null)
  }, [])

  useEffect(() => {
    if (!privacyOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPrivacyOpen(false)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [privacyOpen])

  if (decided) return null

  function decide(value: 'granted' | 'denied') {
    writeConsent(value)
    setDecided(true)
  }

  return (
    <>
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
            <button
              type="button"
              onClick={() => setPrivacyOpen(true)}
              className="cursor-pointer self-start text-label font-semibold text-muted underline transition hover:text-text"
            >
              Privacidade
            </button>
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

      <div
        className={cn(
          'fixed inset-0 z-[90] flex items-center justify-center p-4 transition-opacity duration-200',
          privacyOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        <button
          type="button"
          aria-label="Fechar privacidade"
          tabIndex={privacyOpen ? 0 : -1}
          onClick={() => setPrivacyOpen(false)}
          className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
        />

        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-title"
          className={cn(
            'relative w-full max-w-lg rounded-xl border border-white/10 bg-surface p-6 transition duration-200',
            privacyOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <h2
              id="privacy-title"
              className="text-lg font-bold leading-[22px] text-text"
            >
              Privacidade
            </h2>
            <button
              type="button"
              onClick={() => setPrivacyOpen(false)}
              aria-label="Fechar"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted transition hover:bg-white/5 hover:text-text"
            >
              <X
                aria-hidden
                className="h-4 w-4"
              />
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-3 text-caption leading-[1.7] text-muted">
            <p>
              Usamos cookies apenas quando você aceita, para medir o uso do site e melhorar a
              experiência. Nenhum dado de navegação é usado para anúncios.
            </p>
            <p>
              Seus dados de contato são usados para confirmar agendamentos, enviar lembretes e
              recibos. Você pode recusar os cookies e continuar navegando normalmente.
            </p>
            <p>
              Para solicitar a exclusão dos seus dados, fale com a barbearia pelo WhatsApp ou pelo
              e-mail de contato.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

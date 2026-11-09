'use client'

import { X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { buttonClasses } from '@/components/ui/Button'
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
          'fixed inset-x-0 z-50 border-t border-border bg-surface px-4 py-3 lg:bottom-6 lg:left-6 lg:right-auto lg:max-w-[420px] lg:rounded-lg lg:border lg:p-5 lg:shadow-card',
          hasBottomNav ? 'bottom-[calc(4rem+env(safe-area-inset-bottom))] lg:bottom-6' : 'bottom-0',
        )}
      >
        <div className="flex flex-col gap-3 lg:gap-4">
          <div className="flex flex-col gap-1.5">
            <p
              id="consent-title"
              className="text-body font-medium text-text"
            >
              Cookies e medição
            </p>
            <p className="text-caption leading-relaxed text-muted">
              Usamos cookies para medir o uso do site e melhorar a experiência. Você pode aceitar ou
              recusar.{' '}
              <button
                type="button"
                onClick={() => setPrivacyOpen(true)}
                className="cursor-pointer text-text-secondary underline underline-offset-2 transition-colors hover:text-text"
              >
                Privacidade
              </button>
            </p>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => decide('denied')}
              className={buttonClasses({
                variant: 'ghost',
                size: 'sm',
                className: 'min-h-touch',
              })}
            >
              Recusar
            </button>
            <button
              type="button"
              onClick={() => decide('granted')}
              className={buttonClasses({ size: 'sm', className: 'min-h-touch' })}
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
          className="absolute inset-0 cursor-default bg-black/70"
        />

        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-title"
          className={cn(
            'relative w-full max-w-lg rounded-xl border border-border bg-surface p-6 transition-opacity duration-200',
            privacyOpen ? 'opacity-100' : 'opacity-0',
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <h2
              id="privacy-title"
              className="font-display text-title font-semibold text-text"
            >
              Privacidade
            </h2>
            <button
              type="button"
              onClick={() => setPrivacyOpen(false)}
              aria-label="Fechar"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted transition-colors hover:bg-white/5 hover:text-text"
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

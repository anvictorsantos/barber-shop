'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { updateNotificationPreferencesAction } from '@/lib/customer/actions'

export function NotificationPreferencesForm({
  initial,
  hasEmail,
  hasWhatsapp,
}: {
  initial: { email: boolean; whatsapp: boolean }
  hasEmail: boolean
  hasWhatsapp: boolean
}) {
  const router = useRouter()
  const [values, setValues] = useState(initial)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function submit() {
    setPending(true)
    setError(null)
    const result = await updateNotificationPreferencesAction(values)
    setPending(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    setSaved(true)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface-input px-4 py-3">
        <label
          htmlFor="notify-email"
          className="flex cursor-pointer flex-col"
        >
          E-mail
          <span className="text-micro text-muted">
            {hasEmail ? 'Confirmações, lembretes e recibos.' : 'Sem e-mail cadastrado.'}
          </span>
        </label>
        <input
          id="notify-email"
          type="checkbox"
          checked={values.email}
          disabled={!hasEmail}
          onChange={(event) => {
            setValues((current) => ({ ...current, email: event.target.checked }))
            setSaved(false)
          }}
          className="h-4 w-4 accent-[var(--accent)]"
        />
      </div>

      <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface-input px-4 py-3">
        <label
          htmlFor="notify-whatsapp"
          className="flex cursor-pointer flex-col"
        >
          WhatsApp
          <span className="text-micro text-muted">
            {hasWhatsapp ? 'Lembretes e avisos de agendamento.' : 'Sem WhatsApp cadastrado.'}
          </span>
        </label>
        <input
          id="notify-whatsapp"
          type="checkbox"
          checked={values.whatsapp}
          disabled={!hasWhatsapp}
          onChange={(event) => {
            setValues((current) => ({ ...current, whatsapp: event.target.checked }))
            setSaved(false)
          }}
          className="h-4 w-4 accent-[var(--accent)]"
        />
      </div>

      {error ? (
        <p
          role="alert"
          className="text-caption text-danger"
        >
          {error}
        </p>
      ) : null}
      {saved ? (
        <p
          role="status"
          className="text-caption text-success"
        >
          Preferências salvas.
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={submit}
          disabled={pending}
        >
          {pending ? 'Salvando…' : 'Salvar preferências'}
        </Button>
      </div>
    </div>
  )
}

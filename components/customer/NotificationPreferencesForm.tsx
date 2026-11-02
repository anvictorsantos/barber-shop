'use client'

import { useState } from 'react'

import { updateNotificationPreferencesAction } from '@/lib/customer/actions'
import { cn } from '@/lib/utils'

function Toggle({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean
  disabled?: boolean
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition disabled:cursor-not-allowed disabled:opacity-40',
        checked ? 'justify-end bg-primary' : 'justify-start bg-surface-subtle',
      )}
    >
      <span className="h-5 w-5 rounded-full bg-white" />
    </button>
  )
}

export function NotificationPreferencesForm({
  initial,
  hasEmail,
  hasWhatsapp,
}: {
  initial: { email: boolean; whatsapp: boolean }
  hasEmail: boolean
  hasWhatsapp: boolean
}) {
  const [values, setValues] = useState(initial)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save(next: { email: boolean; whatsapp: boolean }) {
    setValues(next)
    setPending(true)
    setError(null)
    const result = await updateNotificationPreferencesAction(next)
    setPending(false)
    if (!result.ok) setError(result.error)
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] py-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-bold leading-[17px] text-text">Lembretes por WhatsApp</span>
          <span className="text-caption leading-[15px] text-muted">
            {hasWhatsapp ? 'Avisos 24 horas antes do agendamento' : 'Sem WhatsApp cadastrado.'}
          </span>
        </div>
        <Toggle
          label="Lembretes por WhatsApp"
          checked={values.whatsapp}
          disabled={!hasWhatsapp || pending}
          onChange={(checked) => save({ ...values, whatsapp: checked })}
        />
      </div>

      <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] py-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-bold leading-[17px] text-text">E-mail de Confirmação</span>
          <span className="text-caption leading-[15px] text-muted">
            {hasEmail ? 'Receber recibos e detalhes da vaga' : 'Sem e-mail cadastrado.'}
          </span>
        </div>
        <Toggle
          label="E-mail de confirmação"
          checked={values.email}
          disabled={!hasEmail || pending}
          onChange={(checked) => save({ ...values, email: checked })}
        />
      </div>

      {error ? (
        <p
          role="alert"
          className="pt-2 text-caption text-danger"
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}

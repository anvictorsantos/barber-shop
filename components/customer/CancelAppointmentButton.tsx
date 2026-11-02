'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { cancelMyAppointmentAction } from '@/lib/customer/actions'

export function CancelAppointmentButton({
  appointmentId,
  startAtIso,
}: {
  appointmentId: string
  startAtIso: string
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hours = (new Date(startAtIso).getTime() - Date.now()) / (60 * 60 * 1000)
  const free = hours >= 2

  async function cancel() {
    const message = free
      ? 'Cancelar este agendamento? O reembolso é automático quando houver pagamento.'
      : 'Faltam menos de 2h. Cancelar agora não gera reembolso. Continuar?'
    if (!window.confirm(message)) return

    setPending(true)
    setError(null)
    const result = await cancelMyAppointmentAction({ appointmentId })
    setPending(false)

    if (!result.ok) setError(result.error)
    else router.refresh()
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={cancel}
        disabled={pending}
        className="h-9 cursor-pointer rounded-sm border border-danger px-4 text-[13px] font-bold leading-4 text-danger transition hover:bg-danger/10 disabled:pointer-events-none disabled:opacity-40"
      >
        {pending ? 'Cancelando…' : 'Cancelar'}
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

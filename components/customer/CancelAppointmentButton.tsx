'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { cancelMyAppointmentAction } from '@/lib/customer/actions'

export function CancelAppointmentButton({
  appointmentId,
  startAtIso,
}: {
  appointmentId: string
  startAtIso: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hours = (new Date(startAtIso).getTime() - Date.now()) / (60 * 60 * 1000)
  const free = hours >= 2

  async function cancel() {
    setPending(true)
    setError(null)
    const result = await cancelMyAppointmentAction({ appointmentId })
    setPending(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
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

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Cancelar agendamento"
        description={
          free
            ? 'Cancelamento gratuito até 2h antes. Se houver pagamento, o reembolso é automático.'
            : 'Faltam menos de 2h para o atendimento. Cancelar agora não gera reembolso.'
        }
      >
        <div className="mt-6 flex justify-end gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setOpen(false)}
          >
            Voltar
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={cancel}
            disabled={pending}
          >
            {pending ? 'Cancelando…' : 'Cancelar agendamento'}
          </Button>
        </div>
      </Modal>
    </>
  )
}

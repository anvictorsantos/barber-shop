'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { blockCustomerAction, unblockCustomerAction } from '@/lib/admin/actions'

export function BlockCustomerButton({
  userId,
  blocked,
  canManage,
}: {
  userId: string
  blocked: boolean
  canManage: boolean
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!canManage) return null

  async function toggle() {
    const confirmed = window.confirm(
      blocked
        ? 'Desbloquear este cliente para agendamentos online?'
        : 'Bloquear este cliente para agendamentos online?',
    )
    if (!confirmed) return

    setPending(true)
    setError(null)
    const result = blocked
      ? await unblockCustomerAction({ userId })
      : await blockCustomerAction({ userId })
    setPending(false)

    if (!result.ok) setError(result.error)
    else router.refresh()
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant={blocked ? 'outline' : 'danger'}
        size="sm"
        disabled={pending}
        onClick={toggle}
      >
        {pending ? 'Salvando…' : blocked ? 'Desbloquear' : 'Bloquear agendamentos'}
      </Button>
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

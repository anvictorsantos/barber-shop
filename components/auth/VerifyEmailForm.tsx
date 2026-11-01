'use client'

import Link from 'next/link'
import { useState } from 'react'

import { AuthCard } from '@/components/auth/AuthCard'
import { FormMessage } from '@/components/auth/FormMessage'
import { Button } from '@/components/ui/Button'
import { postJson } from '@/lib/http/client'

export function VerifyEmailForm({ token }: { token: string | null }) {
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  if (!token) {
    return (
      <AuthCard
        title="Link inválido"
        description="O link de confirmação está incompleto."
      >
        <Link
          href="/entrar"
          className="font-semibold text-accent hover:text-accent-hover"
        >
          Ir para entrar
        </Link>
      </AuthCard>
    )
  }

  if (done) {
    return (
      <AuthCard
        title="E-mail confirmado"
        description="Sua conta está pronta."
      >
        <Link
          href="/entrar"
          className="font-semibold text-accent hover:text-accent-hover"
        >
          Entrar
        </Link>
      </AuthCard>
    )
  }

  async function confirm() {
    setError(null)
    setPending(true)

    const result = await postJson<{ user: { id: string } }>('/api/auth/verify-email', { token })
    setPending(false)

    if (!result.ok) {
      setError(result.error.message)
      return
    }

    setDone(true)
  }

  return (
    <AuthCard
      title="Confirme seu e-mail"
      description="Um toque para ativar seu endereço."
    >
      <div className="flex flex-col gap-4">
        {error ? <FormMessage>{error}</FormMessage> : null}
        <Button
          type="button"
          onClick={confirm}
          disabled={pending}
        >
          {pending ? 'Confirmando…' : 'Confirmar e-mail'}
        </Button>
        <Link
          href="/entrar"
          className="text-center text-caption font-semibold text-muted hover:text-text"
        >
          Entrar
        </Link>
      </div>
    </AuthCard>
  )
}

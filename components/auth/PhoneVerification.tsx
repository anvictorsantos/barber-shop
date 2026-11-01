'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import { AuthCard } from '@/components/auth/AuthCard'
import { FormMessage } from '@/components/auth/FormMessage'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Input'
import { postAuthPath } from '@/lib/auth/redirect'
import { postJson } from '@/lib/http/client'

type RoleName = 'CUSTOMER' | 'BARBER' | 'OWNER'

interface UserResponse {
  user: { id: string; name: string; role: RoleName }
}

export function PhoneVerification({
  phone,
  next,
  onBack,
}: {
  phone: string
  next?: string | null
  onBack?: () => void
}) {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)

    const result = await postJson<UserResponse>('/api/auth/verify-phone', { phone, code })
    setPending(false)

    if (!result.ok) {
      setError(result.error.message)
      return
    }

    router.push(postAuthPath(result.data.user.role, next))
    router.refresh()
  }

  async function resend() {
    setError(null)
    setNotice(null)

    const result = await postJson<{ ok: boolean }>('/api/auth/resend', { identifier: phone })
    if (result.ok) {
      setNotice('Código reenviado. Confira o WhatsApp.')
    } else {
      setError(result.error.message)
    }
  }

  return (
    <AuthCard
      title="Confirme seu WhatsApp"
      description={`Enviamos um código de 6 dígitos para ${phone}.`}
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={verify}
      >
        {notice ? <FormMessage tone="success">{notice}</FormMessage> : null}
        {error ? <FormMessage>{error}</FormMessage> : null}

        <Field
          label="Código"
          htmlFor="otp-code"
        >
          <Input
            id="otp-code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
            className="text-center text-title tracking-[0.3em]"
          />
        </Field>

        <Button
          type="submit"
          disabled={pending || code.length !== 6}
        >
          {pending ? 'Confirmando…' : 'Confirmar'}
        </Button>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={resend}
          >
            Reenviar código
          </Button>
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="cursor-pointer text-caption font-semibold text-muted underline hover:text-text"
            >
              Voltar
            </button>
          ) : null}
        </div>

        <p className="text-center text-caption text-muted">
          Já confirmou?{' '}
          <Link
            href="/entrar"
            className="font-semibold text-accent hover:text-accent-hover"
          >
            Entrar
          </Link>
        </p>
      </form>
    </AuthCard>
  )
}

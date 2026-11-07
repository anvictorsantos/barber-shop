'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import { AuthField, AuthInput } from '@/components/auth/AuthField'
import { AuthHeading } from '@/components/auth/AuthHeading'
import { FormMessage } from '@/components/auth/FormMessage'
import { Button } from '@/components/ui/Button'
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
    <div className="flex w-full flex-col gap-7">
      <AuthHeading
        title="Confirme seu WhatsApp"
        description={`Enviamos um código de 6 dígitos para ${phone}.`}
      />

      <form
        className="flex flex-col gap-7"
        onSubmit={verify}
      >
        {notice ? <FormMessage tone="success">{notice}</FormMessage> : null}
        {error ? <FormMessage>{error}</FormMessage> : null}

        <AuthField
          label="Código"
          htmlFor="otp-code"
        >
          <AuthInput
            id="otp-code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
            className="text-center text-lg tracking-[0.3em]"
          />
        </AuthField>

        <div className="flex flex-col gap-5">
          <Button
            type="submit"
            size="lg"
            className="h-[52px] w-full gap-2.5 rounded-md px-[22px] text-sm"
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

          <p className="text-center text-[13px] leading-4 text-muted">
            Já confirmou?{' '}
            <Link
              href="/entrar"
              className="font-semibold text-accent underline underline-offset-2 transition hover:text-accent-hover"
            >
              Entrar
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}

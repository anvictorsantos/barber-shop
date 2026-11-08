'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import { AuthField, AuthInput } from '@/components/auth/AuthField'
import { AuthHeading } from '@/components/auth/AuthHeading'
import { FormMessage } from '@/components/auth/FormMessage'
import { PhoneVerification } from '@/components/auth/PhoneVerification'
import { Button } from '@/components/ui/Button'
import { postAuthPath } from '@/lib/auth/redirect'
import { postJson } from '@/lib/http/client'

type RoleName = 'CUSTOMER' | 'BARBER' | 'OWNER'

interface RegisterResponse {
  user: { id: string; name: string; role: RoleName }
  requiresPhoneVerification: boolean
  verificationEmailSent: boolean
}

export function RegisterForm({ next, onLogin }: { next?: string | null; onLogin: () => void }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [phonePending, setPhonePending] = useState<string | null>(null)

  if (phonePending) {
    return (
      <PhoneVerification
        phone={phonePending}
        next={next ?? null}
        onBack={() => {
          setPhonePending(null)
        }}
      />
    )
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)

    const result = await postJson<RegisterResponse>('/api/auth/register', {
      name,
      identifier,
      password,
    })
    setPending(false)

    if (!result.ok) {
      if (result.error.code === 'delivery_failed') {
        setPhonePending(identifier)
        return
      }
      setError(result.error.message)
      return
    }

    if (result.data.requiresPhoneVerification) {
      setPhonePending(identifier)
      return
    }

    router.push(postAuthPath(result.data.user.role, next))
    router.refresh()
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <AuthHeading
        title="Criar conta"
        description="Informe seu nome, telefone ou e-mail e uma senha."
      />

      <form
        className="flex flex-col gap-6"
        onSubmit={submit}
      >
        {error ? <FormMessage>{error}</FormMessage> : null}

        <div className="flex flex-col gap-4">
          <AuthField
            label="Nome"
            htmlFor="register-name"
          >
            <AuthInput
              id="register-name"
              name="name"
              autoComplete="name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </AuthField>

          <AuthField
            label="Telefone ou e-mail"
            htmlFor="register-identifier"
            hint="Telefone com DDI, ex: +55 31 98881-5243."
          >
            <AuthInput
              id="register-identifier"
              name="identifier"
              autoComplete="username"
              placeholder="seu@email.com"
              required
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
            />
          </AuthField>

          <AuthField
            label="Senha"
            htmlFor="register-password"
            hint="Mínimo de 8 caracteres."
          >
            <AuthInput
              id="register-password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </AuthField>
        </div>

        <div className="flex flex-col gap-4">
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={pending}
          >
            {pending ? 'Criando conta…' : 'Criar conta'}
          </Button>

          <p className="text-center text-caption text-muted">
            Já tem conta?{' '}
            <button
              type="button"
              onClick={onLogin}
              className="cursor-pointer font-medium text-accent transition-colors hover:text-accent-hover"
            >
              Entrar
            </button>
          </p>
        </div>
      </form>
    </div>
  )
}

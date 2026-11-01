'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import { AuthCard } from '@/components/auth/AuthCard'
import { FormMessage } from '@/components/auth/FormMessage'
import { PhoneVerification } from '@/components/auth/PhoneVerification'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Input'
import { postAuthPath } from '@/lib/auth/redirect'
import { postJson } from '@/lib/http/client'

type RoleName = 'CUSTOMER' | 'BARBER' | 'OWNER'

interface RegisterResponse {
  user: { id: string; name: string; role: RoleName }
  requiresPhoneVerification: boolean
  verificationEmailSent: boolean
}

export function RegisterForm({ next }: { next?: string | null }) {
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
    <AuthCard
      title="Criar conta"
      description="Escolha como quer entrar: telefone ou e-mail."
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={submit}
      >
        {error ? <FormMessage>{error}</FormMessage> : null}

        <Field
          label="Nome"
          htmlFor="register-name"
        >
          <Input
            id="register-name"
            name="name"
            autoComplete="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>

        <Field
          label="Telefone ou e-mail"
          htmlFor="register-identifier"
          hint="Telefone com DDI, ex: +55 31 98881-5243."
        >
          <Input
            id="register-identifier"
            name="identifier"
            autoComplete="username"
            required
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
          />
        </Field>

        <Field
          label="Senha"
          htmlFor="register-password"
          hint="Mínimo de 8 caracteres."
        >
          <Input
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>

        <Button
          type="submit"
          disabled={pending}
        >
          {pending ? 'Criando conta…' : 'Criar conta'}
        </Button>

        <p className="text-center text-caption text-muted">
          Já tem conta?{' '}
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

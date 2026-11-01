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

interface UserResponse {
  user: { id: string; name: string; role: RoleName }
}

export function LoginForm({ next }: { next?: string | null }) {
  const router = useRouter()
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

    const result = await postJson<UserResponse>('/api/auth/login', { identifier, password })
    setPending(false)

    if (!result.ok) {
      if (result.error.code === 'phone_not_verified') {
        setPhonePending(identifier)
        return
      }
      setError(result.error.message)
      return
    }

    router.push(postAuthPath(result.data.user.role, next))
    router.refresh()
  }

  return (
    <AuthCard
      title="Entrar"
      description="Use seu telefone ou e-mail e sua senha."
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={submit}
      >
        {error ? <FormMessage>{error}</FormMessage> : null}

        <Field
          label="Telefone ou e-mail"
          htmlFor="login-identifier"
        >
          <Input
            id="login-identifier"
            name="identifier"
            autoComplete="username"
            required
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
          />
        </Field>

        <Field
          label="Senha"
          htmlFor="login-password"
        >
          <Input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>

        <Button
          type="submit"
          disabled={pending}
        >
          {pending ? 'Entrando…' : 'Entrar'}
        </Button>

        <div className="flex flex-wrap items-center justify-between gap-3 text-caption">
          <Link
            href="/recuperar-senha"
            className="font-semibold text-muted hover:text-text"
          >
            Esqueci minha senha
          </Link>
          <Link
            href="/criar-conta"
            className="font-semibold text-accent hover:text-accent-hover"
          >
            Criar conta
          </Link>
        </div>
      </form>
    </AuthCard>
  )
}

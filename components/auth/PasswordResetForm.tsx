'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'

import { AuthCard } from '@/components/auth/AuthCard'
import { FormMessage } from '@/components/auth/FormMessage'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Input'
import { postJson } from '@/lib/http/client'

type Mode = 'request' | 'requested' | 'token' | 'done'

export function PasswordResetForm({ token }: { token: string | null }) {
  const [mode, setMode] = useState<Mode>(token ? 'token' : 'request')
  const [identifier, setIdentifier] = useState('')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  function validatePassword(): boolean {
    if (password.length < 8) {
      setError('A senha precisa ter pelo menos 8 caracteres.')
      return false
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return false
    }
    return true
  }

  async function request(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)

    const result = await postJson<{ ok: boolean }>('/api/auth/request-password-reset', {
      identifier,
    })
    setPending(false)

    if (!result.ok) {
      setError(result.error.message)
      return
    }

    setNotice(
      'Se este contato existir, enviamos as instruções. Se for WhatsApp, use o código abaixo.',
    )
    setMode('requested')
  }

  async function resetWithToken(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!validatePassword()) return

    setPending(true)
    const result = await postJson<{ ok: boolean }>('/api/auth/reset-password', {
      token,
      password,
    })
    setPending(false)

    if (!result.ok) {
      setError(result.error.message)
      return
    }

    setMode('done')
  }

  async function resetWithOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!validatePassword()) return

    setPending(true)
    const result = await postJson<{ ok: boolean }>('/api/auth/reset-password', {
      phone,
      code,
      password,
    })
    setPending(false)

    if (!result.ok) {
      setError(result.error.message)
      return
    }

    setMode('done')
  }

  if (mode === 'done') {
    return (
      <AuthCard
        title="Senha alterada"
        description="Use a nova senha para entrar."
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

  if (mode === 'token') {
    return (
      <AuthCard
        title="Nova senha"
        description="Escolha uma senha com pelo menos 8 caracteres."
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={resetWithToken}
        >
          {error ? <FormMessage>{error}</FormMessage> : null}

          <Field
            label="Nova senha"
            htmlFor="reset-token-password"
          >
            <Input
              id="reset-token-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>

          <Field
            label="Confirmar senha"
            htmlFor="reset-token-confirm"
          >
            <Input
              id="reset-token-confirm"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
          </Field>

          <Button
            type="submit"
            disabled={pending}
          >
            {pending ? 'Salvando…' : 'Salvar nova senha'}
          </Button>
        </form>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Recuperar senha"
      description="Informe o telefone ou e-mail da sua conta."
    >
      {mode === 'request' ? (
        <form
          className="flex flex-col gap-4"
          onSubmit={request}
        >
          {error ? <FormMessage>{error}</FormMessage> : null}

          <Field
            label="Telefone ou e-mail"
            htmlFor="reset-identifier"
          >
            <Input
              id="reset-identifier"
              autoComplete="username"
              required
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
            />
          </Field>

          <Button
            type="submit"
            disabled={pending}
          >
            {pending ? 'Enviando…' : 'Enviar instruções'}
          </Button>
        </form>
      ) : (
        <div className="flex flex-col gap-5">
          {notice ? <FormMessage tone="info">{notice}</FormMessage> : null}
          {error ? <FormMessage>{error}</FormMessage> : null}

          <form
            className="flex flex-col gap-4"
            onSubmit={resetWithOtp}
          >
            <Field
              label="Telefone"
              htmlFor="reset-phone"
            >
              <Input
                id="reset-phone"
                type="tel"
                autoComplete="tel"
                placeholder="+55 31 98881-5243"
                required
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </Field>

            <Field
              label="Código do WhatsApp"
              htmlFor="reset-code"
            >
              <Input
                id="reset-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                className="text-center tracking-[0.3em]"
              />
            </Field>

            <Field
              label="Nova senha"
              htmlFor="reset-password"
            >
              <Input
                id="reset-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field>

            <Field
              label="Confirmar senha"
              htmlFor="reset-confirm"
            >
              <Input
                id="reset-confirm"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
              />
            </Field>

            <Button
              type="submit"
              disabled={pending}
            >
              {pending ? 'Salvando…' : 'Salvar nova senha'}
            </Button>
          </form>
        </div>
      )}

      <p className="mt-4 text-center text-caption text-muted">
        Lembrou a senha?{' '}
        <Link
          href="/entrar"
          className="font-semibold text-accent hover:text-accent-hover"
        >
          Entrar
        </Link>
      </p>
    </AuthCard>
  )
}

'use client'

import { useState, type FormEvent } from 'react'

import { AuthField, AuthInput } from '@/components/auth/AuthField'
import { AuthHeading } from '@/components/auth/AuthHeading'
import { FormMessage } from '@/components/auth/FormMessage'
import { Button } from '@/components/ui/Button'
import { postJson } from '@/lib/http/client'

type Mode = 'request' | 'requested' | 'token' | 'done'

const submitClass = 'w-full'

function BackToLogin({ onLogin }: { onLogin: () => void }) {
  return (
    <p className="text-center text-caption text-muted">
      Lembrou a senha?{' '}
      <button
        type="button"
        onClick={onLogin}
        className="cursor-pointer font-medium text-accent transition-colors hover:text-accent-hover"
      >
        Entrar
      </button>
    </p>
  )
}

export function PasswordResetForm({
  token,
  onLogin,
}: {
  token: string | null
  onLogin: () => void
}) {
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
      <div className="flex w-full flex-col gap-6">
        <AuthHeading
          title="Senha alterada"
          description="Use a nova senha para entrar."
        />
        <Button
          type="button"
          size="lg"
          className={submitClass}
          onClick={onLogin}
        >
          Entrar
        </Button>
      </div>
    )
  }

  if (mode === 'token') {
    return (
      <div className="flex w-full flex-col gap-6">
        <AuthHeading
          title="Nova senha"
          description="Escolha uma senha com pelo menos 8 caracteres."
        />

        <form
          className="flex flex-col gap-6"
          onSubmit={resetWithToken}
        >
          {error ? <FormMessage>{error}</FormMessage> : null}

          <div className="flex flex-col gap-4">
            <AuthField
              label="Nova senha"
              htmlFor="reset-token-password"
            >
              <AuthInput
                id="reset-token-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </AuthField>

            <AuthField
              label="Confirmar senha"
              htmlFor="reset-token-confirm"
            >
              <AuthInput
                id="reset-token-confirm"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
              />
            </AuthField>
          </div>

          <div className="flex flex-col gap-4">
            <Button
              type="submit"
              size="lg"
              className={submitClass}
              disabled={pending}
            >
              {pending ? 'Salvando…' : 'Salvar nova senha'}
            </Button>

            <BackToLogin onLogin={onLogin} />
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <AuthHeading
        title="Recuperar senha"
        description="Informe o telefone ou e-mail da sua conta."
      />

      {mode === 'request' ? (
        <form
          className="flex flex-col gap-6"
          onSubmit={request}
        >
          {error ? <FormMessage>{error}</FormMessage> : null}

          <AuthField
            label="Telefone ou e-mail"
            htmlFor="reset-identifier"
          >
            <AuthInput
              id="reset-identifier"
              autoComplete="username"
              placeholder="seu@email.com"
              required
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
            />
          </AuthField>

          <div className="flex flex-col gap-4">
            <Button
              type="submit"
              size="lg"
              className={submitClass}
              disabled={pending}
            >
              {pending ? 'Enviando…' : 'Enviar instruções'}
            </Button>

            <BackToLogin onLogin={onLogin} />
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          {notice ? <FormMessage tone="info">{notice}</FormMessage> : null}
          {error ? <FormMessage>{error}</FormMessage> : null}

          <form
            className="flex flex-col gap-6"
            onSubmit={resetWithOtp}
          >
            <div className="flex flex-col gap-4">
              <AuthField
                label="Telefone"
                htmlFor="reset-phone"
              >
                <AuthInput
                  id="reset-phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+55 31 98881-5243"
                  required
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </AuthField>

              <AuthField
                label="Código do WhatsApp"
                htmlFor="reset-code"
              >
                <AuthInput
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
              </AuthField>

              <AuthField
                label="Nova senha"
                htmlFor="reset-password"
              >
                <AuthInput
                  id="reset-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </AuthField>

              <AuthField
                label="Confirmar senha"
                htmlFor="reset-confirm"
              >
                <AuthInput
                  id="reset-confirm"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                />
              </AuthField>
            </div>

            <div className="flex flex-col gap-4">
              <Button
                type="submit"
                size="lg"
                className={submitClass}
                disabled={pending}
              >
                {pending ? 'Salvando…' : 'Salvar nova senha'}
              </Button>

              <BackToLogin onLogin={onLogin} />
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

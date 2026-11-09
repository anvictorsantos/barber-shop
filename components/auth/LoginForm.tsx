'use client'

import { ChevronRight, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import { AuthField, AuthInput } from '@/components/auth/AuthField'
import { AuthHeading } from '@/components/auth/AuthHeading'
import { AuthRedirectOverlay } from '@/components/auth/AuthRedirectOverlay'
import { FormMessage } from '@/components/auth/FormMessage'
import { PhoneVerification } from '@/components/auth/PhoneVerification'
import { Button } from '@/components/ui/Button'
import { postAuthPath } from '@/lib/auth/redirect'
import { postJson } from '@/lib/http/client'

type RoleName = 'CUSTOMER' | 'BARBER' | 'OWNER'

interface UserResponse {
  user: { id: string; name: string; role: RoleName }
}

export function LoginForm({
  next,
  onCreateAccount,
  onForgotPassword,
}: {
  next?: string | null
  onCreateAccount: () => void
  onForgotPassword: () => void
}) {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [resending, setResending] = useState(false)
  const [phoneLoginPending, setPhoneLoginPending] = useState(false)
  const [phonePending, setPhonePending] = useState<string | null>(null)
  const [redirecting, setRedirecting] = useState(false)

  const phoneLike = identifier.trim().length >= 8 && !identifier.includes('@')

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

    setRedirecting(true)
    await new Promise((resolve) => setTimeout(resolve, 450))
    router.push(postAuthPath(result.data.user.role, next))
    router.refresh()
  }

  async function resendActivation() {
    if (!identifier.trim()) {
      setError('Informe seu telefone ou e-mail.')
      return
    }

    setError(null)
    setNotice(null)
    setResending(true)
    await postJson('/api/auth/resend', { identifier })
    setResending(false)
    setNotice('Se este contato tiver um agendamento, enviamos as instruções.')
  }

  async function requestPhoneCode() {
    setError(null)
    setNotice(null)
    setPhoneLoginPending(true)
    await postJson('/api/auth/phone-login', { phone: identifier })
    setPhoneLoginPending(false)
    setPhonePending(identifier)
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <AuthHeading
        title="Entrar"
        description="Use seu telefone ou e-mail e sua senha."
      />

      <form
        className="flex flex-col gap-6"
        onSubmit={submit}
      >
        {error ? <FormMessage>{error}</FormMessage> : null}
        {notice ? <FormMessage tone="info">{notice}</FormMessage> : null}

        <div className="flex flex-col gap-4">
          <AuthField
            label="Telefone ou e-mail"
            htmlFor="login-identifier"
          >
            <AuthInput
              id="login-identifier"
              name="identifier"
              autoComplete="username"
              required
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="seu@email.com"
            />
          </AuthField>

          <AuthField
            label="Senha"
            htmlFor="login-password"
          >
            <div className="relative">
              <AuthInput
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Sua senha"
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label="Alternar visibilidade"
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center text-muted transition-colors hover:text-text"
              >
                {showPassword ? (
                  <EyeOff
                    aria-hidden
                    className="h-4 w-4"
                  />
                ) : (
                  <Eye
                    aria-hidden
                    className="h-4 w-4"
                  />
                )}
              </button>
            </div>
          </AuthField>

          <div className="flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={onForgotPassword}
              className="cursor-pointer text-caption text-accent transition-colors hover:text-accent-hover"
            >
              Esqueci minha senha
            </button>
            <button
              type="button"
              onClick={resendActivation}
              disabled={resending}
              className="cursor-pointer text-caption text-muted transition-colors hover:text-text disabled:opacity-50"
            >
              {resending ? 'Enviando…' : 'Receber link para definir minha senha'}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={pending}
          >
            {pending ? 'Entrando…' : 'Entrar'}
          </Button>

          {phoneLike ? (
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              onClick={requestPhoneCode}
              disabled={phoneLoginPending}
            >
              {phoneLoginPending ? 'Enviando…' : 'Entrar com código no WhatsApp'}
            </Button>
          ) : null}

          <p className="text-center text-caption text-muted">
            Não tem conta?{' '}
            <button
              type="button"
              onClick={onCreateAccount}
              className="cursor-pointer font-medium text-accent transition-colors hover:text-accent-hover"
            >
              Criar conta
            </button>
          </p>
        </div>

        <div className="flex items-center gap-4">
          <span className="h-px flex-1 bg-border" />
          <span className="text-caption text-subtle">ou</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <Link
          href="/servicos"
          className="inline-flex items-center justify-center gap-1 text-body text-text-secondary transition-colors hover:text-text"
        >
          Continuar como visitante
          <ChevronRight
            aria-hidden
            className="h-4 w-4"
          />
        </Link>
      </form>

      {pending || redirecting ? <AuthRedirectOverlay label="Entrando…" /> : null}
    </div>
  )
}

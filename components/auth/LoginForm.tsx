'use client'

import { ChevronRight, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import { FormMessage } from '@/components/auth/FormMessage'
import { PhoneVerification } from '@/components/auth/PhoneVerification'
import { Button } from '@/components/ui/Button'
import { postAuthPath } from '@/lib/auth/redirect'
import { postJson } from '@/lib/http/client'
import { cn } from '@/lib/utils'

type RoleName = 'CUSTOMER' | 'BARBER' | 'OWNER'

interface UserResponse {
  user: { id: string; name: string; role: RoleName }
}

const fieldClass =
  'h-[52px] w-full rounded-md border border-white/10 bg-background px-4 text-sm text-text placeholder:text-muted transition focus:border-accent'

export function LoginForm({ next }: { next?: string | null }) {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
    <div className="flex w-full flex-col gap-7 rounded-xl border border-white/10 bg-surface p-6 sm:p-10">
      <div className="flex flex-col gap-2.5">
        <h2 className="font-display text-[30px] font-bold leading-[1.2] text-text sm:text-[38px]">
          Entrar
        </h2>
        <p className="text-sm leading-[1.5] text-muted">Use seu telefone ou e-mail e sua senha.</p>
      </div>

      <form
        className="flex flex-col gap-7"
        onSubmit={submit}
      >
        {error ? <FormMessage>{error}</FormMessage> : null}

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2.5">
            <label
              htmlFor="login-identifier"
              className="text-[13px] font-medium leading-4 text-text"
            >
              Telefone ou e-mail
            </label>
            <input
              id="login-identifier"
              name="identifier"
              autoComplete="username"
              required
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="seu@email.com"
              className={fieldClass}
            />
          </div>

          <div className="flex flex-col gap-2.5">
            <label
              htmlFor="login-password"
              className="text-[13px] font-medium leading-4 text-text"
            >
              Senha
            </label>
            <div className="relative">
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Sua senha"
                className={cn(fieldClass, 'pr-12')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label="Alternar visibilidade"
                className="absolute right-4 top-1/2 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center text-muted transition hover:text-text"
              >
                {showPassword ? (
                  <EyeOff
                    aria-hidden
                    strokeWidth={1.8}
                    className="h-5 w-5"
                  />
                ) : (
                  <Eye
                    aria-hidden
                    strokeWidth={1.8}
                    className="h-5 w-5"
                  />
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <Link
              href="/recuperar-senha"
              className="text-[13px] font-semibold leading-4 text-primary underline underline-offset-2 transition hover:text-primary-hover"
            >
              Esqueci minha senha
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <Button
            type="submit"
            size="lg"
            className="h-[52px] w-full gap-2.5 rounded-md px-[22px] text-sm"
            disabled={pending}
          >
            {pending ? 'Entrando…' : 'Entrar'}
            <ChevronRight
              aria-hidden
              className="h-[18px] w-[18px]"
            />
          </Button>

          <p className="text-center text-[13px] leading-4 text-muted">
            Não tem conta?{' '}
            <Link
              href="/criar-conta"
              className="font-semibold text-accent underline underline-offset-2 transition hover:text-accent-hover"
            >
              Criar conta
            </Link>
          </p>
        </div>

        <div className="flex items-center gap-4">
          <span className="h-px flex-1 bg-white/10" />
          <span className="text-caption text-muted">ou</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/servicos"
            className="inline-flex h-[52px] w-full items-center justify-center rounded-md border border-primary px-[22px] text-sm font-bold text-text transition hover:bg-primary/10"
          >
            Continuar como visitante
          </Link>
          <p className="text-center text-caption leading-[1.6] text-muted">
            Você pode agendar sem conta e criar uma depois.
          </p>
        </div>
      </form>
    </div>
  )
}

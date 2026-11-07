'use client'

import { useState } from 'react'

import { LoginForm } from '@/components/auth/LoginForm'
import { PasswordResetForm } from '@/components/auth/PasswordResetForm'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { cn } from '@/lib/utils'

export type AuthMode = 'login' | 'register' | 'reset'

const MODE_QUERY: Record<AuthMode, string | null> = {
  login: null,
  register: 'criar',
  reset: 'recuperar',
}

export function AuthPanel({
  next,
  initialMode = 'login',
  token = null,
}: {
  next?: string | null
  initialMode?: AuthMode
  token?: string | null
}) {
  const [mode, setMode] = useState<AuthMode>(token ? 'reset' : initialMode)
  const [resetToken, setResetToken] = useState<string | null>(token)

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode)

    const url = new URL(window.location.href)
    const query = MODE_QUERY[nextMode]
    if (query) url.searchParams.set('modo', query)
    else url.searchParams.delete('modo')
    if (nextMode !== 'reset') {
      setResetToken(null)
      url.searchParams.delete('token')
    }
    window.history.replaceState(null, '', url)
  }

  return (
    <div className="flex w-full flex-col gap-7 rounded-xl border border-white/10 bg-surface p-6 sm:p-10">
      {mode === 'reset' ? null : (
        <div
          role="group"
          aria-label="Acesso à conta"
          className="grid grid-cols-2 gap-1 rounded-md bg-background p-1"
        >
          <button
            type="button"
            aria-pressed={mode === 'login'}
            onClick={() => switchMode('login')}
            className={cn(
              'h-11 cursor-pointer rounded-sm text-sm font-semibold transition',
              mode === 'login' ? 'bg-white/10 text-text' : 'text-muted hover:text-text',
            )}
          >
            Entrar
          </button>
          <button
            type="button"
            aria-pressed={mode === 'register'}
            onClick={() => switchMode('register')}
            className={cn(
              'h-11 cursor-pointer rounded-sm text-sm font-semibold transition',
              mode === 'register' ? 'bg-white/10 text-text' : 'text-muted hover:text-text',
            )}
          >
            Criar conta
          </button>
        </div>
      )}

      {mode === 'login' ? (
        <LoginForm
          next={next ?? null}
          onCreateAccount={() => switchMode('register')}
          onForgotPassword={() => switchMode('reset')}
        />
      ) : null}

      {mode === 'register' ? (
        <RegisterForm
          next={next ?? null}
          onLogin={() => switchMode('login')}
        />
      ) : null}

      {mode === 'reset' ? (
        <PasswordResetForm
          token={resetToken}
          onLogin={() => switchMode('login')}
        />
      ) : null}
    </div>
  )
}

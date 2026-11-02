'use client'

import { Crown, Scissors, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { buttonClasses } from '@/components/ui/Button'

const OPTIONS = [
  { role: 'customer', label: 'Entrar como cliente', icon: User, next: '/conta/agendamentos' },
  { role: 'barber', label: 'Entrar como barbeiro', icon: Scissors, next: '/admin' },
  { role: 'owner', label: 'Entrar como dono', icon: Crown, next: '/admin' },
] as const

export function DemoLoginButtons() {
  const router = useRouter()
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function enter(role: (typeof OPTIONS)[number]['role'], next: string) {
    setPending(role)
    setError(null)

    const response = await fetch('/api/auth/demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })

    setPending(null)

    if (!response.ok) {
      setError('Não foi possível entrar na demonstração.')
      return
    }

    router.push(next)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 py-2">
        <div className="h-px flex-1 bg-border" />
        <span className="text-micro uppercase tracking-wider text-subtle">
          Acesso de demonstração
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {OPTIONS.map((option) => {
        const Icon = option.icon
        return (
          <button
            key={option.role}
            type="button"
            disabled={pending !== null}
            onClick={() => enter(option.role, option.next)}
            className={buttonClasses({
              variant: 'outline',
              className: 'w-full justify-start',
            })}
          >
            <Icon
              className="h-4 w-4 text-accent"
              aria-hidden
            />
            {pending === option.role ? 'Entrando…' : option.label}
          </button>
        )
      })}

      {error ? (
        <p
          role="alert"
          className="text-caption text-danger"
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}

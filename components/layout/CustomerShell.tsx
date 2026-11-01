import Link from 'next/link'
import { redirect } from 'next/navigation'

import { CustomerNav } from '@/components/layout/CustomerNav'
import { getSessionUser } from '@/lib/auth/session'

import type { ReactNode } from 'react'

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export async function CustomerShell({ children }: { children: ReactNode }) {
  const user = await getSessionUser()
  if (!user) redirect('/entrar?next=/conta/agendamentos')
  if (user.role !== 'CUSTOMER') redirect('/admin')

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="border-b border-border bg-shell/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-shell items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="font-display text-lg font-black tracking-wider text-accent"
          >
            BARBEARIA DO LUIZ
          </Link>

          <CustomerNav variant="horizontal" />

          <Link
            href="/conta/perfil"
            className="flex items-center gap-2 text-caption font-semibold text-muted hover:text-text"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-caption font-bold text-accent">
              {initials(user.name)}
            </span>
            <span className="hidden sm:inline">{user.name.split(' ')[0]}</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-6 sm:px-6 lg:pb-10">
        {children}
      </main>

      <CustomerNav variant="bottom" />
    </div>
  )
}

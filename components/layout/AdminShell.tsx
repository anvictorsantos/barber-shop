import { Bell } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { AdminNav } from '@/components/layout/AdminNav'
import { SkipLink } from '@/components/layout/SkipLink'
import { StatusPill } from '@/components/ui/StatusPill'
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

export async function AdminShell({ children }: { children: ReactNode }) {
  const user = await getSessionUser()
  if (!user) redirect('/entrar?next=/admin')
  if (user.role === 'CUSTOMER') redirect('/conta/agendamentos')

  return (
    <div className="flex min-h-dvh bg-background">
      <SkipLink />
      <aside className="hidden w-[260px] shrink-0 flex-col gap-10 border-r border-border bg-shell p-6 lg:flex">
        <div className="flex flex-col gap-1.5">
          <Link
            href="/admin"
            className="flex items-center"
          >
            <Image
              src="/brand/logo.png"
              alt="Barbearia do Luiz"
              width={774}
              height={880}
              priority
              className="h-14 w-auto"
            />
          </Link>
          <p className="text-label uppercase tracking-wider text-muted">Painel de controle</p>
        </div>

        <AdminNav role={user.role} />

        <div className="mt-auto flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-accent bg-primary/10 text-caption font-bold text-accent">
            {initials(user.name)}
          </span>
          <div className="flex min-w-0 flex-col">
            <p className="truncate text-caption font-bold text-text">{user.name}</p>
            <p className="text-micro text-muted">
              {user.role === 'OWNER' ? 'Administrador' : 'Barbeiro'}
            </p>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-20 items-center justify-between border-b border-border px-6 lg:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <Link
              href="/admin"
              className="flex items-center"
            >
              <Image
                src="/brand/logo.png"
                alt="Barbearia do Luiz"
                width={774}
                height={880}
                className="h-9 w-auto"
              />
            </Link>
          </div>

          <div className="hidden lg:block">
            <StatusPill tone="success">BARBEARIA ABERTA</StatusPill>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Notificações"
              className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface text-accent"
            >
              <Bell
                className="h-[18px] w-[18px]"
                aria-hidden
              />
            </button>
          </div>
        </header>

        <main
          id="main-content"
          className="flex-1 p-6 lg:p-8"
        >
          {children}
        </main>
      </div>
    </div>
  )
}

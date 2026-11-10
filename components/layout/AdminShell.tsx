import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { AdminMobileMenu } from '@/components/admin/AdminMobileMenu'
import { LogoutButton } from '@/components/admin/LogoutButton'
import { NotificationsBell } from '@/components/admin/NotificationsBell'
import { AdminNav } from '@/components/layout/AdminNav'
import { SkipLink } from '@/components/layout/SkipLink'
import { StatusPill } from '@/components/ui/StatusPill'
import { getAdminNotifications } from '@/lib/admin/notifications'
import { getSessionUser } from '@/lib/auth/session'
import { initials } from '@/lib/format/name'

import type { ReactNode } from 'react'

export async function AdminShell({ children }: { children: ReactNode }) {
  const user = await getSessionUser()
  if (!user) redirect('/entrar?next=/admin')
  if (user.role === 'CUSTOMER') redirect('/conta/agendamentos')

  const notifications = await getAdminNotifications(user)

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
              width={800}
              height={800}
              priority
              className="h-14 w-auto m-auto"
            />
          </Link>
        </div>

        <AdminNav role={user.role} />

        <div className="mt-auto flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-accent bg-primary/10 text-caption font-bold text-accent">
              {initials(user.name)}
            </span>
            <div className="flex min-w-0 flex-col">
              <p className="truncate text-caption font-bold text-text">{user.name}</p>
              <p className="text-micro text-muted">
                {user.role === 'OWNER' ? 'Administrador' : 'Barbeiro'}
              </p>
            </div>
            <LogoutButton
              className="ml-auto"
              label=""
            />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-20 items-center justify-between border-b border-border px-6 lg:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <AdminMobileMenu
              name={user.name}
              role={user.role}
            />
            <Link
              href="/admin"
              className="flex items-center"
            >
              <Image
                src="/brand/logo.png"
                alt="Barbearia do Luiz"
                width={800}
                height={800}
                className="h-9 w-auto m-auto"
              />
            </Link>
          </div>

          <div className="hidden lg:block">
            <StatusPill
              tone="success"
              pulse
            >
              BARBEARIA ABERTA
            </StatusPill>
          </div>

          <div className="flex items-center gap-3">
            <NotificationsBell
              count={notifications.count}
              items={notifications.items}
            />
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

'use client'

import { Menu, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

import { LogoutButton } from '@/components/admin/LogoutButton'
import { AdminNav } from '@/components/layout/AdminNav'
import { initials } from '@/lib/format/name'
import { cn } from '@/lib/utils'

import type { Role } from '@prisma/client'

export function AdminMobileMenu({ name, role }: { name: string; role: Role }) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <>
      <button
        type="button"
        aria-label="Abrir menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-border bg-surface text-text lg:hidden"
      >
        <Menu
          aria-hidden
          className="h-[18px] w-[18px]"
        />
      </button>

      <button
        type="button"
        aria-label="Fechar menu"
        onClick={close}
        className={cn(
          'fixed inset-0 z-[70] cursor-default bg-black/60 transition-opacity duration-300 lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      <div
        aria-hidden={!open}
        inert={!open}
        className={cn(
          'fixed inset-y-0 left-0 z-[70] flex w-[280px] flex-col gap-6 bg-shell p-5 transition-transform duration-300 lg:hidden',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between">
          <Link
            href="/admin"
            onClick={close}
            className="flex items-center"
          >
            <Image
              src="/brand/logo.png"
              alt="Barbearia do Luiz"
              width={800}
              height={800}
              className="h-12 w-auto"
            />
          </Link>
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={close}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-muted transition hover:bg-white/5 hover:text-text"
          >
            <X
              aria-hidden
              className="h-4 w-4"
            />
          </button>
        </div>

        <AdminNav
          role={role}
          onNavigate={close}
        />

        <div className="mt-auto flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-accent bg-primary/10 text-caption font-bold text-accent">
              {initials(name)}
            </span>
            <div className="flex min-w-0 flex-col">
              <p className="truncate text-caption font-bold text-text">{name}</p>
              <p className="text-micro text-muted">
                {role === 'OWNER' ? 'Administrador' : 'Barbeiro'}
              </p>
            </div>
            <LogoutButton
              className="ml-auto"
              label=""
            />
          </div>
        </div>
      </div>
    </>
  )
}

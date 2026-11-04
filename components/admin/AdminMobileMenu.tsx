'use client'

import { Home, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { LogoutButton } from '@/components/admin/LogoutButton'
import { AdminNav } from '@/components/layout/AdminNav'

import type { Role } from '@prisma/client'

export function AdminMobileMenu({ role }: { role: Role }) {
  const [open, setOpen] = useState(false)

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

      {open ? (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default bg-black/60"
          />
          <div className="relative flex h-full w-[280px] flex-col gap-6 bg-shell p-5">
            <div className="flex items-center justify-between">
              <span className="font-display text-sm font-black uppercase tracking-[1px] text-accent">
                Menu
              </span>
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-muted transition hover:bg-white/5 hover:text-text"
              >
                <X
                  aria-hidden
                  className="h-4 w-4"
                />
              </button>
            </div>

            <AdminNav role={role} />

            <div className="mt-auto flex flex-col gap-3 border-t border-white/10 pt-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-caption font-semibold text-muted transition hover:text-text"
              >
                <Home
                  aria-hidden
                  className="h-4 w-4"
                />
                Ver site
              </Link>
              <LogoutButton />
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

'use client'

import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export function HeaderMenu({ links }: { links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        aria-label="Abrir menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-border-strong text-text transition-colors hover:border-accent/60"
      >
        <Menu
          aria-hidden
          className="h-5 w-5"
        />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[70] flex flex-col bg-background">
          <div className="flex h-16 shrink-0 items-center justify-end px-4 sm:px-6">
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={() => setOpen(false)}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-border-strong text-text transition-colors hover:border-accent/60"
            >
              <X
                aria-hidden
                className="h-5 w-5"
              />
            </button>
          </div>

          <nav
            aria-label="Menu principal"
            className="flex flex-1 flex-col justify-center gap-2 px-6 pb-24"
          >
            {links.map((link, index) => (
              <Link
                key={`${link.href}-${link.label}`}
                href={link.href}
                className="flex items-baseline gap-4 border-b border-border py-4 font-display text-[32px] font-medium leading-tight text-text transition-colors hover:text-accent lg:text-[40px]"
              >
                <span className="text-caption tabular-nums text-subtle">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </>
  )
}

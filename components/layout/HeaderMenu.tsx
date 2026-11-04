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
        className="flex h-[52px] w-[52px] cursor-pointer items-center justify-center rounded-md border border-white/10 text-text transition hover:border-white/30"
      >
        <Menu
          aria-hidden
          className="h-5 w-5"
        />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[70] flex flex-col bg-background/98 backdrop-blur">
          <div className="flex h-[88px] shrink-0 items-center justify-end px-5 lg:px-20">
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={() => setOpen(false)}
              className="flex h-[52px] w-[52px] cursor-pointer items-center justify-center rounded-md border border-white/10 text-text transition hover:border-white/30"
            >
              <X
                aria-hidden
                className="h-5 w-5"
              />
            </button>
          </div>

          <nav
            aria-label="Menu principal"
            className="flex flex-1 flex-col justify-center gap-3 px-6 pb-24 lg:px-20"
          >
            {links.map((link) => (
              <Link
                key={`${link.href}-${link.label}`}
                href={link.href}
                className="font-display text-[32px] font-bold leading-tight text-text transition hover:text-accent lg:text-[44px]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </>
  )
}

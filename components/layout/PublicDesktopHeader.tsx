import { ArrowRight, UserRound } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { postAuthPath } from '@/lib/auth/redirect'
import type { SessionUser } from '@/lib/auth/session'

type ActivePage = 'home' | 'services' | 'booking'

const NAV_LINKS = [
  { href: '/', label: 'Início', page: 'home' },
  { href: '/servicos', label: 'Serviços', page: 'services' },
  { href: '/servicos', label: 'Agendar', page: 'booking' },
  { href: '/loja', label: 'Loja', page: 'store' },
] as const

export function PublicDesktopHeader({
  shopName,
  city,
  state,
  user,
  active,
  overlay = false,
}: {
  shopName: string
  city: string
  state: string
  user: SessionUser | null
  active?: ActivePage | 'store'
  overlay?: boolean
}) {
  const accountHref = user ? postAuthPath(user.role) : '/entrar'

  return (
    <header className={overlay ? 'absolute inset-x-0 top-0 z-40' : 'border-b border-white/10'}>
      <div className="flex h-[88px] items-center justify-between gap-8 px-10 xl:px-20">
        <Link
          href="/"
          className="flex items-center"
        >
          <Image
            src="/brand/logo.png"
            alt={`${shopName} — ${city}, ${state}`}
            width={774}
            height={880}
            priority
            className="h-[60px] w-auto"
          />
        </Link>

        <nav className="flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              aria-current={link.page === active ? 'page' : undefined}
              className={
                link.page === active
                  ? 'text-sm font-bold text-accent'
                  : 'text-sm font-medium text-muted transition hover:text-text'
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href={accountHref}
            className="inline-flex h-[52px] items-center justify-center gap-2.5 rounded-md bg-white/10 px-[22px] text-sm font-bold text-text transition hover:bg-white/15"
          >
            {user ? 'Minha conta' : 'Entrar'}
            <UserRound
              aria-hidden
              className="h-[18px] w-[18px]"
            />
          </Link>

          {user ? null : (
            <Link
              href="/criar-conta"
              className="inline-flex h-[52px] items-center justify-center gap-2.5 rounded-md bg-primary px-[22px] text-sm font-bold text-white transition hover:bg-primary-hover"
            >
              Criar conta
              <ArrowRight
                aria-hidden
                className="h-[18px] w-[18px]"
              />
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

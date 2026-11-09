import Image from 'next/image'
import Link from 'next/link'

import { postAuthPath } from '@/lib/auth/redirect'
import type { SessionUser } from '@/lib/auth/session'
import { cn } from '@/lib/utils'

type ActivePage = 'home' | 'services' | 'booking'

const NAV_LINKS = [
  { href: '/', label: 'Início', page: 'home' },
  { href: '/servicos', label: 'Serviços', page: 'services' },
  { href: '/loja', label: 'Loja', page: 'store' },
] as const

export function PublicDesktopHeader({
  shopName,
  city,
  state,
  user,
  active,
  overlay = false,
  hideAccount = false,
}: {
  shopName: string
  city: string
  state: string
  user: SessionUser | null
  active?: ActivePage | 'store'
  overlay?: boolean
  hideAccount?: boolean
}) {
  const accountHref = user ? postAuthPath(user.role) : '/entrar'

  return (
    <header className={overlay ? 'absolute inset-x-0 top-0 z-40' : 'border-b border-border'}>
      <div className="mx-auto grid h-20 max-w-shell grid-cols-[1fr_auto_1fr] items-center gap-8 px-6 lg:px-10">
        <Link
          href="/"
          className="flex items-center justify-self-start"
        >
          <Image
            src="/brand/logo.png"
            alt={`${shopName} — ${city}, ${state}`}
            width={774}
            height={880}
            sizes="48px"
            priority
            className="h-12 w-auto"
          />
        </Link>

        <nav className="flex items-center gap-8">
          {NAV_LINKS.map((link) => {
            const isActive = link.page === active
            return (
              <Link
                key={link.label}
                href={link.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative text-body transition-colors',
                  isActive ? 'text-text' : 'text-muted hover:text-text',
                )}
              >
                {link.label}
                {isActive ? (
                  <span
                    aria-hidden
                    className="absolute -bottom-2 left-1/2 h-[3px] w-[3px] -translate-x-1/2 rotate-45 bg-accent"
                  />
                ) : null}
              </Link>
            )
          })}
        </nav>

        {hideAccount ? (
          <div className="justify-self-end" />
        ) : (
          <div className="flex items-center justify-self-end gap-6">
            <Link
              href={accountHref}
              className="text-body text-muted transition-colors hover:text-text"
            >
              {user ? 'Minha conta' : 'Entrar'}
            </Link>

            {user ? null : (
              <Link
                href="/entrar?modo=criar"
                className="inline-flex h-10 items-center justify-center rounded-md border border-border-strong px-4 text-body font-medium text-text transition-colors hover:border-accent/60"
              >
                Criar conta
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

import { ArrowRight, UserRound } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { HeaderMenu } from '@/components/layout/HeaderMenu'
import { postAuthPath } from '@/lib/auth/redirect'
import type { SessionUser } from '@/lib/auth/session'

type ActivePage = 'home' | 'services' | 'booking'

export function PublicDesktopHeader({
  shopName,
  city,
  state,
  user,
}: {
  shopName: string
  city: string
  state: string
  user: SessionUser | null
  active?: ActivePage
}) {
  const accountHref = user ? postAuthPath(user.role) : '/entrar'

  const menuLinks = [
    { href: '/', label: 'Início' },
    { href: '/servicos', label: 'Serviços' },
    { href: '/servicos', label: 'Agendar' },
    { href: '/loja', label: 'Loja' },
    { href: accountHref, label: user ? 'Minha conta' : 'Entrar' },
    ...(user ? [] : [{ href: '/criar-conta', label: 'Criar conta' }]),
  ]

  return (
    <header className="border-b border-white/10">
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

          <HeaderMenu links={menuLinks} />
        </div>
      </div>
    </header>
  )
}

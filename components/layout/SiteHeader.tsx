import Image from 'next/image'
import Link from 'next/link'

import { CartLink } from '@/components/cart/CartLink'
import { HeaderMenu } from '@/components/layout/HeaderMenu'

const MENU_LINKS = [
  { href: '/', label: 'Início' },
  { href: '/servicos', label: 'Serviços' },
  { href: '/loja', label: 'Loja' },
  { href: '/entrar', label: 'Entrar' },
  { href: '/entrar?modo=criar', label: 'Criar conta' },
]

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-shell">
      <div className="mx-auto flex h-16 max-w-shell items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center"
        >
          <Image
            src="/brand/logo.png"
            alt="Barbearia do Luiz"
            width={774}
            height={880}
            sizes="40px"
            className="h-10 w-auto"
          />
        </Link>

        <div className="flex items-center gap-2">
          <CartLink />
          <HeaderMenu links={MENU_LINKS} />
        </div>
      </div>
    </header>
  )
}

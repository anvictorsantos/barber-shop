import Link from 'next/link'

import { CartLink } from '@/components/cart/CartLink'
import { buttonClasses } from '@/components/ui/Button'

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-shell/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-shell items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="font-display text-lg font-black tracking-wider text-accent"
        >
          BARBEARIA DO LUIZ
        </Link>

        <nav className="hidden items-center gap-6 sm:flex">
          <Link
            href="/servicos"
            className="text-caption font-semibold text-muted hover:text-text"
          >
            Serviços
          </Link>
          <Link
            href="/loja"
            className="text-caption font-semibold text-muted hover:text-text"
          >
            Loja
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <CartLink />
          <Link
            href="/entrar"
            className={buttonClasses({ variant: 'outline', size: 'sm' })}
          >
            Entrar
          </Link>
          <Link
            href="/criar-conta"
            className={buttonClasses({
              variant: 'primary',
              size: 'sm',
              className: 'hidden sm:inline-flex',
            })}
          >
            Criar conta
          </Link>
        </div>
      </div>
    </header>
  )
}

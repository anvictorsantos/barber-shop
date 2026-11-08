import Image from 'next/image'
import Link from 'next/link'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Página não encontrada — Barbearia do Luiz',
}

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center">
      <Image
        src="/brand/logo.png"
        alt="Barbearia do Luiz"
        width={774}
        height={880}
        className="h-16 w-auto"
      />

      <p className="mt-10 text-caption text-muted">Erro 404</p>
      <h1 className="mt-3 font-display text-[38px] font-semibold leading-[1.08] text-text sm:text-[44px]">
        Página não encontrada
      </h1>
      <p className="mt-3 max-w-[380px] text-body leading-relaxed text-muted">
        O endereço pode ter mudado ou nunca existiu.
      </p>

      <div className="mt-8 flex items-center gap-5">
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-body font-medium text-accent-ink transition-colors hover:bg-primary-hover"
        >
          Voltar ao início
        </Link>
        <Link
          href="/servicos"
          className="text-body text-text-secondary transition-colors hover:text-text"
        >
          Ver serviços
        </Link>
      </div>
    </main>
  )
}

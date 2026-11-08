import Link from 'next/link'

import { SectionLabel } from '@/components/ui/SectionLabel'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacidade — Barbearia do Luiz',
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-prose flex-col gap-8 px-6 py-16">
      <Link
        href="/"
        className="w-fit text-caption text-muted transition-colors hover:text-text"
      >
        Voltar ao site
      </Link>

      <div className="flex flex-col gap-4">
        <SectionLabel>Documento</SectionLabel>
        <h1 className="font-display text-[40px] font-semibold leading-[1.05] text-text">
          Privacidade
        </h1>
      </div>

      <div className="border-t border-border pt-6">
        <p className="text-lead leading-relaxed text-text-secondary">
          A política de privacidade completa entra junto com o fluxo de contas e pagamentos. Hoje o
          site só mede uso quando o visitante aceita o banner de cookies.
        </p>
      </div>
    </main>
  )
}

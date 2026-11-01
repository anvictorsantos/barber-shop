import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacidade — Barbearia do Luiz',
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-dvh max-w-narrow px-5 py-16">
      <h1 className="text-page font-extrabold text-text">Privacidade</h1>
      <p className="mt-4 text-body leading-relaxed text-text-secondary">
        A política de privacidade completa entra junto com o fluxo de contas e pagamentos. Hoje o
        site só mede uso quando o visitante aceita o banner de cookies.
      </p>
    </main>
  )
}

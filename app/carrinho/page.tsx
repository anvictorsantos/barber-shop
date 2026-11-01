import { CartContents } from '@/components/cart/CartContents'
import { PublicShell } from '@/components/layout/PublicShell'
import { PageHeader } from '@/components/ui/PageHeader'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Carrinho — Barbearia do Luiz',
  robots: { index: false, follow: false },
}

export default function CartPage() {
  return (
    <PublicShell>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6">
        <PageHeader
          title="Carrinho"
          description="Revise os serviços antes de finalizar."
        />
        <CartContents />
      </div>
    </PublicShell>
  )
}

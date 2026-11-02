import { CartContents } from '@/components/cart/CartContents'
import { PublicShell } from '@/components/layout/PublicShell'
import { PageHeader } from '@/components/ui/PageHeader'
import { getSessionUser } from '@/lib/auth/session'
import { findAvailableCredit } from '@/lib/loyalty/service'

import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Carrinho — Barbearia do Luiz',
  robots: { index: false, follow: false },
}

export default async function CartPage() {
  const user = await getSessionUser()
  const customer = user
    ? { name: user.name, email: user.email ?? '', phone: user.phone ?? '' }
    : null
  const hasCredit =
    user?.role === 'CUSTOMER' ? (await findAvailableCredit(user.id)) !== null : false

  return (
    <PublicShell>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6">
        <PageHeader
          title="Carrinho"
          description="Revise os serviços antes de finalizar."
        />
        <CartContents
          customer={customer}
          hasCredit={hasCredit}
        />
      </div>
    </PublicShell>
  )
}

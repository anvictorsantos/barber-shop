import { VerifyEmailForm } from '@/components/auth/VerifyEmailForm'
import { PublicShell } from '@/components/layout/PublicShell'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Confirmar e-mail — Barbearia do Luiz',
  robots: { index: false, follow: false },
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>
}) {
  const params = await searchParams
  const token = typeof params.token === 'string' ? params.token : null

  return (
    <PublicShell>
      <div className="mx-auto w-full max-w-md px-4 py-12 sm:px-6">
        <VerifyEmailForm token={token} />
      </div>
    </PublicShell>
  )
}

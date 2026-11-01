import { PasswordResetForm } from '@/components/auth/PasswordResetForm'
import { PublicShell } from '@/components/layout/PublicShell'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Recuperar senha — Barbearia do Luiz',
  robots: { index: false, follow: false },
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>
}) {
  const params = await searchParams
  const token = typeof params.token === 'string' ? params.token : null

  return (
    <PublicShell>
      <div className="mx-auto w-full max-w-md px-4 py-12 sm:px-6">
        <PasswordResetForm token={token} />
      </div>
    </PublicShell>
  )
}

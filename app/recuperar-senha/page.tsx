import { redirect } from 'next/navigation'

import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

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
  const query = new URLSearchParams({ modo: 'recuperar' })
  if (typeof params.token === 'string') query.set('token', params.token)

  redirect(`/entrar?${query.toString()}`)
}

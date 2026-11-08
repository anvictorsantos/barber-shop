import { redirect } from 'next/navigation'

import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Criar conta — Barbearia do Luiz',
  robots: { index: false, follow: false },
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>
}) {
  const params = await searchParams
  const query = new URLSearchParams({ modo: 'criar' })
  if (typeof params.next === 'string') query.set('next', params.next)

  redirect(`/entrar?${query.toString()}`)
}

import { redirect } from 'next/navigation'

import { DemoLoginButtons } from '@/components/auth/DemoLoginButtons'
import { LoginForm } from '@/components/auth/LoginForm'
import { PublicShell } from '@/components/layout/PublicShell'
import { postAuthPath } from '@/lib/auth/redirect'
import { getSessionUser } from '@/lib/auth/session'
import { getServerEnv } from '@/lib/env'

import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Entrar — Barbearia do Luiz',
  robots: { index: false, follow: false },
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>
}) {
  const user = await getSessionUser()
  if (user) redirect(postAuthPath(user.role, null))

  const params = await searchParams
  const next = typeof params.next === 'string' ? params.next : null

  return (
    <PublicShell>
      <div className="mx-auto w-full max-w-md px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-6">
          <LoginForm next={next} />
          {getServerEnv().DEMO_MODE ? <DemoLoginButtons /> : null}
        </div>
      </div>
    </PublicShell>
  )
}

import { Check } from 'lucide-react'
import { redirect } from 'next/navigation'

import { AuthPanel, type AuthMode } from '@/components/auth/AuthPanel'
import { DemoLoginButtons } from '@/components/auth/DemoLoginButtons'
import { PublicDesktopFooter } from '@/components/layout/PublicDesktopFooter'
import { PublicDesktopHeader } from '@/components/layout/PublicDesktopHeader'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SkipLink } from '@/components/layout/SkipLink'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { postAuthPath } from '@/lib/auth/redirect'
import { getSessionUser } from '@/lib/auth/session'
import { getServerEnv } from '@/lib/env'
import { getShopSettings } from '@/lib/settings/queries'

import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Entrar — Barbearia do Luiz',
  robots: { index: false, follow: false },
}

const BENEFITS = [
  {
    title: 'Agendamento sem complicação',
    description: 'Seus dados ficam salvos para o próximo horário.',
  },
  {
    title: 'Seu histórico na mão',
    description: 'Atendimentos anteriores, avaliações e créditos de fidelidade.',
  },
] as const

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    next?: string | string[]
    modo?: string | string[]
    token?: string | string[]
  }>
}) {
  const user = await getSessionUser()
  if (user) redirect(postAuthPath(user.role, null))

  const [params, shop] = await Promise.all([searchParams, getShopSettings()])
  const next = typeof params.next === 'string' ? params.next : null
  const token = typeof params.token === 'string' ? params.token : null
  const modo = typeof params.modo === 'string' ? params.modo : null
  const initialMode: AuthMode =
    token || modo === 'recuperar' ? 'reset' : modo === 'criar' ? 'register' : 'login'
  const shopName = shop?.name ?? 'Barbearia do Luiz'
  const city = shop?.city ?? 'Belo Horizonte'
  const state = shop?.state ?? 'MG'
  const whatsapp = (shop?.whatsapp ?? '+5531988815243').replace(/\D/g, '')

  return (
    <>
      <SkipLink />
      <main
        id="main-content"
        className="flex min-h-dvh flex-col bg-background"
      >
        <div className="lg:hidden">
          <SiteHeader />
        </div>
        <div className="hidden lg:block">
          <PublicDesktopHeader
            shopName={shopName}
            city={city}
            state={state}
            user={user}
            hideAccount
          />
        </div>

        <section className="flex w-full flex-1 px-6 py-12 lg:px-10 lg:py-16 xl:px-[120px]">
          <div className="mx-auto grid w-full max-w-[1160px] items-center gap-12 lg:grid-cols-[minmax(0,1fr)_480px] xl:gap-20">
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-5">
                <SectionLabel>Sua conta</SectionLabel>
                <h1 className="font-display text-[38px] font-semibold leading-[1.08] text-text lg:text-[44px] xl:text-[50px]">
                  Seus horários, em um só lugar.
                </h1>
                <p className="max-w-[440px] text-lead leading-relaxed text-muted">
                  Salve seus profissionais favoritos e veja todo o histórico de atendimentos sem
                  procurar em outro lugar.
                </p>
              </div>

              <div className="flex flex-col divide-y divide-border border-y border-border">
                {BENEFITS.map((benefit, index) => (
                  <div
                    key={benefit.title}
                    className="flex gap-5 py-4"
                  >
                    <span className="pt-0.5 text-caption tabular-nums text-subtle">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="text-body font-medium text-text">{benefit.title}</span>
                      <span className="text-caption leading-relaxed text-muted">
                        {benefit.description}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <p className="flex items-center gap-2 text-caption text-muted">
                <Check
                  aria-hidden
                  className="h-4 w-4 shrink-0 text-accent"
                />
                Agendar sem conta também funciona — você pode entrar depois.
              </p>
            </div>

            <div className="flex w-full flex-col gap-4">
              <AuthPanel
                next={next}
                initialMode={initialMode}
                token={token}
              />
              {getServerEnv().DEMO_MODE ? <DemoLoginButtons /> : null}
            </div>
          </div>
        </section>

        <PublicDesktopFooter
          shopName={shopName}
          whatsapp={whatsapp}
        />
      </main>
    </>
  )
}

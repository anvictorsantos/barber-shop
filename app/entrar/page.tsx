import { CalendarDays, Check, History } from 'lucide-react'
import { redirect } from 'next/navigation'

import { AuthPanel, type AuthMode } from '@/components/auth/AuthPanel'
import { DemoLoginButtons } from '@/components/auth/DemoLoginButtons'
import { PublicDesktopFooter } from '@/components/layout/PublicDesktopFooter'
import { PublicDesktopHeader } from '@/components/layout/PublicDesktopHeader'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SkipLink } from '@/components/layout/SkipLink'
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
    icon: CalendarDays,
    title: 'Agendamento em segundos',
    description: 'Seus dados ficam salvos para o próximo horário.',
  },
  {
    icon: History,
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

        <section className="flex w-full flex-1 px-5 py-10 lg:px-10 lg:py-12 xl:px-[120px] xl:py-16">
          <div className="mx-auto grid w-full max-w-[1200px] items-center gap-10 lg:grid-cols-[minmax(0,1fr)_520px] xl:gap-[104px]">
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-5">
                <span className="text-label font-bold uppercase tracking-[1.8px] text-accent">
                  Bem-vindo de volta
                </span>
                <h1 className="font-display text-[34px] font-bold leading-[1.15] text-text lg:text-[40px] xl:text-[48px]">
                  Entre e acompanhe seus horários.
                </h1>
                <p className="text-base leading-[1.65] text-muted">
                  Salve seus profissionais favoritos e veja todo o histórico de atendimentos em um
                  só lugar.
                </p>
              </div>

              <span className="h-0.5 w-12 bg-primary" />

              <div className="flex flex-col gap-6">
                {BENEFITS.map((benefit) => (
                  <div
                    key={benefit.title}
                    className="flex items-center gap-4"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#302119]">
                      <benefit.icon
                        aria-hidden
                        strokeWidth={1.8}
                        className="h-5 w-5 text-primary"
                      />
                    </span>
                    <div className="flex min-w-0 flex-col gap-1.5">
                      <span className="text-[15px] font-semibold leading-[18px] text-text">
                        {benefit.title}
                      </span>
                      <span className="text-[13px] leading-[1.5] text-muted">
                        {benefit.description}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <p className="flex items-center gap-2.5 pt-2 text-[13px] leading-[1.5] text-muted">
                <Check
                  aria-hidden
                  strokeWidth={1.8}
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

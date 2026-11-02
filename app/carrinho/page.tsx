import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

import { BookingProgress } from '@/components/booking/BookingProgress'
import { CartContents } from '@/components/cart/CartContents'
import { PublicDesktopFooter } from '@/components/layout/PublicDesktopFooter'
import { PublicDesktopHeader } from '@/components/layout/PublicDesktopHeader'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SkipLink } from '@/components/layout/SkipLink'
import { getSessionUser } from '@/lib/auth/session'
import { findAvailableCredit } from '@/lib/loyalty/service'
import { getShopSettings } from '@/lib/settings/queries'

import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Checkout — Barbearia do Luiz',
  robots: { index: false, follow: false },
}

export default async function CartPage() {
  const [user, shop] = await Promise.all([getSessionUser(), getShopSettings()])

  const customer = user
    ? { name: user.name, email: user.email ?? '', phone: user.phone ?? '' }
    : null
  const hasCredit =
    user?.role === 'CUSTOMER' ? (await findAvailableCredit(user.id)) !== null : false

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
            active="booking"
          />
        </div>

        <section className="flex w-full flex-1 flex-col gap-6 px-5 pb-14 pt-3 lg:px-10 xl:px-20">
          <BookingProgress current="pagamento" />

          <Link
            href="/servicos"
            className="inline-flex w-fit items-center gap-1.5 text-caption font-semibold text-primary transition hover:text-primary-hover"
          >
            <ChevronLeft
              aria-hidden
              className="h-3 w-3"
            />
            Voltar aos serviços
          </Link>

          <div className="flex flex-col gap-2.5">
            <span className="text-label font-bold uppercase tracking-[1.8px] text-accent">
              Agendamento · Checkout
            </span>
            <h1 className="font-display text-[32px] font-bold leading-[1.2] text-text lg:text-[38px]">
              Checkout
            </h1>
            <p className="text-[15px] leading-[1.5] text-muted">
              Confirme seus dados e forma de pagamento.
            </p>
          </div>

          <CartContents
            customer={customer}
            hasCredit={hasCredit}
          />
        </section>

        <PublicDesktopFooter
          shopName={shopName}
          whatsapp={whatsapp}
        />
      </main>
    </>
  )
}

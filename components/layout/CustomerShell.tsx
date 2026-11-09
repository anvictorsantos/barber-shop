import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { LogoutButton } from '@/components/admin/LogoutButton'
import { CustomerNav } from '@/components/layout/CustomerNav'
import { SkipLink } from '@/components/layout/SkipLink'
import { getSessionUser } from '@/lib/auth/session'
import { getLoyaltySummary } from '@/lib/loyalty/service'

import type { LoyaltyTier } from '@prisma/client'
import type { ReactNode } from 'react'

const TIER_LABEL: Record<LoyaltyTier, string> = {
  BRONZE: 'Bronze',
  GOLD: 'Gold',
  PLATINUM: 'Platinum',
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export async function CustomerShell({ children }: { children: ReactNode }) {
  const user = await getSessionUser()
  if (!user) redirect('/entrar?next=/conta/agendamentos')
  if (user.role !== 'CUSTOMER') redirect('/admin')

  const loyalty = await getLoyaltySummary(user.id)

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SkipLink />

      <header className="border-b border-white/[0.07] bg-shell">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:h-[97px] lg:px-10">
          <Link
            href="/"
            className="flex items-center"
          >
            <Image
              src="/brand/logo.png"
              alt="Barbearia do Luiz"
              width={774}
              height={880}
              priority
              className="h-10 w-auto lg:h-[52px]"
            />
          </Link>

          <CustomerNav variant="horizontal" />

          <div className="flex items-center gap-4">
            <Link
              href="/conta/perfil"
              className="flex items-center gap-3"
            >
              <span className="hidden flex-col items-end gap-0.5 sm:flex">
                <span className="text-sm font-bold leading-[17px] text-text">{user.name}</span>
                <span className="text-caption font-semibold leading-[15px] text-accent">
                  Cliente {TIER_LABEL[loyalty.tier]}
                </span>
              </span>
              <span className="flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-primary bg-primary/15 text-caption font-bold text-accent">
                {initials(user.name)}
              </span>
            </Link>

            <LogoutButton />
          </div>
        </div>
      </header>

      <main
        id="main-content"
        className="mx-auto w-full max-w-[1440px] flex-1"
      >
        {children}
      </main>

      <CustomerNav variant="bottom" />
    </div>
  )
}

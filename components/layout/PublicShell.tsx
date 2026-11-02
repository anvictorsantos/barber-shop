import { SiteHeader } from '@/components/layout/SiteHeader'
import { SkipLink } from '@/components/layout/SkipLink'

import type { ReactNode } from 'react'

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SkipLink />
      <SiteHeader />
      <main
        id="main-content"
        className="flex-1"
      >
        {children}
      </main>
      <footer className="border-t border-border px-4 py-6 text-center text-caption text-subtle sm:px-6">
        Barbearia do Luiz — Belo Horizonte, MG
      </footer>
    </div>
  )
}

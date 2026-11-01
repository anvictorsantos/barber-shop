import { CustomerShell } from '@/components/layout/CustomerShell'

import type { ReactNode } from 'react'

export const dynamic = 'force-dynamic'

export default function ContaLayout({ children }: { children: ReactNode }) {
  return <CustomerShell>{children}</CustomerShell>
}

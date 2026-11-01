import { AdminShell } from '@/components/layout/AdminShell'

import type { ReactNode } from 'react'

export const dynamic = 'force-dynamic'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>
}

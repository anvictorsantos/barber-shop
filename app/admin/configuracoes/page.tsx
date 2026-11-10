import { redirect } from 'next/navigation'

import { SettingsManager } from '@/components/admin/settings/SettingsManager'
import { PageHeader } from '@/components/ui/PageHeader'
import { getSessionUser } from '@/lib/auth/session'
import {
  getAdminBarbers,
  getAdminGallery,
  getAdminShopHours,
  getAdminTimeBlocks,
  getShopSettings,
} from '@/lib/settings/queries'

import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Configurações — Barbearia do Luiz',
  robots: { index: false, follow: false },
}

export default async function SettingsPage() {
  const user = await getSessionUser()
  if (!user) redirect('/entrar?next=/admin/configuracoes')
  if (user.role !== 'OWNER') redirect('/admin')

  const [shop, gallery, hours, barbers, blocks] = await Promise.all([
    getShopSettings(),
    getAdminGallery(),
    getAdminShopHours(),
    getAdminBarbers(),
    getAdminTimeBlocks(),
  ])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Configurações"
        description="Dados da barbearia, galeria da home, horários, equipe e bloqueios."
      />
      <SettingsManager
        shop={shop}
        gallery={gallery}
        hours={hours}
        barbers={barbers}
        blocks={blocks}
      />
    </div>
  )
}

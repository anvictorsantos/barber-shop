import { redirect } from 'next/navigation'

import { CatalogManager } from '@/components/admin/CatalogManager'
import { PageHeader } from '@/components/ui/PageHeader'
import { getSessionUser } from '@/lib/auth/session'
import { getAdminProducts, getAdminServices } from '@/lib/catalog/admin-queries'

import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Serviços e Produtos — Barbearia do Luiz',
  robots: { index: false, follow: false },
}

export default async function AdminCatalogPage() {
  const user = await getSessionUser()
  if (!user) redirect('/entrar?next=/admin/catalogo')
  if (user.role !== 'OWNER') redirect('/admin')

  const [services, products] = await Promise.all([getAdminServices(), getAdminProducts()])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Serviços e Produtos"
        description="Catálogo, preços, duração e estoque."
      />
      <CatalogManager
        services={services}
        products={products}
      />
    </div>
  )
}

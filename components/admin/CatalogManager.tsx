'use client'

import { Package, Pencil, Plus, Power, Scissors, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { ProductEditor } from '@/components/admin/ProductEditor'
import { ServiceEditor } from '@/components/admin/ServiceEditor'
import { FormMessage } from '@/components/auth/FormMessage'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusPill } from '@/components/ui/StatusPill'
import {
  toggleProductAction,
  toggleServiceAction,
  toggleServiceFeaturedAction,
} from '@/lib/catalog/actions'
import { serviceCategoryLabels } from '@/lib/catalog/labels'
import type { AdminProduct, AdminService } from '@/lib/catalog/types'
import { formatBRL } from '@/lib/format/money'
import { cn } from '@/lib/utils'

type Tab = 'services' | 'products'

export function CatalogManager({
  services,
  products,
}: {
  services: AdminService[]
  products: AdminProduct[]
}) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('services')
  const [serviceEditor, setServiceEditor] = useState<AdminService | null | undefined>(undefined)
  const [productEditor, setProductEditor] = useState<AdminProduct | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)

  async function toggleService(service: AdminService) {
    setError(null)
    setPendingId(service.id)
    const result = await toggleServiceAction({ id: service.id, active: !service.active })
    setPendingId(null)

    if (!result.ok) {
      setError(result.error)
      return
    }

    router.refresh()
  }

  async function toggleFeatured(service: AdminService) {
    setError(null)
    setPendingId(service.id)
    const result = await toggleServiceFeaturedAction({
      id: service.id,
      featured: !service.featured,
    })
    setPendingId(null)

    if (!result.ok) {
      setError(result.error)
      return
    }

    router.refresh()
  }

  async function toggleProduct(product: AdminProduct) {
    setError(null)
    setPendingId(product.id)
    const result = await toggleProductAction({ id: product.id, active: !product.active })
    setPendingId(null)

    if (!result.ok) {
      setError(result.error)
      return
    }

    router.refresh()
  }

  return (
    <div className="flex flex-col gap-6">
      {error ? <FormMessage>{error}</FormMessage> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTab('services')}
            className={cn(
              'cursor-pointer rounded-lg px-4 py-2 text-caption font-bold transition',
              tab === 'services'
                ? 'bg-primary text-accent-ink'
                : 'bg-surface text-muted hover:text-text',
            )}
          >
            Serviços ({services.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('products')}
            className={cn(
              'cursor-pointer rounded-lg px-4 py-2 text-caption font-bold transition',
              tab === 'products'
                ? 'bg-primary text-accent-ink'
                : 'bg-surface text-muted hover:text-text',
            )}
          >
            Produtos ({products.length})
          </button>
        </div>

        <Button
          onClick={() => (tab === 'services' ? setServiceEditor(null) : setProductEditor(null))}
        >
          <Plus
            className="h-4 w-4"
            aria-hidden
          />
          {tab === 'services' ? 'Novo serviço' : 'Novo produto'}
        </Button>
      </div>

      {tab === 'services' ? (
        <>
          {serviceEditor !== undefined ? (
            <ServiceEditor
              key={serviceEditor?.id ?? 'new'}
              service={serviceEditor}
              onClose={() => setServiceEditor(undefined)}
              onSaved={() => {
                setServiceEditor(undefined)
                router.refresh()
              }}
            />
          ) : null}

          {services.length === 0 ? (
            <Card>
              <EmptyState
                icon={Scissors}
                title="Nenhum serviço cadastrado"
                description="Crie o primeiro serviço do catálogo."
                action={
                  <Button onClick={() => setServiceEditor(null)}>
                    <Plus
                      className="h-4 w-4"
                      aria-hidden
                    />
                    Novo serviço
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {services.map((service) => (
                <article
                  key={service.id}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lead font-bold text-text">{service.name}</h2>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <StatusPill tone={service.active ? 'success' : 'neutral'}>
                        {service.active ? 'Ativo' : 'Inativo'}
                      </StatusPill>
                      {service.featured ? <StatusPill tone="primary">Destaque</StatusPill> : null}
                    </div>
                  </div>

                  <p className="text-caption text-muted">{service.description}</p>

                  <div className="flex flex-wrap items-center gap-3 text-caption text-muted">
                    <span>{serviceCategoryLabels[service.category]}</span>
                    <span>{service.durationMin} min</span>
                    <span className="font-bold text-accent">{formatBRL(service.priceCents)}</span>
                  </div>

                  <div className="mt-auto flex flex-wrap gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setServiceEditor(service)}
                    >
                      <Pencil
                        className="h-3.5 w-3.5"
                        aria-hidden
                      />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pendingId === service.id}
                      onClick={() => toggleFeatured(service)}
                    >
                      <Star
                        className={cn(
                          'h-3.5 w-3.5',
                          service.featured ? 'fill-current text-accent' : '',
                        )}
                        aria-hidden
                      />
                      {service.featured ? 'Remover destaque' : 'Destacar'}
                    </Button>
                    <Button
                      size="sm"
                      variant={service.active ? 'outline' : 'primary'}
                      disabled={pendingId === service.id}
                      onClick={() => toggleService(service)}
                    >
                      <Power
                        className="h-3.5 w-3.5"
                        aria-hidden
                      />
                      {service.active ? 'Desativar' : 'Ativar'}
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {productEditor !== undefined ? (
            <ProductEditor
              key={productEditor?.id ?? 'new'}
              product={productEditor}
              onClose={() => setProductEditor(undefined)}
              onSaved={() => {
                setProductEditor(undefined)
                router.refresh()
              }}
            />
          ) : null}

          {products.length === 0 ? (
            <Card>
              <EmptyState
                icon={Package}
                title="Nenhum produto cadastrado"
                description="Crie o primeiro produto da loja."
                action={
                  <Button onClick={() => setProductEditor(null)}>
                    <Plus
                      className="h-4 w-4"
                      aria-hidden
                    />
                    Novo produto
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {products.map((product) => (
                <article
                  key={product.id}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lead font-bold text-text">{product.name}</h2>
                    <StatusPill tone={product.active ? 'success' : 'neutral'}>
                      {product.active ? 'Ativo' : 'Inativo'}
                    </StatusPill>
                  </div>

                  <p className="text-caption text-muted">{product.description}</p>

                  <div className="flex flex-wrap items-center gap-3 text-caption text-muted">
                    <span className="font-bold text-accent">{formatBRL(product.priceCents)}</span>
                    <span>Estoque: {product.stock}</span>
                    {product.reserved > 0 ? <span>Reservado: {product.reserved}</span> : null}
                  </div>

                  <div className="mt-auto flex flex-wrap gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setProductEditor(product)}
                    >
                      <Pencil
                        className="h-3.5 w-3.5"
                        aria-hidden
                      />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant={product.active ? 'outline' : 'primary'}
                      disabled={pendingId === product.id}
                      onClick={() => toggleProduct(product)}
                    >
                      <Power
                        className="h-3.5 w-3.5"
                        aria-hidden
                      />
                      {product.active ? 'Desativar' : 'Ativar'}
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

'use client'

import { ShoppingBag, Trash2 } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { removeCartItem } from '@/lib/cart/store'
import { useCart } from '@/lib/cart/useCart'
import { formatBRL } from '@/lib/format/money'
import { formatBookingDateTime } from '@/lib/time/format'

export function CartContents() {
  const items = useCart()
  const total = items.reduce((sum, item) => sum + item.priceCents, 0)

  if (items.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={ShoppingBag}
          title="Carrinho vazio"
          description="Escolha um serviço para começar."
          action={
            <Link
              href="/servicos"
              className="inline-flex min-h-touch items-center rounded-lg bg-primary px-5 py-2.5 text-body font-bold text-white hover:bg-primary-hover"
            >
              Ver serviços
            </Link>
          }
        />
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex flex-col gap-1">
              <h2 className="text-lead font-bold text-text">{item.serviceName}</h2>
              <p className="text-caption text-muted">
                {item.barberName} · {formatBookingDateTime(item.startAt)} · {item.durationMin} min
              </p>
              <p className="text-body font-bold text-accent">{formatBRL(item.priceCents)}</p>
            </div>

            <button
              type="button"
              onClick={() => removeCartItem(item.id)}
              aria-label={`Remover ${item.serviceName}`}
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md bg-danger/10 text-danger hover:bg-danger/20"
            >
              <Trash2
                className="h-4 w-4"
                aria-hidden
              />
            </button>
          </article>
        ))}
      </div>

      <Card className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-caption uppercase tracking-wider text-muted">Total</span>
          <span className="text-metric font-extrabold text-accent">{formatBRL(total)}</span>
        </div>

        <Button
          type="button"
          size="lg"
          disabled
        >
          Finalizar pedido
        </Button>
        <p className="text-center text-caption text-subtle">Pagamento entra na próxima etapa.</p>

        <Link
          href="/servicos"
          className="text-center text-caption font-semibold text-muted hover:text-text"
        >
          Adicionar mais serviços
        </Link>
      </Card>
    </div>
  )
}

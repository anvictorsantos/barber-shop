'use client'

import { ShoppingBag, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import { FormMessage } from '@/components/auth/FormMessage'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field, Input } from '@/components/ui/Input'
import { clearCart, removeCartItem } from '@/lib/cart/store'
import { useCart } from '@/lib/cart/useCart'
import { formatBRL } from '@/lib/format/money'
import { createOrderAction } from '@/lib/orders/actions'
import { formatBookingDateTime } from '@/lib/time/format'
import { cn } from '@/lib/utils'

type PaymentMode = 'ON_SITE' | 'ONLINE'

export function CartContents({
  customer,
}: {
  customer: { name: string; email: string; phone: string } | null
}) {
  const router = useRouter()
  const items = useCart()
  const total = items.reduce((sum, item) => sum + item.priceCents, 0)
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('ON_SITE')
  const [name, setName] = useState(customer?.name ?? '')
  const [email, setEmail] = useState(customer?.email ?? '')
  const [phone, setPhone] = useState(customer?.phone ?? '')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)

    const result = await createOrderAction({
      paymentMode,
      customer: { name, email, phone },
      lines: items.map((item) => ({
        kind: 'service' as const,
        serviceId: item.serviceId,
        barberId: item.barberId,
        startAt: item.startAt,
      })),
    })

    setPending(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    clearCart()

    if (result.initPoint) {
      window.location.assign(result.initPoint)
      return
    }

    router.push(`/pedido/${result.code}`)
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

        <div className="h-px w-full bg-border" />

        <div className="flex flex-col gap-2">
          <span className="text-caption font-bold text-text">Pagamento</span>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setPaymentMode('ON_SITE')}
              className={cn(
                'flex cursor-pointer flex-col items-start gap-1 rounded-lg border p-3 text-left transition',
                paymentMode === 'ON_SITE'
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-surface-input hover:border-accent',
              )}
            >
              <span className="text-caption font-bold text-text">Pagar no local</span>
              <span className="text-micro text-muted">Dinheiro, cartão ou PIX</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMode('ONLINE')}
              className={cn(
                'flex cursor-pointer flex-col items-start gap-1 rounded-lg border p-3 text-left transition',
                paymentMode === 'ONLINE'
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-surface-input hover:border-accent',
              )}
            >
              <span className="text-caption font-bold text-text">Pagar online</span>
              <span className="text-micro text-muted">PIX ou cartão via Mercado Pago</span>
            </button>
          </div>
        </div>

        {customer ? (
          <p className="text-caption text-muted">
            Reservando como <span className="font-bold text-text">{customer.name}</span> ·{' '}
            {customer.email || customer.phone}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <Field
              label="Seu nome"
              htmlFor="checkout-name"
            >
              <Input
                id="checkout-name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </Field>
            <Field
              label="E-mail"
              htmlFor="checkout-email"
              hint="Opcional se informar WhatsApp"
            >
              <Input
                id="checkout-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
            <Field
              label="WhatsApp"
              htmlFor="checkout-phone"
              hint="Com DDI, ex: +55 31 98881-5243"
            >
              <Input
                id="checkout-phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </Field>
          </div>
        )}

        {error ? <FormMessage>{error}</FormMessage> : null}

        <form onSubmit={submit}>
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={pending}
          >
            {pending ? 'Finalizando…' : 'Finalizar pedido'}
          </Button>
        </form>

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

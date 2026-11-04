'use client'

import { ptBR } from 'date-fns/locale'
import { formatInTimeZone } from 'date-fns-tz'
import { ChevronRight, Scissors, ShieldCheck, Trash2, UserRound } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import { FormMessage } from '@/components/auth/FormMessage'
import { BookingOverview } from '@/components/booking/BookingOverview'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { BUSINESS_TIMEZONE } from '@/lib/availability/slots'
import { clearCart, removeCartItem } from '@/lib/cart/store'
import { useCart } from '@/lib/cart/useCart'
import { formatBRL } from '@/lib/format/money'
import { createOrderAction } from '@/lib/orders/actions'
import { cn } from '@/lib/utils'

type PaymentMode = 'ON_SITE' | 'ONLINE'

const fieldClass = 'h-[50px] rounded-md border-white/10 bg-background px-4 text-sm'

export function CartContents({
  customer,
  hasCredit = false,
}: {
  customer: { name: string; email: string; phone: string } | null
  hasCredit?: boolean
}) {
  const router = useRouter()
  const items = useCart()
  const total = items.reduce((sum, item) => sum + item.priceCents, 0)
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('ON_SITE')
  const [useCredit, setUseCredit] = useState(false)
  const [name, setName] = useState(customer?.name ?? '')
  const [email, setEmail] = useState(customer?.email ?? '')
  const [phone, setPhone] = useState(customer?.phone ?? '')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const creditApplied =
    useCredit && paymentMode === 'ON_SITE'
      ? Math.max(0, ...items.map((item) => item.priceCents))
      : 0

  if (items.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={Scissors}
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
      useCredit: paymentMode === 'ON_SITE' && useCredit,
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
    <form
      onSubmit={submit}
      className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px] xl:items-start xl:gap-8"
    >
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex items-center gap-4 rounded-xl border border-primary bg-[#302119] p-5">
          <UserRound
            aria-hidden
            strokeWidth={1.8}
            className="h-6 w-6 shrink-0 text-accent"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="text-[15px] font-bold leading-[18px] text-text">
              {customer ? `Agendando como ${customer.name}` : 'Você está agendando como visitante'}
            </span>
            <span className="text-caption leading-[1.5] text-muted">
              {customer
                ? customer.email || customer.phone
                : 'Sua conta é criada depois, se quiser acompanhar seus agendamentos.'}
            </span>
            {!customer ? (
              <Link
                href="/entrar?next=/carrinho"
                className="w-fit text-[13px] font-bold leading-4 text-accent underline underline-offset-2"
              >
                Entrar na minha conta
              </Link>
            ) : null}
          </div>
        </div>

        <section className="flex flex-col gap-6 rounded-xl border border-white/10 bg-surface p-7">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-[19px] font-bold leading-[23px] text-text">Seus dados</h2>
            <span className="text-label text-muted">Campos obrigatórios</span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="checkout-name"
                className="text-caption text-muted"
              >
                Nome
              </label>
              <Input
                id="checkout-name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={fieldClass}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="checkout-email"
                className="text-caption text-muted"
              >
                E-mail
              </label>
              <Input
                id="checkout-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={fieldClass}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="checkout-phone"
              className="text-caption text-muted"
            >
              WhatsApp
            </label>
            <Input
              id="checkout-phone"
              type="tel"
              placeholder="Com DDI, ex: +55 31 98881-5243"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className={fieldClass}
            />
          </div>

          <p className="text-caption leading-[1.5] text-muted">
            Usamos seus dados para confirmar o agendamento e enviar lembretes.
          </p>
        </section>

        <section className="flex flex-col gap-[22px] rounded-xl border border-white/10 bg-surface p-7">
          <h2 className="text-[19px] font-bold leading-[23px] text-text">Forma de pagamento</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setPaymentMode('ON_SITE')}
              className={cn(
                'flex min-h-[92px] cursor-pointer items-center gap-4 rounded-md border p-5 text-left transition',
                paymentMode === 'ON_SITE'
                  ? 'border-primary bg-primary'
                  : 'border-white/10 bg-background hover:border-accent/50',
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px]',
                  paymentMode === 'ON_SITE' ? 'border-white' : 'border-muted',
                )}
              >
                {paymentMode === 'ON_SITE' ? (
                  <span className="h-2 w-2 rounded-full bg-white" />
                ) : null}
              </span>
              <span className="flex flex-col gap-2">
                <span
                  className={cn(
                    'text-sm font-bold leading-[17px]',
                    paymentMode === 'ON_SITE' ? 'text-white' : 'text-muted',
                  )}
                >
                  Pagar na barbearia
                </span>
                <span
                  className={cn(
                    'text-label',
                    paymentMode === 'ON_SITE' ? 'text-white' : 'text-muted',
                  )}
                >
                  Dinheiro, cartão ou PIX
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setUseCredit(false)
                setPaymentMode('ONLINE')
              }}
              className={cn(
                'flex min-h-[92px] cursor-pointer items-center gap-4 rounded-md border p-5 text-left transition',
                paymentMode === 'ONLINE'
                  ? 'border-primary bg-primary'
                  : 'border-white/10 bg-background hover:border-accent/50',
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px]',
                  paymentMode === 'ONLINE' ? 'border-white' : 'border-muted',
                )}
              >
                {paymentMode === 'ONLINE' ? (
                  <span className="h-2 w-2 rounded-full bg-white" />
                ) : null}
              </span>
              <span className="flex flex-col gap-2">
                <span
                  className={cn(
                    'text-sm font-bold leading-[17px]',
                    paymentMode === 'ONLINE' ? 'text-white' : 'text-muted',
                  )}
                >
                  Pagar online
                </span>
                <span
                  className={cn(
                    'text-label',
                    paymentMode === 'ONLINE' ? 'text-white' : 'text-muted',
                  )}
                >
                  PIX ou cartão
                </span>
              </span>
            </button>
          </div>

          {customer && hasCredit && paymentMode === 'ON_SITE' ? (
            <div className="flex items-start gap-3 rounded-md border border-white/10 bg-background p-4 text-caption text-text">
              <input
                id="checkout-credit"
                type="checkbox"
                checked={useCredit}
                onChange={(event) => setUseCredit(event.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
              />
              <label
                htmlFor="checkout-credit"
                className="flex cursor-pointer flex-col gap-0.5"
              >
                Usar crédito de fidelidade
                <span className="text-micro text-muted">
                  Um serviço grátis, válido no pagamento na barbearia.
                </span>
              </label>
            </div>
          ) : null}

          <p className="text-caption text-muted">
            {paymentMode === 'ON_SITE'
              ? 'Pague na barbearia após o atendimento.'
              : 'Pagamento online via Mercado Pago, com PIX ou cartão.'}
          </p>
        </section>
      </div>

      <BookingOverview
        title="Seu pedido"
        titleClassName="text-[19px] leading-[23px]"
        className="gap-6 xl:w-[400px] xl:min-h-[596px]"
      >
        <div className="flex flex-col gap-4">
          {items.map((item) => {
            const when = formatInTimeZone(
              new Date(item.startAt),
              BUSINESS_TIMEZONE,
              "EEE, d MMM '·' HH:mm",
              { locale: ptBR },
            )

            return (
              <div
                key={item.id}
                className="flex items-center gap-3.5"
              >
                <span className="flex h-[76px] w-[68px] shrink-0 items-center justify-center rounded-md bg-surface-input">
                  <Scissors
                    aria-hidden
                    className="h-5 w-5 text-muted"
                  />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-[7px]">
                  <h3 className="truncate text-base font-bold leading-[19px] text-text">
                    {item.serviceName}
                  </h3>
                  <span className="text-label leading-[1.6] text-muted">
                    {item.barberName} · {when}
                  </span>
                  <span className="text-[15px] font-bold leading-[18px] text-accent">
                    {formatBRL(item.priceCents)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeCartItem(item.id)}
                  aria-label={`Remover ${item.serviceName}`}
                  className="flex h-[18px] w-[18px] shrink-0 cursor-pointer items-center justify-center text-danger transition hover:text-danger/80"
                >
                  <Trash2
                    className="h-[18px] w-[18px]"
                    aria-hidden
                  />
                </button>
              </div>
            )
          })}
        </div>

        <Link
          href="/servicos"
          className="w-fit text-[13px] font-bold leading-4 text-primary underline underline-offset-2 transition hover:text-primary-hover"
        >
          Adicionar mais serviços
        </Link>

        <div className="h-px w-full bg-white/10" />

        <div className="flex items-center justify-between gap-4">
          <span className="text-body text-muted">Subtotal</span>
          <span className="text-sm text-text">{formatBRL(total)}</span>
        </div>

        {creditApplied > 0 ? (
          <div className="flex items-center justify-between gap-4">
            <span className="text-body text-muted">Crédito de fidelidade</span>
            <span className="text-sm font-semibold text-success">− {formatBRL(creditApplied)}</span>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-4">
          <span className="text-[15px] font-bold leading-[18px] text-text">Total</span>
          <span className="text-[30px] font-bold leading-[36px] text-accent">
            {formatBRL(total - creditApplied)}
          </span>
        </div>

        <div className="flex items-center gap-2 rounded-md bg-background p-3">
          <ShieldCheck
            aria-hidden
            className="h-4 w-4 shrink-0 text-success"
          />
          <span className="text-caption text-muted">
            {paymentMode === 'ONLINE' ? 'Pagamento online' : 'Pagamento na barbearia'}
          </span>
        </div>

        {error ? <FormMessage>{error}</FormMessage> : null}

        <Button
          type="submit"
          size="lg"
          className="h-[52px] w-fit gap-2.5 self-end rounded-md px-[22px] text-sm"
          disabled={pending}
        >
          {pending ? 'Finalizando…' : 'Finalizar pedido'}
          <ChevronRight
            aria-hidden
            className="h-[18px] w-[18px]"
          />
        </Button>

        <p className="text-center text-caption leading-[1.6] text-muted">
          Você receberá a confirmação por WhatsApp ou e-mail.
        </p>

        <div className="h-px w-full bg-white/10" />

        <p className="flex items-start gap-2.5 text-caption leading-[1.6] text-muted">
          <ShieldCheck
            aria-hidden
            className="mt-0.5 h-[18px] w-[18px] shrink-0 text-success"
          />
          Cancelamento gratuito com até 2h de antecedência.
        </p>
      </BookingOverview>
    </form>
  )
}

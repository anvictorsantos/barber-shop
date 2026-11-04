import { ptBR } from 'date-fns/locale'
import { formatInTimeZone } from 'date-fns-tz'
import {
  Check,
  ChevronRight,
  Clock,
  MapPin,
  MessageCircle,
  Scissors,
  ShieldCheck,
  UserRound,
  XCircle,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PublicDesktopFooter } from '@/components/layout/PublicDesktopFooter'
import { PublicDesktopHeader } from '@/components/layout/PublicDesktopHeader'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SkipLink } from '@/components/layout/SkipLink'
import { getSessionUser } from '@/lib/auth/session'
import { BUSINESS_TIMEZONE } from '@/lib/availability/slots'
import { formatBRL } from '@/lib/format/money'
import { getOrderByCode } from '@/lib/orders/queries'
import { orderStatusLabel, orderStatusTone } from '@/lib/orders/status'
import { getShopSettings } from '@/lib/settings/queries'

import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Agendamento confirmado — Barbearia do Luiz',
  robots: { index: false, follow: false },
}

const pillTone: Record<string, string> = {
  success: 'bg-success/10 text-success',
  warning: 'bg-accent/10 text-accent',
  danger: 'bg-danger/10 text-danger',
  primary: 'bg-primary/10 text-primary',
  neutral: 'bg-white/5 text-muted',
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export default async function OrderPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const order = await getOrderByCode(code)
  if (!order) notFound()

  const [user, shop] = await Promise.all([getSessionUser(), getShopSettings()])
  const settled = order.payments.some((payment) => payment.paidAt !== null)

  const appointment = order.appointments[0] ?? null
  const appointmentStart = appointment ? appointment.startAt : null
  const time = appointmentStart
    ? formatInTimeZone(appointmentStart, BUSINESS_TIMEZONE, 'HH:mm')
    : null
  const dateContext = appointmentStart
    ? capitalize(
        formatInTimeZone(appointmentStart, BUSINESS_TIMEZONE, "EEEE, d 'de' MMMM", {
          locale: ptBR,
        }),
      )
    : null

  const confirmed = order.status === 'OPEN' || order.status === 'PAID'
  const pendingPayment = order.status === 'PENDING_PAYMENT'

  const eyebrow = confirmed ? 'Agendamento confirmado' : orderStatusLabel(order.status)
  const title = confirmed
    ? 'Seu horário está reservado.'
    : pendingPayment
      ? 'Falta só o pagamento.'
      : 'Este pedido não está ativo.'

  const explanation = confirmed
    ? 'Enviamos os detalhes do agendamento para o WhatsApp informado. Chegue com 10 minutos de antecedência.'
    : pendingPayment
      ? 'Assim que o pagamento for aprovado, seu horário fica confirmado e você recebe o aviso no WhatsApp.'
      : 'Escolha um novo horário quando quiser — leva menos de um minuto para agendar de novo.'

  const shopName = shop?.name ?? 'Barbearia do Luiz'
  const city = shop?.city ?? 'Belo Horizonte'
  const state = shop?.state ?? 'MG'
  const whatsapp = (shop?.whatsapp ?? '+5531988815243').replace(/\D/g, '')
  const cityLabel = city === 'Belo Horizonte' ? 'BH' : city
  const address = `${shop?.addressLine ?? 'Rua dos Geólogos, 698 — Alípio de Melo'}, ${cityLabel}`

  const extraLines = [
    ...order.appointments.slice(1).map((item) => ({
      key: item.id,
      label: `${item.service.name} · ${formatInTimeZone(item.startAt, BUSINESS_TIMEZONE, 'HH:mm')}`,
      priceCents: item.priceCents,
    })),
    ...order.products.map((line) => ({
      key: line.id,
      label: `${line.product.name} × ${line.quantity}`,
      priceCents: line.lineTotalCents,
    })),
  ]

  const HeroIcon = confirmed ? Check : pendingPayment ? Clock : XCircle
  const heroTone = confirmed ? 'bg-success' : pendingPayment ? 'bg-accent' : 'bg-danger'

  return (
    <>
      <SkipLink />
      <main
        id="main-content"
        className="flex min-h-dvh flex-col bg-background"
      >
        <div className="lg:hidden">
          <SiteHeader />
        </div>
        <div className="hidden lg:block">
          <PublicDesktopHeader
            shopName={shopName}
            city={city}
            state={state}
            user={user}
            active="booking"
          />
        </div>

        <section className="flex w-full flex-1 px-5 py-10 lg:px-10 lg:py-12 xl:px-[120px] xl:py-[72px]">
          <div className="mx-auto grid w-full max-w-[1200px] items-center gap-8 lg:grid-cols-2 lg:gap-10 xl:grid-cols-[minmax(0,536px)_minmax(0,576px)] xl:justify-between xl:gap-[88px]">
            <div className="flex flex-col gap-7">
              <span
                className={`flex h-20 w-20 items-center justify-center rounded-full ${heroTone}`}
              >
                <HeroIcon
                  aria-hidden
                  strokeWidth={1.8}
                  className="h-8 w-8 text-white"
                />
              </span>

              <div className="flex flex-col gap-4">
                <span className="text-label font-bold uppercase tracking-[1.8px] text-success">
                  {eyebrow}
                </span>
                <h1 className="font-display text-[36px] font-bold leading-[1.15] text-text lg:text-[40px] xl:text-[46px]">
                  {title}
                </h1>
                <span className="text-base font-bold leading-[19px] text-accent">
                  Código #{order.code}
                </span>
              </div>

              <p className="text-[15px] leading-[1.7] text-muted">{explanation}</p>

              <div className="flex flex-col gap-3">
                <Link
                  href={user ? '/conta/agendamentos' : '/'}
                  className="inline-flex h-[52px] w-fit items-center justify-center gap-2.5 rounded-md bg-primary px-[22px] text-sm font-bold text-white transition hover:bg-primary-hover"
                >
                  {user ? 'Ver meus agendamentos' : 'Voltar ao início'}
                  <ChevronRight
                    aria-hidden
                    className="h-[18px] w-[18px]"
                  />
                </Link>

                {settled && user ? (
                  <a
                    href={`/api/pedidos/${order.code}/recibo`}
                    className="inline-flex h-[52px] w-fit items-center justify-center rounded-md border border-white/10 px-[22px] text-sm font-bold text-text transition hover:border-white/30"
                  >
                    Baixar recibo
                  </a>
                ) : (
                  <a
                    href={`https://wa.me/${whatsapp}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-[52px] w-fit items-center justify-center rounded-md border border-white/10 px-[22px] text-sm font-bold text-text transition hover:border-white/30"
                  >
                    Falar no WhatsApp
                  </a>
                )}
              </div>

              <p className="text-[13px] leading-[1.7] text-muted">
                Precisa de ajuda? Fale com a gente pelo WhatsApp.
              </p>
            </div>

            <aside className="flex flex-col gap-[26px] rounded-[24px] border border-white/10 bg-surface p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-[19px] font-bold leading-[23px] text-text">Seu agendamento</h2>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-[7px] text-[10px] font-bold uppercase leading-3 tracking-[0.8px] ${
                    pillTone[confirmed ? 'success' : orderStatusTone(order.status)]
                  }`}
                >
                  {confirmed ? 'Confirmado' : orderStatusLabel(order.status)}
                </span>
              </div>

              {appointment ? (
                <div className="flex items-center gap-5">
                  <div className="relative h-24 w-[104px] shrink-0 overflow-hidden rounded-md bg-surface-input">
                    {appointment.service.imageUrl ? (
                      <Image
                        src={appointment.service.imageUrl}
                        alt={appointment.service.name}
                        fill
                        sizes="104px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center">
                        <Scissors
                          aria-hidden
                          className="h-6 w-6 text-muted"
                        />
                      </span>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <span className="text-caption text-muted">Serviço</span>
                    <span className="text-[23px] font-bold leading-7 text-text">
                      {appointment.service.name}
                    </span>
                    <span className="text-caption text-accent">
                      {appointment.service.durationMin} minutos
                    </span>
                  </div>
                </div>
              ) : null}

              {extraLines.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {extraLines.map((line) => (
                    <li
                      key={line.key}
                      className="flex items-center justify-between gap-4 text-caption"
                    >
                      <span className="min-w-0 truncate text-muted">{line.label}</span>
                      <span className="shrink-0 font-semibold text-text">
                        {formatBRL(line.priceCents)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="h-px w-full bg-white/10" />

              <div className="flex items-center justify-between gap-4">
                <span className="text-[13px] leading-4 text-muted">Profissional</span>
                <span className="flex items-center gap-2.5">
                  <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-input">
                    {appointment?.barber.avatarUrl ? (
                      <Image
                        src={appointment.barber.avatarUrl}
                        alt={appointment.barber.displayName}
                        fill
                        sizes="32px"
                        className="object-cover"
                      />
                    ) : (
                      <UserRound
                        aria-hidden
                        className="h-4 w-4 text-muted"
                      />
                    )}
                  </span>
                  <span className="text-sm font-bold leading-[17px] text-text">
                    {appointment?.barber.displayName ?? 'A definir'}
                  </span>
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-[13px] leading-4 text-muted">Data e horário</span>
                <span className="flex flex-col items-end gap-[5px]">
                  <span className="text-base font-bold leading-[19px] text-text">
                    {time ?? '—'}
                  </span>
                  <span className="text-caption text-muted">{dateContext ?? '—'}</span>
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-[13px] leading-4 text-muted">Pagamento</span>
                <span className="text-[22px] font-bold leading-[27px] text-accent">
                  {formatBRL(order.totalCents)}
                </span>
              </div>

              <div className="h-px w-full bg-white/10" />

              <div className="flex items-center gap-3 rounded-md border border-white/10 bg-background p-4">
                <MessageCircle
                  aria-hidden
                  strokeWidth={1.8}
                  className="h-5 w-5 shrink-0 text-success"
                />
                <span className="flex-1 text-[13px] font-semibold leading-4 text-text">
                  Lembretes no WhatsApp
                </span>
                <span
                  aria-hidden
                  className="flex h-[22px] w-10 items-center justify-end rounded-full bg-success p-[3px]"
                >
                  <span className="h-4 w-4 rounded-full bg-white" />
                </span>
              </div>

              <div className="flex items-start gap-3">
                <MapPin
                  aria-hidden
                  strokeWidth={1.8}
                  className="h-5 w-5 shrink-0 text-primary"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="text-[13px] font-semibold leading-4 text-text">{shopName}</span>
                  <span className="text-caption leading-[1.5] text-muted">{address}</span>
                </div>
              </div>

              <p className="flex items-start gap-2.5 text-caption leading-[1.6] text-muted">
                <ShieldCheck
                  aria-hidden
                  strokeWidth={1.8}
                  className="h-[18px] w-[18px] shrink-0 text-success"
                />
                Cancelamento gratuito com até 2h de antecedência.
              </p>
            </aside>
          </div>
        </section>

        <PublicDesktopFooter
          shopName={shopName}
          whatsapp={whatsapp}
        />
      </main>
    </>
  )
}

import { ptBR } from 'date-fns/locale'
import { formatInTimeZone } from 'date-fns-tz'
import { CalendarDays, ChevronLeft, MapPin, Scissors, ShieldCheck, UserRound } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { BookingProgress } from '@/components/booking/BookingProgress'
import { AddToCartButton } from '@/components/cart/AddToCartButton'
import { PublicDesktopFooter } from '@/components/layout/PublicDesktopFooter'
import { PublicDesktopHeader } from '@/components/layout/PublicDesktopHeader'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SkipLink } from '@/components/layout/SkipLink'
import { buttonClasses } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { getSessionUser } from '@/lib/auth/session'
import { getAvailability } from '@/lib/availability/queries'
import { BUSINESS_TIMEZONE } from '@/lib/availability/slots'
import { getActiveBarberById, getServiceById } from '@/lib/catalog/queries'
import { formatBRL } from '@/lib/format/money'
import { getShopSettings } from '@/lib/settings/queries'

import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Resumo do agendamento — Barbearia do Luiz',
  robots: { index: false, follow: false },
}

const editLinkClass =
  'w-fit text-caption font-semibold text-primary underline underline-offset-2 transition hover:text-primary-hover'

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export default async function BookingSummaryPage({
  searchParams,
}: {
  searchParams: Promise<{
    serviceId?: string | string[]
    barberId?: string | string[]
    startAt?: string | string[]
  }>
}) {
  const query = await searchParams
  const serviceId = typeof query.serviceId === 'string' ? query.serviceId : null
  const barberId = typeof query.barberId === 'string' ? query.barberId : null
  const startAt = typeof query.startAt === 'string' ? query.startAt : null
  if (!serviceId || !barberId || !startAt) notFound()

  const [service, barber, shop, user] = await Promise.all([
    getServiceById(serviceId),
    getActiveBarberById(barberId),
    getShopSettings(),
    getSessionUser(),
  ])
  if (!service || !barber) notFound()

  const startDate = new Date(startAt)
  if (Number.isNaN(startDate.getTime())) notFound()

  const date = formatInTimeZone(startDate, BUSINESS_TIMEZONE, 'yyyy-MM-dd')
  const availability = await getAvailability({ serviceId, barberId, date }).catch(() => null)
  const slot = availability?.slots.find((item) => item.startAt === startAt && item.available)

  const shopName = shop?.name ?? 'Barbearia do Luiz'
  const city = shop?.city ?? 'Belo Horizonte'
  const state = shop?.state ?? 'MG'
  const whatsapp = (shop?.whatsapp ?? '+5531988815243').replace(/\D/g, '')
  const cityLabel = city === 'Belo Horizonte' ? 'BH' : city
  const address = `${shop?.addressLine ?? 'Rua dos Geólogos, 698 — Alípio de Melo'}, ${cityLabel}`

  const appointmentDate = capitalize(
    formatInTimeZone(startDate, BUSINESS_TIMEZONE, "EEEE, d 'de' MMMM", { locale: ptBR }),
  )
  const appointmentMeta = `${formatInTimeZone(startDate, BUSINESS_TIMEZONE, 'yyyy')} · ${formatInTimeZone(startDate, BUSINESS_TIMEZONE, 'HH:mm')} · ${service.durationMin} min`

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

        <section className="flex w-full flex-1 flex-col gap-6 px-5 pb-16 pt-3 lg:px-10 xl:px-20">
          <BookingProgress current="resumo" />

          <Link
            href={`/agendar/${service.id}/horario?barberId=${barber.id}`}
            className="inline-flex w-fit items-center gap-1.5 text-caption font-semibold text-primary transition hover:text-primary-hover"
          >
            <ChevronLeft
              aria-hidden
              className="h-3 w-3"
            />
            Voltar para horários
          </Link>

          <div className="flex flex-col gap-2.5">
            <span className="text-label font-bold uppercase tracking-[1.8px] text-accent">
              Agendamento · Resumo
            </span>
            <h1 className="font-display text-[32px] font-bold leading-[1.2] text-text lg:text-[38px]">
              Resumo do agendamento
            </h1>
            <p className="text-[15px] leading-[1.5] text-muted">
              Revise os dados antes de adicionar ao carrinho.
            </p>
          </div>

          {slot ? (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px] xl:items-start xl:gap-8">
              <div className="flex min-w-0 flex-col gap-6">
                <div className="flex flex-col gap-7 rounded-xl border border-primary bg-surface p-7">
                  <div className="flex items-center gap-4 sm:gap-7">
                    <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-input sm:h-[140px] sm:w-[180px]">
                      {service.imageUrl ? (
                        <Image
                          src={service.imageUrl}
                          alt={service.name}
                          fill
                          sizes="(max-width: 639px) 80px, 180px"
                          className="object-cover"
                        />
                      ) : (
                        <Scissors
                          aria-hidden
                          className="h-8 w-8 text-muted"
                        />
                      )}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col gap-3">
                      <span className="text-label font-bold uppercase tracking-[1.2px] text-accent">
                        Serviço
                      </span>
                      <span className="text-[22px] font-bold leading-[1.2] text-text sm:text-[26px] sm:leading-[31px]">
                        {service.name}
                      </span>
                      <span className="text-[21px] font-bold leading-[25px] text-accent">
                        {formatBRL(service.priceCents)}
                      </span>
                      <span className="text-caption text-muted">{service.durationMin} minutos</span>
                    </div>

                    <Link
                      href={`/servicos/${service.slug}`}
                      className={editLinkClass}
                    >
                      Editar
                    </Link>
                  </div>

                  <div className="h-px w-full bg-white/10" />

                  <div className="flex items-center gap-[18px]">
                    <div className="relative flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-input">
                      {barber.avatarUrl ? (
                        <Image
                          src={barber.avatarUrl}
                          alt={barber.displayName}
                          fill
                          sizes="52px"
                          className="object-cover"
                        />
                      ) : (
                        <UserRound
                          aria-hidden
                          className="h-5 w-5 text-muted"
                        />
                      )}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col gap-[7px]">
                      <span className="text-label font-bold uppercase tracking-[1.2px] text-accent">
                        Profissional
                      </span>
                      <span className="text-[17px] font-bold leading-[21px] text-text">
                        {barber.displayName}
                      </span>
                    </div>

                    <Link
                      href={`/agendar/${service.id}/profissional`}
                      className={editLinkClass}
                    >
                      Editar
                    </Link>
                  </div>

                  <div className="h-px w-full bg-white/10" />

                  <div className="flex items-center gap-[18px]">
                    <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-md bg-[#302119]">
                      <CalendarDays
                        aria-hidden
                        className="h-[22px] w-[22px] text-accent"
                      />
                    </span>

                    <div className="flex min-w-0 flex-1 flex-col gap-[7px]">
                      <span className="text-label font-bold uppercase tracking-[1.2px] text-accent">
                        Data e horário
                      </span>
                      <span className="text-[17px] font-bold leading-[21px] text-text">
                        {appointmentDate}
                      </span>
                      <span className="text-caption text-muted">{appointmentMeta}</span>
                    </div>

                    <Link
                      href={`/agendar/${service.id}/horario?barberId=${barber.id}`}
                      className={editLinkClass}
                    >
                      Editar
                    </Link>
                  </div>
                </div>

                <p className="flex items-start gap-2.5 text-caption leading-[1.6] text-muted">
                  <ShieldCheck
                    aria-hidden
                    className="mt-0.5 h-[18px] w-[18px] shrink-0 text-success"
                  />
                  Cancelamento gratuito com até 2h de antecedência.
                </p>
              </div>

              <aside className="flex flex-col gap-6 rounded-xl border border-white/10 bg-surface p-7 xl:min-h-[480px]">
                <h2 className="text-[19px] font-bold leading-[23px] text-text">Total</h2>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-body text-muted">Serviço</span>
                  <span className="text-sm text-text">{formatBRL(service.priceCents)}</span>
                </div>

                <div className="h-px w-full bg-white/10" />

                <div className="flex items-center justify-between gap-4">
                  <span className="text-[15px] font-semibold leading-[18px] text-text">Total</span>
                  <span className="text-[30px] font-bold leading-[36px] text-accent">
                    {formatBRL(service.priceCents)}
                  </span>
                </div>

                <p className="text-body leading-[1.6] text-muted">
                  Você será levado ao carrinho para revisar e finalizar.
                </p>

                <AddToCartButton
                  item={{
                    serviceId: service.id,
                    serviceName: service.name,
                    barberId: barber.id,
                    barberName: barber.displayName,
                    startAt: slot.startAt,
                    durationMin: service.durationMin,
                    priceCents: service.priceCents,
                  }}
                />

                <p className="text-center text-caption leading-[1.6] text-muted">
                  Não precisa de conta para agendar.
                </p>

                <div className="h-px w-full bg-white/10" />

                <div className="flex items-start gap-3">
                  <MapPin
                    aria-hidden
                    className="mt-0.5 h-[18px] w-[18px] shrink-0 text-primary"
                  />
                  <div className="flex flex-col gap-1.5">
                    <span className="text-body font-semibold text-text">{shopName}</span>
                    <span className="text-caption leading-[1.6] text-muted">{address}</span>
                  </div>
                </div>
              </aside>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <Card className="text-body text-muted">
                Este horário acabou de ser reservado. Escolha outro horário para continuar.
              </Card>
              <Link
                href={`/agendar/${serviceId}/horario?barberId=${barberId}`}
                className={buttonClasses({
                  variant: 'outline',
                  className: 'w-fit',
                })}
              >
                Ver outros horários
              </Link>
            </div>
          )}
        </section>

        <PublicDesktopFooter
          shopName={shopName}
          whatsapp={whatsapp}
        />
      </main>
    </>
  )
}

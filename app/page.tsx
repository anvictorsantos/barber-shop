import { formatInTimeZone } from 'date-fns-tz'
import {
  Beer,
  Camera,
  ChevronRight,
  Clock,
  Droplets,
  MapPin,
  MessageCircle,
  Sparkles,
  ThumbsUp,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { PublicDesktopFooter } from '@/components/layout/PublicDesktopFooter'
import { PublicDesktopHeader } from '@/components/layout/PublicDesktopHeader'
import { SkipLink } from '@/components/layout/SkipLink'
import { buttonClasses } from '@/components/ui/Button'
import { getSessionUser } from '@/lib/auth/session'
import { BUSINESS_TIMEZONE, isShopOpen } from '@/lib/availability/slots'
import { getShopHours, getShopSettings } from '@/lib/settings/queries'
import { minutesToTime, shopHoursLines } from '@/lib/time/schedule'
import type { ShopHoursRow } from '@/lib/time/schedule'

import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1600&q=80'

export const metadata: Metadata = {
  title: 'Barbearia do Luiz — Agende seu horário',
  description:
    'Corte, barba e resenha de alto padrão em Belo Horizonte. Escolha serviço, profissional e horário.',
  openGraph: {
    title: 'Barbearia do Luiz — Agende seu horário',
    description:
      'Corte, barba e resenha de alto padrão em Belo Horizonte. Escolha serviço, profissional e horário.',
    type: 'website',
    locale: 'pt_BR',
    images: [{ url: HERO_IMAGE }],
  },
}

const INSTAGRAM_URL = 'https://www.instagram.com/barbeariadoluiz'
const FACEBOOK_URL = 'https://www.facebook.com/barbeariadoluiz'

const DEFAULT_HOURS: ShopHoursRow[] = [
  { weekday: 0, openMinute: 0, closeMinute: 0, closed: true },
  { weekday: 1, openMinute: 540, closeMinute: 1200, closed: false },
  { weekday: 2, openMinute: 540, closeMinute: 1200, closed: false },
  { weekday: 3, openMinute: 540, closeMinute: 1200, closed: false },
  { weekday: 4, openMinute: 540, closeMinute: 1200, closed: false },
  { weekday: 5, openMinute: 540, closeMinute: 1200, closed: false },
  { weekday: 6, openMinute: 540, closeMinute: 1080, closed: false },
]

const PERKS = [
  {
    name: 'Pomadas Premium',
    description: 'Fixação e acabamento seco.',
    icon: Sparkles,
  },
  {
    name: 'Óleos & Balm',
    description: 'Hidratação para barba e pele.',
    icon: Droplets,
  },
  {
    name: 'Cerveja Gelada',
    description: 'Gelada para acompanhar a resenha.',
    icon: Beer,
  },
] as const

const SCHEMA_DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

export default async function HomePage() {
  const [user, shop, storedHours] = await Promise.all([
    getSessionUser(),
    getShopSettings(),
    getShopHours(),
  ])

  const hours = storedHours.length > 0 ? storedHours : DEFAULT_HOURS
  const timezone = BUSINESS_TIMEZONE
  const todayWeekday = Number(formatInTimeZone(new Date(), timezone, 'i')) % 7
  const open = isShopOpen({
    shopHours: hours.find((hour) => hour.weekday === todayWeekday) ?? null,
    timezone,
  })

  const shopName = shop?.name ?? 'Barbearia do Luiz'
  const addressLine = shop?.addressLine ?? 'Rua dos Geólogos, 698 — Alípio de Melo'
  const city = shop?.city ?? 'Belo Horizonte'
  const state = shop?.state ?? 'MG'
  const phone = shop?.phone ?? '+5531988815243'
  const whatsapp = (shop?.whatsapp ?? '+5531988815243').replace(/\D/g, '')
  const cityLabel = city === 'Belo Horizonte' ? 'BH' : city
  const [streetLine = addressLine, neighborhood = ''] = addressLine.split(' — ')
  const locationLabel = neighborhood ? `${neighborhood} · ${cityLabel}` : `${city}, ${state}`

  const accountHref = user
    ? user.role === 'CUSTOMER'
      ? '/conta/agendamentos'
      : '/admin'
    : '/entrar'
  const accountLabel = user ? 'Minha conta' : 'Entrar'

  const hoursLines = shopHoursLines(hours)

  const socials = [
    { href: INSTAGRAM_URL, label: 'Instagram', icon: Camera },
    { href: FACEBOOK_URL, label: 'Facebook', icon: ThumbsUp },
    { href: `https://wa.me/${whatsapp}`, label: 'WhatsApp', icon: MessageCircle },
  ] as const

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${addressLine}, ${city} - ${state}`,
  )}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HairSalon',
    name: shopName,
    description:
      'Corte, barba e resenha de alto padrão em Belo Horizonte. Escolha serviço, profissional e horário.',
    image: HERO_IMAGE,
    telephone: phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: addressLine,
      addressLocality: city,
      addressRegion: state,
      addressCountry: 'BR',
    },
    sameAs: [INSTAGRAM_URL, FACEBOOK_URL],
    openingHoursSpecification: hours
      .filter((hour) => !hour.closed)
      .map((hour) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: SCHEMA_DAYS[hour.weekday],
        opens: minutesToTime(hour.openMinute),
        closes: minutesToTime(hour.closeMinute),
      })),
  }

  return (
    <>
      <SkipLink />
      <main
        id="main-content"
        className="min-h-dvh bg-background"
      >
        <div className="flex min-h-dvh flex-col lg:hidden">
          <div className="mx-auto flex min-h-dvh w-full max-w-narrow flex-col">
            <section className="relative h-[260px]">
              <Image
                src={HERO_IMAGE}
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(116.57deg,rgba(0,0,0,0.8)_33.33%,rgba(18,19,22,0)_50%,#121316_66.67%)]" />

              <div className="relative flex h-full flex-col justify-between p-5">
                <div className="flex items-center justify-between gap-4">
                  <span
                    className={
                      open
                        ? 'rounded-xs bg-success px-2 py-1 text-label font-bold text-white'
                        : 'rounded-xs bg-white/10 px-2 py-1 text-label font-bold text-muted'
                    }
                  >
                    {open ? 'ABERTO AGORA' : 'FECHADO'}
                  </span>
                  <Link
                    href={accountHref}
                    className="text-caption font-semibold text-text-secondary hover:text-text"
                  >
                    {accountLabel}
                  </Link>
                </div>

                <div className="flex flex-col gap-1">
                  <h1 className="font-display text-brand font-black tracking-wide text-accent">
                    {shopName.toUpperCase()}
                  </h1>
                  <p className="text-body text-white/80">Corte, Barba e Resenha de Alto Padrão</p>
                </div>
              </div>
            </section>

            <div className="flex flex-col gap-5 px-5 pb-8 pt-5">
              <section className="rounded-xl border border-white/10 bg-surface p-4">
                <p className="text-body font-semibold uppercase tracking-wider text-accent">
                  Pronto para dar um tapa no visual?
                </p>
                <Link
                  href="/servicos"
                  className={buttonClasses({ size: 'lg', className: 'mt-3 w-full' })}
                >
                  AGENDAR AGORA
                </Link>
              </section>

              <section className="flex flex-col gap-3 rounded-xl bg-surface p-4">
                <div className="flex items-start gap-2.5">
                  <MapPin
                    aria-hidden
                    className="mt-0.5 h-[18px] w-[18px] shrink-0 text-primary"
                  />
                  <p className="text-body font-semibold text-text">
                    {addressLine}, {cityLabel}
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <Clock
                    aria-hidden
                    className="mt-0.5 h-[18px] w-[18px] shrink-0 text-primary"
                  />
                  <div className="flex flex-col gap-0.5">
                    {hoursLines.map((line) => (
                      <p
                        key={line}
                        className="text-body font-medium text-text"
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              </section>

              <section className="flex flex-col gap-2.5">
                <h2 className="text-lead font-bold text-text">Nossos Produtos e Diferenciais</h2>
                <div className="flex gap-2.5">
                  {PERKS.map((perk) => (
                    <Link
                      key={perk.name}
                      href="/loja"
                      className="flex min-h-[110px] flex-1 flex-col justify-between rounded-lg bg-surface p-3 transition hover:bg-surface-subtle"
                    >
                      <span className="flex h-[45px] items-center justify-center rounded-sm bg-accent-soft">
                        <perk.icon
                          aria-hidden
                          className="h-5 w-5 text-accent"
                        />
                      </span>
                      <span className="text-caption font-bold leading-tight text-text">
                        {perk.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>

              <nav
                aria-label="Redes sociais"
                className="flex items-center justify-center gap-1 pt-5"
              >
                {socials.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-11 w-11 items-center justify-center rounded-full text-accent transition hover:bg-white/5 hover:text-accent-hover"
                  >
                    <social.icon
                      aria-hidden
                      className="h-6 w-6"
                    />
                  </a>
                ))}
              </nav>
            </div>

            <footer className="mt-auto border-t border-border px-5 py-6 text-center text-caption text-subtle">
              <p>
                © {new Date().getFullYear()} {shopName}
              </p>
              <div className="mt-2 flex justify-center gap-4">
                <Link
                  href="/privacidade"
                  className="hover:text-text"
                >
                  Privacidade
                </Link>
                <Link
                  href={accountHref}
                  className="hover:text-text"
                >
                  {accountLabel}
                </Link>
              </div>
              <p className="mt-2 text-micro">Feito em Belo Horizonte</p>
            </footer>
          </div>
        </div>

        <div className="hidden min-h-dvh flex-col lg:flex">
          <PublicDesktopHeader
            shopName={shopName}
            city={city}
            state={state}
            user={user}
            active="home"
          />

          <section className="flex items-center gap-10 px-10 py-12 xl:gap-16 xl:px-20">
            <div className="flex min-w-0 flex-1 flex-col gap-6">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className={
                    open
                      ? 'h-[7px] w-[7px] rounded-full bg-success'
                      : 'h-[7px] w-[7px] rounded-full bg-muted'
                  }
                />
                <span
                  className={
                    open
                      ? 'text-label font-bold uppercase tracking-[1.4px] text-success'
                      : 'text-label font-bold uppercase tracking-[1.4px] text-muted'
                  }
                >
                  {open ? 'ABERTO AGORA' : 'FECHADO'}
                </span>
              </div>

              <h1 className="font-display text-[40px] font-bold leading-[1.13] text-text xl:text-[52px]">
                Seu próximo corte começa aqui.
              </h1>

              <p className="text-[17px] leading-[1.5] text-accent">
                Corte, barba e resenha de alto padrão.
              </p>

              <div className="flex flex-col gap-3.5">
                <div className="flex gap-3">
                  <Link
                    href="/servicos"
                    className={buttonClasses({
                      size: 'lg',
                      className: 'h-[52px] flex-1 gap-2.5 rounded-md px-[22px] text-sm',
                    })}
                  >
                    AGENDAR AGORA
                    <ChevronRight
                      aria-hidden
                      className="h-[18px] w-[18px]"
                    />
                  </Link>
                  <Link
                    href="/loja"
                    className={buttonClasses({
                      variant: 'outline',
                      size: 'lg',
                      className: 'h-[52px] rounded-md px-[22px] text-sm',
                    })}
                  >
                    Loja
                  </Link>
                </div>
                <p className="text-body text-muted">
                  Escolha o serviço, o profissional e o horário. Agende como visitante.
                </p>
                <Link
                  href="/servicos"
                  className="w-fit text-body font-semibold text-primary underline underline-offset-2 transition hover:text-primary-hover"
                >
                  Ver serviços sem agendar
                </Link>
              </div>
            </div>

            <div className="relative aspect-[600/436] w-[47%] shrink-0 overflow-hidden rounded-3xl">
              <Image
                src={HERO_IMAGE}
                alt=""
                fill
                priority
                sizes="(min-width: 1440px) 600px, 47vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,19,22,0.13)_0%,rgba(18,19,22,0.4)_50%,rgba(18,19,22,0.96)_100%)]" />
              <div className="absolute bottom-8 left-8 flex flex-col gap-2">
                <span className="text-label font-semibold uppercase tracking-[2px] text-accent">
                  {locationLabel}
                </span>
                <span className="font-display text-[29px] font-black leading-[39px] text-accent">
                  {shopName.toUpperCase()}
                </span>
                <span className="text-body text-white">{streetLine}</span>
              </div>
            </div>
          </section>

          <section className="flex items-center gap-6 bg-surface px-10 py-7 xl:gap-10 xl:px-20">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <MapPin
                aria-hidden
                className="h-6 w-6 shrink-0 text-primary"
              />
              <div className="flex min-w-0 flex-col gap-2">
                <span className="text-label uppercase tracking-[1.5px] text-accent">
                  Onde nos encontrar
                </span>
                <span className="text-lead font-semibold text-text">
                  {addressLine}, {cityLabel}
                </span>
              </div>
            </div>

            <div
              aria-hidden
              className="h-12 w-px shrink-0 bg-white/10"
            />

            <div className="flex shrink-0 items-center gap-4">
              <Clock
                aria-hidden
                className="h-6 w-6 text-primary"
              />
              <div className="flex flex-col gap-1.5">
                {hoursLines.map((line, index) => (
                  <span
                    key={line}
                    className={index === 0 ? 'text-sm text-text' : 'text-sm text-muted'}
                  >
                    {line}
                  </span>
                ))}
              </div>
            </div>

            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className={buttonClasses({
                variant: 'outline',
                className: 'h-[52px] shrink-0 gap-2.5 rounded-md px-[22px] text-sm',
              })}
            >
              Como chegar
              <ChevronRight
                aria-hidden
                className="h-[18px] w-[18px]"
              />
            </a>
          </section>

          <section className="flex flex-col gap-6 px-10 py-12 xl:px-20">
            <div className="flex items-center justify-between gap-6">
              <h2 className="font-display text-[29px] font-bold leading-[39px] text-text">
                Nossos Produtos e Diferenciais
              </h2>
              <span className="text-body text-muted">Para continuar o cuidado em casa</span>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {PERKS.map((perk) => (
                <Link
                  key={perk.name}
                  href="/loja"
                  className="flex min-h-[152px] items-center gap-[18px] rounded-xl bg-surface p-4 transition hover:bg-surface-subtle"
                >
                  <span className="flex h-[120px] w-[120px] shrink-0 items-center justify-center rounded-md bg-accent-soft">
                    <perk.icon
                      aria-hidden
                      className="h-9 w-9 text-accent"
                    />
                  </span>
                  <span className="flex min-w-0 flex-col gap-2.5">
                    <span className="text-[17px] font-bold leading-[21px] text-text">
                      {perk.name}
                    </span>
                    <span className="text-caption leading-[1.6] text-muted">
                      {perk.description}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <PublicDesktopFooter
            shopName={shopName}
            whatsapp={whatsapp}
          />
        </div>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
    </>
  )
}

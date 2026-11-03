import { formatInTimeZone } from 'date-fns-tz'
import {
  ArrowRight,
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
  const [, neighborhood = ''] = addressLine.split(' — ')
  const captionLocation = neighborhood ? `${neighborhood}, ${city}` : `${city}, ${state}`

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
        className="bg-background min-h-dvh"
      >
        <div className="lg:hidden flex flex-col min-h-dvh">
          <div className="flex flex-col mx-auto w-full max-w-narrow min-h-dvh">
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

              <div className="relative flex flex-col justify-between p-5 h-full">
                <div className="flex justify-between items-center gap-4">
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
                    className="font-semibold text-caption text-text-secondary hover:text-text"
                  >
                    {accountLabel}
                  </Link>
                </div>

                <div className="flex flex-col gap-1">
                  <h1 className="font-display font-black text-accent text-brand tracking-wide">
                    {shopName.toUpperCase()}
                  </h1>
                  <p className="text-body text-white/80">Corte, Barba e Resenha de Alto Padrão</p>
                </div>
              </div>
            </section>

            <div className="flex flex-col gap-5 px-5 pt-5 pb-8">
              <section className="bg-surface p-4 border border-white/10 rounded-xl">
                <p className="font-semibold text-accent text-body uppercase tracking-wider">
                  Pronto para dar um tapa no visual?
                </p>
                <Link
                  href="/servicos"
                  className={buttonClasses({ size: 'lg', className: 'mt-3 w-full' })}
                >
                  AGENDAR AGORA
                </Link>
              </section>

              <section className="flex flex-col gap-3 bg-surface p-4 rounded-xl">
                <div className="flex items-start gap-2.5">
                  <MapPin
                    aria-hidden
                    className="mt-0.5 w-[18px] h-[18px] text-primary shrink-0"
                  />
                  <p className="font-semibold text-body text-text">
                    {addressLine}, {cityLabel}
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <Clock
                    aria-hidden
                    className="mt-0.5 w-[18px] h-[18px] text-primary shrink-0"
                  />
                  <div className="flex flex-col gap-0.5">
                    {hoursLines.map((line) => (
                      <p
                        key={line}
                        className="font-medium text-body text-text"
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              </section>

              <section className="flex flex-col gap-2.5">
                <h2 className="font-bold text-lead text-text">Nossos Produtos e Diferenciais</h2>
                <div className="flex gap-2.5">
                  {PERKS.map((perk) => (
                    <Link
                      key={perk.name}
                      href="/loja"
                      className="flex flex-col flex-1 justify-between bg-surface hover:bg-surface-subtle p-3 rounded-lg min-h-[110px] transition"
                    >
                      <span className="flex justify-center items-center rounded-sm h-[45px] bg-accent-soft">
                        <perk.icon
                          aria-hidden
                          className="w-5 h-5 text-accent"
                        />
                      </span>
                      <span className="font-bold text-caption text-text leading-tight">
                        {perk.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>

              <nav
                aria-label="Redes sociais"
                className="flex justify-center items-center gap-1 pt-5"
              >
                {socials.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    target="_blank"
                    rel="noreferrer"
                    className="flex justify-center items-center hover:bg-white/5 rounded-full w-11 h-11 text-accent transition hover:text-accent-hover"
                  >
                    <social.icon
                      aria-hidden
                      className="w-6 h-6"
                    />
                  </a>
                ))}
              </nav>
            </div>

            <footer className="mt-auto px-5 py-6 border-border border-t text-caption text-subtle text-center">
              <p>
                © {new Date().getFullYear()} {shopName}
              </p>
              <div className="flex justify-center gap-4 mt-2">
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

        <div className="hidden lg:flex flex-col min-h-dvh">
          <PublicDesktopHeader
            shopName={shopName}
            city={city}
            state={state}
            user={user}
            active="home"
          />

          <section className="flex xl:justify-between items-center gap-10 xl:gap-16 px-10 xl:px-20 py-12">
            <div className="flex flex-col flex-1 xl:flex-none gap-6 xl:w-[616px] min-w-0">
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

              <h1 className="font-display font-bold text-[40px] text-text xl:text-[52px] leading-[1.13]">
                Corte, Barba e Resenha de Alto Padrão
              </h1>

              <p className="text-[17px] text-accent leading-[1.5]">
                Pronto para dar um tapa no visual?
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
                      className="w-[18px] h-[18px]"
                    />
                  </Link>
                  <Link
                    href={accountHref}
                    className={buttonClasses({
                      variant: 'ghost',
                      size: 'lg',
                      className: 'h-[52px] flex-none gap-2.5 rounded-md px-[22px] text-sm',
                    })}
                  >
                    {accountLabel}
                    <ArrowRight
                      aria-hidden
                      className="w-[18px] h-[18px]"
                    />
                  </Link>
                </div>
                <p className="text-body text-muted">
                  Agende como convidado. Não é preciso fazer login.
                </p>
                <Link
                  href="/servicos"
                  className="w-fit font-semibold text-body text-primary hover:text-primary-hover underline underline-offset-2 transition"
                >
                  Continuar navegando sem entrar
                </Link>
              </div>
            </div>

            <div className="relative xl:flex-none rounded-3xl w-[47%] xl:w-[600px] aspect-[600/436] overflow-hidden shrink-0">
              <Image
                src={HERO_IMAGE}
                alt=""
                fill
                priority
                sizes="(min-width: 1440px) 600px, 47vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,19,22,0.13)_0%,rgba(18,19,22,0.4)_50%,rgba(18,19,22,0.96)_100%)]" />
              <div className="bottom-8 left-8 absolute flex flex-col gap-2">
                <span className="font-semibold text-accent text-label uppercase tracking-[2px]">
                  Seu estilo. Seu momento.
                </span>
                <span className="font-display font-black text-[29px] text-accent leading-[39px]">
                  {shopName.toUpperCase()}
                </span>
                <span className="text-body text-white">{captionLocation}</span>
              </div>
            </div>
          </section>

          <section className="flex items-center gap-6 xl:gap-10 bg-surface px-10 xl:px-20 py-7">
            <div className="flex flex-1 items-center gap-4 min-w-0">
              <MapPin
                aria-hidden
                className="w-6 h-6 text-primary shrink-0"
              />
              <div className="flex flex-col gap-2 min-w-0">
                <span className="text-accent text-label uppercase tracking-[1.5px]">
                  Onde nos encontrar
                </span>
                <span className="font-semibold text-lead text-text">
                  {addressLine}, {cityLabel}
                </span>
              </div>
            </div>

            <div
              aria-hidden
              className="bg-white/10 w-px h-12 shrink-0"
            />

            <div className="flex items-center gap-4 shrink-0">
              <Clock
                aria-hidden
                className="w-6 h-6 text-primary"
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
                className="w-[18px] h-[18px]"
              />
            </a>
          </section>

          <section className="flex flex-col gap-6 px-10 xl:px-20 py-12">
            <div className="flex justify-between items-center gap-6">
              <h2 className="font-display font-bold text-[29px] text-text leading-[39px]">
                Nossos Produtos e Diferenciais
              </h2>
              <span className="text-body text-muted">O cuidado continua além do corte.</span>
            </div>

            <div className="gap-6 grid grid-cols-3">
              {PERKS.map((perk) => (
                <Link
                  key={perk.name}
                  href="/loja"
                  className="flex items-center gap-[18px] bg-surface hover:bg-surface-subtle p-4 rounded-xl min-h-[152px] transition"
                >
                  <span className="flex justify-center items-center rounded-md w-[120px] h-[120px] bg-accent-soft shrink-0">
                    <perk.icon
                      aria-hidden
                      className="w-9 h-9 text-accent"
                    />
                  </span>
                  <span className="flex flex-col gap-2.5 min-w-0">
                    <span className="font-bold text-[17px] text-text leading-[21px]">
                      {perk.name}
                    </span>
                    <span className="text-caption text-muted leading-[1.6]">
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

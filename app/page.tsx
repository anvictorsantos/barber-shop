import { formatInTimeZone } from 'date-fns-tz'
import { ArrowRight, Clock, MapPin } from 'lucide-react'
import Link from 'next/link'

import { HomeHero } from '@/components/home/HomeHero'
import { ReviewsSection } from '@/components/home/ReviewsSection'
import { StatsSection } from '@/components/home/StatsSection'
import { TeamSection } from '@/components/home/TeamSection'
import { PublicDesktopFooter } from '@/components/layout/PublicDesktopFooter'
import { PublicDesktopHeader } from '@/components/layout/PublicDesktopHeader'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SkipLink } from '@/components/layout/SkipLink'
import { getSessionUser } from '@/lib/auth/session'
import { BUSINESS_TIMEZONE, isShopOpen } from '@/lib/availability/slots'
import { getActiveBarbers } from '@/lib/catalog/queries'
import { getHomeReviews, getHomeStats } from '@/lib/home/queries'
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

const INSTAGRAM_URL = 'https://www.instagram.com/_barbeariadoluiz_/?hl=en'
const FACEBOOK_URL = 'https://www.facebook.com/p/Barbearia-do-Luiz-100064042935001/'

const DEFAULT_HOURS: ShopHoursRow[] = [
  { weekday: 0, openMinute: 0, closeMinute: 0, closed: true },
  { weekday: 1, openMinute: 540, closeMinute: 1200, closed: false },
  { weekday: 2, openMinute: 540, closeMinute: 1200, closed: false },
  { weekday: 3, openMinute: 540, closeMinute: 1200, closed: false },
  { weekday: 4, openMinute: 540, closeMinute: 1200, closed: false },
  { weekday: 5, openMinute: 540, closeMinute: 1200, closed: false },
  { weekday: 6, openMinute: 540, closeMinute: 1080, closed: false },
]

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
  const [user, shop, storedHours, barbers, reviews, stats] = await Promise.all([
    getSessionUser(),
    getShopSettings(),
    getShopHours(),
    getActiveBarbers(),
    getHomeReviews(3),
    getHomeStats(),
  ])

  const hours = storedHours.length > 0 ? storedHours : DEFAULT_HOURS
  const timezone = BUSINESS_TIMEZONE
  const todayWeekday = Number(formatInTimeZone(new Date(), timezone, 'i')) % 7
  const todayHours = hours.find((hour) => hour.weekday === todayWeekday) ?? null
  const open = isShopOpen({ shopHours: todayHours, timezone })

  const shopName = shop?.name ?? 'Barbearia do Luiz'
  const addressLine = shop?.addressLine ?? 'Rua dos Geólogos, 698 — Alípio de Melo'
  const city = shop?.city ?? 'Belo Horizonte'
  const state = shop?.state ?? 'MG'
  const phone = shop?.phone ?? '+5531988815243'
  const whatsapp = (shop?.whatsapp ?? '+5531988815243').replace(/\D/g, '')
  const cityLabel = city === 'Belo Horizonte' ? 'BH' : city

  const hoursLabel =
    todayHours && !todayHours.closed
      ? `Horário de funcionamento das ${minutesToTime(todayHours.openMinute)} às ${minutesToTime(todayHours.closeMinute)}`
      : 'Hoje fechado — confira os horários da semana'

  const hoursLines = shopHoursLines(hours)

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
            active="home"
            overlay
          />
        </div>

        <HomeHero
          shopName={shopName}
          open={open}
          hoursLabel={hoursLabel}
        />

        <section className="bg-surface">
          <div className="flex w-full flex-col gap-6 px-5 py-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10 lg:px-10 lg:py-7 xl:px-20">
            <div className="flex items-start gap-4">
              <MapPin
                aria-hidden
                className="mt-1 h-6 w-6 shrink-0 text-primary"
              />
              <div className="flex min-w-0 flex-col gap-2">
                <span className="text-label uppercase tracking-[1.5px] text-accent">
                  Venha nos visitar
                </span>
                <span className="text-lead font-semibold text-text">
                  {addressLine}, {cityLabel}
                </span>
              </div>
            </div>

            <div
              aria-hidden
              className="hidden h-12 w-px shrink-0 bg-white/10 lg:block"
            />

            <div className="flex items-start gap-4">
              <Clock
                aria-hidden
                className="mt-1 h-6 w-6 text-primary"
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

            <Link
              href="/servicos"
              className="inline-flex h-[52px] w-fit items-center justify-center gap-2.5 rounded-md bg-white/10 px-[22px] text-sm font-bold text-text transition hover:bg-white/15 lg:ml-auto"
            >
              Ver serviços
              <ArrowRight
                aria-hidden
                className="h-[18px] w-[18px]"
              />
            </Link>
          </div>
        </section>

        <TeamSection
          barbers={barbers}
          whatsapp={whatsapp}
        />

        <StatsSection
          beards={stats.beards}
          cuts={stats.cuts}
          clients={stats.clients}
        />

        <ReviewsSection reviews={reviews} />

        <PublicDesktopFooter
          shopName={shopName}
          whatsapp={whatsapp}
        />
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
    </>
  )
}

import { formatInTimeZone } from 'date-fns-tz'
import { headers } from 'next/headers'

import { AboutSection } from '@/components/home/AboutSection'
import { GallerySection } from '@/components/home/GallerySection'
import { HomeHero } from '@/components/home/HomeHero'
import { ReviewsSection } from '@/components/home/ReviewsSection'
import { StatsSection } from '@/components/home/StatsSection'
import { TeamSection } from '@/components/home/TeamSection'
import { PublicDesktopFooter } from '@/components/layout/PublicDesktopFooter'
import { PublicDesktopHeader } from '@/components/layout/PublicDesktopHeader'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SkipLink } from '@/components/layout/SkipLink'
import { getSessionUser } from '@/lib/auth/session'
import { BUSINESS_TIMEZONE, getNextOpening, isShopOpen } from '@/lib/availability/slots'
import { HERO_IMAGE } from '@/lib/catalog/images'
import { getActiveBarbers, getActiveServices } from '@/lib/catalog/queries'
import { getHomeHeroBooking, getHomeReviews, getHomeStats } from '@/lib/home/queries'
import { getShopHours, getShopSettings } from '@/lib/settings/queries'
import { formatHourLabel, minutesToTime } from '@/lib/time/schedule'
import type { ShopHoursRow } from '@/lib/time/schedule'

import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Barbearia do Luiz — Agende seu horário',
  description:
    'Corte bem-feito, atenção aos detalhes e atendimento que faz você se sentir em casa, em Belo Horizonte.',
  openGraph: {
    title: 'Barbearia do Luiz — Agende seu horário',
    description:
      'Corte bem-feito, atenção aos detalhes e atendimento que faz você se sentir em casa, em Belo Horizonte.',
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

const WEEKDAY_NAMES = [
  'domingo',
  'segunda',
  'terça',
  'quarta',
  'quinta',
  'sexta',
  'sábado',
] as const

export default async function HomePage() {
  const [user, shop, storedHours, barbers, services, reviews, stats] = await Promise.all([
    getSessionUser(),
    getShopSettings(),
    getShopHours(),
    getActiveBarbers(),
    getActiveServices(),
    getHomeReviews(3),
    getHomeStats(),
  ])

  const hours = storedHours.length > 0 ? storedHours : DEFAULT_HOURS
  const timezone = BUSINESS_TIMEZONE
  const now = new Date()
  const todayWeekday = Number(formatInTimeZone(now, timezone, 'i')) % 7
  const todayHours = hours.find((hour) => hour.weekday === todayWeekday) ?? null
  const open = isShopOpen({ shopHours: todayHours, timezone, now })
  const nextOpening = getNextOpening({ shopHours: hours, now, timezone })
  const statusDetail = open
    ? todayHours
      ? `até ${formatHourLabel(todayHours.closeMinute)}`
      : 'Aberto agora'
    : nextOpening
      ? `Abre ${nextOpening.dayOffset === 0 ? 'hoje' : WEEKDAY_NAMES[nextOpening.weekday]}, ${formatHourLabel(nextOpening.openMinute)}`
      : 'Confira os horários da semana'

  const shopName = shop?.name ?? 'Barbearia do Luiz'
  const addressLine = shop?.addressLine ?? 'Rua dos Geólogos, 698 — Alípio de Melo'
  const city = shop?.city ?? 'Belo Horizonte'
  const state = shop?.state ?? 'MG'
  const phone = shop?.phone ?? '+5531988815243'
  const whatsapp = (shop?.whatsapp ?? '+5531988815243').replace(/\D/g, '')

  const featuredService =
    services.find((service) => service.slug === 'corte-barba') ??
    services.find((service) => service.category === 'COMBO') ??
    services[0] ??
    null
  const featuredBarber = barbers[0] ?? null
  const heroBooking =
    featuredService && featuredBarber
      ? await getHomeHeroBooking({ service: featuredService, barber: featuredBarber, now })
      : null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HairSalon',
    name: shopName,
    description:
      'Corte bem-feito, atenção aos detalhes e atendimento que faz você se sentir em casa, em Belo Horizonte.',
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
          open={open}
          statusDetail={statusDetail}
          address={addressLine}
          booking={heroBooking}
        />

        <AboutSection />

        <TeamSection
          barbers={barbers}
          whatsapp={whatsapp}
        />

        <StatsSection
          beards={stats.beards}
          cuts={stats.cuts}
          clients={stats.clients}
        />

        <GallerySection />

        <ReviewsSection reviews={reviews} />

        <PublicDesktopFooter
          shopName={shopName}
          whatsapp={whatsapp}
        />
      </main>

      <script
        type="application/ld+json"
        nonce={(await headers()).get('x-nonce') ?? undefined}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
    </>
  )
}

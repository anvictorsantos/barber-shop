import { formatInTimeZone } from 'date-fns-tz'

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
import { minutesToTime } from '@/lib/time/schedule'
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

  const hoursLabel =
    todayHours && !todayHours.closed
      ? `Horário de funcionamento das ${minutesToTime(todayHours.openMinute)} às ${minutesToTime(todayHours.closeMinute)}`
      : 'Hoje fechado — confira os horários da semana'

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

        <div
          aria-hidden
          className="relative h-20 overflow-hidden bg-background lg:h-24"
        >
          <div className="absolute -left-4 -right-4 top-1/2 h-[3px] bg-[linear-gradient(90deg,#D35F27_0%,#EAA83A_50%,#D35F27_100%)] shadow-[0_0_24px_rgba(211,95,39,0.65)]" />
        </div>

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

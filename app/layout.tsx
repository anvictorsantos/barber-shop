import { Inter, Playfair_Display } from 'next/font/google'

import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider'
import { ConsentBanner } from '@/components/analytics/ConsentBanner'

import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Barbearia do Luiz',
  description:
    'Corte bem-feito, atenção aos detalhes e atendimento que faz você se sentir em casa, em Belo Horizonte.',
  metadataBase: new URL(process.env.APP_URL || 'http://localhost:3000'),
  robots: { index: true, follow: true },
  appleWebApp: {
    capable: true,
    title: 'Barbearia',
    statusBarStyle: 'black-translucent',
  },
}

export const viewport: Viewport = {
  themeColor: '#121110',
  colorScheme: 'dark',
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID?.trim() || null

  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
    >
      <body
        className={`${inter.variable} ${playfair.variable} bg-background text-text antialiased`}
      >
        <AnalyticsProvider gtmId={gtmId} />
        {children}
        <ConsentBanner />
      </body>
    </html>
  )
}

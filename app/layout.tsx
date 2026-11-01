import { Inter, Playfair_Display } from 'next/font/google'

import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider'
import { ConsentBanner } from '@/components/analytics/ConsentBanner'

import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['900'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Barbearia do Luiz',
  description: 'Corte, barba e resenha de alto padrão em Belo Horizonte.',
  metadataBase: new URL(process.env.APP_URL || 'http://localhost:3000'),
  robots: { index: true, follow: true },
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

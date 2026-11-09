import { Inter } from 'next/font/google'
import { headers } from 'next/headers'

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

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID?.trim() || null
  const nonce = (await headers()).get('x-nonce') ?? undefined

  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
    >
      <body className={`${inter.variable} bg-background text-text antialiased`}>
        <AnalyticsProvider
          gtmId={gtmId}
          nonce={nonce}
        />
        {children}
        <ConsentBanner />
      </body>
    </html>
  )
}

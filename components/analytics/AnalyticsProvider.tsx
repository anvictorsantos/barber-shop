'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { GoogleTagManager } from '@/components/analytics/GoogleTagManager'
import { readConsent, subscribeConsent, type Consent } from '@/lib/analytics/consent'
import { trackPageView } from '@/lib/analytics/gtm'

export function AnalyticsProvider({
  gtmId,
  nonce,
}: {
  gtmId: string | null
  nonce?: string | undefined
}) {
  const [consent, setConsent] = useState<Consent | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    setConsent(readConsent())
    return subscribeConsent(setConsent)
  }, [])

  useEffect(() => {
    if (consent === 'granted') trackPageView(pathname)
  }, [consent, pathname])

  if (consent !== 'granted' || !gtmId) return null

  return (
    <GoogleTagManager
      id={gtmId}
      nonce={nonce}
    />
  )
}

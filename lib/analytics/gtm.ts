import { readConsent } from '@/lib/analytics/consent'
import type { AnalyticsEventName, AnalyticsParams } from '@/lib/analytics/events'

// GTM receives behaviour only. Never push email, phone, CPF, names, or IDs.
export function pushDataLayer(payload: Record<string, unknown>): void {
  if (typeof window === 'undefined') return
  if (readConsent() !== 'granted') return

  try {
    window.dataLayer = window.dataLayer ?? []
    window.dataLayer.push(payload)
  } catch {
    // A blocked or broken dataLayer must not break the page.
  }
}

export function trackEvent(name: AnalyticsEventName, params: AnalyticsParams = {}): void {
  pushDataLayer({ event: name, ...params })
}

export function trackPageView(pathname: string): void {
  if (typeof window === 'undefined') return
  pushDataLayer({
    event: 'page_view',
    page_path: pathname,
    page_location: `${window.location.origin}${pathname}`,
    page_title: document.title,
  })
}

export type Consent = 'granted' | 'denied'

const STORAGE_KEY = 'bl.analytics.consent.v1'
const EVENT_NAME = 'bl:analytics-consent'

export function readConsent(): Consent | null {
  if (typeof window === 'undefined') return null
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    return value === 'granted' || value === 'denied' ? value : null
  } catch {
    return null
  }
}

export function writeConsent(consent: Consent): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, consent)
  } catch {
    // Storage can be unavailable in private mode; the in-memory state still applies.
  }
  window.dispatchEvent(new CustomEvent<Consent>(EVENT_NAME, { detail: consent }))
}

export function subscribeConsent(listener: (consent: Consent) => void): () => void {
  if (typeof window === 'undefined') return () => undefined

  const onCustom = (event: Event) => {
    const consent = (event as CustomEvent<Consent>).detail
    if (consent === 'granted' || consent === 'denied') listener(consent)
  }
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return
    if (event.newValue === 'granted' || event.newValue === 'denied') {
      listener(event.newValue)
    }
  }

  window.addEventListener(EVENT_NAME, onCustom)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(EVENT_NAME, onCustom)
    window.removeEventListener('storage', onStorage)
  }
}

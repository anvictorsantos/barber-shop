import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DOMAIN_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/

export type NormalizedIdentifier =
  { kind: 'email'; value: string } | { kind: 'phone'; value: string }

export function normalizeEmail(value: string): string | null {
  const email = value.trim().toLowerCase()
  if (!EMAIL_PATTERN.test(email)) return null

  const at = email.lastIndexOf('@')
  if (at < 1 || at === email.length - 1) return null
  return email
}

export function emailDomain(email: string): string | null {
  const at = email.lastIndexOf('@')
  if (at < 1 || at === email.length - 1) return null

  const domain = email
    .slice(at + 1)
    .trim()
    .toLowerCase()
    .replace(/\.+$/, '')

  return DOMAIN_PATTERN.test(domain) ? domain : null
}

export function normalizePhone(value: string, defaultCountry: CountryCode = 'BR'): string | null {
  const raw = value.trim()
  if (!raw) return null

  const parsed = parsePhoneNumberFromString(raw, raw.startsWith('+') ? undefined : defaultCountry)
  return parsed?.isValid() ? parsed.number : null
}

export function normalizeIdentifier(value: string): NormalizedIdentifier | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  if (trimmed.includes('@')) {
    const email = normalizeEmail(trimmed)
    return email ? { kind: 'email', value: email } : null
  }

  const phone = normalizePhone(trimmed)
  return phone ? { kind: 'phone', value: phone } : null
}

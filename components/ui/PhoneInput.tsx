'use client'

import { AsYouType, parsePhoneNumberFromString } from 'libphonenumber-js'
import { useState } from 'react'

import { cn } from '@/lib/utils'

const COUNTRIES = [
  { code: 'BR', dial: '+55', label: 'Brasil' },
  { code: 'US', dial: '+1', label: 'Estados Unidos' },
  { code: 'PT', dial: '+351', label: 'Portugal' },
  { code: 'AR', dial: '+54', label: 'Argentina' },
  { code: 'MX', dial: '+52', label: 'México' },
  { code: 'GB', dial: '+44', label: 'Reino Unido' },
  { code: 'ES', dial: '+34', label: 'Espanha' },
  { code: 'CA', dial: '+1', label: 'Canadá' },
] as const

type CountryCode = (typeof COUNTRIES)[number]['code']

function formatFor(value: string, country: CountryCode): string {
  if (!value) return ''
  const parsed = value.startsWith('+')
    ? parsePhoneNumberFromString(value)
    : parsePhoneNumberFromString(value, country)
  if (parsed) return new AsYouType(country).input(parsed.nationalNumber)
  return new AsYouType(country).input(value)
}

export function PhoneInput({
  id,
  value,
  onChange,
  className,
  placeholder = 'Seu WhatsApp',
  invalid = false,
  describedBy,
}: {
  id?: string
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
  invalid?: boolean
  describedBy?: string
}) {
  const [country, setCountry] = useState<CountryCode>('BR')
  const [display, setDisplay] = useState(() => formatFor(value, 'BR'))

  function emit(raw: string, nextCountry: CountryCode) {
    const formatted = new AsYouType(nextCountry).input(raw)
    setDisplay(formatted)
    const parsed = parsePhoneNumberFromString(formatted, nextCountry)
    onChange(parsed ? parsed.number : raw)
  }

  function changeCountry(next: CountryCode) {
    setCountry(next)
    emit(display, next)
  }

  return (
    <div
      className={cn(
        'flex h-[50px] w-full items-center gap-2 rounded-md border border-white/10 bg-background px-2 transition focus-within:border-accent',
        className,
      )}
    >
      <select
        aria-label="País do WhatsApp"
        value={country}
        onChange={(event) => changeCountry(event.target.value as CountryCode)}
        className="h-[38px] shrink-0 cursor-pointer rounded-sm border border-white/10 bg-surface-input px-2 text-caption text-text outline-none"
      >
        {COUNTRIES.map((item) => (
          <option
            key={item.code}
            value={item.code}
          >
            {item.label} ({item.dial})
          </option>
        ))}
      </select>

      <input
        id={id}
        type="tel"
        inputMode="tel"
        value={display}
        placeholder={placeholder}
        onChange={(event) => emit(event.target.value, country)}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className="h-full min-w-0 flex-1 bg-transparent text-sm text-text placeholder:text-muted outline-none"
      />
    </div>
  )
}

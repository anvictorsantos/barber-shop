import { describe, expect, it } from 'vitest'

import {
  formatBlockSchedule,
  minutesToTime,
  parseTimeToMinutes,
  shopHoursLines,
} from '@/lib/time/schedule'
import {
  createBarberSchema,
  hoursSchema,
  shopSchema,
  timeBlockSchema,
} from '@/lib/validation/settings'

describe('time helpers', () => {
  it('parses and formats HH:mm', () => {
    expect(parseTimeToMinutes('09:30')).toBe(570)
    expect(parseTimeToMinutes('24:00')).toBeNull()
    expect(minutesToTime(570)).toBe('09:30')
  })

  it('formats recurring and one-off blocks', () => {
    expect(
      formatBlockSchedule({
        recurring: true,
        weekday: 3,
        date: null,
        startMinute: 720,
        endMinute: 810,
      }),
    ).toContain('Qua · 12:00 às 13:30')

    expect(
      formatBlockSchedule({
        recurring: false,
        weekday: null,
        date: '2026-11-15',
        startMinute: 900,
        endMinute: 960,
      }),
    ).toContain('2026-11-15 · 15:00 às 16:00')
  })

  it('describes opening hours by day group', () => {
    const hours = [
      { weekday: 0, openMinute: 0, closeMinute: 0, closed: true },
      { weekday: 1, openMinute: 540, closeMinute: 1200, closed: false },
      { weekday: 2, openMinute: 540, closeMinute: 1200, closed: false },
      { weekday: 3, openMinute: 540, closeMinute: 1200, closed: false },
      { weekday: 4, openMinute: 540, closeMinute: 1200, closed: false },
      { weekday: 5, openMinute: 540, closeMinute: 1200, closed: false },
      { weekday: 6, openMinute: 540, closeMinute: 1080, closed: false },
    ]

    expect(shopHoursLines(hours)).toEqual(['Segunda a Sexta: 9h às 20h', 'Sábado: 9h às 18h'])
  })
})

describe('settings validation', () => {
  it('accepts a valid shop', () => {
    expect(
      shopSchema.safeParse({
        name: 'Barbearia',
        addressLine: 'Rua A, 1',
        city: 'Belo Horizonte',
        state: 'MG',
        whatsapp: '+5531999999999',
      }).success,
    ).toBe(true)
  })

  it('requires seven hour rows', () => {
    expect(hoursSchema.safeParse({ hours: [] }).success).toBe(false)
  })

  it('requires a contact for a new barber', () => {
    const parsed = createBarberSchema.safeParse({
      name: 'Barbeiro',
      email: '',
      phone: '',
      password: 'secret123',
      displayName: 'Barbeiro',
      title: 'Barbeiro',
      avatarUrl: '',
    })
    expect(parsed.success).toBe(false)
  })

  it('enforces the time block shape', () => {
    expect(
      timeBlockSchema.safeParse({
        barberId: 'b1',
        label: 'Almoço',
        recurring: true,
        start: '12:00',
        end: '13:30',
      }).success,
    ).toBe(false)

    expect(
      timeBlockSchema.safeParse({
        barberId: 'b1',
        label: 'Almoço',
        recurring: true,
        weekday: 3,
        start: '13:30',
        end: '12:00',
      }).success,
    ).toBe(false)
  })
})

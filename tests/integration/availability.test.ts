import { addDays, format, parseISO } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { describe, expect, it } from 'vitest'

import { getAvailability } from '@/lib/availability/queries'
import { BUSINESS_TIMEZONE } from '@/lib/availability/slots'
import { prisma } from '@/lib/db/prisma'

describe('availability query', () => {
  it('returns slots and applies the seeded lunch block', async () => {
    const service = await prisma.service.findFirst({ where: { active: true } })
    const barber = await prisma.barberProfile.findFirst({
      where: { active: true, user: { email: 'luiz@barbeariadoluiz.com.br' } },
    })
    expect(service).not.toBeNull()
    expect(barber).not.toBeNull()
    if (!service || !barber) return

    const today = parseISO(formatInTimeZone(new Date(), BUSINESS_TIMEZONE, 'yyyy-MM-dd'))
    let result = null

    for (let index = 0; index < 8; index += 1) {
      const date = format(addDays(today, index), 'yyyy-MM-dd')
      const candidate = await getAvailability({
        serviceId: service.id,
        barberId: barber.id,
        date,
      })
      if (candidate.slots.length > 0) {
        result = candidate
        break
      }
    }

    expect(result).not.toBeNull()
    if (!result) return

    expect(result.slots.some((slot) => slot.available)).toBe(true)

    const lunchSlot = result.slots.find((slot) => slot.time === '12:00')
    if (lunchSlot) {
      expect(lunchSlot.reason).toBe('blocked')
    }
  })

  it('rejects an unknown service', async () => {
    await expect(
      getAvailability({
        serviceId: 'missing-service',
        barberId: 'missing-barber',
        date: formatInTimeZone(new Date(), BUSINESS_TIMEZONE, 'yyyy-MM-dd'),
      }),
    ).rejects.toThrow('Serviço não encontrado.')
  })
})

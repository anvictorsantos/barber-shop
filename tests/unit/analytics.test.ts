import { describe, expect, it } from 'vitest'

import { isValidGtmId } from '@/lib/analytics/env'

describe('isValidGtmId', () => {
  it('accepts a GTM container id', () => {
    expect(isValidGtmId('GTM-ABC123')).toBe(true)
  })

  it('rejects a GA4 measurement id', () => {
    expect(isValidGtmId('G-ABC123')).toBe(false)
  })

  it('rejects empty or missing ids', () => {
    expect(isValidGtmId('')).toBe(false)
    expect(isValidGtmId(null)).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'

import { brlToCents, centsToBRL } from '@/lib/format/money'

describe('brlToCents', () => {
  it('parses Brazilian and plain decimal formats', () => {
    expect(brlToCents('1.234,56')).toBe(123456)
    expect(brlToCents('10,50')).toBe(1050)
    expect(brlToCents('1234.56')).toBe(123456)
    expect(brlToCents('R$ 45')).toBe(4500)
    expect(brlToCents('0,01')).toBe(1)
  })

  it('rejects empty, malformed and negative values', () => {
    expect(brlToCents('')).toBeNull()
    expect(brlToCents('abc')).toBeNull()
    expect(brlToCents('1,2,3')).toBeNull()
    expect(brlToCents('-5')).toBeNull()
  })
})

describe('centsToBRL', () => {
  it('formats integer cents as BRL', () => {
    const value = centsToBRL(6000)
    expect(value).toContain('R$')
    expect(value).toContain('60,00')
  })

  it('formats zero', () => {
    expect(centsToBRL(0)).toContain('0,00')
  })
})

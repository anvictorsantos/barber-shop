import { describe, expect, it } from 'vitest'

import { parseMoneyToCents, formatMoney } from '@/lib/format/money'

describe('parseMoneyToCents', () => {
  it('parses Brazilian and plain decimal formats', () => {
    expect(parseMoneyToCents('1.234,56')).toBe(123456)
    expect(parseMoneyToCents('10,50')).toBe(1050)
    expect(parseMoneyToCents('1234.56')).toBe(123456)
    expect(parseMoneyToCents('R$ 45')).toBe(4500)
    expect(parseMoneyToCents('0,01')).toBe(1)
  })

  it('rejects empty, malformed and negative values', () => {
    expect(parseMoneyToCents('')).toBeNull()
    expect(parseMoneyToCents('abc')).toBeNull()
    expect(parseMoneyToCents('1,2,3')).toBeNull()
    expect(parseMoneyToCents('-5')).toBeNull()
  })
})

describe('formatMoney', () => {
  it('formats integer cents as currency', () => {
    const value = formatMoney(6000)
    expect(value).toContain('R$')
    expect(value).toContain('60,00')
  })

  it('formats zero', () => {
    expect(formatMoney(0)).toContain('0,00')
  })
})

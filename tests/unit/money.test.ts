import { describe, expect, it } from 'vitest'

import { centsToReais, formatBRL, parseBRLToCents } from '@/lib/format/money'

describe('parseBRLToCents', () => {
  it('parses Brazilian and plain decimal formats', () => {
    expect(parseBRLToCents('1.234,56')).toBe(123456)
    expect(parseBRLToCents('10,50')).toBe(1050)
    expect(parseBRLToCents('1234.56')).toBe(123456)
    expect(parseBRLToCents('R$ 45')).toBe(4500)
    expect(parseBRLToCents('0,01')).toBe(1)
  })

  it('rejects empty, malformed and negative values', () => {
    expect(parseBRLToCents('')).toBeNull()
    expect(parseBRLToCents('abc')).toBeNull()
    expect(parseBRLToCents('1,2,3')).toBeNull()
    expect(parseBRLToCents('-5')).toBeNull()
  })
})

describe('formatBRL', () => {
  it('formats integer cents as BRL', () => {
    const value = formatBRL(6000)
    expect(value).toContain('R$')
    expect(value).toContain('60,00')
  })

  it('formats zero', () => {
    expect(formatBRL(0)).toContain('0,00')
  })

  it('converts cents to reais', () => {
    expect(centsToReais(4550)).toBe(45.5)
  })
})

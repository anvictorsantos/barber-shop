import { describe, expect, it } from 'vitest'

import { centsToReais, formatBRL } from '@/lib/format/money'

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

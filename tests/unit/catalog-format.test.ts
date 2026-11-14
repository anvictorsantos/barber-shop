import { describe, expect, it } from 'vitest'

import { slugify } from '@/lib/catalog/slug'
import { formatMoneyInput, parseMoneyToCents } from '@/lib/format/money'

describe('money input format', () => {
  it('parses comma decimals', () => {
    expect(parseMoneyToCents('60,00')).toBe(6000)
    expect(parseMoneyToCents('R$ 1.234,56')).toBe(123456)
    expect(parseMoneyToCents('55.5')).toBe(5550)
  })

  it('rejects invalid and negative values', () => {
    expect(parseMoneyToCents('')).toBeNull()
    expect(parseMoneyToCents('-10')).toBeNull()
    expect(parseMoneyToCents('abc')).toBeNull()
  })

  it('formats cents back to the input shape', () => {
    expect(formatMoneyInput(6000)).toBe('60,00')
    expect(formatMoneyInput(5550)).toBe('55,50')
  })
})

describe('slugify', () => {
  it('removes accents and punctuation', () => {
    expect(slugify('Corte + Barba')).toBe('corte-barba')
    expect(slugify('Óleo Pós-Barba Eucalyptus')).toBe('oleo-pos-barba-eucalyptus')
  })
})

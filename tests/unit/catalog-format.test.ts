import { describe, expect, it } from 'vitest'

import { slugify } from '@/lib/catalog/slug'
import { formatBRLInput, parseBRLToCents } from '@/lib/format/money'

describe('BRL input', () => {
  it('parses comma decimals', () => {
    expect(parseBRLToCents('60,00')).toBe(6000)
    expect(parseBRLToCents('R$ 1.234,56')).toBe(123456)
    expect(parseBRLToCents('55.5')).toBe(5550)
  })

  it('rejects invalid and negative values', () => {
    expect(parseBRLToCents('')).toBeNull()
    expect(parseBRLToCents('-10')).toBeNull()
    expect(parseBRLToCents('abc')).toBeNull()
  })

  it('formats cents back to the input shape', () => {
    expect(formatBRLInput(6000)).toBe('60,00')
    expect(formatBRLInput(5550)).toBe('55,50')
  })
})

describe('slugify', () => {
  it('removes accents and punctuation', () => {
    expect(slugify('Corte + Barba')).toBe('corte-barba')
    expect(slugify('Óleo Pós-Barba Eucalyptus')).toBe('oleo-pos-barba-eucalyptus')
  })
})

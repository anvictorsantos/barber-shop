import { describe, expect, it } from 'vitest'

import { slugify } from '@/lib/catalog/slug'
import { formatBRLInput, brlToCents } from '@/lib/format/money'

describe('BRL input', () => {
  it('parses comma decimals', () => {
    expect(brlToCents('60,00')).toBe(6000)
    expect(brlToCents('R$ 1.234,56')).toBe(123456)
    expect(brlToCents('55.5')).toBe(5550)
  })

  it('rejects invalid and negative values', () => {
    expect(brlToCents('')).toBeNull()
    expect(brlToCents('-10')).toBeNull()
    expect(brlToCents('abc')).toBeNull()
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

import { describe, expect, it } from 'vitest'

import { cn } from '@/lib/utils'

describe('cn', () => {
  it('keeps a custom font size and a text color from colliding', () => {
    expect(cn('text-body text-text')).toBe('text-body text-text')
    expect(cn('bg-primary text-accent-ink', 'h-11 px-5 text-body')).toBe(
      'bg-primary text-accent-ink h-11 px-5 text-body',
    )
  })

  it('still resolves conflicts inside the same group', () => {
    expect(cn('text-muted text-text')).toBe('text-text')
    expect(cn('text-body text-lead')).toBe('text-lead')
  })
})

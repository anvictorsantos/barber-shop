import { describe, expect, it } from 'vitest'

import { contentSecurityPolicy } from '@/lib/http/csp'

const policy = contentSecurityPolicy('test-nonce')

function directive(name: string): string {
  return policy.split('; ').find((part) => part.startsWith(`${name} `)) ?? ''
}

describe('content security policy', () => {
  it('requires the per-request nonce for scripts and drops unsafe-inline', () => {
    const scriptSrc = directive('script-src')

    expect(scriptSrc).toContain("'nonce-test-nonce'")
    expect(scriptSrc).toContain("'strict-dynamic'")
    expect(scriptSrc).not.toContain('unsafe-inline')
  })

  it('keeps the block-everything defaults', () => {
    expect(directive('default-src')).toBe("default-src 'self'")
    expect(directive('object-src')).toBe("object-src 'none'")
    expect(directive('frame-ancestors')).toBe("frame-ancestors 'none'")
    expect(directive('base-uri')).toBe("base-uri 'self'")
  })
})

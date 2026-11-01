import { describe, expect, it } from 'vitest'

import { DisifyEmailReputation } from '@/lib/auth/email-reputation'

function response(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  } as Response
}

describe('Disify email reputation', () => {
  it('rejects a disposable domain and caches it', async () => {
    let calls = 0
    const fetchImpl = (async () => {
      calls += 1
      return response({ disposable: true })
    }) as unknown as typeof fetch

    let now = 1_000_000
    const checker = new DisifyEmailReputation(fetchImpl, () => now)

    await expect(checker.check('user@temp.test')).resolves.toEqual({ disposable: true })
    await expect(checker.check('other@temp.test')).resolves.toEqual({ disposable: true })
    expect(calls).toBe(1)

    now += 24 * 60 * 60 * 1000 + 1
    await expect(checker.check('third@temp.test')).resolves.toEqual({ disposable: true })
    expect(calls).toBe(2)
  })

  it('fails open on a network error', async () => {
    const fetchImpl = (async () => {
      throw new Error('offline')
    }) as unknown as typeof fetch

    const checker = new DisifyEmailReputation(fetchImpl, () => 1_000_000)
    await expect(checker.check('user@example.com')).resolves.toBeNull()
  })

  it('does not call the provider for an invalid email', async () => {
    let calls = 0
    const fetchImpl = (async () => {
      calls += 1
      return response({ disposable: false })
    }) as unknown as typeof fetch

    const checker = new DisifyEmailReputation(fetchImpl)
    await expect(checker.check('not-an-email')).resolves.toBeNull()
    expect(calls).toBe(0)
  })
})

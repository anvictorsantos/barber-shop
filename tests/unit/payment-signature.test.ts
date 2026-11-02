import { createHmac } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { verifyMercadoPagoSignature } from '@/lib/payments/signature'

const secret = 'webhook-test-secret'

function sign(dataId: string, requestId: string, ts: string): string {
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`
  return createHmac('sha256', secret).update(manifest).digest('hex')
}

describe('mercado pago webhook signature', () => {
  it('accepts a signature built from the notification manifest', () => {
    const ts = '1704908010'
    const signature = sign('ABC123', 'request-1', ts)

    expect(
      verifyMercadoPagoSignature({
        xSignature: `ts=${ts},v1=${signature}`,
        xRequestId: 'request-1',
        dataId: 'abc123',
        secret,
      }),
    ).toBe(true)
  })

  it('rejects tampered data', () => {
    const ts = '1704908010'
    const signature = sign('123', 'request-1', ts)

    expect(
      verifyMercadoPagoSignature({
        xSignature: `ts=${ts},v1=${signature}`,
        xRequestId: 'request-2',
        dataId: '123',
        secret,
      }),
    ).toBe(false)
  })

  it('rejects missing headers and empty secrets', () => {
    expect(
      verifyMercadoPagoSignature({
        xSignature: null,
        xRequestId: 'request-1',
        dataId: '123',
        secret,
      }),
    ).toBe(false)

    expect(
      verifyMercadoPagoSignature({
        xSignature: 'ts=1704908010,v1=abc',
        xRequestId: 'request-1',
        dataId: '123',
        secret: '',
      }),
    ).toBe(false)
  })
})

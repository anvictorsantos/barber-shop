import { createHmac, timingSafeEqual } from 'node:crypto'

interface SignatureInput {
  xSignature: string | null
  xRequestId: string | null
  dataId: string | null
  secret: string
}

function parseSignatureHeader(header: string): { ts: string; v1: string } | null {
  const parts = new Map<string, string>()

  for (const chunk of header.split(',')) {
    const separator = chunk.indexOf('=')
    if (separator === -1) continue
    parts.set(chunk.slice(0, separator).trim(), chunk.slice(separator + 1).trim())
  }

  const ts = parts.get('ts')
  const v1 = parts.get('v1')
  if (!ts || !v1) return null
  return { ts, v1 }
}

export function verifyMercadoPagoSignature(input: SignatureInput): boolean {
  if (!input.xSignature || !input.dataId || !input.secret) return false

  const parsed = parseSignatureHeader(input.xSignature)
  if (!parsed) return false

  const manifest = `id:${input.dataId.toLowerCase()};request-id:${input.xRequestId ?? ''};ts:${parsed.ts};`
  const expected = createHmac('sha256', input.secret).update(manifest).digest('hex')

  const received = Buffer.from(parsed.v1, 'utf8')
  const calculated = Buffer.from(expected, 'utf8')

  return received.length === calculated.length && timingSafeEqual(received, calculated)
}

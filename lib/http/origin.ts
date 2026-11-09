import { getServerEnv } from '@/lib/env'
import { AppError } from '@/lib/http/errors'

function assertSameOriginValue(value: string, expected: string): void {
  if (value === 'null') {
    throw new AppError(403, 'invalid_origin', 'Origem inválida.')
  }

  try {
    if (new URL(value).origin !== expected) {
      throw new AppError(403, 'invalid_origin', 'Origem inválida.')
    }
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError(403, 'invalid_origin', 'Origem inválida.')
  }
}

export function assertSameOrigin(request: Request): void {
  const expected = new URL(getServerEnv().APP_URL).origin
  const origin = request.headers.get('origin')

  if (origin) {
    assertSameOriginValue(origin, expected)
    return
  }

  const referer = request.headers.get('referer')
  if (referer) assertSameOriginValue(referer, expected)
}

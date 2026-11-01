import { getServerEnv } from '@/lib/env'
import { AppError } from '@/lib/http/errors'

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get('origin')
  if (!origin) return

  if (origin === 'null') {
    throw new AppError(403, 'invalid_origin', 'Origem inválida.')
  }

  try {
    const expected = new URL(getServerEnv().APP_URL).origin
    const actual = new URL(origin).origin
    if (actual !== expected) {
      throw new AppError(403, 'invalid_origin', 'Origem inválida.')
    }
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError(500, 'config_error', 'Configuração inválida.')
  }
}

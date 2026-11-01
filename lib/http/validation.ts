import { AppError } from '@/lib/http/errors'

import type { z } from 'zod'

export async function parseJson<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    throw new AppError(400, 'invalid_json', 'Corpo da requisição inválido.')
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    throw new AppError(400, 'invalid_input', first?.message ?? 'Dados inválidos.')
  }

  return parsed.data
}

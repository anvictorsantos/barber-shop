export class AppError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'AppError'
    this.status = status
    this.code = code
  }
}

export function errorResponse(error: unknown): Response {
  if (error instanceof AppError) {
    return Response.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status },
    )
  }

  console.error('[error]', error instanceof Error ? error.message : 'Unknown error')
  return Response.json(
    { error: { code: 'internal_error', message: 'Erro interno. Tente novamente.' } },
    { status: 500 },
  )
}

export function isExclusionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return message.includes('appointments_active_no_overlap') || message.includes('23P01')
}

export function isTransientTransactionError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false
  const code = 'code' in error ? (error as { code?: unknown }).code : undefined
  if (code === 'P2034') return true

  const meta = 'meta' in error ? (error as { meta?: unknown }).meta : undefined
  if (typeof meta === 'object' && meta !== null && 'code' in meta) {
    return (meta as { code?: unknown }).code === '40001'
  }

  const message = error instanceof Error ? error.message : ''
  return message.includes('40001') || message.includes('could not serialize access')
}

export function isUniqueConstraintError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false
  return (error as { code?: unknown }).code === 'P2002'
}

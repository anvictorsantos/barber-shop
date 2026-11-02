export function isExclusionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return message.includes('appointments_active_no_overlap') || message.includes('23P01')
}

export const WEEKDAY_LABELS = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
] as const

export const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const

export function parseTimeToMinutes(value: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim())
  if (!match) return null

  return Number(match[1]) * 60 + Number(match[2])
}

export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

export function formatTimeRange(startMinute: number, endMinute: number): string {
  return `${minutesToTime(startMinute)} às ${minutesToTime(endMinute)}`
}

export function formatBlockSchedule(block: {
  recurring: boolean
  weekday: number | null
  date: string | null
  startMinute: number
  endMinute: number
}): string {
  const day = block.recurring
    ? block.weekday !== null
      ? WEEKDAY_SHORT[block.weekday]
      : '—'
    : (block.date ?? '—')

  return `${day} · ${formatTimeRange(block.startMinute, block.endMinute)}`
}

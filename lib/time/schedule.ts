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

export interface ShopHoursRow {
  weekday: number
  openMinute: number
  closeMinute: number
  closed: boolean
}

export function formatHourLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins === 0 ? `${hours}h` : `${hours}h${String(mins).padStart(2, '0')}`
}

export function hoursRangeFor(
  hours: readonly ShopHoursRow[],
  weekdays: readonly number[],
): { openMinute: number; closeMinute: number } | null {
  const rows = weekdays.map((weekday) => hours.find((hour) => hour.weekday === weekday))
  const first = rows[0]
  if (!first || first.closed) return null

  for (const row of rows) {
    if (
      !row ||
      row.closed ||
      row.openMinute !== first.openMinute ||
      row.closeMinute !== first.closeMinute
    ) {
      return null
    }
  }

  return { openMinute: first.openMinute, closeMinute: first.closeMinute }
}

export function describeHoursGroup(
  hours: readonly ShopHoursRow[],
  weekdays: readonly number[],
  label: string,
): string | null {
  const range = hoursRangeFor(hours, weekdays)
  if (!range) return null

  return `${label}: ${formatHourLabel(range.openMinute)} às ${formatHourLabel(range.closeMinute)}`
}

export function shopHoursLines(hours: readonly ShopHoursRow[]): string[] {
  return [
    describeHoursGroup(hours, [1, 2, 3, 4, 5], 'Segunda a Sexta'),
    describeHoursGroup(hours, [6], 'Sábado'),
    describeHoursGroup(hours, [0], 'Domingo'),
  ].filter((line): line is string => line !== null)
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

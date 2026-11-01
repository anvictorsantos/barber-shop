'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import { FormMessage } from '@/components/auth/FormMessage'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { updateHoursAction } from '@/lib/settings/actions'
import type { AdminShopHours } from '@/lib/settings/types'
import { WEEKDAY_LABELS, minutesToTime } from '@/lib/time/schedule'

interface HourRow {
  weekday: number
  open: string
  close: string
  closed: boolean
}

function initialRows(hours: AdminShopHours[]): HourRow[] {
  const byWeekday = new Map(hours.map((row) => [row.weekday, row]))

  return Array.from({ length: 7 }, (_, weekday) => {
    const row = byWeekday.get(weekday)
    return {
      weekday,
      open: row ? minutesToTime(row.openMinute) : '09:00',
      close: row ? minutesToTime(row.closeMinute) : '19:00',
      closed: row?.closed ?? weekday === 0,
    }
  })
}

export function HoursForm({ hours }: { hours: AdminShopHours[] }) {
  const router = useRouter()
  const [rows, setRows] = useState<HourRow[]>(() => initialRows(hours))
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, setPending] = useState(false)

  function updateRow(weekday: number, patch: Partial<HourRow>) {
    setRows((current) =>
      current.map((row) => (row.weekday === weekday ? { ...row, ...patch } : row)),
    )
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSaved(false)
    setPending(true)

    const result = await updateHoursAction({ hours: rows })
    setPending(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    setSaved(true)
    router.refresh()
  }

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="text-title font-bold text-text">Horários de funcionamento</h2>

      <form
        className="flex flex-col gap-4"
        onSubmit={submit}
      >
        {error ? <FormMessage>{error}</FormMessage> : null}
        {saved ? <FormMessage tone="success">Horários salvos.</FormMessage> : null}

        <div className="flex flex-col gap-2">
          {rows.map((row) => (
            <div
              key={row.weekday}
              className="grid items-center gap-3 rounded-md border border-border bg-surface-input p-3 sm:grid-cols-[1fr_auto_auto_auto]"
            >
              <span className="text-caption font-bold text-text">
                {WEEKDAY_LABELS[row.weekday]}
              </span>

              <label className="flex items-center gap-2 text-caption text-muted">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[var(--primary)]"
                  checked={row.closed}
                  onChange={(event) => updateRow(row.weekday, { closed: event.target.checked })}
                />
                Fechado
              </label>

              <input
                type="time"
                value={row.open}
                disabled={row.closed}
                onChange={(event) => updateRow(row.weekday, { open: event.target.value })}
                className="h-9 rounded-sm border border-border-strong bg-surface px-2 text-caption text-text disabled:opacity-40"
                aria-label={`Abertura de ${WEEKDAY_LABELS[row.weekday]}`}
              />

              <input
                type="time"
                value={row.close}
                disabled={row.closed}
                onChange={(event) => updateRow(row.weekday, { close: event.target.value })}
                className="h-9 rounded-sm border border-border-strong bg-surface px-2 text-caption text-text disabled:opacity-40"
                aria-label={`Fechamento de ${WEEKDAY_LABELS[row.weekday]}`}
              />
            </div>
          ))}
        </div>

        <Button
          type="submit"
          disabled={pending}
        >
          {pending ? 'Salvando…' : 'Salvar horários'}
        </Button>
      </form>
    </Card>
  )
}

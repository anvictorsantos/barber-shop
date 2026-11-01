'use client'

import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import { FormMessage } from '@/components/auth/FormMessage'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field, Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { createTimeBlockAction, deleteTimeBlockAction } from '@/lib/settings/actions'
import type { AdminBarber, AdminTimeBlock } from '@/lib/settings/types'
import { WEEKDAY_LABELS, formatBlockSchedule } from '@/lib/time/schedule'

export function TimeBlockManager({
  barbers,
  blocks,
}: {
  barbers: AdminBarber[]
  blocks: AdminTimeBlock[]
}) {
  const router = useRouter()
  const [barberId, setBarberId] = useState(barbers[0]?.id ?? '')
  const [label, setLabel] = useState('')
  const [recurring, setRecurring] = useState<'weekly' | 'once'>('weekly')
  const [weekday, setWeekday] = useState('1')
  const [date, setDate] = useState('')
  const [start, setStart] = useState('12:00')
  const [end, setEnd] = useState('13:30')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSaved(false)

    if (!barberId) {
      setError('Cadastre um barbeiro antes de bloquear horários.')
      return
    }

    setPending(true)
    const input =
      recurring === 'weekly'
        ? {
            barberId,
            label,
            recurring: true,
            weekday: Number(weekday),
            start,
            end,
          }
        : {
            barberId,
            label,
            recurring: false,
            date,
            start,
            end,
          }

    const result = await createTimeBlockAction(input)
    setPending(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    setSaved(true)
    setLabel('')
    router.refresh()
  }

  async function remove(block: AdminTimeBlock) {
    setError(null)
    const result = await deleteTimeBlockAction({ id: block.id })
    if (!result.ok) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-4">
        <h2 className="text-title font-bold text-text">Bloquear horário</h2>
        <p className="text-caption text-muted">
          Use para almoço, folga, manutenção ou qualquer indisponibilidade.
        </p>

        <form
          className="flex flex-col gap-4"
          onSubmit={submit}
        >
          {error ? <FormMessage>{error}</FormMessage> : null}
          {saved ? <FormMessage tone="success">Bloqueio criado.</FormMessage> : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Barbeiro"
              htmlFor="block-barber"
            >
              <Select
                id="block-barber"
                value={barberId}
                onChange={(event) => setBarberId(event.target.value)}
              >
                {barbers.map((barber) => (
                  <option
                    key={barber.id}
                    value={barber.id}
                  >
                    {barber.displayName}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Motivo"
              htmlFor="block-label"
            >
              <Input
                id="block-label"
                required
                value={label}
                onChange={(event) => setLabel(event.target.value)}
              />
            </Field>

            <Field
              label="Tipo"
              htmlFor="block-recurring"
            >
              <Select
                id="block-recurring"
                value={recurring}
                onChange={(event) => setRecurring(event.target.value as 'weekly' | 'once')}
              >
                <option value="weekly">Toda semana</option>
                <option value="once">Data única</option>
              </Select>
            </Field>

            {recurring === 'weekly' ? (
              <Field
                label="Dia da semana"
                htmlFor="block-weekday"
              >
                <Select
                  id="block-weekday"
                  value={weekday}
                  onChange={(event) => setWeekday(event.target.value)}
                >
                  {WEEKDAY_LABELS.map((labelText, index) => (
                    <option
                      key={labelText}
                      value={String(index)}
                    >
                      {labelText}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : (
              <Field
                label="Data"
                htmlFor="block-date"
              >
                <Input
                  id="block-date"
                  type="date"
                  required
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </Field>
            )}

            <Field
              label="Início"
              htmlFor="block-start"
            >
              <Input
                id="block-start"
                type="time"
                required
                value={start}
                onChange={(event) => setStart(event.target.value)}
              />
            </Field>

            <Field
              label="Fim"
              htmlFor="block-end"
            >
              <Input
                id="block-end"
                type="time"
                required
                value={end}
                onChange={(event) => setEnd(event.target.value)}
              />
            </Field>
          </div>

          <Button
            type="submit"
            disabled={pending}
          >
            {pending ? 'Salvando…' : 'Bloquear agenda'}
          </Button>
        </form>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-title font-bold text-text">Bloqueios ativos</h2>

        {blocks.length === 0 ? (
          <p className="text-caption text-muted">Nenhum bloqueio cadastrado.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {blocks.map((block) => (
              <li
                key={block.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-input p-3"
              >
                <div className="flex flex-col">
                  <p className="text-caption font-bold text-text">{block.label}</p>
                  <p className="text-micro text-muted">
                    {block.barber.displayName} · {formatBlockSchedule(block)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(block)}
                  aria-label={`Remover ${block.label}`}
                  className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md bg-danger/10 text-danger hover:bg-danger/20"
                >
                  <Trash2
                    className="h-4 w-4"
                    aria-hidden
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

'use client'

import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { FormMessage } from '@/components/auth/FormMessage'
import { Button, buttonClasses } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import type { AvailabilitySlot } from '@/lib/availability/slots'
import { getJson } from '@/lib/http/client'
import { cn } from '@/lib/utils'

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

export function SlotPicker({
  serviceId,
  barberId,
  initialDate,
  today,
  horizonEnd,
}: {
  serviceId: string
  barberId: string
  initialDate: string
  today: string
  horizonEnd: string
}) {
  const [cursor, setCursor] = useState(() => startOfMonth(parseISO(initialDate)))
  const [date, setDate] = useState(initialDate)
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [selected, setSelected] = useState<AvailabilitySlot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const todayDate = parseISO(today)
  const horizonDate = parseISO(horizonEnd)
  const monthStart = startOfMonth(cursor)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const gridEnd = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    setSelected(null)

    const url = `/api/availability?serviceId=${encodeURIComponent(serviceId)}&barberId=${encodeURIComponent(barberId)}&date=${encodeURIComponent(date)}`

    getJson<{ slots: AvailabilitySlot[] }>(url).then((result) => {
      if (!active) return
      setLoading(false)

      if (!result.ok) {
        setError(result.error.message)
        setSlots([])
        return
      }

      setSlots(result.data.slots)
    })

    return () => {
      active = false
    }
  }, [barberId, date, serviceId])

  const availableSlots = slots.filter((slot) => slot.available)

  function selectDay(day: Date) {
    if (isBefore(day, todayDate) || isAfter(day, horizonDate)) return
    setCursor(startOfMonth(day))
    setDate(format(day, 'yyyy-MM-dd'))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCursor(addDays(monthStart, -1))}
            aria-label="Mês anterior"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-border text-text hover:border-accent"
          >
            <ChevronLeft
              className="h-4 w-4"
              aria-hidden
            />
          </button>
          <p className="text-lead font-bold capitalize text-text">
            {format(cursor, 'MMMM yyyy', { locale: ptBR })}
          </p>
          <button
            type="button"
            onClick={() => setCursor(addDays(endOfMonth(cursor), 1))}
            aria-label="Próximo mês"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-border text-text hover:border-accent"
          >
            <ChevronRight
              className="h-4 w-4"
              aria-hidden
            />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((weekday, index) => (
            <span
              key={`${weekday}-${index}`}
              className="py-1 text-center text-micro font-bold text-muted"
            >
              {weekday}
            </span>
          ))}

          {days.map((day) => {
            if (!isSameMonth(day, cursor)) return <span key={day.toISOString()} />
            const value = format(day, 'yyyy-MM-dd')
            const disabled = isBefore(day, todayDate) || isAfter(day, horizonDate)
            const selectedDay = value === date
            const isToday = value === today

            return (
              <button
                key={value}
                type="button"
                disabled={disabled}
                aria-pressed={selectedDay}
                aria-label={format(day, "d 'de' MMMM", { locale: ptBR })}
                onClick={() => selectDay(day)}
                className={cn(
                  'h-9 rounded-full text-caption font-bold transition',
                  selectedDay
                    ? 'bg-primary text-white'
                    : isToday
                      ? 'border border-accent text-accent'
                      : 'text-text hover:bg-white/5',
                  disabled && 'cursor-not-allowed text-inactive opacity-40',
                )}
              >
                {format(day, 'd')}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lead font-bold text-text">Horários disponíveis</h2>

        {error ? <FormMessage>{error}</FormMessage> : null}

        {loading ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton
                key={index}
                className="h-11"
              />
            ))}
          </div>
        ) : availableSlots.length === 0 ? (
          <p className="rounded-lg border border-border bg-surface p-4 text-caption text-muted">
            Nenhum horário para esta data. Escolha outro dia.
          </p>
        ) : (
          <div
            role="radiogroup"
            aria-label="Horários disponíveis"
            className="grid grid-cols-3 gap-2 sm:grid-cols-4"
          >
            {availableSlots.map((slot) => {
              const isSelected = selected?.startAt === slot.startAt
              return (
                <button
                  key={slot.startAt}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setSelected(slot)}
                  className={cn(
                    'h-11 cursor-pointer rounded-lg border text-caption font-bold transition',
                    isSelected
                      ? 'border-primary bg-primary text-white'
                      : 'border-border-strong bg-surface text-text hover:border-accent',
                  )}
                >
                  {slot.time}
                </button>
              )
            })}
          </div>
        )}

        {selected ? (
          <Link
            href={`/agendar/resumo?serviceId=${encodeURIComponent(serviceId)}&barberId=${encodeURIComponent(barberId)}&startAt=${encodeURIComponent(selected.startAt)}`}
            className={buttonClasses({ size: 'lg', className: 'w-full' })}
          >
            Continuar
          </Link>
        ) : (
          <Button
            size="lg"
            className="w-full"
            disabled
          >
            Continuar
          </Button>
        )}
      </div>
    </div>
  )
}

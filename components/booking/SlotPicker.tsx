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
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { FormMessage } from '@/components/auth/FormMessage'
import { BookingOverview } from '@/components/booking/BookingOverview'
import { Button, buttonClasses } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import type { AvailabilitySlot } from '@/lib/availability/slots'
import { getJson } from '@/lib/http/client'
import { cn } from '@/lib/utils'

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export interface PickerService {
  id: string
  name: string
  durationMin: number
  price: string
  promoLabel: string | null
  imageUrl: string | null
}

export interface PickerBarber {
  displayName: string
  avatarUrl: string | null
}

export function SlotPicker({
  service,
  barber,
  address,
  barberId,
  initialDate,
  today,
  horizonEnd,
}: {
  service: PickerService
  barber: PickerBarber
  address: string
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
  const selectedDate = parseISO(date)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    setSelected(null)

    const url = `/api/availability?serviceId=${encodeURIComponent(service.id)}&barberId=${encodeURIComponent(barberId)}&date=${encodeURIComponent(date)}`

    getJson<{ slots: AvailabilitySlot[] }>(url).then((result) => {
      if (!active) return
      setLoading(false)

      if (!result.ok) {
        setError(result.error.message)
        setSlots([])
        return
      }

      setSlots(result.data.slots)
      setSelected(result.data.slots.find((slot) => slot.available) ?? null)
    })

    return () => {
      active = false
    }
  }, [barberId, date, service.id])

  const availableSlots = slots.filter((slot) => slot.available)
  const scheduleHref = selected
    ? `/agendar/resumo?serviceId=${encodeURIComponent(service.id)}&barberId=${encodeURIComponent(barberId)}&startAt=${encodeURIComponent(selected.startAt)}`
    : null
  const dateLabel = capitalize(format(selectedDate, "EEE, d 'de' MMM", { locale: ptBR }))
  const timeLabel = selected
    ? `${selected.time} · ${service.durationMin} minutos`
    : 'Escolha um horário'

  function selectDay(day: Date) {
    if (!isSameMonth(day, cursor)) return
    if (isBefore(day, todayDate) || isAfter(day, horizonDate)) return
    setCursor(startOfMonth(day))
    setDate(format(day, 'yyyy-MM-dd'))
  }

  return (
    <div className="flex flex-col gap-8 xl:flex-row xl:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-6 xl:w-[888px] xl:flex-none">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <div className="flex flex-col gap-6 rounded-xl border border-white/10 bg-surface p-7 lg:w-[438px] lg:shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-title font-bold capitalize text-text">
                {format(cursor, 'MMMM yyyy', { locale: ptBR })}
              </span>
              <div className="flex items-center gap-[18px]">
                <button
                  type="button"
                  onClick={() => setCursor(addDays(monthStart, -1))}
                  aria-label="Mês anterior"
                  className="cursor-pointer text-muted transition hover:text-text"
                >
                  <ChevronLeft
                    aria-hidden
                    className="h-3.5 w-3.5"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setCursor(addDays(endOfMonth(cursor), 1))}
                  aria-label="Próximo mês"
                  className="cursor-pointer text-text transition hover:text-accent"
                >
                  <ChevronRight
                    aria-hidden
                    className="h-3.5 w-3.5"
                  />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-y-2.5">
              {WEEKDAYS.map((weekday, index) => (
                <span
                  key={`${weekday}-${index}`}
                  className="text-center text-micro font-semibold text-muted"
                >
                  {weekday}
                </span>
              ))}

              {days.map((day) => {
                const value = format(day, 'yyyy-MM-dd')
                const outside = !isSameMonth(day, cursor)
                const disabled = outside || isBefore(day, todayDate) || isAfter(day, horizonDate)
                const selectedDay = value === date

                return (
                  <button
                    key={value}
                    type="button"
                    disabled={disabled}
                    aria-pressed={selectedDay}
                    aria-label={format(day, "d 'de' MMMM", { locale: ptBR })}
                    onClick={() => selectDay(day)}
                    className={cn(
                      'mx-auto flex h-[42px] w-[42px] items-center justify-center rounded-full text-[13px] leading-4 transition',
                      selectedDay
                        ? 'bg-primary font-bold text-white'
                        : disabled
                          ? 'cursor-not-allowed text-muted opacity-30'
                          : 'cursor-pointer font-medium text-text hover:bg-white/5',
                    )}
                  >
                    {format(day, 'd')}
                  </button>
                )
              })}
            </div>

            <div className="h-px w-full bg-white/10" />

            <span className="flex items-center gap-2 text-caption text-muted">
              <span
                aria-hidden
                className="h-[7px] w-[7px] rounded-full bg-primary"
              />
              {capitalize(format(selectedDate, "d 'de' MMMM", { locale: ptBR }))}
            </span>
          </div>

          <div className="flex flex-1 flex-col gap-5 rounded-xl border border-white/10 bg-surface p-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-base font-bold leading-[19px] text-text">Horários disponíveis</h2>
              <span className="text-caption text-muted">Duração: {service.durationMin} min</span>
            </div>

            {error ? <FormMessage>{error}</FormMessage> : null}

            {loading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 4 }, (_, index) => (
                  <Skeleton
                    key={index}
                    className="h-[58px] w-full rounded-md"
                  />
                ))}
              </div>
            ) : availableSlots.length === 0 ? (
              <p className="rounded-md border border-white/10 bg-background p-4 text-caption text-muted">
                Nenhum horário para esta data. Escolha outro dia.
              </p>
            ) : (
              <div
                role="radiogroup"
                aria-label="Horários disponíveis"
                className="flex flex-col gap-3 lg:max-h-[268px] lg:overflow-y-auto lg:pr-1"
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
                        'flex h-[58px] w-full shrink-0 cursor-pointer items-center justify-between rounded-md border px-4 transition',
                        isSelected
                          ? 'border-primary bg-[#302119]'
                          : 'border-white/10 bg-background hover:border-accent/50',
                      )}
                    >
                      <span className="flex items-center gap-2.5">
                        <Clock
                          aria-hidden
                          className={cn('h-4 w-4', isSelected ? 'text-accent' : 'text-muted')}
                        />
                        <span className="text-[15px] font-bold leading-[18px] text-white">
                          {slot.time}
                        </span>
                      </span>
                      <span
                        aria-hidden
                        className={cn(
                          'flex h-[18px] w-[18px] items-center justify-center rounded-full border-[1.5px]',
                          isSelected ? 'border-primary' : 'border-muted',
                        )}
                      >
                        {isSelected ? <span className="h-2 w-2 rounded-full bg-primary" /> : null}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            <span className="text-label text-muted">Horário de Brasília (GMT-3)</span>
          </div>
        </div>

        <div className="flex justify-end">
          {scheduleHref ? (
            <Link
              href={scheduleHref}
              className={buttonClasses({
                size: 'lg',
                className: 'h-[52px] w-fit gap-2.5 rounded-md px-[22px] text-sm',
              })}
            >
              Continuar
              <ChevronRight
                aria-hidden
                className="h-[18px] w-[18px]"
              />
            </Link>
          ) : (
            <Button
              size="lg"
              disabled
              className="h-[52px] w-fit rounded-md px-[22px] text-sm"
            >
              Continuar
            </Button>
          )}
        </div>
      </div>

      <BookingOverview
        className="shrink-0 xl:w-[360px]"
        service={{
          name: service.name,
          imageUrl: service.imageUrl,
          meta: service.promoLabel ?? `${service.durationMin} min`,
        }}
        barber={barber}
        dateLabel={dateLabel}
        timeLabel={timeLabel}
        total={service.price}
        address={address}
      />
    </div>
  )
}

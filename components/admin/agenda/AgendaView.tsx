'use client'

import { addDays, format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarPlus, ChevronLeft, ChevronRight, Clock, Loader2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { Button, buttonClasses } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field, Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { StatusPill, type StatusTone } from '@/components/ui/StatusPill'
import {
  cancelAppointmentAction,
  completeAppointmentAction,
  createManualBookingAction,
  markNoShowAction,
} from '@/lib/admin/actions'
import type { AgendaDay } from '@/lib/admin/queries'
import { formatBRL } from '@/lib/format/money'
import { recordPaymentAction } from '@/lib/payments/actions'
import { cn } from '@/lib/utils'

import type { AppointmentStatus } from '@prisma/client'

interface BarberOption {
  id: string
  displayName: string
}

interface ServiceOption {
  id: string
  name: string
  durationMin: number
  priceCents: number
}

interface Slot {
  startAt: string
  time: string
  available: boolean
}

const STATUS_LABELS: Record<AppointmentStatus, { label: string; tone: StatusTone }> = {
  PENDING: { label: 'Pendente', tone: 'warning' },
  CONFIRMED: { label: 'Confirmado', tone: 'success' },
  COMPLETED: { label: 'Concluído', tone: 'neutral' },
  NO_SHOW: { label: 'Falta', tone: 'danger' },
  CANCELED: { label: 'Cancelado', tone: 'neutral' },
  CANCELED_LATE: { label: 'Cancelado tarde', tone: 'danger' },
}

const SOURCE_LABELS = {
  ONLINE: 'Online',
  MANUAL: 'Manual',
  WALK_IN: 'Encaixe',
} as const

function dateLabel(date: string): string {
  return format(parseISO(date), "EEEE, d 'de' MMMM", { locale: ptBR })
}

export function AgendaView({
  day,
  today,
  isOwner,
  scopeBarberId,
  selectedBarberId,
  barbers,
  services,
}: {
  day: AgendaDay
  today: string
  isOwner: boolean
  scopeBarberId: string | null
  selectedBarberId: string | null
  barbers: BarberOption[]
  services: ServiceOption[]
}) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const previous = format(addDays(parseISO(day.date), -1), 'yyyy-MM-dd')
  const next = format(addDays(parseISO(day.date), 1), 'yyyy-MM-dd')

  function navigate(date: string, barberId = selectedBarberId) {
    const params = new URLSearchParams({ date })
    if (barberId) params.set('barber', barberId)
    router.push(`/admin/agenda?${params.toString()}`)
  }

  async function run(id: string, action: () => Promise<{ ok: boolean; error?: string }>) {
    setBusyId(id)
    setError(null)
    const result = await action()
    setBusyId(null)
    if (!result.ok) setError(result.error ?? 'Não foi possível concluir.')
    else router.refresh()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Dia anterior"
            onClick={() => navigate(previous)}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-muted hover:text-text"
          >
            <ChevronLeft
              className="h-5 w-5"
              aria-hidden
            />
          </button>
          <div className="min-w-36 text-center">
            <p className="text-lead font-bold capitalize text-text">{dateLabel(day.date)}</p>
            <p className="text-caption text-muted">
              {day.appointments.length} agendamento{day.appointments.length === 1 ? '' : 's'}
            </p>
          </div>
          <button
            type="button"
            aria-label="Próximo dia"
            onClick={() => navigate(next)}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-muted hover:text-text"
          >
            <ChevronRight
              className="h-5 w-5"
              aria-hidden
            />
          </button>
          {day.date !== today ? (
            <button
              type="button"
              onClick={() => navigate(today)}
              className="cursor-pointer text-caption font-semibold text-accent hover:underline"
            >
              Hoje
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isOwner ? (
            <Select
              aria-label="Filtrar por profissional"
              value={selectedBarberId ?? ''}
              onChange={(event) => navigate(day.date, event.target.value || null)}
              className="w-48"
            >
              <option value="">Todos os profissionais</option>
              {barbers.map((barber) => (
                <option
                  key={barber.id}
                  value={barber.id}
                >
                  {barber.displayName}
                </option>
              ))}
            </Select>
          ) : null}
          <Button
            variant="gold"
            onClick={() => setShowForm((current) => !current)}
          >
            <CalendarPlus
              className="h-4 w-4"
              aria-hidden
            />
            {showForm ? 'Fechar' : 'Novo agendamento'}
          </Button>
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-caption text-danger"
        >
          {error}
        </p>
      ) : null}

      {showForm ? (
        <ManualBookingForm
          date={day.date}
          barbers={barbers}
          services={services}
          scopeBarberId={scopeBarberId}
          onClose={() => setShowForm(false)}
          onCreated={(code) => {
            setShowForm(false)
            router.push(`/admin/agenda?date=${day.date}&created=${code}`)
            router.refresh()
          }}
        />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
        <div className="flex flex-col gap-3">
          {day.appointments.length === 0 ? (
            <Card>
              <EmptyState
                icon={Clock}
                title="Nada marcado para este dia"
                description="Use “Novo agendamento” para encaixar um cliente."
              />
            </Card>
          ) : (
            day.appointments.map((appointment) => {
              const status = STATUS_LABELS[appointment.status]
              const canAct = appointment.status === 'PENDING' || appointment.status === 'CONFIRMED'
              const canPay = !appointment.order.paid && canAct

              return (
                <article
                  key={appointment.id}
                  className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex w-16 shrink-0 flex-col">
                      <span className="text-lead font-extrabold text-accent">
                        {appointment.timeLabel}
                      </span>
                      <span className="text-micro text-subtle">{appointment.endLabel}</span>
                    </div>
                    <div className="flex min-w-0 flex-col gap-1">
                      <p className="truncate text-body font-bold text-text">
                        {appointment.customerName}
                      </p>
                      <p className="truncate text-caption text-muted">
                        {appointment.serviceName} · {appointment.barberName} ·{' '}
                        {SOURCE_LABELS[appointment.source]}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill tone={status.tone}>{status.label}</StatusPill>
                        <span className="text-caption font-bold text-text">
                          {formatBRL(appointment.priceCents)}
                        </span>
                        <span className="text-micro text-subtle">#{appointment.order.code}</span>
                        {appointment.order.paid ? (
                          <StatusPill tone="success">Pago</StatusPill>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {canAct ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === appointment.id}
                          onClick={() =>
                            run(appointment.id, () =>
                              completeAppointmentAction({ appointmentId: appointment.id }),
                            )
                          }
                        >
                          Concluir
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === appointment.id}
                          onClick={() => {
                            if (!window.confirm('Marcar falta sem aviso deste cliente?')) return
                            run(appointment.id, () =>
                              markNoShowAction({ appointmentId: appointment.id }),
                            )
                          }}
                        >
                          Falta
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={busyId === appointment.id}
                          onClick={() => {
                            if (!window.confirm('Cancelar este agendamento?')) return
                            run(appointment.id, () =>
                              cancelAppointmentAction({ appointmentId: appointment.id }),
                            )
                          }}
                        >
                          Cancelar
                        </Button>
                      </>
                    ) : null}

                    {canPay ? (
                      <div className="flex items-center gap-1">
                        {(['PIX', 'CREDIT_CARD', 'CASH'] as const).map((method) => (
                          <button
                            key={method}
                            type="button"
                            disabled={busyId === appointment.id}
                            onClick={() =>
                              run(appointment.id, () =>
                                recordPaymentAction({
                                  orderCode: appointment.order.code,
                                  method,
                                }),
                              )
                            }
                            className="cursor-pointer rounded-md border border-border bg-white/5 px-2 py-1 text-micro font-bold text-muted transition hover:border-accent hover:text-text disabled:opacity-40"
                          >
                            {method === 'PIX' ? 'PIX' : method === 'CASH' ? 'Dinheiro' : 'Cartão'}
                          </button>
                        ))}
                      </div>
                    ) : null}

                    {busyId === appointment.id ? (
                      <Loader2
                        className="h-4 w-4 animate-spin text-accent"
                        aria-hidden
                      />
                    ) : null}
                  </div>
                </article>
              )
            })
          )}
        </div>

        <Card className="flex h-fit flex-col gap-3">
          <h2 className="text-caption font-bold uppercase tracking-wider text-muted">
            Bloqueios do dia
          </h2>
          {day.blocks.length === 0 ? (
            <p className="text-caption text-subtle">Nenhum bloqueio.</p>
          ) : (
            day.blocks.map((block) => (
              <div
                key={block.id}
                className="flex flex-col gap-0.5 border-t border-border pt-2 first:border-0 first:pt-0"
              >
                <span className="text-caption font-bold text-text">{block.label}</span>
                <span className="text-micro text-muted">
                  {block.startLabel}–{block.endLabel} · {block.barberName}
                </span>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  )
}

function ManualBookingForm({
  date,
  barbers,
  services,
  scopeBarberId,
  onClose,
  onCreated,
}: {
  date: string
  barbers: BarberOption[]
  services: ServiceOption[]
  scopeBarberId: string | null
  onClose: () => void
  onCreated: (code: string) => void
}) {
  const [serviceId, setServiceId] = useState(services[0]?.id ?? '')
  const [barberId, setBarberId] = useState(scopeBarberId ?? barbers[0]?.id ?? '')
  const [day, setDay] = useState(date)
  const [slots, setSlots] = useState<Slot[]>([])
  const [startAt, setStartAt] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [source, setSource] = useState<'MANUAL' | 'WALK_IN'>('MANUAL')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedService = useMemo(
    () => services.find((service) => service.id === serviceId) ?? null,
    [services, serviceId],
  )

  useEffect(() => {
    if (!serviceId || !barberId || !day) return

    let active = true
    setLoading(true)
    setStartAt('')

    fetch(
      `/api/availability?serviceId=${encodeURIComponent(serviceId)}&barberId=${encodeURIComponent(barberId)}&date=${encodeURIComponent(day)}`,
    )
      .then(async (response) => {
        if (!response.ok) throw new Error('Não foi possível carregar os horários.')
        const body = (await response.json()) as { slots?: Slot[] }
        if (active) setSlots((body.slots ?? []).filter((slot) => slot.available))
      })
      .catch(() => {
        if (active) setSlots([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [serviceId, barberId, day])

  async function submit() {
    setError(null)
    setSaving(true)
    const result = await createManualBookingAction({
      serviceId,
      barberId,
      date: day,
      startAt,
      source,
      customer: { name, email, phone },
    })
    setSaving(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    onCreated(result.code)
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lead font-bold text-text">Novo agendamento</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar formulário"
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted hover:text-text"
        >
          <X
            className="h-4 w-4"
            aria-hidden
          />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Field
          label="Serviço"
          htmlFor="booking-service"
        >
          <Select
            id="booking-service"
            value={serviceId}
            onChange={(event) => setServiceId(event.target.value)}
          >
            {services.map((service) => (
              <option
                key={service.id}
                value={service.id}
              >
                {service.name} · {service.durationMin} min
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Profissional"
          htmlFor="booking-barber"
        >
          <Select
            id="booking-barber"
            value={barberId}
            disabled={scopeBarberId !== null}
            onChange={(event) => setBarberId(event.target.value)}
          >
            {barbers
              .filter((barber) => !scopeBarberId || barber.id === scopeBarberId)
              .map((barber) => (
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
          label="Dia"
          htmlFor="booking-date"
        >
          <Input
            id="booking-date"
            type="date"
            value={day}
            onChange={(event) => setDay(event.target.value)}
          />
        </Field>

        <Field
          label="Origem"
          htmlFor="booking-source"
        >
          <Select
            id="booking-source"
            value={source}
            onChange={(event) => setSource(event.target.value as 'MANUAL' | 'WALK_IN')}
          >
            <option value="MANUAL">Manual</option>
            <option value="WALK_IN">Encaixe</option>
          </Select>
        </Field>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-caption font-semibold text-muted">Horário</span>
        {loading ? (
          <p className="text-caption text-subtle">Carregando horários…</p>
        ) : slots.length === 0 ? (
          <p className="text-caption text-subtle">Sem horários livres neste dia.</p>
        ) : (
          <div
            id="booking-form-slots"
            className="flex flex-wrap gap-2"
          >
            {slots.map((slot) => (
              <button
                key={slot.startAt}
                type="button"
                onClick={() => setStartAt(slot.startAt)}
                className={cn(
                  'cursor-pointer rounded-md border px-3 py-1.5 text-caption font-bold transition',
                  startAt === slot.startAt
                    ? 'border-accent bg-accent text-background'
                    : 'border-border bg-surface-input text-muted hover:border-accent hover:text-text',
                )}
              >
                {slot.time}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field
          label="Cliente"
          htmlFor="booking-name"
        >
          <Input
            id="booking-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="off"
          />
        </Field>
        <Field
          label="WhatsApp"
          htmlFor="booking-phone"
          hint="Com DDI, ex: +55 31 98881-5243"
        >
          <Input
            id="booking-phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </Field>
        <Field
          label="E-mail"
          htmlFor="booking-email"
          hint="Opcional se informar WhatsApp"
        >
          <Input
            id="booking-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
      </div>

      {selectedService ? (
        <p className="text-caption text-muted">
          {selectedService.name} · {formatBRL(selectedService.priceCents)} ·{' '}
          {selectedService.durationMin} min
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="text-caption text-danger"
        >
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className={buttonClasses({ variant: 'ghost' })}
        >
          Cancelar
        </button>
        <Button
          variant="gold"
          disabled={saving || !startAt || !name.trim()}
          onClick={submit}
        >
          {saving ? 'Agendando…' : 'Agendar'}
        </Button>
      </div>
    </Card>
  )
}

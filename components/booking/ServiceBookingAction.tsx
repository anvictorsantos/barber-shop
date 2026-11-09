'use client'

import { formatInTimeZone } from 'date-fns-tz'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { buttonClasses } from '@/components/ui/Button'
import type { ButtonSize } from '@/components/ui/Button'
import { BUSINESS_TIMEZONE } from '@/lib/availability/slots'
import { addCartItem } from '@/lib/cart/store'
import { useCart } from '@/lib/cart/useCart'

interface ActionService {
  id: string
  name: string
  durationMin: number
  priceCents: number
}

export function ServiceBookingAction({
  service,
  continuar,
  size = 'lg',
  className = 'w-fit',
}: {
  service: ActionService
  continuar: boolean
  size?: ButtonSize
  className?: string
}) {
  const router = useRouter()
  const items = useCart()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const last = [...items].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  )
  const previous = last.at(-1)

  if (!continuar || !previous) {
    return (
      <Link
        href={`/agendar/${service.id}/profissional`}
        className={buttonClasses({
          size,
          className,
        })}
      >
        Agendar este serviço
        <ChevronRight
          aria-hidden
          className="h-4 w-4"
        />
      </Link>
    )
  }

  async function addToBooking() {
    if (!previous) return
    setPending(true)
    setError(null)

    const previousEnd = new Date(previous.startAt).getTime() + previous.durationMin * 60_000
    const date = formatInTimeZone(new Date(previous.startAt), BUSINESS_TIMEZONE, 'yyyy-MM-dd')

    try {
      const response = await fetch(
        `/api/availability?serviceId=${service.id}&barberId=${previous.barberId}&date=${date}`,
      )
      if (!response.ok) throw new Error('availability')

      const body = (await response.json()) as {
        slots?: { startAt: string; available: boolean }[]
      }

      const slot = body.slots?.find(
        (item) => item.available && new Date(item.startAt).getTime() >= previousEnd,
      )

      if (!slot) {
        setError('Sem horário livre no mesmo dia. Agende pelo fluxo normal.')
        return
      }

      addCartItem({
        serviceId: service.id,
        serviceName: service.name,
        barberId: previous.barberId,
        barberName: previous.barberName,
        startAt: slot.startAt,
        durationMin: service.durationMin,
        priceCents: service.priceCents,
      })
      router.push('/carrinho')
    } catch {
      setError('Não foi possível verificar os horários. Tente novamente.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={addToBooking}
        disabled={pending}
        className={buttonClasses({
          size,
          className,
        })}
      >
        {pending ? 'Verificando…' : 'Adicionar ao agendamento'}
        <ChevronRight
          aria-hidden
          className="h-4 w-4"
        />
      </button>
      <span className="text-caption text-muted">
        Mantém {previous.barberName} e continua a partir de{' '}
        {formatInTimeZone(new Date(previous.startAt), BUSINESS_TIMEZONE, 'HH:mm')}.
      </span>
      {error ? (
        <p
          role="alert"
          className="text-caption text-danger"
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}

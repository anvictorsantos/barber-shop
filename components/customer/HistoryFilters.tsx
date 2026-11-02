'use client'

import { CalendarDays, ChevronDown, Search } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState, type FormEvent } from 'react'

const fieldClass =
  'h-[31px] rounded-xs border border-white/[0.07] bg-background text-caption text-text outline-none transition focus:border-accent'

export function HistoryFilters({
  services,
  barbers,
}: {
  services: { id: string; name: string }[]
  barbers: { id: string; name: string }[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')

  function update(patch: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(patch)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    update({ q: query.trim() })
  }

  const hasFilters = ['from', 'to', 'service', 'barber', 'q'].some((key) => searchParams.get(key))

  return (
    <form
      onSubmit={submit}
      className="flex flex-wrap items-center gap-4 rounded-lg border border-white/[0.07] bg-surface p-4"
    >
      <div className="flex items-center gap-2">
        <label className="relative flex h-[31px] items-center gap-2 rounded-xs border border-white/[0.07] bg-background px-3">
          <span className="sr-only">Data inicial</span>
          <input
            type="date"
            name="from"
            defaultValue={searchParams.get('from') ?? ''}
            onChange={(event) => update({ from: event.target.value })}
            className="w-[92px] bg-transparent text-caption text-muted outline-none [&::-webkit-calendar-picker-indicator]:opacity-0"
          />
          <CalendarDays
            aria-hidden
            strokeWidth={2}
            className="pointer-events-none h-3 w-3 text-primary"
          />
        </label>

        <label className="relative flex h-[31px] items-center gap-2 rounded-xs border border-white/[0.07] bg-background px-3">
          <span className="sr-only">Data final</span>
          <input
            type="date"
            name="to"
            defaultValue={searchParams.get('to') ?? ''}
            onChange={(event) => update({ to: event.target.value })}
            className="w-[98px] bg-transparent text-caption text-muted outline-none [&::-webkit-calendar-picker-indicator]:opacity-0"
          />
          <CalendarDays
            aria-hidden
            strokeWidth={2}
            className="pointer-events-none h-3 w-3 text-primary"
          />
        </label>
      </div>

      <div className="relative">
        <select
          name="service"
          aria-label="Serviço"
          defaultValue={searchParams.get('service') ?? ''}
          onChange={(event) => update({ service: event.target.value })}
          className={`${fieldClass} w-[150px] appearance-none pl-3 pr-7`}
        >
          <option value="">Todos os serviços</option>
          {services.map((service) => (
            <option
              key={service.id}
              value={service.id}
            >
              {service.name}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          strokeWidth={2}
          className="pointer-events-none absolute right-3 top-1/2 h-2.5 w-2.5 -translate-y-1/2 text-muted"
        />
      </div>

      <div className="relative">
        <select
          name="barber"
          aria-label="Barbeiro"
          defaultValue={searchParams.get('barber') ?? ''}
          onChange={(event) => update({ barber: event.target.value })}
          className={`${fieldClass} w-[155px] appearance-none pl-3 pr-7`}
        >
          <option value="">Todos os barbeiros</option>
          {barbers.map((barber) => (
            <option
              key={barber.id}
              value={barber.id}
            >
              {barber.name}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          strokeWidth={2}
          className="pointer-events-none absolute right-3 top-1/2 h-2.5 w-2.5 -translate-y-1/2 text-muted"
        />
      </div>

      <div className="flex h-[31px] min-w-0 flex-1 items-center gap-2 rounded-xs border border-white/[0.07] bg-background px-3">
        <Search
          aria-hidden
          strokeWidth={2}
          className="h-3 w-3 shrink-0 text-subtle"
        />
        <input
          name="q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar serviço..."
          className="min-w-0 flex-1 bg-transparent text-caption text-text placeholder:text-subtle outline-none"
        />
      </div>

      {hasFilters ? (
        <button
          type="button"
          onClick={() => {
            setQuery('')
            router.push(pathname)
          }}
          className="cursor-pointer text-caption font-semibold text-muted transition hover:text-text"
        >
          Limpar filtros
        </button>
      ) : null}
    </form>
  )
}

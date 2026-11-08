'use client'

import { CalendarDays, Search } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import { Select } from '@/components/ui/Select'

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

      <Select
        aria-label="Serviço"
        value={searchParams.get('service') ?? ''}
        onValueChange={(value) => update({ service: value })}
        className="w-[150px]"
        triggerClassName="h-[31px] rounded-xs text-caption"
        options={[
          { label: 'Todos os serviços', value: '' },
          ...services.map((service) => ({ label: service.name, value: service.id })),
        ]}
      />

      <Select
        aria-label="Barbeiro"
        value={searchParams.get('barber') ?? ''}
        onValueChange={(value) => update({ barber: value })}
        className="w-[155px]"
        triggerClassName="h-[31px] rounded-xs text-caption"
        options={[
          { label: 'Todos os barbeiros', value: '' },
          ...barbers.map((barber) => ({ label: barber.name, value: barber.id })),
        ]}
      />

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

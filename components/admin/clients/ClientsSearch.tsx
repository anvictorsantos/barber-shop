'use client'

import { Search } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export function ClientsSearch({ initial }: { initial: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(initial)

  useEffect(() => {
    const current = searchParams.get('q') ?? ''
    if (query.trim() === current) return
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      const value = query.trim()
      if (value) params.set('q', value)
      else params.delete('q')
      params.delete('page')
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname)
    }, 300)
    return () => clearTimeout(timeout)
  }, [query, searchParams, pathname, router])

  return (
    <div className="relative flex w-full max-w-md items-center">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        aria-hidden
      />
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar por nome, e-mail ou telefone"
        aria-label="Buscar clientes"
        className="h-10 w-full rounded-sm border border-border-strong bg-surface-input pl-9 pr-3 text-body text-text placeholder:text-subtle focus:border-accent"
      />
    </div>
  )
}

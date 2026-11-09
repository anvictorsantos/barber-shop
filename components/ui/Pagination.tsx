import Link from 'next/link'

import { cn } from '@/lib/utils'

export function paginationLinkClass(disabled: boolean): string {
  return cn(
    'rounded-md border px-4 py-2 text-caption font-bold',
    disabled
      ? 'pointer-events-none border-border text-muted opacity-40'
      : 'border-border text-text hover:border-accent',
  )
}

export function Pagination({
  page,
  totalPages,
  hrefFor,
  label,
}: {
  page: number
  totalPages: number
  hrefFor: (page: number) => string
  label: string
}) {
  if (totalPages <= 1) return null

  return (
    <nav
      aria-label={label}
      className="flex items-center justify-between gap-3"
    >
      <Link
        href={hrefFor(Math.max(1, page - 1))}
        aria-disabled={page === 1}
        className={paginationLinkClass(page === 1)}
      >
        Anterior
      </Link>

      <span className="text-caption text-muted">
        Página {page} de {totalPages}
      </span>

      <Link
        href={hrefFor(Math.min(totalPages, page + 1))}
        aria-disabled={page === totalPages}
        className={paginationLinkClass(page === totalPages)}
      >
        Próxima
      </Link>
    </nav>
  )
}

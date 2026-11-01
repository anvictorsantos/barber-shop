import { Star } from 'lucide-react'
import Image from 'next/image'

export interface BarberSummary {
  id: string
  displayName: string
  title: string
  avatarUrl: string | null
  ratingAvg: number | { toString(): string }
  ratingCount: number
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function BarberCard({ barber }: { barber: BarberSummary }) {
  const rating = Number(barber.ratingAvg.toString()).toFixed(1)

  return (
    <article className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-accent bg-surface-input">
        {barber.avatarUrl ? (
          <Image
            src={barber.avatarUrl}
            alt={barber.displayName}
            fill
            sizes="56px"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-caption font-bold text-accent">
            {initials(barber.displayName)}
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="truncate text-lead font-bold text-text">{barber.displayName}</p>
        <p className="truncate text-caption text-muted">{barber.title}</p>
        <p className="flex items-center gap-1 text-caption font-bold text-accent">
          <Star
            className="h-3.5 w-3.5"
            aria-hidden
          />
          {rating}
          <span className="font-normal text-subtle">({barber.ratingCount})</span>
        </p>
      </div>
    </article>
  )
}

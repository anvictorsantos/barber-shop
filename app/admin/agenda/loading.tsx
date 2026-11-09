import { Skeleton } from '@/components/ui/Skeleton'

export default function AgendaLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5"
          >
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
        <Skeleton className="h-5 w-48" />
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="flex items-center gap-4"
          >
            <Skeleton className="h-10 w-14 shrink-0" />
            <Skeleton className="h-14 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

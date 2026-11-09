import { Skeleton } from '@/components/ui/Skeleton'

export default function ClientsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-64" />
      </div>

      <Skeleton className="h-10 w-full max-w-md" />

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 border-b border-border p-4 last:border-b-0"
          >
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}

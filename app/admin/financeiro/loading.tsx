import { Skeleton } from '@/components/ui/Skeleton'

export default function FinanceLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5"
          >
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <Skeleton className="mb-4 h-5 w-44" />
        <Skeleton className="h-[280px] w-full" />
      </div>
    </div>
  )
}

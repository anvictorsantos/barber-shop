import { Skeleton } from '@/components/ui/Skeleton'

export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5"
          >
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-[260px] w-full" />
        </div>
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
          <Skeleton className="h-5 w-40" />
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton
              key={index}
              className="h-14 w-full"
            />
          ))}
        </div>
      </div>
    </div>
  )
}

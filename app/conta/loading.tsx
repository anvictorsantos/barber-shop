import { Skeleton } from '@/components/ui/Skeleton'

export default function AccountLoading() {
  return (
    <div className="flex flex-col gap-6 px-4 pb-24 pt-6 sm:px-6 lg:px-10 lg:py-10">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 rounded-[20px] border border-white/[0.07] bg-surface p-6"
            >
              <div className="flex items-center justify-between gap-4">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 rounded-[20px] border border-white/[0.07] bg-surface p-6">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="flex flex-col gap-3 rounded-[20px] border border-white/[0.07] bg-surface p-6">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

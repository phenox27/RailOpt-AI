import { Skeleton } from '@/components/ui/skeleton'

export function TimelineSkeleton() {
  // Simulates the 24-hour block timeline
  const hours = Array.from({ length: 24 }).map((_, i) => i)
  const lanes = ['Engineering', 'S&T', 'Traction', 'Combined']

  return (
    <div className="space-y-4">
      {/* Day selector skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-7 w-7 rounded" />
        <div className="flex items-center gap-1 overflow-hidden">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-10 rounded-lg shrink-0" />
          ))}
        </div>
        <Skeleton className="h-7 w-7 rounded" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Timeline grid skeleton */}
      <div className="rounded-lg border p-4 space-y-3">
        {/* Time axis */}
        <div className="flex items-center gap-0">
          {hours.filter((_, i) => i % 3 === 0).map((h) => (
            <div key={h} className="flex-1 text-center">
              <Skeleton className="h-3 w-6 mx-auto" />
            </div>
          ))}
        </div>

        {/* Lane skeletons */}
        {lanes.map((lane) => (
          <div key={lane} className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <div className="flex items-center gap-2 h-10">
              <Skeleton className="h-8 rounded-md" style={{ width: `${30 + Math.random() * 40}%` }} />
              <Skeleton className="h-8 rounded-md" style={{ width: `${15 + Math.random() * 25}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DaySelectorSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="h-7 w-7 rounded" />
      <div className="flex items-center gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-10 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-7 w-7 rounded" />
    </div>
  )
}

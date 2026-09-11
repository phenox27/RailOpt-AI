import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { KpiCardSkeleton } from './card-skeleton'
import { TableSkeleton } from './table-skeleton'

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-[1400px] mx-auto">
      {/* Welcome section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-32 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-md" />
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Department chart */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-4 w-32" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 flex-1 rounded-sm" />
                <Skeleton className="h-3 w-8" />
              </div>
            ))}
          </CardContent>
        </Card>
        {/* Corridor chart */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-4 w-36" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-full rounded-sm" />
              </div>
            ))}
          </CardContent>
        </Card>
        {/* System status */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-4 w-24" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-14" />
              </div>
            ))}
            <Skeleton className="h-7 w-full rounded-md" />
          </CardContent>
        </Card>
      </div>

      {/* Activity + Conflicts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-4 w-28" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-4 w-32" />
            <TableSkeleton rows={3} columns={3} showHeader={false} />
          </CardContent>
        </Card>
      </div>

      {/* Plan status */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <Skeleton className="h-4 w-20" />
          <div className="flex items-center gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-2 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

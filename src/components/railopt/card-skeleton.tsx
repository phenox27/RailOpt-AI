import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface CardSkeletonProps {
  showHeader?: boolean
  lines?: number
  className?: string
}

export function CardSkeleton({ showHeader = true, lines = 3, className }: CardSkeletonProps) {
  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader className="pb-2 pt-4 px-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-40 mt-1" />
        </CardHeader>
      )}
      <CardContent className="px-4 pb-4 space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-full" style={{ width: i === lines - 1 ? '60%' : '100%' }} />
        ))}
      </CardContent>
    </Card>
  )
}

export function KpiCardSkeleton() {
  return (
    <Card className="p-0 border-l-4 border-l-muted">
      <CardContent className="p-3 space-y-1.5">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-7 w-12" />
        <Skeleton className="h-2 w-20" />
      </CardContent>
    </Card>
  )
}

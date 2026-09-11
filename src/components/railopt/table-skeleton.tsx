import { Skeleton } from '@/components/ui/skeleton'

interface TableSkeletonProps {
  rows?: number
  columns?: number
  showHeader?: boolean
  className?: string
}

export function TableSkeleton({ rows = 5, columns = 5, showHeader = true, className }: TableSkeletonProps) {
  // Vary column widths for realism
  const colWidths = ['w-24', 'w-32', 'w-20', 'w-28', 'w-36', 'w-20', 'w-24', 'w-32']
  
  return (
    <div className={`rounded-md border ${className ?? ''}`}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center gap-4 px-4 py-2.5 bg-muted/30 border-b">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={`h-${i}`} className={`h-3 ${colWidths[i % colWidths.length]}`} />
          ))}
        </div>
      )}
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={`r-${rowIdx}`}
          className="flex items-center gap-4 px-4 py-3 border-b last:border-b-0"
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Skeleton
              key={`c-${rowIdx}-${colIdx}`}
              className={`h-3 ${colWidths[colIdx % colWidths.length]}`}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

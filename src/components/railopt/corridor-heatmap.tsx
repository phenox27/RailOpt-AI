'use client'

import { useMemo, useState } from 'react'
import { blocks, conflicts, corridors } from '@/data/simulated-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Grid3X3,
  Clock,
  AlertTriangle,
  Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Heatmap cell status
type CellStatus = 'available' | 'partial' | 'blocked' | 'conflict'

interface HeatmapCell {
  corridor: string
  hour: number
  status: CellStatus
  blockNames: string[]
  conflictCount: number
}

const STATUS_COLORS: Record<CellStatus, string> = {
  available: 'bg-emerald-100 hover:bg-emerald-200',
  partial: 'bg-amber-200 hover:bg-amber-300',
  blocked: 'bg-red-300 hover:bg-red-400',
  conflict: 'bg-red-500 hover:bg-red-600',
}

const STATUS_LABELS: Record<CellStatus, string> = {
  available: 'Available',
  partial: 'Partial Block',
  blocked: 'Fully Blocked',
  conflict: 'Conflict',
}

export function CorridorHeatmap() {
  const [selectedCell, setSelectedCell] = useState<HeatmapCell | null>(null)

  // Build heatmap data
  const heatmapData = useMemo(() => {
    const data: HeatmapCell[][] = []

    for (const corridor of corridors) {
      const row: HeatmapCell[] = []

      for (let hour = 0; hour < 24; hour++) {
        // Find blocks in this corridor and hour
        const corridorBlocks = blocks.filter((b) => {
          if (b.section !== corridor.name) return false
          const startH = new Date(b.startTime).getHours()
          const endH = new Date(b.endTime).getHours()
          return hour >= startH && hour < endH
        })

        // Find conflicts in this corridor
        const corridorConflicts = conflicts.filter((c) => {
          if (c.resolved) return false
          const block = blocks.find((b) => b.id === c.blockId)
          return block && block.section === corridor.name
        })

        const blockNames = corridorBlocks.map((b) => b.name)
        const conflictCount = corridorConflicts.length

        let status: CellStatus = 'available'
        if (conflictCount > 0 && corridorBlocks.length > 0) {
          status = 'conflict'
        } else if (corridorBlocks.length > 1) {
          status = 'blocked'
        } else if (corridorBlocks.length === 1) {
          status = 'partial'
        }

        row.push({
          corridor: corridor.name,
          hour,
          status,
          blockNames,
          conflictCount,
        })
      }

      data.push(row)
    }

    return data
  }, [])

  // Count summary
  const summary = useMemo(() => {
    let available = 0, partial = 0, blocked = 0, conflict = 0
    for (const row of heatmapData) {
      for (const cell of row) {
        if (cell.status === 'available') available++
        else if (cell.status === 'partial') partial++
        else if (cell.status === 'blocked') blocked++
        else conflict++
      }
    }
    return { available, partial, blocked, conflict }
  }, [heatmapData])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Grid3X3 className="h-4 w-4 text-primary" />
          Corridor Availability Heatmap
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Heatmap Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Hour headers */}
            <div className="flex items-center">
              <div className="w-[80px] shrink-0" />
              {Array.from({ length: 24 }, (_, i) => (
                <div key={`h-${i}`} className="flex-1 text-center text-[8px] text-muted-foreground font-mono min-w-[24px]">
                  {i.toString().padStart(2, '0')}
                </div>
              ))}
            </div>

            {/* Corridor rows */}
            {heatmapData.map((row, rowIdx) => (
              <div key={`row-${rowIdx}`} className="flex items-center">
                <div className="w-[80px] shrink-0 text-[10px] font-semibold text-foreground pr-2 truncate">
                  {corridors[rowIdx]?.name}
                </div>
                {row.map((cell) => (
                  <Popover key={`cell-${cell.hour}`}>
                    <PopoverTrigger asChild>
                      <button
                        className={cn(
                          'flex-1 min-w-[24px] h-6 transition-colors cursor-pointer rounded-sm',
                          STATUS_COLORS[cell.status],
                          cell.status === 'conflict' && 'ring-1 ring-red-400',
                        )}
                        onClick={() => setSelectedCell(cell)}
                      />
                    </PopoverTrigger>
                    <PopoverContent side="top" className="w-56 text-xs p-2.5" sideOffset={4}>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{cell.corridor}</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[8px] px-1 py-0 h-3.5',
                              cell.status === 'available' && 'bg-emerald-50 text-emerald-700',
                              cell.status === 'partial' && 'bg-amber-50 text-amber-700',
                              cell.status === 'blocked' && 'bg-red-50 text-red-700',
                              cell.status === 'conflict' && 'bg-red-100 text-red-800',
                            )}
                          >
                            {STATUS_LABELS[cell.status]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-2.5 w-2.5" />
                          <span>{cell.hour.toString().padStart(2, '0')}:00 – {(cell.hour + 1).toString().padStart(2, '0')}:00</span>
                        </div>
                        {cell.blockNames.length > 0 && (
                          <div className="pt-1 border-t border-border">
                            <p className="text-[9px] text-muted-foreground font-medium">Blocks:</p>
                            {cell.blockNames.map((name, i) => (
                              <p key={i} className="text-[9px] truncate">{name}</p>
                            ))}
                          </div>
                        )}
                        {cell.conflictCount > 0 && (
                          <div className="flex items-center gap-1 text-red-600">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            <span className="text-[9px]">{cell.conflictCount} conflict(s)</span>
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px]">
          <span className="text-muted-foreground font-medium">Legend:</span>
          {Object.entries(STATUS_LABELS).map(([status, label]) => (
            <span key={status} className="flex items-center gap-1">
              <span className={cn('h-3 w-3 rounded-sm', STATUS_COLORS[status as CellStatus])} />
              <span className="text-muted-foreground">{label}</span>
            </span>
          ))}
        </div>

        {/* Summary */}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <Info className="h-3 w-3" />
          <span>
            {summary.available} available · {summary.partial} partial · {summary.blocked} blocked · {summary.conflict} conflict cells
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

'use client'

import { useMemo, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { trains, type SimTrain } from '@/data/simulated-data'
import { TrainFront, Zap, Users, Package } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type TrainTypeFilter = 'all' | 'express' | 'passenger' | 'goods'

const TYPE_CONFIG: Record<string, { label: string; badge: string; icon: typeof Zap }> = {
  express: {
    label: 'Express',
    badge: 'bg-[#e8eaf6] text-[#0d47a1] border-[#9fa8da]',
    icon: Zap,
  },
  passenger: {
    label: 'Passenger',
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
    icon: Users,
  },
  goods: {
    label: 'Freight',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Package,
  },
}

interface TrainTimetableProps {
  sectionFilter?: string
  typeFilter?: TrainTypeFilter
  onTypeFilterChange?: (filter: TrainTypeFilter) => void
}

const FILTER_OPTIONS: { value: TrainTypeFilter; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'express', label: 'Express' },
  { value: 'passenger', label: 'Passenger' },
  { value: 'goods', label: 'Freight' },
]

export function TrainTimetable({ sectionFilter, typeFilter: externalTypeFilter, onTypeFilterChange }: TrainTimetableProps) {
  const [internalTypeFilter, setInternalTypeFilter] = useState<TrainTypeFilter>('all')
  const typeFilter = externalTypeFilter ?? internalTypeFilter
  const setTypeFilter = onTypeFilterChange ?? setInternalTypeFilter

  const filteredTrains = useMemo(() => {
    return trains.filter((train) => {
      if (typeFilter !== 'all' && train.type !== typeFilter) return false
      return true
    })
  }, [typeFilter])

  return (
    <div className="flex flex-col h-full">
      {/* Filter pills */}
      <div className="flex items-center gap-1.5 pb-3 flex-wrap">
        {FILTER_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={typeFilter === opt.value ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'h-7 text-xs px-3 rounded-full transition-all',
              typeFilter === opt.value && 'shadow-sm',
            )}
            onClick={() => setTypeFilter(opt.value)}
          >
            {opt.value !== 'all' && (
              <span className="mr-1">
                {(() => { const Icon = TYPE_CONFIG[opt.value]?.icon; return Icon ? <Icon className="w-3 h-3" /> : null })()}
              </span>
            )}
            {opt.label}
          </Button>
        ))}
        <span className="text-xs text-muted-foreground ml-auto tabular-nums">
          {filteredTrains.length} train{filteredTrains.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-auto rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-[11px] font-semibold h-8">Number</TableHead>
              <TableHead className="text-[11px] font-semibold h-8">Name</TableHead>
              <TableHead className="text-[11px] font-semibold h-8">Type</TableHead>
              <TableHead className="text-[11px] font-semibold h-8">From</TableHead>
              <TableHead className="text-[11px] font-semibold h-8">To</TableHead>
              <TableHead className="text-[11px] font-semibold h-8">Depart</TableHead>
              <TableHead className="text-[11px] font-semibold h-8">Arrive</TableHead>
              <TableHead className="text-[11px] font-semibold h-8">Days</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTrains.map((train, idx) => {
              const typeConf = TYPE_CONFIG[train.type]
              const TypeIcon = typeConf?.icon ?? TrainFront
              return (
                <motion.tr
                  key={train.id}
                  className="hover:bg-muted/30 border-b border-border"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15, delay: idx * 0.03 }}
                  style={{ display: 'table-row' }}
                >
                  <TableCell className="text-xs font-mono font-medium py-2">{train.number}</TableCell>
                  <TableCell className="text-xs font-medium py-2">{train.name}</TableCell>
                  <TableCell className="py-2">
                    <Badge
                      variant="outline"
                      className={cn('text-[10px] px-1.5 py-0 h-5 gap-1 capitalize', typeConf?.badge ?? 'bg-muted/50 text-muted-foreground border-border')}
                    >
                      <TypeIcon className="w-3 h-3" />
                      {typeConf?.label ?? train.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs py-2">{train.fromStation}</TableCell>
                  <TableCell className="text-xs py-2">{train.toStation}</TableCell>
                  <TableCell className="text-xs font-mono tabular-nums py-2">{train.departureTime}</TableCell>
                  <TableCell className="text-xs font-mono tabular-nums py-2">{train.arrivalTime}</TableCell>
                  <TableCell className="text-xs py-2">
                    <span className="text-[10px] text-muted-foreground">
                      {train.daysOfRun.length === 7 ? 'Daily' : train.daysOfRun.join(', ')}
                    </span>
                  </TableCell>
                </motion.tr>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

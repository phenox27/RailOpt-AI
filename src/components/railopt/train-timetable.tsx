'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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
import { TrainFront, Zap, Users, Package, Crosshair, X } from 'lucide-react'
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
  /** Train number to highlight (deep link from the departure board) */
  focusTrainNumber?: string | null
  /** Clear the focus highlight */
  onClearFocus?: () => void
}

const FILTER_OPTIONS: { value: TrainTypeFilter; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'express', label: 'Express' },
  { value: 'passenger', label: 'Passenger' },
  { value: 'goods', label: 'Freight' },
]

export function TrainTimetable({ sectionFilter, typeFilter: externalTypeFilter, onTypeFilterChange, focusTrainNumber, onClearFocus }: TrainTimetableProps) {
  const [internalTypeFilter, setInternalTypeFilter] = useState<TrainTypeFilter>('all')
  const typeFilter = externalTypeFilter ?? internalTypeFilter
  const setTypeFilter = onTypeFilterChange ?? setInternalTypeFilter
  const tableWrapRef = useRef<HTMLDivElement>(null)

  const filteredTrains = useMemo(() => {
    return trains.filter((train) => {
      if (typeFilter !== 'all' && train.type !== typeFilter) return false
      return true
    })
  }, [typeFilter])

  // Focus mode: guarantee the focused train is visible, then scroll it into view
  useEffect(() => {
    if (!focusTrainNumber) return
    const train = trains.find((t) => t.number === focusTrainNumber)
    if (!train) return
    // Reset the type filter if it would hide the focused train
    if (typeFilter !== 'all' && train.type !== typeFilter) {
      setTypeFilter('all')
      return
    }
    const t = setTimeout(() => {
      const row = tableWrapRef.current?.querySelector<HTMLElement>(`[data-train-number="${focusTrainNumber}"]`)
      row?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }, 120)
    return () => clearTimeout(t)
  }, [focusTrainNumber, typeFilter, setTypeFilter])

  const focused = focusTrainNumber
    ? trains.find((t) => t.number === focusTrainNumber) ?? null
    : null

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

      {/* Focus banner */}
      {focused && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-2 rounded-md border border-[#FF9933]/50 bg-[#FF9933]/10 px-2.5 py-1.5"
          role="status"
          aria-label={`Focused on train ${focused.number} ${focused.name}`}
        >
          <Crosshair className="h-3.5 w-3.5 text-[#c2570b] dark:text-[#fdba74] shrink-0" aria-hidden="true" />
          <p className="text-[11px] text-[#9a3412] dark:text-[#fdba74] truncate">
            Focused: <span className="font-mono font-semibold">{focused.number}</span> {focused.name}
            <span className="text-muted-foreground"> · {focused.departureTime} → {focused.arrivalTime}</span>
          </p>
          {onClearFocus && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-5 w-5 p-0 text-muted-foreground hover:text-foreground shrink-0"
              onClick={onClearFocus}
              aria-label="Clear train focus"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </motion.div>
      )}

      {/* Table */}
      <div ref={tableWrapRef} className="flex-1 min-h-0 overflow-auto rounded-md border border-border">
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
              const isFocused = train.number === focusTrainNumber
              return (
                <motion.tr
                  key={train.id}
                  data-train-number={train.number}
                  className={cn(
                    'border-b border-border transition-colors',
                    isFocused
                      ? 'bg-gradient-to-r from-[#FF9933]/15 via-[#FF9933]/8 to-transparent ring-2 ring-inset ring-[#FF9933]/70'
                      : 'hover:bg-muted/30',
                  )}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15, delay: isFocused ? 0 : idx * 0.03 }}
                  style={{ display: 'table-row' }}
                >
                  <TableCell className="text-xs font-mono font-medium py-2">
                    <span className="inline-flex items-center gap-1">
                      {train.number}
                      {isFocused && <span className="h-1.5 w-1.5 rounded-full bg-[#FF9933] animate-pulse" aria-hidden="true" />}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-medium py-2">
                    <span className="inline-flex items-center gap-1.5">
                      {train.name}
                      {isFocused && (
                        <Badge className="text-[8px] px-1 py-0 h-3.5 bg-[#FF9933] text-white border-[#ea580c] uppercase tracking-wide">
                          Focused
                        </Badge>
                      )}
                    </span>
                  </TableCell>
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

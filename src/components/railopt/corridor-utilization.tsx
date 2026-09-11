'use client'

import { useMemo } from 'react'
import type { SimBlock } from '@/data/simulated-data'
import { TRAIN_WINDOWS, computeTrainOverlaps } from '@/lib/train-conflicts'
import { cn } from '@/lib/utils'
import { Activity, AlertTriangle, Clock, Gauge, TrainFront } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'

/** Live drag preview info pushed up from the timeline / gantt while dragging. */
export interface DragPreviewInfo {
  blockId: string
  /** Proposed (snapped) start in decimal hours */
  startH: number
  /** Block duration in decimal hours */
  durationH: number
  /** Number of same-day blocks the proposed slot overlaps */
  conflictCount: number
  /** Numbers of trains whose path crosses the proposed slot */
  trainNumbers: string[]
}

interface CorridorUtilizationProps {
  /** All blocks scheduled on the selected day (plan-filtered) */
  dayBlocks: SimBlock[]
  /** Live drag preview (null when not dragging) */
  preview: DragPreviewInfo | null
  /** Currently selected block — shows a train-path cross-check for its window */
  selectedBlock?: SimBlock | null
  className?: string
}

const TOTAL_HOURS = 24

function blockToHours(b: SimBlock): { startH: number; endH: number } {
  const d = new Date(b.startTime)
  const e = new Date(b.endTime)
  return { startH: d.getHours() + d.getMinutes() / 60, endH: e.getHours() + e.getMinutes() / 60 }
}

function formatH(h: number): string {
  const hr = Math.floor(h)
  const min = Math.round((h - hr) * 60)
  return `${hr.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
}

interface HourBucket {
  hour: number
  /** Sum of block minutes covering this hour (can exceed 60 when blocks overlap) */
  minutes: number
  /** True when summed coverage exceeds the hour (competing blocks) */
  overbooked: boolean
  /** Dominant department in this hour (for tinting) */
  dept: string | null
}

function computeBuckets(dayBlocks: SimBlock[], preview: DragPreviewInfo | null): HourBucket[] {
  const buckets: HourBucket[] = Array.from({ length: TOTAL_HOURS }, (_, hour) => ({
    hour, minutes: 0, overbooked: false, dept: null,
  }))

  const add = (startH: number, endH: number, dept: string) => {
    const from = Math.max(0, startH)
    const to = Math.min(TOTAL_HOURS, endH)
    for (let h = Math.floor(from); h < Math.ceil(to) && h < TOTAL_HOURS; h++) {
      const overlap = Math.min(to, h + 1) - Math.max(from, h)
      if (overlap > 0) {
        buckets[h].minutes += overlap * 60
        if (!buckets[h].dept) buckets[h].dept = dept
      }
    }
  }

  for (const b of dayBlocks) {
    if (preview && b.id === preview.blockId) continue // preview replaces the original slot
    const { startH, endH } = blockToHours(b)
    add(startH, endH, b.department)
  }

  // The dragged block's proposed slot overlays live
  if (preview) {
    add(preview.startH, preview.startH + preview.durationH, 'preview')
  }

  for (const bucket of buckets) {
    bucket.overbooked = bucket.minutes > 60 + 0.5
    bucket.minutes = Math.min(bucket.minutes, 120) // render cap: 2 competing blocks
  }
  return buckets
}

function findLongestFreeWindow(buckets: HourBucket[]): { startH: number; endH: number } | null {
  let best: { startH: number; endH: number } | null = null
  let cur: { startH: number; endH: number } | null = null
  for (const b of buckets) {
    const free = b.minutes <= 5 // treat ≤5 min as effectively free
    if (free) {
      cur = cur ? { ...cur, endH: b.hour + 1 } : { startH: b.hour, endH: b.hour + 1 }
      if (!best || cur.endH - cur.startH > best.endH - best.startH) best = cur
    } else {
      cur = null
    }
  }
  return best
}

function utilizationColor(minutes: number, overbooked: boolean): string {
  if (minutes <= 0) return 'bg-border/50'
  if (overbooked) return 'bg-red-500'
  const pct = (minutes / 60) * 100
  if (pct <= 40) return 'bg-emerald-500/80'
  if (pct <= 70) return 'bg-amber-500/90'
  return 'bg-orange-600'
}

/**
 * Corridor Utilization — 24h hour-by-hour load chart for the selected day.
 * Live-updates during drag rescheduling: the dragged block's original slot is
 * removed and its proposed slot is drawn in, showing freed/reused capacity.
 */
export function CorridorUtilization({ dayBlocks, preview, selectedBlock, className }: CorridorUtilizationProps) {
  const buckets = useMemo(() => computeBuckets(dayBlocks, preview), [dayBlocks, preview])
  const freeWindow = useMemo(() => findLongestFreeWindow(buckets), [buckets])

  // Train-path cross-check for the selected block's window (hidden while dragging)
  const selectedCrossing = useMemo(() => {
    if (!selectedBlock || preview) return null
    const { startH, endH } = blockToHours(selectedBlock)
    return {
      durationH: Math.max(endH - startH, 0.25),
      trains: computeTrainOverlaps(startH, Math.max(endH - startH, 0.25)),
    }
  }, [selectedBlock, preview])

  const bookedMinutes = buckets.reduce((s, b) => s + Math.min(b.minutes, 60), 0)
  const totalHours = (bookedMinutes / 60).toFixed(1)
  const peak = Math.max(...buckets.map((b) => Math.min(b.minutes, 120) / 60))
  const peakPct = Math.round(peak * 100)
  const overbookedHours = buckets.filter((b) => b.overbooked).length

  const previewConflicted = !!preview && (preview.conflictCount > 0 || preview.trainNumbers.length > 0)
  const previewLeftPct = preview ? (preview.startH / TOTAL_HOURS) * 100 : 0
  const previewWidthPct = preview ? (preview.durationH / TOTAL_HOURS) * 100 : 0

  // Train path strips (corridor timetable)
  const trainSpans = useMemo(() => TRAIN_WINDOWS.map((w) => ({
    id: w.train.id,
    number: w.train.number,
    windowLabel: `${w.train.departureTime} → ${w.train.arrivalTime}${w.overnight ? ' (+1d)' : ''} · ${w.train.name}`,
    leftPct: (w.startH / TOTAL_HOURS) * 100,
    widthPct: (Math.min(w.endH, TOTAL_HOURS) - w.startH) / TOTAL_HOURS * 100,
    hitsPreview: !!preview && w.startH < preview.startH + preview.durationH && w.endH > preview.startH,
  })), [preview])

  const nowHour = new Date().getHours() + new Date().getMinutes() / 60

  return (
    <div className={cn('px-4 py-3 border-b border-border bg-card', className)} data-testid="corridor-utilization">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 border-l-2 border-[#138808]/50 pl-2">
          <Gauge className="h-4 w-4 text-[#138808] dark:text-emerald-400" />
          <h3 className="text-xs font-semibold tracking-wide uppercase text-foreground">Corridor Utilization</h3>
        </div>
        {preview ? (
          <Badge className={cn(
            'text-[9px] px-1.5 py-0 h-4 gap-1 animate-pulse font-mono',
            previewConflicted ? 'bg-red-600 text-white border-red-700' : 'bg-[#c2410c] text-white border-[#9a3412]',
          )}>
            <Activity className="h-2.5 w-2.5" />
            Previewing {formatH(preview.startH)}–{formatH(preview.startH + preview.durationH)}
          </Badge>
        ) : (
          <span className="text-[9px] text-muted-foreground font-mono">24h · 1h buckets</span>
        )}
      </div>

      {/* Chart */}
      <div className="relative" role="img" aria-label={`Corridor utilization for the day: peak ${peakPct} percent, ${totalHours} block hours booked`}>
        <div className="flex items-end gap-[2px] h-16 px-0.5">
          {buckets.map((b) => {
            const heightPct = b.minutes <= 0 ? 3 : Math.max(6, (b.minutes / 120) * 100)
            const inPreview = preview && b.hour + 1 > preview.startH && b.hour < preview.startH + preview.durationH
            return (
              <div key={b.hour} className="flex-1 h-full flex flex-col justify-end relative group/u">
                <div
                  className={cn(
                    'w-full rounded-t-sm transition-all duration-200',
                    utilizationColor(b.minutes, b.overbooked),
                    inPreview && previewConflicted && 'ring-1 ring-red-500/70',
                    inPreview && !previewConflicted && 'ring-1 ring-[#FF9933]/80',
                  )}
                  style={{ height: `${heightPct}%` }}
                />
                {b.overbooked && (
                  <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-red-500" aria-hidden="true" />
                )}
                {/* Hover tooltip */}
                <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/u:block whitespace-nowrap rounded bg-foreground text-background text-[9px] font-mono px-1.5 py-0.5 shadow z-20">
                  {b.hour.toString().padStart(2, '0')}:00 · {Math.round(Math.min(b.minutes, 120))}m{b.overbooked ? ' · competing' : ''}
                </span>
              </div>
            )
          })}

          {/* Live preview bracket */}
          {preview && (
            <motion.div
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn(
                'absolute -top-1 -bottom-0.5 rounded border-y-2 pointer-events-none',
                previewConflicted ? 'border-red-500 bg-red-500/10' : 'border-[#FF9933] bg-[#FF9933]/10',
              )}
              style={{ left: `${previewLeftPct}%`, width: `${previewWidthPct}%` }}
              aria-hidden="true"
            />
          )}
        </div>

        {/* Hour labels every 6h */}
        <div className="flex justify-between mt-1 px-0.5">
          {[0, 6, 12, 18, 24].map((h) => (
            <span key={h} className="text-[8px] font-mono text-muted-foreground/70">
              {h.toString().padStart(2, '0')}:00
            </span>
          ))}
        </div>

        {/* Train path strips */}
        <div className="relative h-2 mt-1.5 rounded-sm bg-muted/60 overflow-hidden" aria-hidden="true">
          {trainSpans.map((t) => (
            <span
              key={t.id}
              title={`${t.number} · ${t.windowLabel || ''}`}
              className={cn(
                'absolute top-0 bottom-0',
                t.hitsPreview ? 'bg-red-500/90' : 'bg-[#1a237e]/30 dark:bg-[#7986cb]/40',
              )}
              style={{ left: `${t.leftPct}%`, width: `${t.widthPct}%` }}
            />
          ))}
          <span className="absolute inset-0 flex items-center justify-center text-[7px] uppercase tracking-wider text-muted-foreground/80 font-semibold">
            Train paths
          </span>
        </div>

        {/* Now marker */}
        <div
          className="absolute top-10 bottom-8 w-px bg-red-500/60 pointer-events-none"
          style={{ left: `${(nowHour / TOTAL_HOURS) * 100}%` }}
          aria-hidden="true"
        />
      </div>

      {/* Footer stats */}
      <div className="grid grid-cols-3 gap-2 mt-2.5">
        <div className="rounded-md bg-muted/50 border border-border/50 px-2 py-1.5">
          <p className="text-[8px] uppercase tracking-wide text-muted-foreground font-semibold">Peak load</p>
          <p className={cn('text-xs font-bold font-mono', peakPct > 100 ? 'text-red-600' : peakPct > 70 ? 'text-amber-600' : 'text-emerald-600')}>
            {preview && previewConflicted ? '⚠ ' : ''}{peakPct}%
          </p>
        </div>
        <div className="rounded-md bg-muted/50 border border-border/50 px-2 py-1.5">
          <p className="text-[8px] uppercase tracking-wide text-muted-foreground font-semibold">Block hours</p>
          <p className="text-xs font-bold font-mono text-foreground">{totalHours}h</p>
        </div>
        <div className="rounded-md bg-muted/50 border border-border/50 px-2 py-1.5">
          <p className="text-[8px] uppercase tracking-wide text-muted-foreground font-semibold flex items-center gap-0.5">
            <Clock className="h-2 w-2" />Free window
          </p>
          <p className="text-[10px] font-bold font-mono text-foreground truncate" title={freeWindow ? `${formatH(freeWindow.startH)}–${formatH(freeWindow.endH)}` : 'None ≥ 1h'}>
            {freeWindow ? `${formatH(freeWindow.startH)}–${formatH(freeWindow.endH)}` : '—'}
          </p>
        </div>
      </div>

      {/* Live advisory when previewing with conflicts */}
      {preview && previewConflicted && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'mt-2 flex items-start gap-1.5 rounded-md border px-2 py-1.5 text-[10px] leading-tight',
            preview.conflictCount > 0
              ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-900 dark:text-red-400'
              : 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-400',
          )}
          role="status"
        >
          {preview.conflictCount > 0 ? <AlertTriangle className="h-3 w-3 mt-px shrink-0" /> : <TrainFront className="h-3 w-3 mt-px shrink-0" />}
          <span>
            {preview.conflictCount > 0 && <span className="font-semibold">Overlaps {preview.conflictCount} block{preview.conflictCount > 1 ? 's' : ''}. </span>}
            {preview.trainNumbers.length > 0 && <span>Train path crossing: {preview.trainNumbers.slice(0, 3).join(', ')}{preview.trainNumbers.length > 3 ? ` +${preview.trainNumbers.length - 3}` : ''}</span>}
          </span>
        </motion.div>
      )}

      {/* Train cross-check for the selected block */}
      {selectedCrossing && !preview && (
        <div
          className={cn(
            'mt-2 flex items-start gap-1.5 rounded-md border px-2 py-1.5 text-[10px] leading-tight',
            selectedCrossing.trains.length > 0
              ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-400'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-400',
          )}
          role="status"
        >
          <TrainFront className="h-3 w-3 mt-px shrink-0" />
          {selectedCrossing.trains.length > 0 ? (
            <span>
              <span className="font-semibold">{selectedCrossing.trains.length} train{selectedCrossing.trains.length > 1 ? 's' : ''} cross{selectedCrossing.trains.length > 1 ? '' : 'es'} this block: </span>
              {selectedCrossing.trains.slice(0, 3).map((t) => `${t.number} ${t.name}`).join(' · ')}
              {selectedCrossing.trains.length > 3 ? ` · +${selectedCrossing.trains.length - 3} more` : ''}
            </span>
          ) : (
            <span><span className="font-semibold">Clear of train paths</span> — no scheduled service crosses this window</span>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 pt-1.5 border-t border-border/40">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2.5 rounded-sm bg-emerald-500/80" />
          <span className="text-[8px] text-muted-foreground">≤40%</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2.5 rounded-sm bg-amber-500/90" />
          <span className="text-[8px] text-muted-foreground">≤70%</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2.5 rounded-sm bg-orange-600" />
          <span className="text-[8px] text-muted-foreground">High</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2.5 rounded-sm bg-red-500" />
          <span className="text-[8px] text-muted-foreground">Competing</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1 w-3 rounded-full bg-[#1a237e]/40 dark:bg-[#7986cb]/50" />
          <span className="text-[8px] text-muted-foreground">Train path</span>
        </span>
        {overbookedHours > 0 && (
          <span className="text-[8px] text-red-500 font-medium ml-auto">{overbookedHours}h competing</span>
        )}
      </div>
    </div>
  )
}

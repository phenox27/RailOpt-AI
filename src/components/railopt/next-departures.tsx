'use client'

import { useEffect, useState } from 'react'
import { TRAIN_WINDOWS, trainsDepartingWithin, type TrainWindow } from '@/lib/train-conflicts'
import { cn } from '@/lib/utils'
import { TrainFront, ArrowRight, Radio, ChevronRight, CalendarClock } from 'lucide-react'
import { format, parseISO, addDays } from 'date-fns'

/**
 * Next Departures — live departure board for the corridor.
 *
 * Two clock modes:
 *  - Real clock (default): counts down to real departures, refreshing every 30 s.
 *  - Plan clock (simDate provided): day-of-week comes from the planning day so
 *    daysOfRun/no-service chips match the timeline being planned; the time of
 *    day still ticks with the wall clock, labelled "PLAN" in the header.
 *
 * Rows are clickable when onTrainClick is provided → deep-links into the
 * Timetable view with that train focused.
 */

const WINDOW_HOURS = 3

const TYPE_BADGE: Record<string, string> = {
  express: 'bg-[#e8eaf6] text-[#0d47a1] border-[#9fa8da] dark:bg-[#1a237e]/30 dark:text-[#7986cb] dark:border-[#3f51b5]/50',
  passenger: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50',
  goods: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50',
}

function fmtH(h: number): string {
  const hr = Math.floor(h) % 24
  const min = Math.round((h - Math.floor(h)) * 60)
  return `${hr.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
}

function countdownLabel(mins: number): string {
  if (mins < 1) return 'departing'
  if (mins < 60) return `in ${Math.max(1, Math.round(mins))}m`
  const h = Math.floor(mins / 60)
  const m = Math.round(mins % 60)
  return m > 0 ? `in ${h}h ${m}m` : `in ${h}h`
}

interface DepartureRow {
  key: string
  number: string
  name: string
  type: string
  from: string
  to: string
  /** Effective departure in absolute hours from today 00:00 (may exceed 24 → tomorrow) */
  depH: number
  depLabel: string
  minsAway: number
  isTomorrow: boolean
  /** Whether the train actually runs on the day it departs (daysOfRun) */
  runs: boolean
  /** Comma-joined days of run, e.g. "Mon/Wed/Fri" */
  days: string
}

function toRow(w: TrainWindow, nowH: number, todayName: string, tomorrowName: string): DepartureRow {
  // trainsDepartingWithin may return a window whose departure already passed
  // today (overnight/next-day run) — normalise to the effective departure.
  const eff = w.startH >= nowH ? w.startH : w.startH + 24
  const isTomorrow = eff >= 24
  const day = isTomorrow ? tomorrowName : todayName
  return {
    key: `${w.train.id}${isTomorrow ? '+1' : ''}`,
    number: w.train.number,
    name: w.train.name,
    type: w.train.type,
    from: w.train.fromStation,
    to: w.train.toStation,
    depH: eff,
    depLabel: fmtH(eff),
    minsAway: (eff - nowH) * 60,
    isTomorrow,
    runs: w.train.daysOfRun.includes(day),
    days: w.train.daysOfRun.join('/'),
  }
}

interface NextDeparturesProps {
  className?: string
  variant?: 'compact' | 'board'
  /** Planning day (yyyy-MM-dd) — switches the board to the plan clock so daysOfRun match the planned timeline */
  simDate?: string
  /** Click a departure row → open the Timetable view focused on that train */
  onTrainClick?: (trainNumber: string, trainName: string) => void
}

export function NextDepartures({ className, variant = 'compact', simDate, onTrainClick }: NextDeparturesProps) {
  const board = variant === 'board'
  const [now, setNow] = useState(() => new Date())

  // Refresh every 30 s so the countdowns stay honest
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(t)
  }, [])

  const nowH = now.getHours() + now.getMinutes() / 60
  // Plan clock: weekday comes from the simulated planning day (time of day stays live)
  const clockDate = simDate ? parseISO(simDate) : now
  const todayName = format(clockDate, 'EEE')
  const tomorrowName = format(addDays(clockDate, 1), 'EEE')

  // Recomputed per render (7 trains max) — lets React Compiler own the memoization
  const within = trainsDepartingWithin(nowH, WINDOW_HOURS).map((w) => toRow(w, nowH, todayName, tomorrowName))
  const rows: DepartureRow[] = within.length > 0
    ? [...within].sort((a, b) => a.depH - b.depH)
    : (() => {
        // Quiet window: surface the next scheduled service so the board is never empty
        const upcoming = TRAIN_WINDOWS
          .map((w) => toRow(w, nowH, todayName, tomorrowName))
          .filter((r) => r.depH > nowH + WINDOW_HOURS && r.depH <= nowH + 24)
          .sort((a, b) => a.depH - b.depH)
        const next = upcoming.find((r) => r.runs) ?? upcoming[0]
        return next ? [next] : []
      })()

  const quiet = rows.length === 1 && rows[0].minsAway > WINDOW_HOURS * 60 + 1

  return (
    <div
      data-testid="next-departures"
      data-variant={variant}
      data-clock={simDate ? 'plan' : 'real'}
      className={cn('rounded-md border bg-card overflow-hidden', board ? 'border-[#b8860b]/50 dark:border-[#fbbf24]/30 shadow-sm' : 'border-border', className)}
      role="region"
      aria-label={`Next train departures on the corridor${simDate ? ` (plan clock, ${format(clockDate, 'EEE d MMM')})` : ''}`}
    >
      {/* Header — station-board amber strip in 'board' variant */}
      <div className={cn(
        'flex items-center justify-between px-3 py-2 border-b',
        board
          ? 'bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 border-amber-600/40 dark:from-amber-500 dark:via-amber-400 dark:to-amber-500'
          : 'border-border/60 bg-muted/40',
      )}>
        <div className={cn('flex items-center gap-1.5 pl-2', board ? 'border-l-2 border-black/60' : 'border-l-2 border-[#1a237e]/50')}>
          <TrainFront className={cn('h-3.5 w-3.5', board ? 'text-black' : 'text-[#1a237e] dark:text-[#7986cb]')} />
          <h3 className={cn(
            'text-xs font-bold tracking-widest uppercase',
            board ? 'text-black' : 'text-foreground',
          )}>
            {board ? 'Departure Board · निर्गमन' : 'Next Departures'}
          </h3>
        </div>
        <span className={cn(
          'flex items-center gap-1.5 font-mono',
          board ? 'text-[10px] font-bold text-black/80 bg-black/10 rounded px-1.5 py-0.5' : 'text-[9px] text-muted-foreground',
        )}>
          <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
            <span className={cn('absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping', board ? 'bg-black' : simDate ? 'bg-[#FF9933]' : 'bg-emerald-500')} />
            <span className={cn('relative inline-flex h-1.5 w-1.5 rounded-full', board ? 'bg-black' : simDate ? 'bg-[#FF9933]' : 'bg-emerald-500')} />
          </span>
          <Radio className="h-2.5 w-2.5" aria-hidden="true" />
          {format(now, 'HH:mm')} · {quiet ? 'next service' : `≤ ${WINDOW_HOURS}h`}
        </span>
      </div>

      {/* Plan clock strip — explains the simulated day when simDate is active */}
      {simDate && (
        <div
          className="flex items-center gap-1.5 px-3 py-1 bg-[#FF9933]/10 border-b border-[#FF9933]/25 text-[9px] text-[#9a3412] dark:text-[#fdba74]"
          role="note"
          aria-label={`Departures simulated on the plan clock for ${format(clockDate, 'EEEE d MMMM')}`}
        >
          <CalendarClock className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
          <span className="font-semibold uppercase tracking-wide">Plan clock</span>
          <span className="font-mono">{format(clockDate, 'EEE d MMM').toUpperCase()}</span>
          <span className="ml-auto text-muted-foreground normal-case">days-of-run match the planned day</span>
        </div>
      )}

      {/* Departure rows */}
      {board && (
        <div
          className="grid grid-cols-[64px_1fr_auto] gap-x-3 px-3 py-1 bg-muted/30 border-b border-border/40 text-[8px] font-bold uppercase tracking-widest text-muted-foreground"
          aria-hidden="true"
        >
          <span>Time</span>
          <span>Train · Route</span>
          <span>Status</span>
        </div>
      )}
      <ul className={cn('divide-y divide-border/40', board && 'divide-amber-500/15')}>
        {rows.map((r, idx) => {
          const urgent = r.runs && r.minsAway <= 15
          const soon = r.runs && !urgent && r.minsAway <= 45
          const clickable = !!onTrainClick
          const RowInner = (
            <>
              {/* Time */}
              <span className={cn(
                'font-bold font-mono tabular-nums shrink-0',
                board ? 'text-sm w-14' : 'text-[11px] w-9',
                urgent ? 'text-red-600 dark:text-red-400' : 'text-foreground',
              )}>
                {r.depLabel}
              </span>

              {/* Identity */}
              <div className="min-w-0 flex-1 text-left">
                <div className="flex items-center gap-1.5">
                  <span className={cn('font-semibold font-mono text-foreground/90', board ? 'text-xs' : 'text-[11px]')}>{r.number}</span>
                  <span className={cn('font-medium truncate text-foreground/80', board ? 'text-xs' : 'text-[10px]')}>{r.name}</span>
                  {r.isTomorrow && (
                    <span className="text-[8px] font-mono text-muted-foreground border border-border rounded px-0.5">+1d</span>
                  )}
                </div>
                <p className="flex items-center gap-1 text-muted-foreground truncate">
                  <span className="truncate">{r.from}</span>
                  <ArrowRight className="h-2 w-2 shrink-0" aria-hidden="true" />
                  <span className="truncate">{r.to}</span>
                  <span className={cn('ml-1 border rounded px-1 capitalize', TYPE_BADGE[r.type] ?? '')}>{r.type}</span>
                </p>
              </div>

              {/* Countdown / service status */}
              {r.runs ? (
                <span
                  className={cn(
                    'shrink-0 font-bold font-mono rounded-full border tabular-nums',
                    board ? 'text-[10px] px-2 py-0.5' : 'text-[9px] px-1.5 py-0.5',
                    urgent && 'bg-red-50 text-red-700 border-red-200 animate-pulse dark:bg-red-950/40 dark:text-red-400 dark:border-red-900',
                    soon && 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900',
                    !urgent && !soon && 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900',
                  )}
                >
                  {countdownLabel(r.minsAway)}
                </span>
              ) : (
                <span
                  className="shrink-0 text-[8px] font-medium text-muted-foreground/70 border border-border/50 rounded-full px-1.5 py-0.5"
                  title="Not scheduled to run on this day"
                >
                  no service
                </span>
              )}

              {/* Click affordance */}
              {clickable && (
                <ChevronRight
                  className="h-3 w-3 shrink-0 text-muted-foreground/40 transition-all group-hover/dep:text-[#283593] dark:group-hover/dep:text-[#7986cb] group-hover/dep:translate-x-0.5"
                  aria-hidden="true"
                />
              )}
            </>
          )

          return (
            <li
              key={r.key}
              className={cn(
                'items-center gap-2 px-3',
                board ? 'grid grid-cols-[64px_1fr_auto] gap-x-3 py-2' : 'flex py-1.5',
                idx === 0 && !quiet && !board && 'bg-gradient-to-r from-transparent via-transparent to-muted/30',
                idx === 0 && !quiet && board && 'bg-amber-400/5',
                clickable && 'p-0',
              )}
            >
              {clickable ? (
                <button
                  type="button"
                  onClick={() => onTrainClick?.(r.number, r.name)}
                  className={cn(
                    'group/dep w-full flex items-center gap-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#FF9933] focus-visible:ring-inset',
                    board ? 'px-3 py-2 hover:bg-amber-400/15' : 'px-3 py-1.5 hover:bg-muted/50',
                  )}
                  aria-label={`Open train ${r.number} ${r.name} in the timetable view`}
                  title={`${r.number} ${r.name} · click to inspect in Timetable`}
                >
                  {RowInner}
                </button>
              ) : (
                <div className="flex items-center gap-2 w-full" title={`${r.number} ${r.name} · ${r.from} → ${r.to}${r.isTomorrow ? ' (tomorrow)' : ''} · runs ${r.days}`}>
                  {RowInner}
                </div>
              )}
            </li>
          )
        })}
        {rows.length === 0 && (
          <li className="px-3 py-2.5 text-[10px] text-muted-foreground text-center">
            No scheduled services in the next 24h
          </li>
        )}
      </ul>
      {clickableHint(onTrainClick)}
    </div>
  )
}

function clickableHint(enabled?: boolean) {
  if (!enabled) return null
  return (
    <div className="px-3 py-1 border-t border-border/40 bg-muted/20 text-[8px] text-muted-foreground flex items-center gap-1">
      <TrainFront className="h-2.5 w-2.5" aria-hidden="true" />
      Click a train to inspect it in the Timetable view
    </div>
  )
}

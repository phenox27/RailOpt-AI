'use client'

import { useEffect, useMemo, useState } from 'react'
import { TRAIN_WINDOWS, trainsDepartingWithin, type TrainWindow } from '@/lib/train-conflicts'
import { cn } from '@/lib/utils'
import { TrainFront, ArrowRight, Radio } from 'lucide-react'
import { format } from 'date-fns'

/**
 * Next Departures — live departure board for the corridor.
 * Uses the real wall-clock time and lists every train departing within the
 * next WINDOW_HOURS hours (overnight/next-day wrap aware, honours daysOfRun),
 * refreshing every 30 seconds.
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

export function NextDepartures({ className, variant = 'compact' }: { className?: string; variant?: 'compact' | 'board' }) {
  const board = variant === 'board'
  const [now, setNow] = useState(() => new Date())

  // Refresh every 30 s so the countdowns stay honest
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(t)
  }, [])

  const nowH = now.getHours() + now.getMinutes() / 60
  const todayName = format(now, 'EEE')
  const tomorrowName = format(new Date(now.getTime() + 86400000), 'EEE')

  const rows = useMemo<DepartureRow[]>(() => {
    const within = trainsDepartingWithin(nowH, WINDOW_HOURS).map((w) => toRow(w, nowH, todayName, tomorrowName))
    if (within.length > 0) return within.sort((a, b) => a.depH - b.depH)
    // Quiet window: surface the next scheduled service so the board is never empty
    const upcoming = TRAIN_WINDOWS
      .map((w) => toRow(w, nowH, todayName, tomorrowName))
      .filter((r) => r.depH > nowH + WINDOW_HOURS && r.depH <= nowH + 24)
      .sort((a, b) => a.depH - b.depH)
    const next = upcoming.find((r) => r.runs) ?? upcoming[0]
    return next ? [next] : []
  }, [nowH, todayName, tomorrowName])

  const quiet = rows.length === 1 && rows[0].minsAway > WINDOW_HOURS * 60 + 1

  return (
    <div
      data-testid="next-departures"
      data-variant={variant}
      className={cn('rounded-md border bg-card overflow-hidden', board ? 'border-[#b8860b]/50 dark:border-[#fbbf24]/30 shadow-sm' : 'border-border', className)}
      role="region"
      aria-label="Next train departures on the corridor"
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
            <span className={cn('absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping', board ? 'bg-black' : 'bg-emerald-500')} />
            <span className={cn('relative inline-flex h-1.5 w-1.5 rounded-full', board ? 'bg-black' : 'bg-emerald-500')} />
          </span>
          <Radio className="h-2.5 w-2.5" aria-hidden="true" />
          {format(now, 'HH:mm')} · {quiet ? 'next service' : `≤ ${WINDOW_HOURS}h`}
        </span>
      </div>

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
          return (
            <li
              key={r.key}
              className={cn(
                'items-center gap-2 px-3',
                board ? 'grid grid-cols-[64px_1fr_auto] gap-x-3 py-2' : 'flex py-1.5',
                idx === 0 && !quiet && !board && 'bg-gradient-to-r from-transparent via-transparent to-muted/30',
                idx === 0 && !quiet && board && 'bg-amber-400/5',
              )}
              title={`${r.number} ${r.name} · ${r.from} → ${r.to}${r.isTomorrow ? ' (tomorrow)' : ''} · runs ${r.days}`}
            >
              {/* Time */}
              <span className={cn(
                'font-bold font-mono tabular-nums shrink-0',
                board ? 'text-sm w-14' : 'text-[11px] w-9',
                urgent ? 'text-red-600 dark:text-red-400' : board ? 'text-foreground' : 'text-foreground',
              )}>
                {r.depLabel}
              </span>

              {/* Identity */}
              <div className="min-w-0 flex-1">
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
            </li>
          )
        })}
        {rows.length === 0 && (
          <li className="px-3 py-2.5 text-[10px] text-muted-foreground text-center">
            No scheduled services in the next 24h
          </li>
        )}
      </ul>
    </div>
  )
}

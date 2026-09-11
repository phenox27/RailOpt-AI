import { trains, type SimTrain } from '@/data/simulated-data'

/**
 * Train-timetable conflict helpers.
 *
 * The demo corridor timetable is the `trains` list from simulated data.
 * Each train occupies a path window [departure, arrival] — overnight trains
 * (arrival <= departure) wrap past 24h, so their windows are represented as
 * [depH, arrH + 24] and additionally matched against the previous-day shifted
 * slot when testing overlaps.
 */

export interface TrainOverlap {
  number: string
  name: string
  type: SimTrain['type']
  /** Human-readable path window, e.g. "20:40 → 06:15 (+1d)" */
  windowLabel: string
}

export interface TrainWindow {
  train: SimTrain
  startH: number
  endH: number
  overnight: boolean
}

/** "HH:MM" → decimal hours (e.g. "03:15" → 3.25) */
function hhmmToHours(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return (h || 0) + (m || 0) / 60
}

function formatH(h: number): string {
  const hr = Math.floor(h) % 24
  const min = Math.round((h - Math.floor(h)) * 60)
  return `${hr.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
}

/** All train path windows on the corridor (precomputed once per import). */
export const TRAIN_WINDOWS: TrainWindow[] = trains.map((train) => {
  const depH = hhmmToHours(train.departureTime)
  let arrH = hhmmToHours(train.arrivalTime)
  let overnight = false
  if (arrH <= depH) {
    arrH += 24
    overnight = true
  }
  return { train, startH: depH, endH: arrH, overnight }
})

/**
 * Trains whose path window overlaps the slot [startH, startH + durationH].
 * Handles overnight trains both directions (window spilling past midnight and
 * windows that started the previous day).
 */
export function computeTrainOverlaps(startH: number, durationH: number): TrainOverlap[] {
  const endH = startH + durationH
  const hits: TrainOverlap[] = []
  for (const w of TRAIN_WINDOWS) {
    const overlapsToday = w.startH < endH && w.endH > startH
    // Portion of an overnight window that began "yesterday" (shifted -24h)
    const overlapsFromPrevDay = w.overnight && (w.startH - 24) < endH && (w.endH - 24) > startH
    if (overlapsToday || overlapsFromPrevDay) {
      hits.push({
        number: w.train.number,
        name: w.train.name,
        type: w.train.type,
        windowLabel: `${formatH(w.startH)} → ${formatH(w.endH)}${w.overnight ? ' (+1d)' : ''}`,
      })
    }
  }
  return hits
}

/** True when the slot [startH, endH] overlaps any train path (cheap boolean variant). */
export function hasTrainOverlap(startH: number, durationH: number): boolean {
  const endH = startH + durationH
  return TRAIN_WINDOWS.some((w) => {
    const overlapsToday = w.startH < endH && w.endH > startH
    const overlapsFromPrevDay = w.overnight && (w.startH - 24) < endH && (w.endH - 24) > startH
    return overlapsToday || overlapsFromPrevDay
  })
}

/** Trains departing within the next `hours` from `fromH` (for status strips). */
export function trainsDepartingWithin(fromH: number, hours: number): TrainWindow[] {
  const toH = fromH + hours
  return TRAIN_WINDOWS.filter((w) => {
    const s = w.startH < fromH && w.overnight ? w.startH + 24 : w.startH
    return s >= fromH && s <= toH
  })
}

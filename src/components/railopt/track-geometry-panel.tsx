'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Gauge,
  Route,
  TrendingDown,
  Crosshair,
  Milestone,
  ShieldAlert,
} from 'lucide-react'
import { format, addDays, isAfter, isBefore, parseISO } from 'date-fns'

// ─── Speed Restriction Data ───

interface SpeedRestriction {
  id: string
  section: string
  fromKm: number
  toKm: number
  normalSpeed: number
  restrictedSpeed: number
  reason: string
  validUntil: string // ISO date
  isPermanent: boolean
}

const today = new Date()
const sevenDaysFromNow = addDays(today, 7)
const threeDaysFromNow = addDays(today, 3)
const fiveDaysFromNow = addDays(today, 5)

const speedRestrictions: SpeedRestriction[] = [
  {
    id: 'sr-1',
    section: 'NDLS-AGC',
    fromKm: 12,
    toKm: 28,
    normalSpeed: 80,
    restrictedSpeed: 60,
    reason: 'Curve restriction — deep curve at km 18-22',
    validUntil: format(addDays(today, 30), 'yyyy-MM-dd'),
    isPermanent: false,
  },
  {
    id: 'sr-2',
    section: 'BPL-NGP',
    fromKm: 145,
    toKm: 178,
    normalSpeed: 100,
    restrictedSpeed: 75,
    reason: 'Track renewal work in progress',
    validUntil: format(fiveDaysFromNow, 'yyyy-MM-dd'),
    isPermanent: false,
  },
  {
    id: 'sr-3',
    section: 'AGC-BPL',
    fromKm: 56,
    toKm: 72,
    normalSpeed: 90,
    restrictedSpeed: 40,
    reason: 'Bridge girder replacement — critical zone',
    validUntil: format(threeDaysFromNow, 'yyyy-MM-dd'),
    isPermanent: false,
  },
  {
    id: 'sr-4',
    section: 'NGP-SC',
    fromKm: 210,
    toKm: 235,
    normalSpeed: 110,
    restrictedSpeed: 85,
    reason: 'Signal upgradation — S&T work',
    validUntil: format(addDays(today, 15), 'yyyy-MM-dd'),
    isPermanent: false,
  },
  {
    id: 'sr-5',
    section: 'NDLS-AGC',
    fromKm: 0,
    toKm: 10,
    normalSpeed: 80,
    restrictedSpeed: 35,
    reason: 'Permanent slow zone — yard limits',
    validUntil: '2099-12-31',
    isPermanent: true,
  },
  {
    id: 'sr-6',
    section: 'BPL-NGP',
    fromKm: 200,
    toKm: 220,
    normalSpeed: 100,
    restrictedSpeed: 70,
    reason: 'Traction OHE maintenance — weekly block',
    validUntil: format(addDays(today, 45), 'yyyy-MM-dd'),
    isPermanent: false,
  },
]

// ─── Track Geometry Data ───

interface TrackGeometry {
  corridor: string
  totalKm: number
  curveCount: number
  gradientSections: number
  levelCrossings: number
}

const trackGeometryData: TrackGeometry[] = [
  { corridor: 'NDLS-AGC', totalKm: 195, curveCount: 23, gradientSections: 8, levelCrossings: 15 },
  { corridor: 'AGC-BPL', totalKm: 385, curveCount: 45, gradientSections: 14, levelCrossings: 28 },
  { corridor: 'BPL-NGP', totalKm: 520, curveCount: 67, gradientSections: 22, levelCrossings: 41 },
  { corridor: 'NGP-SC', totalKm: 430, curveCount: 52, gradientSections: 18, levelCrossings: 33 },
]

// ─── Helper Functions ───

function getSeverity(speedRatio: number): 'red' | 'amber' | 'green' {
  if (speedRatio < 0.6) return 'red'
  if (speedRatio < 0.8) return 'amber'
  return 'green'
}

function getSeverityBadge(severity: 'red' | 'amber' | 'green') {
  switch (severity) {
    case 'red':
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px] px-1.5 h-5 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800">
          Critical
        </Badge>
      )
    case 'amber':
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] px-1.5 h-5 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800">
          Moderate
        </Badge>
      )
    case 'green':
      return (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-1.5 h-5 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800">
          Minor
        </Badge>
      )
  }
}

// ─── Critical Alerts ───

function getCriticalAlerts(): { type: 'expiring' | 'severe'; restriction: SpeedRestriction; message: string }[] {
  const alerts: { type: 'expiring' | 'severe'; restriction: SpeedRestriction; message: string }[] = []

  for (const r of speedRestrictions) {
    const ratio = r.restrictedSpeed / r.normalSpeed
    // Check for expiring within 7 days
    if (!r.isPermanent) {
      const validUntil = parseISO(r.validUntil)
      if (isBefore(validUntil, sevenDaysFromNow)) {
        alerts.push({
          type: 'expiring',
          restriction: r,
          message: `${r.section} km ${r.fromKm}-${r.toKm}: Speed restriction expiring on ${format(validUntil, 'MMM d')}`,
        })
      }
    }
    // Check for permanent restrictions below 50% of normal speed
    if (r.isPermanent && ratio < 0.5) {
      alerts.push({
        type: 'severe',
        restriction: r,
        message: `${r.section} km ${r.fromKm}-${r.toKm}: Permanent restriction at ${Math.round(ratio * 100)}% of normal speed`,
      })
    }
  }

  return alerts
}

// ─── Component ───

export function TrackGeometryPanel() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const criticalAlerts = getCriticalAlerts()

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-4"
    >
      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <Card className="border-red-200/60 dark:border-red-800/40">
          <CardContent className="p-3 sm:p-4 space-y-2">
            <div className="flex items-center gap-2 border-l-2 border-red-500/50 pl-2">
              <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400" />
              <h3 className="text-sm font-semibold text-red-700 dark:text-red-400">Critical Alerts</h3>
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px] px-1.5 h-5 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800">
                {criticalAlerts.length}
              </Badge>
            </div>
            <div className="space-y-1.5">
              {criticalAlerts.map((alert, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15, delay: idx * 0.05 }}
                  className="flex items-start gap-2 text-xs py-1.5 px-2.5 rounded-md bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40"
                >
                  {alert.type === 'expiring' ? (
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                  )}
                  <span className="text-red-700 dark:text-red-300">{alert.message}</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Speed Restrictions Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 shrink-0">
              <Gauge className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">Speed Restrictions</CardTitle>
              <p className="text-[11px] text-muted-foreground">Active temporary &amp; permanent restrictions</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 px-2 sm:px-3 pb-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] h-8">Section</TableHead>
                <TableHead className="text-[10px] h-8">From-Km</TableHead>
                <TableHead className="text-[10px] h-8">To-Km</TableHead>
                <TableHead className="text-[10px] h-8">Normal</TableHead>
                <TableHead className="text-[10px] h-8">Restricted</TableHead>
                <TableHead className="text-[10px] h-8">Severity</TableHead>
                <TableHead className="text-[10px] h-8">Valid Until</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {speedRestrictions.map((r) => {
                const ratio = r.restrictedSpeed / r.normalSpeed
                const severity = getSeverity(ratio)
                const isExpanded = expandedRow === r.id
                return (
                  <>
                    <TableRow
                      key={r.id}
                      className="cursor-pointer"
                      onClick={() => setExpandedRow(isExpanded ? null : r.id)}
                    >
                      <TableCell className="text-xs font-medium py-2">
                        <span className="flex items-center gap-1">
                          {isExpanded ? (
                            <ChevronDown className="h-3 w-3 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          )}
                          {r.section}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs tabular-nums py-2">{r.fromKm}</TableCell>
                      <TableCell className="text-xs tabular-nums py-2">{r.toKm}</TableCell>
                      <TableCell className="text-xs tabular-nums py-2">{r.normalSpeed} km/h</TableCell>
                      <TableCell className="text-xs tabular-nums font-semibold py-2">{r.restrictedSpeed} km/h</TableCell>
                      <TableCell className="py-2">{getSeverityBadge(severity)}</TableCell>
                      <TableCell className="text-xs py-2">
                        {r.isPermanent ? (
                          <Badge variant="outline" className="text-[10px] px-1.5 h-5">Permanent</Badge>
                        ) : (
                          format(parseISO(r.validUntil), 'MMM d, yyyy')
                        )}
                      </TableCell>
                    </TableRow>
                    {/* Expanded detail row */}
                    <AnimatePresence key={`${r.id}-detail`}>
                      {isExpanded && (
                        <motion.tr
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.15 }}
                          className="bg-muted/30"
                        >
                          <td colSpan={7} className="px-4 py-3">
                            <div className="space-y-2 text-xs">
                              <div className="flex items-start gap-2">
                                <span className="text-muted-foreground font-medium min-w-[60px]">Reason:</span>
                                <span>{r.reason}</span>
                              </div>
                              <div className="flex items-center gap-4 flex-wrap">
                                <span className="flex items-center gap-1.5">
                                  <Route className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">Distance:</span>
                                  <span className="font-medium tabular-nums">{r.toKm - r.fromKm} km</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <TrendingDown className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">Speed reduction:</span>
                                  <span className="font-medium tabular-nums">{r.normalSpeed - r.restrictedSpeed} km/h ({Math.round((1 - ratio) * 100)}%)</span>
                                </span>
                                {r.isPermanent ? (
                                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px] px-1.5 h-5 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800">
                                    Permanent Restriction
                                  </Badge>
                                ) : (
                                  <span className="flex items-center gap-1.5">
                                    <span className="text-muted-foreground">Expires:</span>
                                    <span className="font-medium">{format(parseISO(r.validUntil), 'EEEE, MMMM d, yyyy')}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Track Geometry Summary */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#1a237e]/10 shrink-0">
              <Route className="h-3.5 w-3.5 text-[#283593] dark:text-[#3f51b5]" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">Track Geometry Summary</CardTitle>
              <p className="text-[11px] text-muted-foreground">Per-corridor track infrastructure data</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 px-3 pb-3">
          {/* Total summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            <div className="rounded-lg bg-muted/40 border border-border/40 p-2.5 text-center">
              <div className="text-lg font-bold tracking-tight tabular-nums">
                {trackGeometryData.reduce((s, d) => s + d.totalKm, 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Total Track km</div>
            </div>
            <div className="rounded-lg bg-muted/40 border border-border/40 p-2.5 text-center">
              <div className="text-lg font-bold tracking-tight tabular-nums">
                {trackGeometryData.reduce((s, d) => s + d.curveCount, 0)}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Curves</div>
            </div>
            <div className="rounded-lg bg-muted/40 border border-border/40 p-2.5 text-center">
              <div className="text-lg font-bold tracking-tight tabular-nums">
                {trackGeometryData.reduce((s, d) => s + d.gradientSections, 0)}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Gradient Sections</div>
            </div>
            <div className="rounded-lg bg-muted/40 border border-border/40 p-2.5 text-center">
              <div className="text-lg font-bold tracking-tight tabular-nums">
                {trackGeometryData.reduce((s, d) => s + d.levelCrossings, 0)}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Level Crossings</div>
            </div>
          </div>

          {/* Per-corridor breakdown */}
          <div className="space-y-1.5">
            {trackGeometryData.map((geo, idx) => (
              <motion.div
                key={geo.corridor}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15, delay: 0.05 + idx * 0.04 }}
                className="flex items-center gap-3 text-xs py-2 px-3 rounded-lg border border-border/40 bg-background/60"
              >
                <span className="font-medium min-w-[65px]">{geo.corridor}</span>
                <span className="flex items-center gap-1 text-muted-foreground tabular-nums">
                  <Route className="h-3 w-3" />
                  {geo.totalKm} km
                </span>
                <span className="flex items-center gap-1 text-muted-foreground tabular-nums">
                  <Milestone className="h-3 w-3" />
                  {geo.curveCount} curves
                </span>
                <span className="flex items-center gap-1 text-muted-foreground tabular-nums hidden sm:flex">
                  <TrendingDown className="h-3 w-3" />
                  {geo.gradientSections} gradients
                </span>
                <span className="flex items-center gap-1 text-muted-foreground tabular-nums ml-auto">
                  <Crosshair className="h-3 w-3" />
                  {geo.levelCrossings} LCs
                </span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

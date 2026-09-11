'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { type SimConflict } from '@/data/simulated-data'
import { toast } from 'sonner'
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  TrainFront,
  Zap,
  Users,
  Package,
  Clock,
  Route,
  ArrowRight,
  ShieldCheck,
  CalendarClock,
  Wrench,
  ChevronRight,
  Sparkles,
  GitBranch,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

// --- Simulated affected trains data (realistic Indian train names) ---
interface AffectedTrain {
  number: string
  name: string
  type: 'Express' | 'Passenger' | 'Freight'
  delayMinutes: number
  route: string
}

interface AlternativeWindow {
  start: string
  end: string
  confidence: number
  reason: string
}

interface DownstreamEffect {
  section: string
  impact: 'high' | 'medium' | 'low'
  description: string
  affectedTrains: number
}

// Data mapped by conflict id
const CONFLICT_IMPACT_DATA: Record<string, {
  affectedTrains: AffectedTrain[]
  alternativeWindows: AlternativeWindow[]
  downstreamEffects: DownstreamEffect[]
}> = {
  'conf-001': {
    affectedTrains: [
      { number: '12301', name: 'Howrah Rajdhani', type: 'Express', delayMinutes: 45, route: 'HWH → NDLS' },
      { number: '12302', name: 'Rajdhani Express', type: 'Express', delayMinutes: 55, route: 'NDLS → HWH' },
      { number: '12310', name: 'Rajdhani Express (PNBE)', type: 'Express', delayMinutes: 30, route: 'NDLS → PNBE' },
      { number: '12951', name: 'Mumbai Rajdhani', type: 'Express', delayMinutes: 20, route: 'BCT → NDLS' },
      { number: '12314', name: 'Sealdah Rajdhani', type: 'Express', delayMinutes: 35, route: 'SDAH → NDLS' },
    ],
    alternativeWindows: [
      { start: '00:30', end: '04:30', confidence: 0.92, reason: 'Pre-Rajdhani window with no express traffic' },
      { start: '05:15', end: '09:15', confidence: 0.71, reason: 'Post-peak morning window, moderate goods traffic' },
      { start: '12:00', end: '16:00', confidence: 0.58, reason: 'Midday window but passenger density higher' },
    ],
    downstreamEffects: [
      { section: 'GZB-ALJN', impact: 'high', description: 'Rajdhani chain delay cascades to Aligarh section', affectedTrains: 3 },
      { section: 'NDLS-NDLS Yard', impact: 'medium', description: 'Platform occupancy conflicts at New Delhi yard', affectedTrains: 2 },
      { section: 'TDL-AGC', impact: 'low', description: 'Minor ripple effect on Tundla-Agra corridor', affectedTrains: 1 },
    ],
  },
  'conf-002': {
    affectedTrains: [
      { number: '12621', name: 'Tamil Nadu Express', type: 'Express', delayMinutes: 25, route: 'NDLS → MAS' },
      { number: '12622', name: 'Tamil Nadu Express (R)', type: 'Express', delayMinutes: 20, route: 'MAS → NDLS' },
      { number: '22691', name: 'Rajdhani Express (MAS)', type: 'Express', delayMinutes: 15, route: 'MAS → NDLS' },
    ],
    alternativeWindows: [
      { start: '01:00', end: '05:00', confidence: 0.88, reason: 'Full night block, both departments can work simultaneously' },
      { start: '23:30', end: '03:30', confidence: 0.79, reason: 'Late night window, requires one-day shift' },
    ],
    downstreamEffects: [
      { section: 'GZB-MTJ', impact: 'medium', description: 'Departure delays propagate to Mathura section', affectedTrains: 2 },
      { section: 'NDLS-KVZ', impact: 'low', description: 'Minor impact on Kolvad section approach', affectedTrains: 1 },
    ],
  },
  'conf-003': {
    affectedTrains: [
      { number: '12393', name: 'Sapt Kranti Express', type: 'Passenger', delayMinutes: 40, route: 'NDLS → MFP' },
      { number: '12367', name: 'Vikramshila Express', type: 'Express', delayMinutes: 35, route: 'NDLS → BGP' },
      { number: '22405', name: 'BBS Rajdhani', type: 'Express', delayMinutes: 30, route: 'NDLS → BBS' },
      { number: '54321', name: 'Freight Express', type: 'Freight', delayMinutes: 60, route: 'CNB → LKO' },
    ],
    alternativeWindows: [
      { start: '03:30', end: '07:30', confidence: 0.75, reason: 'Post-freight window, reduced passenger impact' },
      { start: '00:00', end: '04:00', confidence: 0.82, reason: 'Full night block with freight diversion available' },
    ],
    downstreamEffects: [
      { section: 'MGS-PNBE', impact: 'high', description: 'Mughal Sarai junction congestion affects Patna-bound trains', affectedTrains: 4 },
      { section: 'ALD-CNB', impact: 'medium', description: 'Reverse direction trains on ALD-CNB may need speed restriction', affectedTrains: 2 },
    ],
  },
  'conf-004': {
    affectedTrains: [
      { number: '12002', name: 'Shatabdi Express', type: 'Express', delayMinutes: 15, route: 'NDLS → BPL' },
      { number: '12001', name: 'Shatabdi Express (R)', type: 'Express', delayMinutes: 20, route: 'BPL → NDLS' },
      { number: '12004', name: 'Shatabdi Express (LK)', type: 'Express', delayMinutes: 10, route: 'LK → NDLS' },
      { number: '12259', name: 'Sealdah Duronto', type: 'Express', delayMinutes: 25, route: 'NDLS → SDAH' },
      { number: '12301', name: 'Howrah Rajdhani', type: 'Express', delayMinutes: 30, route: 'NDLS → HWH' },
      { number: '22436', name: 'Vande Bharat', type: 'Express', delayMinutes: 15, route: 'NDLS → BSB' },
    ],
    alternativeWindows: [
      { start: '01:00', end: '04:30', confidence: 0.95, reason: '30-min buffer maintained from all approaching trains' },
      { start: '05:30', end: '09:00', confidence: 0.68, reason: 'Post-Shatabdi window, buffer maintained for morning services' },
    ],
    downstreamEffects: [
      { section: 'NDLS-GZB', impact: 'high', description: 'Safety buffer violation creates risk for all express trains', affectedTrains: 6 },
      { section: 'GZB-TDL', impact: 'medium', description: 'Downstream speed restrictions may be imposed', affectedTrains: 3 },
      { section: 'NDLS Yard', impact: 'high', description: 'Platform route conflicts at New Delhi station', affectedTrains: 4 },
    ],
  },
  'conf-005': {
    affectedTrains: [
      { number: '56789', name: 'Goods Special', type: 'Freight', delayMinutes: 10, route: 'TDL → MGS' },
    ],
    alternativeWindows: [
      { start: '02:00', end: '06:00', confidence: 0.90, reason: 'Alternative path via loop line available' },
    ],
    downstreamEffects: [
      { section: 'CNB-LKO', impact: 'low', description: 'Minimal ripple on Kanpur-Lucknow section', affectedTrains: 1 },
    ],
  },
}

// Default data for unknown conflicts
const DEFAULT_IMPACT_DATA = {
  affectedTrains: [
    { number: '12256', name: 'Garib Rath', type: 'Passenger' as const, delayMinutes: 20, route: 'NDLS → CNB' },
    { number: '54321', name: 'Freight Express', type: 'Freight' as const, delayMinutes: 35, route: 'CNB → LKO' },
  ],
  alternativeWindows: [
    { start: '01:00', end: '05:00', confidence: 0.85, reason: 'Night block window with minimal traffic' },
  ],
  downstreamEffects: [
    { section: 'Adjacent Section', impact: 'low' as const, description: 'Minor cascading effect', affectedTrains: 1 },
  ],
}

// --- Severity config ---
const SEVERITY_CONFIG: Record<string, { color: string; bgColor: string; borderColor: string; gaugeColor: string }> = {
  critical: {
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-800',
    gaugeColor: 'bg-red-500',
  },
  warning: {
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
    gaugeColor: 'bg-amber-500',
  },
  info: {
    color: 'text-[#283593] dark:text-[#3f51b5]',
    bgColor: 'bg-[#e8eaf6] dark:bg-[#0d1442]/30',
    borderColor: 'border-[#9fa8da] dark:border-[#1a237e]',
    gaugeColor: 'bg-[#1a237e]',
  },
}

const TRAIN_TYPE_CONFIG: Record<string, { icon: typeof Zap; color: string; bgColor: string }> = {
  Express: { icon: Zap, color: 'text-[#283593] dark:text-[#3f51b5]', bgColor: 'bg-[#e8eaf6] dark:bg-[#0d1442]/30' },
  Passenger: { icon: Users, color: 'text-sky-600 dark:text-sky-400', bgColor: 'bg-sky-50 dark:bg-sky-950/30' },
  Freight: { icon: Package, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-950/30' },
}

const IMPACT_COLORS: Record<string, { color: string; bgColor: string; borderColor: string }> = {
  high: { color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-950/30', borderColor: 'border-red-200 dark:border-red-800' },
  medium: { color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-950/30', borderColor: 'border-amber-200 dark:border-amber-800' },
  low: { color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-950/30', borderColor: 'border-emerald-200 dark:border-emerald-800' },
}

// --- Component ---
interface ConflictImpactPanelProps {
  conflict: SimConflict | null
  onClose?: () => void
  onOpenWorkflow?: (conflict: SimConflict) => void
}

export function ConflictImpactPanel({ conflict, onClose, onOpenWorkflow }: ConflictImpactPanelProps) {
  const impactData = useMemo(() => {
    if (!conflict) return null
    return CONFLICT_IMPACT_DATA[conflict.id] ?? DEFAULT_IMPACT_DATA
  }, [conflict])

  const impactScore = useMemo(() => {
    if (!impactData) return 0
    const trainCount = impactData.affectedTrains.length
    const avgDelay = impactData.affectedTrains.reduce((sum, t) => sum + t.delayMinutes, 0) / Math.max(impactData.affectedTrains.length, 1)
    // Score formula: trains × delay_factor, capped at 10
    const delayFactor = avgDelay > 40 ? 2 : avgDelay > 20 ? 1.5 : 1
    return Math.min(Math.round(trainCount * delayFactor), 10)
  }, [impactData])

  if (!conflict || !impactData) return null

  const sevConfig = SEVERITY_CONFIG[conflict.severity] ?? SEVERITY_CONFIG.info

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="px-4 pt-4 pb-2"
      >
        <div className="flex items-start gap-3">
          <div className={cn('flex items-center justify-center w-9 h-9 rounded-lg shrink-0', sevConfig.bgColor)}>
            {conflict.severity === 'critical' ? (
              <AlertOctagon className={cn('w-5 h-5', sevConfig.color)} />
            ) : conflict.severity === 'warning' ? (
              <AlertTriangle className={cn('w-5 h-5', sevConfig.color)} />
            ) : (
              <Info className={cn('w-5 h-5', sevConfig.color)} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-foreground">Conflict Impact Analysis</h2>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{conflict.description}</p>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={onClose}>
              <span className="sr-only">Close</span>
              ×
            </Button>
          )}
        </div>
      </motion.div>

      <div className="px-4 pb-4 space-y-4">
        {/* Impact Score Gauge */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
        >
          <Card className={cn('border', sevConfig.borderColor)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-semibold text-foreground">Impact Score</span>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs px-2.5 font-bold tabular-nums',
                    impactScore >= 8 ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800' :
                    impactScore >= 5 ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800' :
                    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800'
                  )}
                >
                  {impactScore} / 10
                </Badge>
              </div>
              {/* Visual gauge bar */}
              <div className="relative h-3 w-full rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${impactScore * 10}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className={cn(
                    'absolute inset-y-0 left-0 rounded-full',
                    impactScore >= 8 ? 'bg-red-500' : impactScore >= 5 ? 'bg-amber-500' : 'bg-emerald-500'
                  )}
                />
                {/* Tick marks */}
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((tick) => (
                  <div
                    key={tick}
                    className="absolute inset-y-0 w-px bg-background/30"
                    style={{ left: `${tick * 10}%` }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">Low</span>
                <span className="text-[10px] text-muted-foreground">High</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Affected Trains */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrainFront className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-foreground">Affected Trains</span>
            <Badge variant="outline" className="text-[10px] px-1.5 h-4 bg-muted/50 text-muted-foreground border-border">
              {impactData.affectedTrains.length}
            </Badge>
          </div>
          <div className="space-y-2 max-h-56 overflow-auto pr-1">
            <AnimatePresence>
              {impactData.affectedTrains.map((train, idx) => {
                const typeConfig = TRAIN_TYPE_CONFIG[train.type]
                const TypeIcon = typeConfig.icon
                return (
                  <motion.div
                    key={train.number}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.05 }}
                  >
                    <Card className="border border-border/60">
                      <CardContent className="p-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className={cn('flex items-center justify-center w-7 h-7 rounded-md shrink-0', typeConfig.bgColor)}>
                            <TypeIcon className={cn('w-3.5 h-3.5', typeConfig.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-foreground">{train.number}</span>
                              <span className="text-xs text-muted-foreground truncate">{train.name}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0 h-3.5', typeConfig.bgColor, typeConfig.color)}>
                                {train.type}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                <Route className="w-2.5 h-2.5" />
                                {train.route}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Clock className="w-3 h-3 text-red-500" />
                            <span className="text-xs font-semibold text-red-600 dark:text-red-400 tabular-nums">+{train.delayMinutes}m</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Alternative Block Windows */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.15 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-[#283593] dark:text-[#3f51b5]" />
            <span className="text-xs font-semibold text-foreground">Alternative Windows</span>
            <Badge variant="outline" className="text-[10px] px-1.5 h-4 bg-[#e8eaf6] text-[#0d47a1] border-[#9fa8da] dark:bg-[#0d1442]/30 dark:text-[#3f51b5] dark:border-[#1a237e]">
              AI
            </Badge>
          </div>
          <div className="space-y-2">
            {impactData.alternativeWindows.map((window, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
              >
                <Card className="border border-[#9fa8da]/60 dark:border-[#1a237e]/40">
                  <CardContent className="p-2.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <CalendarClock className="w-3.5 h-3.5 text-[#283593] dark:text-[#3f51b5]" />
                        <span className="text-xs font-semibold text-foreground tabular-nums">{window.start} — {window.end}</span>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] px-1.5 h-4 tabular-nums',
                          window.confidence >= 0.85 ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800' :
                          window.confidence >= 0.7 ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800' :
                          'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800'
                        )}
                      >
                        {Math.round(window.confidence * 100)}%
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{window.reason}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Resolution Options */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Wrench className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-foreground">Resolution Options</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-10 min-h-[44px] justify-start gap-2 text-xs border-[#9fa8da] text-[#0d47a1] hover:bg-[#e8eaf6] hover:text-[#1a237e] dark:border-[#1a237e] dark:text-[#3f51b5] dark:hover:bg-[#0d1442]/30"
              onClick={() => {
                if (conflict && onOpenWorkflow) {
                  onOpenWorkflow(conflict)
                } else {
                  toast.info('Rescheduling requires the guided resolution workflow')
                }
              }}
            >
              <CalendarClock className="w-4 h-4" />
              Reschedule Block
              <ChevronRight className="w-3 h-3 ml-auto" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-10 min-h-[44px] justify-start gap-2 text-xs border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/30"
              onClick={() => toast.info('Window adjustment proposed', { description: 'The AI engine will re-evaluate the block window in the next optimization run.' })}
            >
              <Clock className="w-4 h-4" />
              Adjust Window
              <ChevronRight className="w-3 h-3 ml-auto" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-10 min-h-[44px] justify-start gap-2 text-xs border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
              onClick={() => toast.warning('Override request submitted', { description: 'A controller override request has been logged for DOM review.' })}
            >
              <ShieldCheck className="w-4 h-4" />
              Request Override
              <ChevronRight className="w-3 h-3 ml-auto" />
            </Button>
          </div>
        </motion.div>

        {/* Downstream Effects */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.25 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <GitBranch className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-foreground">Downstream Effects</span>
          </div>
          <div className="space-y-2">
            {impactData.downstreamEffects.map((effect, idx) => {
              const impactColors = IMPACT_COLORS[effect.impact]
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.05 }}
                >
                  <Card className={cn('border', impactColors.borderColor)}>
                    <CardContent className="p-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <ArrowRight className={cn('w-3 h-3', impactColors.color)} />
                          <span className="text-xs font-semibold text-foreground">{effect.section}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0 h-3.5', impactColors.bgColor, impactColors.color)}>
                            {effect.impact}
                          </Badge>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-3.5 bg-muted/50 text-muted-foreground border-border">
                            {effect.affectedTrains} trains
                          </Badge>
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{effect.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

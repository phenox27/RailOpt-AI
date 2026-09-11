'use client'

import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { blocks, type SimConflict } from '@/data/simulated-data'
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  TrainFront,
  ShieldAlert,
  Ban,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
  ArrowRight,
  Route,
  GitBranch,
  CalendarClock,
  Zap,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

// --- Impact data reused from conflict-impact-panel logic ---
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
    ],
    downstreamEffects: [
      { section: 'GZB-ALJN', impact: 'high', description: 'Rajdhani chain delay cascades to Aligarh section', affectedTrains: 3 },
      { section: 'NDLS Yard', impact: 'medium', description: 'Platform occupancy conflicts at New Delhi yard', affectedTrains: 2 },
    ],
  },
  'conf-002': {
    affectedTrains: [
      { number: '12621', name: 'Tamil Nadu Express', type: 'Express', delayMinutes: 25, route: 'NDLS → MAS' },
      { number: '12622', name: 'Tamil Nadu Express (R)', type: 'Express', delayMinutes: 20, route: 'MAS → NDLS' },
    ],
    alternativeWindows: [
      { start: '01:00', end: '05:00', confidence: 0.88, reason: 'Full night block, both departments can work simultaneously' },
    ],
    downstreamEffects: [
      { section: 'GZB-MTJ', impact: 'medium', description: 'Departure delays propagate to Mathura section', affectedTrains: 2 },
    ],
  },
  'conf-003': {
    affectedTrains: [
      { number: '12393', name: 'Sapt Kranti Express', type: 'Passenger', delayMinutes: 40, route: 'NDLS → MFP' },
      { number: '12367', name: 'Vikramshila Express', type: 'Express', delayMinutes: 35, route: 'NDLS → BGP' },
      { number: '22405', name: 'BBS Rajdhani', type: 'Express', delayMinutes: 30, route: 'NDLS → BBS' },
    ],
    alternativeWindows: [
      { start: '03:30', end: '07:30', confidence: 0.75, reason: 'Post-freight window, reduced passenger impact' },
      { start: '00:00', end: '04:00', confidence: 0.82, reason: 'Full night block with freight diversion available' },
    ],
    downstreamEffects: [
      { section: 'MGS-PNBE', impact: 'high', description: 'Mughal Sarai junction congestion affects Patna-bound trains', affectedTrains: 4 },
    ],
  },
  'conf-004': {
    affectedTrains: [
      { number: '12002', name: 'Shatabdi Express', type: 'Express', delayMinutes: 15, route: 'NDLS → BPL' },
      { number: '12001', name: 'Shatabdi Express (R)', type: 'Express', delayMinutes: 20, route: 'BPL → NDLS' },
      { number: '12301', name: 'Howrah Rajdhani', type: 'Express', delayMinutes: 30, route: 'NDLS → HWH' },
      { number: '22436', name: 'Vande Bharat', type: 'Express', delayMinutes: 15, route: 'NDLS → BSB' },
    ],
    alternativeWindows: [
      { start: '01:00', end: '04:30', confidence: 0.95, reason: '30-min buffer maintained from all approaching trains' },
    ],
    downstreamEffects: [
      { section: 'NDLS-GZB', impact: 'high', description: 'Safety buffer violation creates risk for all express trains', affectedTrains: 6 },
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

const DEFAULT_IMPACT_DATA = {
  affectedTrains: [
    { number: '12256', name: 'Garib Rath', type: 'Passenger' as const, delayMinutes: 20, route: 'NDLS → CNB' },
  ],
  alternativeWindows: [
    { start: '01:00', end: '05:00', confidence: 0.85, reason: 'Night block window with minimal traffic' },
  ],
  downstreamEffects: [
    { section: 'Adjacent Section', impact: 'low' as const, description: 'Minor cascading effect', affectedTrains: 1 },
  ],
}

// --- Resolution type ---
type ResolutionType = 'reschedule' | 'adjust_window' | 'override' | 'merge_blocks'

const RESOLUTION_OPTIONS: { value: ResolutionType; label: string; labelHi: string; description: string; icon: typeof Clock }[] = [
  { value: 'reschedule', label: 'Reschedule Block', labelHi: 'ब्लॉक पुनर्निर्धारित करें', description: 'Move the block to a different time slot that avoids the conflict', icon: CalendarClock },
  { value: 'adjust_window', label: 'Adjust Time Window', labelHi: 'समय विंडो समायोजित करें', description: 'Shrink or shift the block window to resolve overlap', icon: Clock },
  { value: 'override', label: 'Request Override', labelHi: 'ओवरराइड का अनुरोध करें', description: 'Request safety override approval from competent authority', icon: ShieldAlert },
  { value: 'merge_blocks', label: 'Merge Adjacent Blocks', labelHi: 'आसन्न ब्लॉक मर्ज करें', description: 'Combine overlapping blocks into a single larger block', icon: GitBranch },
]

// --- Severity config ---
const SEVERITY_CONFIG: Record<string, { icon: typeof AlertOctagon; color: string; bgColor: string }> = {
  critical: { icon: AlertOctagon, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-950/30' },
  warning: { icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-950/30' },
  info: { icon: Info, color: 'text-[#283593] dark:text-[#3f51b5]', bgColor: 'bg-[#e8eaf6] dark:bg-[#0d1442]/30' },
}

const TYPE_CONFIG: Record<string, { label: string; icon: typeof TrainFront }> = {
  train_conflict: { label: 'Train Conflict', icon: TrainFront },
  department_conflict: { label: 'Dept. Conflict', icon: ShieldAlert },
  corridor_unavailable: { label: 'Corridor Unavailable', icon: Ban },
  safety_violation: { label: 'Safety Violation', icon: AlertOctagon },
}

const IMPACT_COLORS: Record<string, { color: string; bgColor: string }> = {
  high: { color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-950/30' },
  medium: { color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-950/30' },
  low: { color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-950/30' },
}

const STEP_LABELS = [
  'Review Conflict / विरोध समीक्षा',
  'Impact Assessment / प्रभाव मूल्यांकन',
  'Choose Resolution / समाधान चुनें',
  'Configure / कॉन्फ़िगर करें',
  'Confirm & Apply / पुष्टि करें',
]

// --- Step animation wrapper ---
function StepWrapper({ children, stepKey }: { children: React.ReactNode; stepKey: number }) {
  return (
    <motion.div
      key={stepKey}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

// --- Props ---
interface ConflictResolutionWorkflowProps {
  conflict: SimConflict | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onResolved: (id: string) => void
}

export function ConflictResolutionWorkflow({
  conflict,
  open,
  onOpenChange,
  onResolved,
}: ConflictResolutionWorkflowProps) {
  const [step, setStep] = useState(1)
  const [resolutionType, setResolutionType] = useState<ResolutionType>('reschedule')
  const [newStartTime, setNewStartTime] = useState('00:30')
  const [newDuration, setNewDuration] = useState('240')
  const [justification, setJustification] = useState('')
  const [applying, setApplying] = useState(false)

  const impactData = useMemo(() => {
    if (!conflict) return null
    return CONFLICT_IMPACT_DATA[conflict.id] ?? DEFAULT_IMPACT_DATA
  }, [conflict])

  const relatedBlock = useMemo(() => {
    if (!conflict?.blockId) return null
    return blocks.find(b => b.id === conflict.blockId) ?? null
  }, [conflict])

  const totalDelay = useMemo(() => {
    if (!impactData) return 0
    return impactData.affectedTrains.reduce((sum, t) => sum + t.delayMinutes, 0)
  }, [impactData])

  const cascadeRisk = useMemo(() => {
    if (!impactData) return 'low'
    const hasHigh = impactData.downstreamEffects.some(e => e.impact === 'high')
    const hasMedium = impactData.downstreamEffects.some(e => e.impact === 'medium')
    if (hasHigh) return 'high'
    if (hasMedium) return 'medium'
    return 'low'
  }, [impactData])

  const bestWindow = useMemo(() => {
    if (!impactData || impactData.alternativeWindows.length === 0) return null
    return impactData.alternativeWindows.reduce((best, w) => w.confidence > best.confidence ? w : best, impactData.alternativeWindows[0])
  }, [impactData])

  // Reset state when conflict changes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setStep(1)
      setResolutionType('reschedule')
      setNewStartTime('00:30')
      setNewDuration('240')
      setJustification('')
      setApplying(false)
    }
    onOpenChange(newOpen)
  }

  const canGoNext = (): boolean => {
    if (step === 1) return true
    if (step === 2) return true
    if (step === 3) return !!resolutionType
    if (step === 4) return justification.trim().length > 0
    return false
  }

  const handleNext = () => {
    if (step < 5) setStep(s => s + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(s => s - 1)
  }

  const handleApply = async () => {
    setApplying(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    if (conflict) {
      onResolved(conflict.id)
    }
    setApplying(false)
    handleOpenChange(false)
  }

  if (!conflict) return null

  const sevConfig = SEVERITY_CONFIG[conflict.severity] ?? SEVERITY_CONFIG.info
  const SevIcon = sevConfig.icon
  const typeConfig = TYPE_CONFIG[conflict.type]
  const TypeIcon = typeConfig?.icon ?? AlertTriangle

  const progressValue = (step / 5) * 100

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#283593]" />
            Resolve Conflict / विरोध हल करें
          </DialogTitle>
          <DialogDescription>
            Step {step} of 5 — {STEP_LABELS[step - 1]}
          </DialogDescription>
        </DialogHeader>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <Progress value={progressValue} className="h-2" />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            {STEP_LABELS.map((label, i) => (
              <span
                key={i}
                className={cn(
                  'truncate max-w-[20%]',
                  i + 1 === step ? 'text-[#283593] font-semibold' : i + 1 < step ? 'text-emerald-600' : '',
                )}
              >
                {i + 1}
              </span>
            ))}
          </div>
        </div>

        <Separator />

        {/* Step content */}
        <AnimatePresence mode="wait">
          {/* Step 1: Review Conflict */}
          {step === 1 && (
            <StepWrapper stepKey={1}>
              <div className="space-y-4 py-2">
                <div className="flex items-start gap-3">
                  <div className={cn('flex items-center justify-center w-10 h-10 rounded-lg shrink-0', sevConfig.bgColor)}>
                    <SevIcon className={cn('w-5 h-5', sevConfig.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="outline" className={cn(
                        'text-xs px-2 py-0.5',
                        conflict.severity === 'critical' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400' :
                        conflict.severity === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400' :
                        'bg-[#e8eaf6] text-[#0d47a1] border-[#9fa8da] dark:bg-[#0d1442]/30 dark:text-[#3f51b5]'
                      )}>
                        {conflict.severity}
                      </Badge>
                      <Badge variant="outline" className="text-xs px-2 py-0.5 bg-muted/50 text-muted-foreground border-border">
                        {typeConfig?.label ?? conflict.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed">{conflict.description}</p>
                  </div>
                </div>

                {/* Affected Block & Train */}
                <div className="grid grid-cols-2 gap-3">
                  {relatedBlock && (
                    <Card className="border border-border/60">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Zap className="w-3.5 h-3.5 text-[#283593]" />
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase">Affected Block</span>
                        </div>
                        <p className="text-xs font-medium text-foreground">{relatedBlock.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{relatedBlock.section} • {relatedBlock.stationFrom} → {relatedBlock.stationTo}</p>
                      </CardContent>
                    </Card>
                  )}
                  {conflict.trainName && (
                    <Card className="border border-border/60">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <TrainFront className="w-3.5 h-3.5 text-amber-600" />
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase">Affected Train</span>
                        </div>
                        <p className="text-xs font-medium text-foreground">{conflict.trainName}</p>
                        {conflict.trainType && (
                          <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">{conflict.trainType}</p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                  {!relatedBlock && !conflict.trainName && (
                    <Card className="border border-border/60 col-span-2">
                      <CardContent className="p-3">
                        <p className="text-xs text-muted-foreground">No specific block or train is directly linked to this conflict.</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </StepWrapper>
          )}

          {/* Step 2: Impact Assessment */}
          {step === 2 && impactData && (
            <StepWrapper stepKey={2}>
              <div className="space-y-4 py-2">
                {/* Key metrics */}
                <div className="grid grid-cols-3 gap-2">
                  <Card className="border border-border/60">
                    <CardContent className="p-3 text-center">
                      <TrainFront className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                      <p className="text-lg font-bold text-foreground tabular-nums">{impactData.affectedTrains.length}</p>
                      <p className="text-[10px] text-muted-foreground">Trains Affected</p>
                    </CardContent>
                  </Card>
                  <Card className="border border-border/60">
                    <CardContent className="p-3 text-center">
                      <Clock className="w-4 h-4 text-red-500 mx-auto mb-1" />
                      <p className="text-lg font-bold text-red-600 dark:text-red-400 tabular-nums">+{totalDelay}m</p>
                      <p className="text-[10px] text-muted-foreground">Total Delay</p>
                    </CardContent>
                  </Card>
                  <Card className="border border-border/60">
                    <CardContent className="p-3 text-center">
                      <GitBranch className={cn('w-4 h-4 mx-auto mb-1', IMPACT_COLORS[cascadeRisk]?.color ?? 'text-muted-foreground')} />
                      <p className={cn('text-sm font-bold capitalize tabular-nums', IMPACT_COLORS[cascadeRisk]?.color ?? 'text-foreground')}>
                        {cascadeRisk}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Cascade Risk</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Alternative routes */}
                {bestWindow && (
                  <Card className="border border-[#9fa8da]/60 dark:border-[#1a237e]/40">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-3.5 h-3.5 text-[#283593] dark:text-[#3f51b5]" />
                        <span className="text-xs font-semibold text-foreground">Best Alternative Window</span>
                        <Badge variant="outline" className="text-[9px] px-1.5 h-4 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400">
                          {Math.round(bestWindow.confidence * 100)}% confidence
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                        <CalendarClock className="w-3.5 h-3.5 text-[#283593]" />
                        {bestWindow.start} — {bestWindow.end}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">{bestWindow.reason}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Downstream effects summary */}
                {impactData.downstreamEffects.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Route className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs font-semibold text-foreground">Downstream Effects</span>
                    </div>
                    <div className="space-y-1.5">
                      {impactData.downstreamEffects.map((effect, idx) => {
                        const colors = IMPACT_COLORS[effect.impact] ?? IMPACT_COLORS.low
                        return (
                          <div key={idx} className={cn('flex items-center gap-2 rounded-md px-2.5 py-1.5 border border-border/60', colors.bgColor)}>
                            <ArrowRight className={cn('w-3 h-3 shrink-0', colors.color)} />
                            <span className="text-xs font-medium text-foreground flex-1">{effect.section}</span>
                            <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0 h-3.5', colors.bgColor, colors.color)}>
                              {effect.impact}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground tabular-nums">{effect.affectedTrains} trains</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </StepWrapper>
          )}

          {/* Step 3: Choose Resolution */}
          {step === 3 && (
            <StepWrapper stepKey={3}>
              <div className="py-2">
                <RadioGroup
                  value={resolutionType}
                  onValueChange={(v) => setResolutionType(v as ResolutionType)}
                  className="space-y-2"
                >
                  {RESOLUTION_OPTIONS.map((opt) => {
                    const OptIcon = opt.icon
                    return (
                      <label
                        key={opt.value}
                        className={cn(
                          'flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all duration-150',
                          resolutionType === opt.value
                            ? 'border-[#5c6bc0] bg-[#e8eaf6]/50 ring-1 ring-[#5c6bc0]/40 dark:border-[#0d47a1] dark:bg-[#0d1442]/20 dark:ring-[#0d47a1]/40'
                            : 'border-border hover:border-border hover:bg-muted/30',
                        )}
                      >
                        <RadioGroupItem value={opt.value} className="mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <OptIcon className={cn(
                              'w-4 h-4 shrink-0',
                              resolutionType === opt.value ? 'text-[#283593] dark:text-[#3f51b5]' : 'text-muted-foreground',
                            )} />
                            <span className="text-sm font-medium text-foreground">{opt.label}</span>
                            <span className="text-[10px] text-muted-foreground hidden sm:inline">/ {opt.labelHi}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{opt.description}</p>
                        </div>
                      </label>
                    )
                  })}
                </RadioGroup>
              </div>
            </StepWrapper>
          )}

          {/* Step 4: Configure Resolution */}
          {step === 4 && (
            <StepWrapper stepKey={4}>
              <div className="space-y-4 py-2">
                <div className="flex items-center gap-2 mb-1">
                  {(() => {
                    const opt = RESOLUTION_OPTIONS.find(o => o.value === resolutionType)
                    const Icon = opt?.icon ?? Clock
                    return <Icon className="w-4 h-4 text-[#283593]" />
                  })()}
                  <span className="text-sm font-semibold text-foreground">
                    {RESOLUTION_OPTIONS.find(o => o.value === resolutionType)?.label ?? 'Configure'}
                  </span>
                </div>

                {/* Reschedule Block config */}
                {resolutionType === 'reschedule' && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="new-start-time" className="text-xs">New Start Time</Label>
                      <Input
                        id="new-start-time"
                        type="time"
                        value={newStartTime}
                        onChange={(e) => setNewStartTime(e.target.value)}
                        className="h-9 text-sm"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        {bestWindow ? `AI suggests: ${bestWindow.start} (${Math.round(bestWindow.confidence * 100)}% confidence)` : 'Select a time with minimal traffic'}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="new-duration" className="text-xs">Duration (minutes)</Label>
                      <Input
                        id="new-duration"
                        type="number"
                        value={newDuration}
                        onChange={(e) => setNewDuration(e.target.value)}
                        min={30}
                        max={480}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Adjust Window config */}
                {resolutionType === 'adjust_window' && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="adj-start" className="text-xs">Adjusted Start Time</Label>
                      <Input
                        id="adj-start"
                        type="time"
                        value={newStartTime}
                        onChange={(e) => setNewStartTime(e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="adj-duration" className="text-xs">Reduced Duration (minutes)</Label>
                      <Input
                        id="adj-duration"
                        type="number"
                        value={newDuration}
                        onChange={(e) => setNewDuration(e.target.value)}
                        min={30}
                        max={480}
                        className="h-9 text-sm"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Reducing duration may leave some work incomplete
                      </p>
                    </div>
                  </div>
                )}

                {/* Override config */}
                {resolutionType === 'override' && (
                  <div className="space-y-3">
                    <Card className="border border-amber-200/60 dark:border-amber-800/40">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Override Request</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              This will require approval from the Divisional Railway Manager (DRM). Safety protocols must be verified.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <div className="space-y-1.5">
                      <Label htmlFor="override-reason" className="text-xs">Override Reason</Label>
                      <Input
                        id="override-reason"
                        placeholder="e.g., Emergency track safety work"
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Merge blocks config */}
                {resolutionType === 'merge_blocks' && (
                  <div className="space-y-3">
                    <Card className="border border-[#9fa8da]/60 dark:border-[#1a237e]/40">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <GitBranch className="w-4 h-4 text-[#283593] shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-[#0d47a1] dark:text-[#3f51b5]">Merge Adjacent Blocks</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Overlapping blocks on the same section will be combined into a single larger block. The merged block will use the earliest start time and latest end time.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    {relatedBlock && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Primary block: </span>
                        {relatedBlock.name}
                      </div>
                    )}
                  </div>
                )}

                {/* Justification — always shown */}
                <div className="space-y-1.5">
                  <Label htmlFor="justification" className="text-xs">Justification / औचित्य <span className="text-red-500">*</span></Label>
                  <Textarea
                    id="justification"
                    placeholder="Explain why this resolution is appropriate..."
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    className="min-h-[80px] text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Required. This will be recorded in the audit log.
                  </p>
                </div>
              </div>
            </StepWrapper>
          )}

          {/* Step 5: Confirm & Apply */}
          {step === 5 && (
            <StepWrapper stepKey={5}>
              <div className="space-y-4 py-2">
                <Card className="border border-[#9fa8da]/60 dark:border-[#1a237e]/40">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-[#283593]" />
                      <span className="text-sm font-semibold text-foreground">Resolution Summary / समाधान सारांश</span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Conflict</span>
                        <p className="font-medium text-foreground truncate">{conflict.description}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Severity</span>
                        <p className="font-medium capitalize text-foreground">{conflict.severity}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Resolution</span>
                        <p className="font-medium text-foreground">
                          {RESOLUTION_OPTIONS.find(o => o.value === resolutionType)?.label ?? resolutionType}
                        </p>
                      </div>
                      {(resolutionType === 'reschedule' || resolutionType === 'adjust_window') && (
                        <div>
                          <span className="text-muted-foreground">New Start</span>
                          <p className="font-medium text-foreground tabular-nums">{newStartTime}</p>
                        </div>
                      )}
                      {(resolutionType === 'reschedule' || resolutionType === 'adjust_window') && (
                        <div>
                          <span className="text-muted-foreground">Duration</span>
                          <p className="font-medium text-foreground tabular-nums">{newDuration} min</p>
                        </div>
                      )}
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Justification</span>
                        <p className="font-medium text-foreground mt-0.5">{justification}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {impactData && (
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <TrainFront className="w-3.5 h-3.5" />
                    This will affect {impactData.affectedTrains.length} train(s) with a total delay of +{totalDelay} minutes
                  </div>
                )}

                <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 rounded-md px-3 py-2 border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    This action will be logged in the audit trail and cannot be undone.
                  </p>
                </div>
              </div>
            </StepWrapper>
          )}
        </AnimatePresence>

        <Separator />

        {/* Navigation */}
        <DialogFooter className="flex-row items-center justify-between gap-2 sm:justify-between">
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={handleBack}
            disabled={step === 1}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Back
          </Button>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-200',
                  s === step ? 'bg-[#283593] scale-125' : s < step ? 'bg-emerald-500' : 'bg-muted-foreground/30',
                )}
              />
            ))}
          </div>
          {step < 5 ? (
            <Button
              size="sm"
              className="gap-1 bg-[#283593] hover:bg-[#0d47a1] text-white"
              onClick={handleNext}
              disabled={!canGoNext()}
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button
              size="sm"
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleApply}
              disabled={applying}
            >
              {applying ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Apply Resolution
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

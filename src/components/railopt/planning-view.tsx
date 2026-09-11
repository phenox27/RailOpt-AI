'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { plans, blocks, conflicts, maintenanceRequests, corridors, type SimBlock, type SimPlan } from '@/data/simulated-data'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { loadCustomPlans, addBlockToCustomPlan, loadManualBlocks, persistManualBlocks, migrateLocalCustomPlans, migrateLocalManualBlocks, createServerManualBlock, linkServerCustomPlanBlock, updateServerManualBlock, type CustomPlan } from '@/lib/custom-plans'
import { useAppStore } from '@/store/app-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { BlockTimeline } from './block-timeline'
import { AiRecommendationPanel } from './ai-recommendation-panel'
import { BlockDetailPanel } from './block-detail-panel'
import { OptimizationProgress } from './optimization-progress'
import { ManualBlockForm } from './manual-block-form'
import { TrackGeometryPanel } from './track-geometry-panel'
import { GanttView } from './gantt-view'
import { CrewSchedulingPanel } from './crew-scheduling-panel'
import { BlockDurationOptimizer } from './block-duration-optimizer'
import { CorridorUtilization, type DragPreviewInfo } from './corridor-utilization'
import { NextDepartures } from './next-departures'
import {
  Sparkles,
  Plus,
  CalendarClock,
  AlertTriangle,
  Blocks,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Bot,
  Info,
  Clock,
  Users,
  Zap,
  X,
  Printer,
  Gauge,
  ChevronDown,
  ChevronUp,
  GanttChart,
  List,
  HardHat,
  Brain,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, parseISO, addDays, subDays, isToday } from 'date-fns'
import { motion } from 'framer-motion'
import { useIsMobile } from '@/hooks/use-mobile'
import { useDeepLink } from '@/hooks/use-deep-link'
import { PrintHeader } from './print-header'
import { toast } from 'sonner'

// Plan status badge
const PLAN_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-muted text-foreground/80 border-border' },
  optimizing: { label: 'Optimizing', className: 'bg-[#e8eaf6] text-[#0d47a1] border-[#9fa8da]' },
  recommended: { label: 'Recommended', className: 'bg-[#e8eaf6] text-[#0d47a1] border-[#9fa8da]' },
  reviewed: { label: 'Reviewed', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  verified: { label: 'Verified', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  finalized: { label: 'Finalized', className: 'bg-violet-50 text-violet-700 border-violet-200' },
  approved: { label: 'Approved', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
}

export function PlanningView() {
  const [planTab, setPlanTab] = useState<'weekly' | 'monthly'>('weekly')
  // Custom plans (from Plans view wizard) + which plan is being viewed
  const [customPlans, setCustomPlans] = useState<CustomPlan[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const storeActivePlanId = useAppStore((s) => s.activePlanId)
  const setActivePlanId = useAppStore((s) => s.setActivePlanId)

  const basePlan = plans.find((p) => p.type === planTab) || plans[0]
  const activePlan: SimPlan = useMemo(() => {
    if (selectedPlanId) {
      const custom = customPlans.find((p) => p.id === selectedPlanId)
      if (custom) return custom
    }
    return basePlan
  }, [selectedPlanId, customPlans, basePlan])
  const isCustomPlanActive = (activePlan as CustomPlan).isCustom === true

  const planStart = parseISO(activePlan.startDate)
  const [selectedDate, setSelectedDate] = useState(basePlan.startDate)
  const [sectionFilter, setSectionFilter] = useState<string>('all')
  const [deptFilter, setDeptFilter] = useState<string>('all')
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizationDone, setOptimizationDone] = useState(false)
  const [manualFormOpen, setManualFormOpen] = useState(false)
  const [detailSheetOpen, setDetailSheetOpen] = useState(false)
  const [trackDataVisible, setTrackDataVisible] = useState(false)
  const [timelineMode, setTimelineMode] = useState<'timeline' | 'gantt' | 'crew'>('timeline')
  const [optimizerVisible, setOptimizerVisible] = useState(false)
  const [localBlockDurations, setLocalBlockDurations] = useState<Record<string, number>>({})
  const [localBlockStatuses, setLocalBlockStatuses] = useState<Record<string, SimBlock['status']>>({})
  const [customBlocks, setCustomBlocks] = useState<SimBlock[]>([])
  // Live drag preview streamed from the timeline/gantt → Corridor Utilization panel
  const [dragPreview, setDragPreview] = useState<DragPreviewInfo | null>(null)
  const isMobile = useIsMobile()

  // Hydrate from server (source of truth) with one-time localStorage migration
  useEffect(() => {
    let cancelled = false
    const t = setTimeout(async () => {
      try {
        const [mergedBlocks, mergedPlans] = await Promise.all([
          migrateLocalManualBlocks(loadManualBlocks()),
          migrateLocalCustomPlans(loadCustomPlans()),
        ])
        if (cancelled) return
        if (mergedBlocks.length > 0) {
          setCustomBlocks(mergedBlocks)
          persistManualBlocks(mergedBlocks)
        }
        if (mergedPlans.length > 0) setCustomPlans(mergedPlans)
      } catch {
        // server unavailable — localStorage values (loaded above) remain
      }
    }, 0)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [])

  // Consume "Open in Planning" requests from the Plans view
  useEffect(() => {
    if (!storeActivePlanId) return
    const t = setTimeout(() => {
      const target = loadCustomPlans().find((p) => p.id === storeActivePlanId)
      if (target) {
        setCustomPlans((prev) => (prev.some((p) => p.id === target.id) ? prev : [...prev, target]))
        setSelectedPlanId(target.id)
        toast.info(`Viewing "${target.name}"`, {
          description: 'Blocks you add are linked to this custom plan',
        })
      }
      setActivePlanId(null)
    }, 0)
    return () => clearTimeout(t)
  }, [storeActivePlanId, setActivePlanId])

  // Clamp the selected day into the active plan window when switching plans
  useEffect(() => {
    const t = setTimeout(() => {
      setSelectedDate((cur) =>
        cur < activePlan.startDate || cur > activePlan.endDate ? activePlan.startDate : cur
      )
    }, 0)
    return () => clearTimeout(t)
  }, [activePlan.startDate, activePlan.endDate])

  // Merge simulated blocks with locally created blocks + apply local overrides
  const allBlocks = useMemo(() => (
    [...blocks, ...customBlocks].map((b) => ({
      ...b,
      duration: localBlockDurations[b.id] ?? b.duration,
      status: localBlockStatuses[b.id] ?? b.status,
    }))
  ), [customBlocks, localBlockDurations, localBlockStatuses])

  const rawSelectedBlock = allBlocks.find((b) => b.id === selectedBlockId) || null
  const selectedBlock = rawSelectedBlock

  // Deep link from command palette (select block)
  useDeepLink((type, id) => {
    if (type === 'block' && id) {
      const block = allBlocks.find((b) => b.id === id)
      if (block) {
        setSelectedBlockId(block.id)
        if (isMobile) setDetailSheetOpen(true)
      }
    }
  })
  const currentDate = parseISO(selectedDate)
  const goPrevDay = () => {
    const prev = subDays(currentDate, 1)
    if (prev >= planStart) setSelectedDate(format(prev, 'yyyy-MM-dd'))
  }
  const goNextDay = () => {
    const next = addDays(currentDate, 1)
    const planEnd = parseISO(activePlan.endDate)
    if (next <= planEnd) setSelectedDate(format(next, 'yyyy-MM-dd'))
  }

  const runOptimization = async () => {
    setIsOptimizing(true)
    setOptimizationDone(false)
    try {
      const res = await fetch('/api/optimization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: activePlan.id, blockIds: activePlan.blockIds }),
      })
      if (!res.ok) throw new Error('Optimization failed')
    } catch {
      // Error handled in optimization progress
    }
  }

  const onOptimizationComplete = useCallback(() => {
    setIsOptimizing(false)
    setOptimizationDone(true)
  }, [])

  const handleSelectBlock = (id: string | null) => {
    setSelectedBlockId(id)
    if (id && isMobile) {
      setDetailSheetOpen(true)
    }
    if (!id) {
      setOptimizerVisible(false)
    }
  }

  const handleApplyDuration = (newDuration: number) => {
    if (selectedBlockId) {
      setLocalBlockDurations(prev => ({ ...prev, [selectedBlockId]: newDuration }))
      setOptimizerVisible(false)
      toast.success('Block duration updated')
    }
  }

  const handleBlockStatusChange = (blockId: string, nextStatus: SimBlock['status']) => {
    setLocalBlockStatuses(prev => ({ ...prev, [blockId]: nextStatus }))
    const LABELS: Record<string, string> = {
      edited: 'Block edited — submitted for verification',
      verified: 'Block verified',
      finalized: 'Block finalized — ready for approval',
      approved: 'Block approved',
      rejected: 'Block rejected',
    }
    if (nextStatus === 'rejected') {
      toast.error('Block rejected and removed from the recommended workflow')
    } else {
      toast.success(LABELS[nextStatus] || `Block status updated to ${nextStatus}`)
    }
  }

  const handleCreateManualBlock = (data: {
    name: string
    section: string
    stationFrom: string
    stationTo: string
    startTime: string
    endTime: string
    department: string
    line: string
  }) => {
    // startTime/endTime are "HH:mm" — combine with the selected planning date
    const [sh, sm] = data.startTime.split(':').map(Number)
    const [eh, em] = data.endTime.split(':').map(Number)
    let durationMin = (eh * 60 + em) - (sh * 60 + sm)
    if (durationMin <= 0) durationMin += 24 * 60 // handle overnight blocks
    const startISO = `${selectedDate}T${data.startTime.padStart(5, '0')}:00`
    const endISO = `${selectedDate}T${data.endTime.padStart(5, '0')}:00`
    const newBlock: SimBlock = {
      id: `custom-${Date.now()}`,
      name: data.name,
      section: data.section,
      stationFrom: data.stationFrom,
      stationTo: data.stationTo,
      startTime: startISO,
      endTime: endISO,
      duration: durationMin,
      department: data.department,
      status: 'edited',
      planId: activePlan.id,
      line: (data.line as SimBlock['line']) || 'both',
      isAiRecommended: false,
      aiConfidence: 0,
      aiReasoning: '',
      maintenanceReqIds: [],
    }
    setCustomBlocks(prev => {
      const next = [...prev, newBlock]
      persistManualBlocks(next as (SimBlock & { isManual: true })[])
      return next
    })
    // Link the block to the active custom plan (persisted + server)
    if (isCustomPlanActive) {
      setCustomPlans(addBlockToCustomPlan(activePlan.id, newBlock.id))
      void linkServerCustomPlanBlock(activePlan.id, newBlock.id)
    }
    // Write-through to the server (non-blocking)
    void createServerManualBlock(newBlock as (SimBlock & { isManual: true }))
    toast.success(`Block "${data.name}" added to the plan`, {
      description: `${data.section} · ${durationMin} min · ${format(parseISO(startISO), 'MMM d, HH:mm')}`,
    })
    handleSelectBlock(newBlock.id)
  }

  // Drag-and-drop / keyboard reschedule of a manual block on the timeline.
  // newStartH is snapped to 15 min and clamped to [0, 24h − duration] by the timeline;
  // conflictBlockNames lists same-day blocks the proposed slot overlaps (live warning),
  // trainNumbers lists corridor trains whose path crosses the proposed slot.
  const handleMoveBlock = useCallback((blockId: string, newStartH: number, conflictBlockNames: string[] = [], source: 'drag' | 'keyboard' = 'drag', trainNumbers: string[] = []) => {
    const block = customBlocks.find((b) => b.id === blockId)
    if (!block) return
    const durationMin = Math.max(block.duration, 15)
    const startTotal = Math.round(newStartH * 60)
    const endTotal = Math.min(24 * 60, startTotal + durationMin)
    const pad = (n: number) => n.toString().padStart(2, '0')
    const sh = Math.floor(startTotal / 60)
    const sm = startTotal % 60
    const eh = Math.floor(endTotal / 60)
    const em = endTotal % 60
    const startTime = `${selectedDate}T${pad(sh)}:${pad(sm)}:00`
    const endTime = `${selectedDate}T${pad(eh)}:${pad(em)}:00`
    if (startTime === block.startTime && endTime === block.endTime) return

    const previous = { startTime: block.startTime, endTime: block.endTime, duration: block.duration }
    const nextTimes = { startTime, endTime, duration: endTotal - startTotal }

    // localStorage is written on every mutation, so it is always the freshest full list
    const applyTimes = (times: { startTime: string; endTime: string; duration: number }) => {
      setCustomBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, ...times } : b)))
      persistManualBlocks(loadManualBlocks().map((b) => (b.id === blockId ? { ...b, ...times } : b)) as (SimBlock & { isManual: true })[])
      void updateServerManualBlock(blockId, times)
    }
    applyTimes(nextTimes)

    const oldLabel = previous.startTime.split('T')[1]?.slice(0, 5) ?? ''
    const newLabel = `${pad(sh)}:${pad(sm)}`
    const undoAction = {
      label: 'Undo',
      onClick: () => {
        applyTimes(previous)
        toast.success('Reschedule reverted', {
          description: `${block.name} restored to ${oldLabel}`,
        })
      },
    }
    const trainSuffix = trainNumbers.length > 0 ? ` · train path: ${trainNumbers.slice(0, 3).join(', ')}${trainNumbers.length > 3 ? ` +${trainNumbers.length - 3}` : ''}` : ''
    if (conflictBlockNames.length > 0) {
      toast.warning('Block moved — overlaps detected', {
        description: `${block.name}: ${oldLabel} → ${newLabel} · overlaps ${conflictBlockNames.slice(0, 2).join(', ')}${conflictBlockNames.length > 2 ? ` +${conflictBlockNames.length - 2} more` : ''}${trainSuffix}`,
        action: undoAction,
        duration: 9000,
      })
    } else if (trainNumbers.length > 0) {
      // No block overlap, but the slot crosses live train paths — amber advisory
      toast.warning('Block moved — train path crossing', {
        description: `${block.name}: ${oldLabel} → ${newLabel} · crosses train ${trainNumbers.slice(0, 2).join(', ')}${trainNumbers.length > 2 ? ` +${trainNumbers.length - 2}` : ''}`,
        action: undoAction,
        duration: 9000,
      })
    } else if (source !== 'keyboard') {
      // Keyboard nudges stay silent on success — the block visibly moves; no toast spam
      toast.success('Block rescheduled', {
        description: `${block.name}: ${oldLabel} → ${newLabel} (saved to server)`,
        action: undoAction,
        duration: 8000,
      })
    }
  }, [customBlocks, selectedDate])

  // Effective plan block ids — applies the section/department filters + manual blocks
  const effectivePlanBlockIds = useMemo(() => {
    let ids = activePlan.blockIds.filter((id) => {
      const b = allBlocks.find((blk) => blk.id === id)
      if (!b) return false
      if (sectionFilter !== 'all' && b.section !== sectionFilter) return false
      if (deptFilter !== 'all' && b.department !== deptFilter) return false
      return true
    })
    // Manual blocks belong to the plan they were created under
    ids = [...ids, ...customBlocks.filter((b) => b.planId === activePlan.id).map((b) => b.id)]
    return ids
  }, [activePlan, allBlocks, sectionFilter, deptFilter, customBlocks])

  const planBlocks = allBlocks.filter((b) => effectivePlanBlockIds.includes(b.id))

  // Blocks on the selected day (same date-filtering as the timeline) → Corridor Utilization panel
  const utilDayBlocks = useMemo(() => (
    planBlocks.filter((b) => new Date(b.startTime).toISOString().split('T')[0] === selectedDate)
  ), [planBlocks, selectedDate])

  // Click an hour bucket in the Corridor Utilization panel → select that hour's first block
  const handleHourJump = useCallback((hour: number) => {
    const startOf = (b: SimBlock) => {
      const d = new Date(b.startTime)
      return d.getHours() + d.getMinutes() / 60
    }
    const starting = utilDayBlocks
      .filter((b) => startOf(b) >= hour && startOf(b) < hour + 1)
      .sort((a, b) => startOf(a) - startOf(b))
    const covering = utilDayBlocks
      .filter((b) => startOf(b) <= hour && startOf(b) + b.duration / 60 > hour)
      .sort((a, b) => startOf(a) - startOf(b))
    const target = starting[0] ?? covering[0]
    if (target) {
      handleSelectBlock(target.id)
      const dep = new Date(target.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      toast.success(`Inspecting ${target.name}`, { description: `Starts at ${dep}` })
    } else {
      toast.info(`${hour.toString().padStart(2, '0')}:00–${(hour + 1).toString().padStart(2, '0')}:00 is free`, {
        description: 'No blocks in this hour — a good candidate slot for new maintenance work',
      })
    }
  }, [utilDayBlocks, isMobile])

  const totalBlocks = planBlocks.length
  const aiRecommended = planBlocks.filter((b) => b.isAiRecommended).length
  const planConflicts = conflicts.filter((c) => !c.resolved)
  const criticalConflicts = planConflicts.filter((c) => c.severity === 'critical').length
  const totalHours = planBlocks.reduce((sum, b) => sum + b.duration, 0) / 60
  const departmentsInvolved = new Set(planBlocks.map((b) => b.department)).size

  const dayLabels: { date: string; label: string; dayNum: number; hasBlocks: boolean; isToday: boolean }[] = []
  const planEnd = parseISO(activePlan.endDate)
  let d = planStart
  while (d <= planEnd) {
    const dateStr = format(d, 'yyyy-MM-dd')
    const hasBlocks = planBlocks.some((b) => {
      const bDate = new Date(b.startTime).toISOString().split('T')[0]
      return bDate === dateStr
    })
    dayLabels.push({ date: dateStr, label: format(d, 'EEE'), dayNum: d.getDate(), hasBlocks, isToday: isToday(d) })
    d = addDays(d, 1)
  }

  // Detail panel content
  const detailContent = selectedBlock ? (
    <div className="p-4 space-y-3">
      {/* Duration Optimizer toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant={optimizerVisible ? 'default' : 'outline'}
          size="sm"
          className={cn(
            'text-[10px] h-7 px-2.5 gap-1.5',
            optimizerVisible ? 'bg-[#283593] hover:bg-[#0d47a1] text-white' : 'text-[#283593] border-[#9fa8da] hover:bg-[#e8eaf6] dark:text-[#3f51b5] dark:border-[#1a237e] dark:hover:bg-[#0d1442]/30',
          )}
          onClick={() => setOptimizerVisible(!optimizerVisible)}
        >
          <Brain className="w-3.5 h-3.5" />
          Duration Optimizer
        </Button>
      </div>

      {/* Duration Optimizer panel */}
      {optimizerVisible && (
        <BlockDurationOptimizer
          blockId={selectedBlockId}
          currentDuration={selectedBlock.duration}
          onApply={handleApplyDuration}
        />
      )}

      {selectedBlock.isAiRecommended ? (
        <>
          <AiRecommendationPanel
            block={selectedBlock}
            onAccept={() => { handleBlockStatusChange(selectedBlock.id, 'edited'); setSelectedBlockId(null); setDetailSheetOpen(false) }}
            onEdit={() => setManualFormOpen(true)}
            onReject={() => { handleBlockStatusChange(selectedBlock.id, 'rejected'); setSelectedBlockId(null); setDetailSheetOpen(false) }}
          />
          <BlockDetailPanel
            block={selectedBlock}
            onEdit={() => setManualFormOpen(true)}
            onClose={() => { setSelectedBlockId(null); setDetailSheetOpen(false) }}
            onReject={() => handleBlockStatusChange(selectedBlock.id, 'rejected')}
            onAdvance={(next) => handleBlockStatusChange(selectedBlock.id, next)}
          />
        </>
      ) : (
        <BlockDetailPanel
          block={selectedBlock}
          onEdit={() => setManualFormOpen(true)}
          onClose={() => { setSelectedBlockId(null); setDetailSheetOpen(false) }}
          onReject={() => handleBlockStatusChange(selectedBlock.id, 'rejected')}
          onAdvance={(next) => handleBlockStatusChange(selectedBlock.id, next)}
        />
      )}
    </div>
  ) : null

  return (
    <div className="flex flex-col h-full print-area">
      {/* Print Header - hidden on screen, visible when printing */}
      <PrintHeader
        title="RailOpt AI — Block Planning Schedule"
        corridor={corridors[0]?.name ?? 'Railway Corridor'}
        planName={activePlan.name}
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-4 sm:px-6 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <CalendarClock className="h-5 w-5 text-[#283593]" />
          <h1 className="text-lg font-semibold text-foreground">Planning</h1>
        </div>
        <div className="flex items-center gap-2">
          <Tabs
            value={isCustomPlanActive ? 'custom-active' : planTab}
            onValueChange={(v) => {
              setPlanTab(v as 'weekly' | 'monthly')
              setSelectedPlanId(null)
            }}
          >
            <TabsList className="h-8">
              <TabsTrigger value="weekly" className="text-xs px-3 h-7">Weekly</TabsTrigger>
              <TabsTrigger value="monthly" className="text-xs px-3 h-7">Monthly</TabsTrigger>
            </TabsList>
          </Tabs>
          {/* Print Schedule button */}
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8 min-h-[44px] sm:h-8 gap-1.5"
            onClick={() => window.print()}
          >
            <Printer className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Print Schedule</span>
            <span className="sm:hidden">Print</span>
          </Button>
        </div>
      </div>

      {/* Plan info strip — plan selector + status */}
      <div className="flex items-center gap-3 px-4 sm:px-6 pb-2 flex-wrap">
        <Select
          value={activePlan.id}
          onValueChange={(id) => {
            const base = plans.find((p) => p.id === id)
            if (base) {
              setSelectedPlanId(null)
              setPlanTab(base.type === 'monthly' ? 'monthly' : 'weekly')
            } else {
              setSelectedPlanId(id)
              const custom = customPlans.find((p) => p.id === id)
              toast.info(`Viewing "${custom?.name ?? 'custom plan'}"`, {
                description: 'Blocks you add are linked to this custom plan',
              })
            }
          }}
        >
          <SelectTrigger size="sm" className="w-full sm:w-[320px] text-xs h-9 min-h-[44px] sm:h-8 gap-1.5" aria-label="Select plan">
            <CalendarClock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel className="text-[10px]">Standard Plans</SelectLabel>
              {plans.map((p) => (
                <SelectItem key={p.id} value={p.id} className="text-xs">
                  {p.name}
                </SelectItem>
              ))}
            </SelectGroup>
            {customPlans.length > 0 && (
              <SelectGroup>
                <SelectLabel className="text-[10px]">My Custom Plans</SelectLabel>
                {customPlans.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">
                    {p.name} · Custom
                  </SelectItem>
                ))}
              </SelectGroup>
            )}
          </SelectContent>
        </Select>
        <Badge variant="outline" className={cn('rounded-full text-[10px] px-2 py-0 h-5', PLAN_STATUS_CONFIG[activePlan.status]?.className || '')}>
          {PLAN_STATUS_CONFIG[activePlan.status]?.label || activePlan.status}
        </Badge>
        {isCustomPlanActive && (
          <Badge variant="outline" className="rounded-full text-[10px] px-2 py-0 h-5 bg-[#fff7ed] text-[#c2570b] border-[#fdba74] dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800">
            Custom Plan
          </Badge>
        )}
        <span className="text-xs text-muted-foreground">v{activePlan.version}</span>
      </div>

      {/* Filter bar - stacks on mobile */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-2 px-4 sm:px-6 pb-3 py-2 bg-muted/30 rounded-lg mx-4 sm:mx-6 border border-border/50">
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <Select value={sectionFilter} onValueChange={setSectionFilter}>
            <SelectTrigger size="sm" className="w-full sm:w-[140px] text-xs h-9 min-h-[44px] sm:h-8">
              <SelectValue placeholder="Section" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              {corridors.map((c) => (
                <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger size="sm" className="w-full sm:w-[130px] text-xs h-9 min-h-[44px] sm:h-8">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="engineering">Engineering</SelectItem>
              <SelectItem value="snt">S&T</SelectItem>
              <SelectItem value="traction">Traction</SelectItem>
              <SelectItem value="combined">Combined</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 sm:ml-auto">
          <Button
            size="sm"
            className={cn(
              "bg-[#283593] hover:bg-[#0d47a1] text-white text-xs h-9 min-h-[44px] sm:h-8 gap-1.5 relative overflow-hidden",
              !isOptimizing && "animate-[shimmer_2s_infinite]"
            )}
            onClick={runOptimization}
            disabled={isOptimizing}
          >
            {!isOptimizing && (
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer-sweep_2.5s_infinite]" />
            )}
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Run AI Optimization</span>
            <span className="sm:hidden">AI Optimize</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-9 min-h-[44px] sm:h-8 gap-1.5"
            onClick={() => setManualFormOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Manual Add Block</span>
            <span className="sm:hidden">Add Block</span>
          </Button>
        </div>
      </div>

      <Separator />

      {/* Track Data - Collapsible section */}
      <div className="px-4 sm:px-6 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 border-l-2 border-[#1a237e]/40 pl-2">
            <Gauge className="h-4 w-4 text-[#283593] dark:text-[#3f51b5]" />
            <h2 className="text-sm font-semibold">Track Data</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
            onClick={() => setTrackDataVisible(!trackDataVisible)}
          >
            {trackDataVisible ? (
              <>Hide <ChevronUp className="h-3 w-3" /></>
            ) : (
              <>Show <ChevronDown className="h-3 w-3" /></>
            )}
          </Button>
        </div>
      </div>
      {trackDataVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="px-4 sm:px-6 pb-3"
        >
          <TrackGeometryPanel />
        </motion.div>
      )}

      <Separator />

      {/* Mini Stats Summary - wraps on mobile */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-4 px-4 sm:px-6 py-2.5 bg-muted/50 border-y border-border/30 text-xs">
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-card border border-border/50">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground hidden sm:inline">Total Hours:</span>
          <span className="text-muted-foreground sm:hidden">Hrs:</span>
          <span className="font-semibold text-foreground">{totalHours.toFixed(1)}h</span>
        </span>
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-card border border-border/50">
          <Users className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground hidden sm:inline">Departments:</span>
          <span className="text-muted-foreground sm:hidden">Depts:</span>
          <span className="font-semibold text-foreground">{departmentsInvolved}</span>
        </span>
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-card border border-border/50">
          <Blocks className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">Blocks:</span>
          <span className="font-semibold text-foreground">{totalBlocks}</span>
        </span>
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-card border border-border/50">
          <Bot className="h-3 w-3 text-[#1a237e]" />
          <span className="text-muted-foreground">AI:</span>
          <span className="font-semibold text-[#283593]">{aiRecommended}</span>
        </span>
        {criticalConflicts > 0 ? (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 border border-red-200 text-red-600 font-medium">
            <AlertTriangle className="h-3 w-3" />
            {criticalConflicts} conflict{criticalConflicts > 1 ? 's' : ''}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-600">
            <CheckCircle2 className="h-3 w-3" />
            No conflicts
          </span>
        )}
      </div>

      <Separator />

      {/* Main content: Timeline + Detail Panel */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Timeline */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Day selector - scrollable with visible scroll */}
          <div className="flex items-center gap-2 px-4 sm:px-6 py-2.5 border-b border-border bg-background">
            <Button variant="ghost" size="sm" className="h-9 w-9 min-h-[44px] min-w-[44px] sm:h-7 sm:w-7 sm:min-h-0 sm:min-w-0 p-0" onClick={goPrevDay}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Day Pills - horizontally scrollable */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin">
              {dayLabels.map((day) => (
                <button
                  key={day.date}
                  className={cn(
                    'flex flex-col items-center px-2.5 py-1.5 rounded-lg text-[10px] transition-all duration-150 shrink-0 min-w-[40px] min-h-[44px] justify-center sm:min-h-0',
                    day.date === selectedDate
                      ? 'bg-[#283593] text-white shadow-sm shadow-[#283593]/25'
                      : day.isToday
                      ? 'bg-[#e8eaf6] text-[#0d47a1] ring-1 ring-[#5c6bc0] font-medium'
                      : 'text-muted-foreground hover:bg-muted/50',
                  )}
                  onClick={() => setSelectedDate(day.date)}
                >
                  <span className="text-[9px] uppercase">{day.label}</span>
                  <span className={cn('text-sm leading-tight', day.date === selectedDate ? 'font-bold' : 'font-medium')}>{day.dayNum}</span>
                  {day.hasBlocks && (
                    <span className={cn('h-1.5 w-1.5 rounded-full mt-0.5', day.date === selectedDate ? 'bg-background' : 'bg-[#1a237e]')} />
                  )}
                </button>
              ))}
            </div>

            <Button variant="ghost" size="sm" className="h-9 w-9 min-h-[44px] min-w-[44px] sm:h-7 sm:w-7 sm:min-h-0 sm:min-w-0 p-0" onClick={goNextDay}>
              <ChevronRight className="h-4 w-4" />
            </Button>

            <span className="text-xs font-medium text-foreground ml-2 hidden sm:inline">
              {format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy')}
            </span>
            <span className="text-xs font-medium text-foreground ml-2 sm:hidden">
              {format(parseISO(selectedDate), 'EEE, MMM d')}
            </span>
          </div>

          {/* Optimization progress */}
          {(isOptimizing || optimizationDone) && (
            <div className="px-4 sm:px-6 py-3">
              <OptimizationProgress isRunning={isOptimizing} onComplete={onOptimizationComplete} />
            </div>
          )}

          {/* Timeline/Gantt toggle */}
          <div className="flex items-center gap-0.5 px-4 sm:px-6 py-1.5 border-b border-border bg-muted/10">
            <div className="flex items-center bg-muted/50 rounded-md p-0.5 gap-0">
              <Button
                variant={timelineMode === 'timeline' ? 'secondary' : 'ghost'}
                size="sm"
                className={cn("text-[10px] h-6 px-2.5 gap-1 rounded-sm", timelineMode === 'timeline' && "shadow-sm")}
                onClick={() => setTimelineMode('timeline')}
              >
                <List className="h-3 w-3" />Timeline
              </Button>
              <Button
                variant={timelineMode === 'gantt' ? 'secondary' : 'ghost'}
                size="sm"
                className={cn("text-[10px] h-6 px-2.5 gap-1 rounded-sm", timelineMode === 'gantt' && "shadow-sm")}
                onClick={() => setTimelineMode('gantt')}
              >
                <GanttChart className="h-3 w-3" />Gantt
              </Button>
              <Button
                variant={timelineMode === 'crew' ? 'secondary' : 'ghost'}
                size="sm"
                className={cn("text-[10px] h-6 px-2.5 gap-1 rounded-sm", timelineMode === 'crew' && "shadow-sm")}
                onClick={() => setTimelineMode('crew')}
              >
                <HardHat className="h-3 w-3" />Crew
              </Button>
            </div>
          </div>

          {/* Timeline / Gantt / Crew - horizontally scrollable on mobile */}
          <div className="flex-1 overflow-hidden print-keep dot-grid relative">
            {timelineMode === 'crew' ? (
              <div className="h-full px-2 sm:px-4 md:px-6 py-3 overflow-auto">
                <CrewSchedulingPanel />
              </div>
            ) : timelineMode === 'timeline' ? (
              <div className="h-full px-2 sm:px-4 md:px-6 py-3 overflow-auto">
                {isMobile && (
                  <div className="text-[10px] text-muted-foreground mb-2 flex items-center gap-1">
                    <span>↔ Pinch or scroll to zoom timeline</span>
                  </div>
                )}
                <BlockTimeline
                  selectedDate={selectedDate}
                  selectedBlockId={selectedBlockId}
                  onSelectBlock={handleSelectBlock}
                  planBlockIds={effectivePlanBlockIds}
                  extraBlocks={customBlocks}
                  onMoveBlock={handleMoveBlock}
                  onDragPreview={setDragPreview}
                />
              </div>
            ) : (
              <GanttView
                selectedBlockId={selectedBlockId}
                onSelectBlock={handleSelectBlock}
                planBlockIds={effectivePlanBlockIds}
                extraBlocks={customBlocks}
                onMoveBlock={handleMoveBlock}
                onDragPreview={setDragPreview}
              />
            )}
          </div>
        </div>

        {/* Right: Detail panel - Sheet on mobile, side panel on desktop */}
        {isMobile ? (
          <Sheet open={detailSheetOpen} onOpenChange={(open) => { setDetailSheetOpen(open); if (!open) setSelectedBlockId(null) }}>
            <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="text-sm">Block Details</SheetTitle>
              </SheetHeader>
              <CorridorUtilization dayBlocks={utilDayBlocks} preview={dragPreview} selectedBlock={selectedBlock} onHourClick={handleHourJump} dayLabel={format(currentDate, 'EEE d MMM')} selectedHour={selectedBlock ? new Date(selectedBlock.startTime).getHours() : null} />
              <NextDepartures className="mx-4 mt-3" />
              {detailContent}
            </SheetContent>
          </Sheet>
        ) : (
          selectedBlock ? (
            <div className="w-full lg:w-[340px] xl:w-[380px] border-l border-border overflow-y-auto bg-background">
              <CorridorUtilization dayBlocks={utilDayBlocks} preview={dragPreview} selectedBlock={selectedBlock} onHourClick={handleHourJump} dayLabel={format(currentDate, 'EEE d MMM')} selectedHour={selectedBlock ? new Date(selectedBlock.startTime).getHours() : null} />
              <NextDepartures className="mx-4 mt-3" />
              {detailContent}
            </div>
          ) : (
            <div className="hidden lg:flex w-[340px] xl:w-[380px] border-l border-border flex-col overflow-y-auto bg-muted/10">
              <CorridorUtilization dayBlocks={utilDayBlocks} preview={dragPreview} className="bg-background" onHourClick={handleHourJump} dayLabel={format(currentDate, 'EEE d MMM')} selectedHour={selectedBlock ? new Date(selectedBlock.startTime).getHours() : null} />
              <NextDepartures className="mx-4 mt-3" />
              <div className="flex-1 flex items-center justify-center py-10">
                <div className="text-center text-muted-foreground px-4">
                  <Info className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-medium">Select a block to view details</p>
                  <p className="text-[10px] mt-1">Click a block in the timeline — or an hour in the utilization chart</p>
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {/* Manual Block Form Dialog */}
      <ManualBlockForm
        open={manualFormOpen}
        onOpenChange={setManualFormOpen}
        onSubmit={handleCreateManualBlock}
      />
    </div>
  )
}

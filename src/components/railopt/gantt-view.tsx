'use client'

import { useState, useMemo, useCallback } from 'react'
import { blocks, conflicts, corridors } from '@/data/simulated-data'
import type { SimBlock, SimConflict } from '@/data/simulated-data'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Separator } from '@/components/ui/separator'
import {
  GanttChart as GanttIcon,
  Bot,
  AlertTriangle,
  Clock,
  MapPin,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Filter,
  Calendar,
  Info,
  Layers,
  GripVertical,
  Sparkles,
  Timer,
  Building2,
  Route,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'

// Department colors
const DEPT_COLORS: Record<string, { bg: string; border: string; text: string; hex: string }> = {
  engineering: { bg: 'bg-blue-600', border: 'border-blue-700', text: 'text-blue-100', hex: '#2563EB' },
  snt: { bg: 'bg-[#1a237e]', border: 'border-[#283593]', text: 'text-[#e8eaf6]', hex: '#0EA5A4' },
  traction: { bg: 'bg-amber-600', border: 'border-amber-700', text: 'text-amber-50', hex: '#B77900' },
  combined: { bg: 'bg-violet-500', border: 'border-violet-600', text: 'text-violet-50', hex: '#7C3AED' },
}

const DEPT_LIGHT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  engineering: { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-800' },
  snt: { bg: 'bg-teal-100', border: 'border-[#3f51b5]', text: 'text-[#1a237e]' },
  traction: { bg: 'bg-amber-100', border: 'border-amber-400', text: 'text-amber-800' },
  combined: { bg: 'bg-violet-100', border: 'border-violet-400', text: 'text-violet-800' },
}

const DEPT_LABELS: Record<string, string> = {
  engineering: 'Engineering',
  snt: 'S&T',
  traction: 'Traction',
  combined: 'Combined',
}

// Corridors for Y-axis
const GANTT_CORRIDORS = [
  { id: 'NDLS-GZB', name: 'NDLS-GZB', fullName: 'New Delhi — Ghaziabad' },
  { id: 'TDL-MTJ', name: 'TDL-MTJ', fullName: 'Tundla — Mathura' },
  { id: 'CNB-LKO', name: 'CNB-LKO', fullName: 'Kanpur — Lucknow' },
  { id: 'ALD-MGS', name: 'ALD-MGS', fullName: 'Prayagraj — Mughal Sarai' },
  { id: 'BPL-JHS', name: 'BPL-JHS', fullName: 'Bhopal — Jhansi' },
]

// Compute dependencies between blocks sharing same section (finish-to-start sequence)
function computeDependencies(filteredBlocks: SimBlock[]): { from: string; to: string; type: 'finish-to-start' }[] {
  const deps: { from: string; to: string; type: 'finish-to-start' }[] = []
  const bySection: Record<string, SimBlock[]> = {}
  for (const b of filteredBlocks) {
    if (!bySection[b.section]) bySection[b.section] = []
    bySection[b.section].push(b)
  }
  for (const sectionBlocks of Object.values(bySection)) {
    const sorted = [...sectionBlocks].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    for (let i = 0; i < sorted.length - 1; i++) {
      deps.push({ from: sorted[i].id, to: sorted[i + 1].id, type: 'finish-to-start' })
    }
  }
  return deps
}

interface GanttViewProps {
  selectedBlockId: string | null
  onSelectBlock: (blockId: string | null) => void
  planBlockIds?: string[]
  extraBlocks?: SimBlock[]
}

function timeToHours(isoString: string): number {
  const d = new Date(isoString)
  return d.getHours() + d.getMinutes() / 60
}

function formatHour(h: number): string {
  const hr = Math.floor(h)
  const min = Math.round((h - hr) * 60)
  return `${hr.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
}

// Lane assignment algorithm
function assignLanes(blocksToAssign: SimBlock[]): SimBlock[][] {
  const lanes: SimBlock[][] = []
  for (const block of blocksToAssign) {
    const startH = timeToHours(block.startTime)
    const endH = timeToHours(block.endTime)
    let placed = false
    for (let i = 0; i < lanes.length; i++) {
      const hasOverlap = lanes[i].some((b) => {
        const bs = timeToHours(b.startTime)
        const be = timeToHours(b.endTime)
        return startH < be && endH > bs
      })
      if (!hasOverlap) {
        lanes[i].push(block)
        placed = true
        break
      }
    }
    if (!placed) lanes.push([block])
  }
  return lanes
}

export function GanttView({ selectedBlockId, onSelectBlock, planBlockIds, extraBlocks }: GanttViewProps) {
  // Filters
  const [deptFilter, setDeptFilter] = useState<string>('all')
  const [showAiRecommended, setShowAiRecommended] = useState(true)
  const [showConflicts, setShowConflicts] = useState(true)
  const [showDependencies, setShowDependencies] = useState(true)
  const [zoomLevel, setZoomLevel] = useState(1) // 1 = normal (24h), 2 = zoomed in (12h), 3 = 6h
  const [selectedDate, setSelectedDate] = useState('2025-01-27')
  const [groupBy, setGroupBy] = useState<'section' | 'department'>('section')
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null)

  // Zoom controls
  const hoursVisible = zoomLevel === 1 ? 24 : zoomLevel === 2 ? 12 : 6
  const startHour = zoomLevel === 3 ? 6 : 0

  // Filtered blocks (including locally created blocks)
  const filteredBlocks = useMemo(() => {
    const source = extraBlocks && extraBlocks.length > 0 ? [...blocks, ...extraBlocks] : blocks
    return source.filter((b) => {
      if (planBlockIds && !planBlockIds.includes(b.id)) return false
      const blockDate = new Date(b.startTime).toISOString().split('T')[0]
      if (blockDate !== selectedDate) return false
      if (deptFilter !== 'all' && b.department !== deptFilter) return false
      if (!showAiRecommended && b.isAiRecommended) return false
      return true
    })
  }, [planBlockIds, selectedDate, deptFilter, showAiRecommended, extraBlocks])

  // Compute dynamic dependencies
  const dependencies = useMemo(() => computeDependencies(filteredBlocks), [filteredBlocks])

  // Group blocks based on groupBy toggle
  const groupedBlocks = useMemo(() => {
    if (groupBy === 'section') {
      const grouped: Record<string, { label: string; sublabel: string; blocks: SimBlock[] }> = {}
      for (const corridor of GANTT_CORRIDORS) {
        const corridorBlocks = filteredBlocks.filter((b) => b.section === corridor.id)
        if (corridorBlocks.length > 0) {
          grouped[corridor.id] = { label: corridor.name, sublabel: corridor.fullName, blocks: corridorBlocks }
        }
      }
      return grouped
    } else {
      const grouped: Record<string, { label: string; sublabel: string; blocks: SimBlock[] }> = {}
      for (const dept of ['engineering', 'snt', 'traction', 'combined'] as const) {
        const deptBlocks = filteredBlocks.filter((b) => b.department === dept)
        if (deptBlocks.length > 0) {
          grouped[dept] = { label: DEPT_LABELS[dept], sublabel: `${deptBlocks.length} blocks`, blocks: deptBlocks }
        }
      }
      return grouped
    }
  }, [filteredBlocks, groupBy])

  // Get conflicts for a block
  const getBlockConflicts = useCallback((blockId: string): SimConflict[] => {
    return conflicts.filter((c) => c.blockId === blockId && !c.resolved)
  }, [])

  // Current time indicator
  const currentHour = new Date().getHours() + new Date().getMinutes() / 60

  // Time axis calculations
  const ROW_HEIGHT = 52
  const TIME_HEADER_HEIGHT = 36
  const LABEL_COL_WIDTH = 130

  // Date navigation
  const availableDates = useMemo(() => {
    const dates = new Set<string>()
    blocks.forEach((b) => {
      if (planBlockIds && !planBlockIds.includes(b.id)) return
      dates.add(new Date(b.startTime).toISOString().split('T')[0])
    })
    return Array.from(dates).sort()
  }, [planBlockIds])

  // Summary: total hours per department
  const deptSummary = useMemo(() => {
    const summary: Record<string, number> = {}
    for (const b of filteredBlocks) {
      summary[b.department] = (summary[b.department] || 0) + b.duration / 60
    }
    return summary
  }, [filteredBlocks])

  const groupEntries = Object.entries(groupedBlocks)

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-border bg-muted/20">
        <GanttIcon className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold text-foreground">Gantt View</span>

        <Separator orientation="vertical" className="h-5 mx-1" />

        {/* Date selector */}
        <Select value={selectedDate} onValueChange={setSelectedDate}>
          <SelectTrigger size="sm" className="w-[150px] text-xs">
            <Calendar className="h-3 w-3 mr-1" />
            <SelectValue placeholder="Date" />
          </SelectTrigger>
          <SelectContent>
            {availableDates.map((d) => (
              <SelectItem key={d} value={d}>
                {format(parseISO(d), 'EEE, MMM d')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Department filter */}
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger size="sm" className="w-[130px] text-xs">
            <Filter className="h-3 w-3 mr-1" />
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

        <Separator orientation="vertical" className="h-5 mx-1" />

        {/* Group By toggle */}
        <div className="flex items-center gap-1.5">
          <Layers className="h-3 w-3 text-muted-foreground" />
          <ToggleGroup type="single" value={groupBy} onValueChange={(v) => { if (v) setGroupBy(v as 'section' | 'department') }} className="gap-0.5">
            <ToggleGroupItem value="section" className="text-[10px] px-2 py-0.5 h-6 rounded-l-md rounded-r-none data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
              <Route className="h-3 w-3 mr-1" />Section
            </ToggleGroupItem>
            <ToggleGroupItem value="department" className="text-[10px] px-2 py-0.5 h-6 rounded-r-md rounded-l-none data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
              <Building2 className="h-3 w-3 mr-1" />Dept
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <Separator orientation="vertical" className="h-5 mx-1" />

        {/* Toggle: AI Recommended */}
        <div className="flex items-center gap-1.5">
          <Switch id="show-ai" checked={showAiRecommended} onCheckedChange={setShowAiRecommended} className="scale-75" />
          <label htmlFor="show-ai" className="text-[11px] text-muted-foreground cursor-pointer">AI</label>
        </div>

        {/* Toggle: Conflicts */}
        <div className="flex items-center gap-1.5">
          <Switch id="show-conflicts" checked={showConflicts} onCheckedChange={setShowConflicts} className="scale-75" />
          <label htmlFor="show-conflicts" className="text-[11px] text-muted-foreground cursor-pointer">Conflicts</label>
        </div>

        {/* Toggle: Dependencies */}
        <div className="flex items-center gap-1.5">
          <Switch id="show-deps" checked={showDependencies} onCheckedChange={setShowDependencies} className="scale-75" />
          <label htmlFor="show-deps" className="text-[11px] text-muted-foreground cursor-pointer">Deps</label>
        </div>

        <div className="flex-1" />

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setZoomLevel(Math.max(1, zoomLevel - 1))} disabled={zoomLevel <= 1}>
            <ZoomOut className="h-3 w-3" />
          </Button>
          <span className="text-[10px] text-muted-foreground w-8 text-center">
            {zoomLevel === 1 ? '24h' : zoomLevel === 2 ? '12h' : '6h'}
          </span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setZoomLevel(Math.min(3, zoomLevel + 1))} disabled={zoomLevel >= 3}>
            <ZoomIn className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Main Gantt Chart */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-[900px]">
          {/* Time Axis Header - with major/minor gridlines */}
          <div className="relative border-b border-border bg-muted/10 sticky top-0 z-20" style={{ height: TIME_HEADER_HEIGHT }}>
            {/* Group label column header */}
            <div className="absolute left-0 top-0 bottom-0 border-r border-border flex items-center px-2" style={{ width: LABEL_COL_WIDTH }}>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                {groupBy === 'section' ? 'Corridor' : 'Department'}
              </span>
            </div>
            {/* Time ticks with major/minor */}
            <div className="relative h-full" style={{ marginLeft: LABEL_COL_WIDTH }}>
              {Array.from({ length: hoursVisible * 2 + 1 }, (_, i) => {
                const halfHour = startHour + i * 0.5
                if (halfHour > startHour + hoursVisible) return null
                const isMajor = i % 2 === 0
                const hour = Math.floor(halfHour)
                const minute = (halfHour - hour) * 60
                return (
                  <div
                    key={`time-${i}`}
                    className="absolute top-0 flex flex-col items-center"
                    style={{ left: `${((halfHour - startHour) / hoursVisible) * 100}%`, transform: 'translateX(-50%)' }}
                  >
                    {isMajor ? (
                      <>
                        <span className="text-[10px] text-muted-foreground font-mono mt-1">
                          {hour.toString().padStart(2, '0')}:{minute === 0 ? '00' : minute.toString().padStart(2, '0')}
                        </span>
                        <div className="w-px h-2.5 bg-border mt-0.5" />
                      </>
                    ) : (
                      <div className="w-px h-1.5 bg-border/40 mt-auto mb-1" style={{ marginTop: '14px' }} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Grouped Rows with animations */}
          <AnimatePresence mode="popLayout">
            {groupEntries.map(([groupId, group], groupIdx) => {
              const groupBlocks = group.blocks
              const lanes = assignLanes(groupBlocks)
              const rowHeight = Math.max(lanes.length, 1) * ROW_HEIGHT + 12

              return (
                <motion.div
                  key={groupId}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.25, delay: groupIdx * 0.04 }}
                  className="flex border-b border-border"
                >
                  {/* Group Label Column */}
                  <div className="shrink-0 border-r border-border flex flex-col items-center justify-center px-2 bg-muted/5" style={{ width: LABEL_COL_WIDTH }}>
                    <span className="text-xs font-bold text-foreground">{group.label}</span>
                    <span className="text-[9px] text-muted-foreground mt-0.5 truncate max-w-full">{group.sublabel}</span>
                    <span className="text-[8px] text-muted-foreground/60 mt-0.5">{groupBlocks.length} block{groupBlocks.length !== 1 ? 's' : ''}</span>
                  </div>

                  {/* Chart Area */}
                  <div className="flex-1 relative" style={{ height: rowHeight }}>
                    {/* Major grid lines (hourly) */}
                    {Array.from({ length: hoursVisible + 1 }, (_, i) => (
                      <div
                        key={`grid-major-${groupId}-${i}`}
                        className="absolute top-0 bottom-0 w-px bg-border/25"
                        style={{ left: `${(i / hoursVisible) * 100}%` }}
                      />
                    ))}
                    {/* Minor grid lines (30 min) */}
                    {Array.from({ length: hoursVisible * 2 + 1 }, (_, i) => {
                      if (i % 2 === 0) return null // skip major positions
                      return (
                        <div
                          key={`grid-minor-${groupId}-${i}`}
                          className="absolute top-0 bottom-0 w-px bg-border/10"
                          style={{ left: `${((i * 0.5) / hoursVisible) * 100}%` }}
                        />
                      )
                    })}

                    {/* Current time indicator (Today Line) */}
                    {currentHour >= startHour && currentHour <= startHour + hoursVisible && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                        style={{ left: `${((currentHour - startHour) / hoursVisible) * 100}%` }}
                      >
                        <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rounded-full shadow-sm shadow-red-500/50" />
                        <span className="absolute -top-5 -left-5 text-[9px] text-red-500 font-bold whitespace-nowrap bg-background/80 px-1 rounded">
                          NOW
                        </span>
                      </div>
                    )}

                    {/* Block Bars */}
                    {lanes.map((laneBlocks, laneIdx) =>
                      laneBlocks.map((block, blockIdx) => {
                        const startH = timeToHours(block.startTime)
                        const endH = timeToHours(block.endTime)
                        const leftPct = ((startH - startHour) / hoursVisible) * 100
                        const widthPct = ((endH - startH) / hoursVisible) * 100
                        const isSelected = selectedBlockId === block.id
                        const isHovered = hoveredBlockId === block.id
                        const blockConflicts = getBlockConflicts(block.id)
                        const hasConflict = blockConflicts.length > 0
                        const dept = block.department
                        const colors = DEPT_COLORS[dept] || DEPT_COLORS.combined
                        const lightColors = DEPT_LIGHT_COLORS[dept] || DEPT_LIGHT_COLORS.combined

                        return (
                          <HoverCard key={block.id}>
                            <HoverCardTrigger asChild>
                              <motion.button
                                initial={{ opacity: 0, scaleX: 0.8 }}
                                animate={{ opacity: 1, scaleX: 1 }}
                                transition={{ duration: 0.2, delay: groupIdx * 0.04 + blockIdx * 0.03 }}
                                className={cn(
                                  'absolute text-left cursor-pointer transition-all duration-150 outline-none group/bar',
                                  'rounded-md shadow-sm',
                                  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                                  block.isAiRecommended
                                    ? cn(lightColors.bg, 'border-2 border-dashed', lightColors.border, 'hover:border-[#1a237e]')
                                    : cn(colors.bg, 'border border-solid', colors.border),
                                  isSelected && 'ring-2 ring-offset-1 ring-offset-background ring-[#1a237e] shadow-md z-10',
                                  isHovered && !isSelected && 'shadow-md z-10 brightness-110',
                                  hasConflict && showConflicts && 'ring-1 ring-red-400',
                                )}
                                style={{
                                  left: `${leftPct}%`,
                                  width: `${Math.max(widthPct, 2)}%`,
                                  top: laneIdx * ROW_HEIGHT + 6,
                                  height: ROW_HEIGHT - 12,
                                  transformOrigin: 'left center',
                                }}
                                onClick={() => onSelectBlock(isSelected ? null : block.id)}
                                onMouseEnter={() => setHoveredBlockId(block.id)}
                                onMouseLeave={() => setHoveredBlockId(null)}
                              >
                                {/* Drag handle (visual only) on hover */}
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-md bg-black/10 opacity-0 group-hover/bar:opacity-100 transition-opacity flex items-center justify-center">
                                  <GripVertical className="h-2.5 w-2.5 text-white/60" />
                                </div>

                                <div className="flex items-center gap-1 pl-2.5 pr-2 h-full overflow-hidden">
                                  {/* AI sparkle icon */}
                                  {block.isAiRecommended && (
                                    <Sparkles className={cn('h-3 w-3 shrink-0', lightColors.text)} />
                                  )}
                                  {/* Conflict indicator */}
                                  {hasConflict && showConflicts && (
                                    <AlertTriangle className="h-3 w-3 shrink-0 text-red-500" />
                                  )}
                                  <span
                                    className={cn(
                                      'text-[10px] font-medium truncate leading-tight',
                                      block.isAiRecommended ? lightColors.text : colors.text,
                                    )}
                                  >
                                    {block.name}
                                  </span>
                                  {/* Duration badge inside bar */}
                                  {widthPct > 8 && (
                                    <span className={cn(
                                      'text-[8px] ml-auto shrink-0 opacity-70',
                                      block.isAiRecommended ? lightColors.text : colors.text,
                                    )}>
                                      {block.duration}m
                                    </span>
                                  )}
                                </div>
                                {/* Conflict flag */}
                                {hasConflict && showConflicts && (
                                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                                    <span className="text-[7px] text-white font-bold">!</span>
                                  </div>
                                )}
                              </motion.button>
                            </HoverCardTrigger>
                            <HoverCardContent side="top" className="w-80 text-xs p-3" sideOffset={8}>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <p className="font-semibold text-sm">{block.name}</p>
                                  {block.isAiRecommended && (
                                    <Badge className="text-[9px] px-1.5 py-0 h-4 bg-[#e8eaf6] text-[#0d47a1] border-[#9fa8da]">
                                      <Sparkles className="h-2.5 w-2.5 mr-0.5" /> AI
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span>{formatHour(startH)} – {formatHour(endH)} ({block.duration} min)</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  <span>{block.section} · {block.stationFrom} → {block.stationTo}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <Timer className="h-3 w-3" />
                                  <span>Line: {block.line} · Dept: {DEPT_LABELS[dept] || dept}</span>
                                </div>
                                {block.isAiRecommended && (
                                  <div className="pt-1.5 border-t border-border">
                                    <p className="text-[#283593] font-medium text-[11px]">
                                      AI Recommendation · Confidence: {Math.round(block.aiConfidence * 100)}%
                                    </p>
                                    <p className="text-muted-foreground text-[10px] mt-1 line-clamp-3">
                                      {block.aiReasoning}
                                    </p>
                                  </div>
                                )}
                                {hasConflict && (
                                  <div className="pt-1.5 border-t border-border">
                                    <p className="text-red-600 font-medium text-[11px]">
                                      ⚠ {blockConflicts.length} conflict{blockConflicts.length > 1 ? 's' : ''}
                                    </p>
                                    {blockConflicts.map((c) => (
                                      <p key={c.id} className="text-[10px] text-muted-foreground mt-0.5">
                                        {c.description}
                                      </p>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        )
                      })
                    )}

                    {/* Dependency Arrows */}
                    {showDependencies && dependencies.map((dep) => {
                      const fromBlock = groupBlocks.find((b) => b.id === dep.from)
                      const toBlock = groupBlocks.find((b) => b.id === dep.to)
                      if (!fromBlock || !toBlock) return null
                      const fromEnd = ((timeToHours(fromBlock.endTime) - startHour) / hoursVisible) * 100
                      const toStart = ((timeToHours(toBlock.startTime) - startHour) / hoursVisible) * 100
                      if (fromEnd >= toStart) return null
                      const arrowWidth = toStart - fromEnd
                      if (arrowWidth < 0.5) return null
                      return (
                        <div
                          key={`dep-${dep.from}-${dep.to}`}
                          className="absolute z-[5] pointer-events-none"
                          style={{
                            left: `${fromEnd}%`,
                            width: `${arrowWidth}%`,
                            top: ROW_HEIGHT / 2,
                            height: 2,
                          }}
                        >
                          <div className="w-full h-px bg-muted-foreground/25" />
                          <div
                            className="absolute right-0 top-1/2 -translate-y-1/2"
                            style={{
                              width: 0,
                              height: 0,
                              borderTop: '3px solid transparent',
                              borderBottom: '3px solid transparent',
                              borderLeft: '5px solid rgb(100,100,100,0.35)',
                            }}
                          />
                        </div>
                      )
                    })}

                    {/* Empty state */}
                    {groupBlocks.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] text-muted-foreground/40">No blocks</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* Summary Row */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="flex border-b border-border bg-muted/15"
          >
            <div className="shrink-0 border-r border-border flex items-center px-2" style={{ width: LABEL_COL_WIDTH }}>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">Summary</span>
            </div>
            <div className="flex-1 flex items-center gap-4 px-4 py-2">
              {Object.entries(deptSummary).map(([dept, hours]) => {
                const colors = DEPT_COLORS[dept]
                if (!colors) return null
                return (
                  <div key={dept} className="flex items-center gap-1.5">
                    <span className={cn('h-2.5 w-2.5 rounded-sm', colors.bg)} />
                    <span className="text-[10px] text-muted-foreground">{DEPT_LABELS[dept] || dept}</span>
                    <span className="text-[11px] font-semibold text-foreground">{hours.toFixed(1)}h</span>
                  </div>
                )
              })}
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-1.5">
                <Timer className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">Total</span>
                <span className="text-[11px] font-semibold text-foreground">
                  {filteredBlocks.reduce((s, b) => s + b.duration, 0) / 60}h
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-[#1a237e]" />
                <span className="text-[10px] text-muted-foreground">AI</span>
                <span className="text-[11px] font-semibold text-[#283593]">
                  {filteredBlocks.filter(b => b.isAiRecommended).length}/{filteredBlocks.length}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 px-3 py-2 border-t border-border bg-muted/10 text-xs">
        <span className="text-[10px] text-muted-foreground font-semibold uppercase">Legend</span>
        <Separator orientation="vertical" className="h-4" />

        {/* Department colors */}
        {Object.entries(DEPT_LABELS).map(([code, label]) => {
          const c = DEPT_COLORS[code]
          if (!c) return null
          return (
            <span key={code} className="flex items-center gap-1.5">
              <span className={cn('h-3 w-3 rounded-sm shadow-sm', c.bg)} />
              <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
            </span>
          )
        })}

        <Separator orientation="vertical" className="h-4" />

        {/* AI Recommended */}
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-5 rounded-sm border-2 border-dashed border-[#3f51b5] bg-[#e8eaf6]" />
          <Sparkles className="h-3 w-3 text-[#283593]" />
          <span className="text-[11px] text-muted-foreground font-medium">AI Recommended</span>
        </span>

        {/* Conflict */}
        <span className="flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
          <span className="text-[11px] text-muted-foreground font-medium">Conflict</span>
        </span>

        {/* Dependency */}
        <span className="flex items-center gap-1.5">
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground font-medium">Dependency</span>
        </span>

        {/* Today line */}
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-0.5 bg-red-500 rounded-full" />
          <span className="text-[11px] text-muted-foreground font-medium">Current Time</span>
        </span>

        {/* Drag handle */}
        <span className="flex items-center gap-1.5">
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground font-medium">Drag</span>
        </span>
      </div>
    </div>
  )
}

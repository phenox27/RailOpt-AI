'use client'

import { useMemo, useState, useRef, useCallback } from 'react'
import { SimBlock, SimConflict, blocks, conflicts } from '@/data/simulated-data'
import { Badge } from '@/components/ui/badge'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { AlertTriangle, Bot, Clock, MapPin, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

// Department color mapping
const DEPT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  engineering: { bg: 'bg-blue-600', border: 'border-blue-700', text: 'text-blue-100' },
  snt: { bg: 'bg-[#1a237e]', border: 'border-[#283593]', text: 'text-[#e8eaf6]' },
  traction: { bg: 'bg-amber-600', border: 'border-amber-700', text: 'text-amber-50' },
  combined: { bg: 'bg-violet-500', border: 'border-violet-600', text: 'text-violet-50' },
}

const DEPT_LIGHT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  engineering: { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-800' },
  snt: { bg: 'bg-teal-100', border: 'border-[#3f51b5]', text: 'text-[#1a237e]' },
  traction: { bg: 'bg-amber-100', border: 'border-amber-400', text: 'text-amber-800' },
  combined: { bg: 'bg-violet-100', border: 'border-violet-400', text: 'text-violet-800' },
}

const DEPT_LABELS: Record<string, string> = {
  engineering: 'ENGG',
  snt: 'S&T',
  traction: 'TRAC',
  combined: 'COMB',
}

// Department legend colors (for the legend icons)
const DEPT_LEGEND_COLORS: Record<string, string> = {
  engineering: '#2563EB',
  snt: '#14B8A6',
  traction: '#D97706',
  combined: '#8B5CF6',
}

interface BlockTimelineProps {
  selectedDate: string
  selectedBlockId: string | null
  onSelectBlock: (blockId: string | null) => void
  planBlockIds?: string[]
  extraBlocks?: SimBlock[]
}

// Parse ISO time to hours (e.g. "2025-01-27T01:00:00" -> 1.0)
function timeToHours(isoString: string): number {
  const d = new Date(isoString)
  return d.getHours() + d.getMinutes() / 60
}

// Format hours to HH:MM
function formatHour(h: number): string {
  const hr = Math.floor(h)
  const min = Math.round((h - hr) * 60)
  return `${hr.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
}

// Check if a block belongs to the selected date
function isBlockOnDate(block: SimBlock, dateStr: string): boolean {
  const blockDate = new Date(block.startTime).toISOString().split('T')[0]
  return blockDate === dateStr
}

interface TimelineLane {
  laneIndex: number
  blocks: SimBlock[]
}

// Simple lane assignment: place blocks into lanes to avoid overlap
function assignLanes(dayBlocks: SimBlock[]): TimelineLane[] {
  const lanes: SimBlock[][] = []

  for (const block of dayBlocks) {
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
    if (!placed) {
      lanes.push([block])
    }
  }

  return lanes.map((blocks, idx) => ({ laneIndex: idx, blocks }))
}

export function BlockTimeline({ selectedDate, selectedBlockId, onSelectBlock, planBlockIds, extraBlocks }: BlockTimelineProps) {
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null)
  const timelineRef = useRef<HTMLDivElement>(null)

  // Filter blocks for the selected day and plan (including locally created blocks)
  const dayBlocks = useMemo(() => {
    const source = extraBlocks && extraBlocks.length > 0 ? [...blocks, ...extraBlocks] : blocks
    const filtered = source.filter((b) => {
      if (planBlockIds && !planBlockIds.includes(b.id)) return false
      return isBlockOnDate(b, selectedDate)
    })
    return filtered.sort((a, b) => timeToHours(a.startTime) - timeToHours(b.startTime))
  }, [selectedDate, planBlockIds, extraBlocks])

  const lanes = useMemo(() => assignLanes(dayBlocks), [dayBlocks])

  // Arrow key navigation for block items
  const handleTimelineKeyDown = useCallback((e: React.KeyboardEvent) => {
    const blockButtons = timelineRef.current?.querySelectorAll<HTMLButtonElement>('[data-block-id]')
    if (!blockButtons || blockButtons.length === 0) return

    const currentIndex = Array.from(blockButtons).findIndex(
      (btn) => btn === document.activeElement
    )

    if (currentIndex === -1) return

    let nextIndex = currentIndex
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      nextIndex = (currentIndex + 1) % blockButtons.length
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      nextIndex = (currentIndex - 1 + blockButtons.length) % blockButtons.length
    } else {
      return
    }

    blockButtons[nextIndex]?.focus()
  }, [])

  // Get conflicts for a block
  const getBlockConflicts = (blockId: string): SimConflict[] => {
    return conflicts.filter((c) => c.blockId === blockId && !c.resolved)
  }

  // Current time indicator
  const currentHour = new Date().getHours() + new Date().getMinutes() / 60
  const nowPct = (currentHour / 24) * 100

  const TOTAL_HOURS = 24
  const LANE_HEIGHT = 52
  const HEADER_HEIGHT = 28
  const LANE_GAP = 6

  if (dayBlocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Clock className="h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm font-medium">No blocks scheduled for this day</p>
        <p className="text-xs mt-1">Run AI optimization or manually add blocks</p>
      </div>
    )
  }

  const timelineAriaLabel = `Block timeline for ${selectedDate}: ${dayBlocks.length} blocks across ${lanes.length} lanes`

  return (
    <div className="w-full overflow-x-auto" role="img" aria-label={timelineAriaLabel} ref={timelineRef} onKeyDown={handleTimelineKeyDown}>
      <div className="min-w-[800px]">
        {/* Time axis header */}
        <div
          className="relative border-b border-border mb-0"
          style={{ height: HEADER_HEIGHT }}
        >
          {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => (
            <div
              key={`tick-${i}`}
              className="absolute top-0 flex flex-col items-center"
              style={{ left: `${(i / TOTAL_HOURS) * 100}%`, transform: 'translateX(-50%)' }}
            >
              <span className="text-[10px] text-muted-foreground font-mono mt-1">
                {i.toString().padStart(2, '0')}:00
              </span>
              <div className="w-px h-2 bg-border mt-0.5" />
            </div>
          ))}
        </div>

        {/* Lanes */}
        <div className="relative">
          {/* Grid lines */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ height: lanes.length * (LANE_HEIGHT + LANE_GAP) + LANE_GAP }}
          >
            {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => (
              <div
                key={`grid-${i}`}
                className="absolute top-0 bottom-0 w-px bg-border/40"
                style={{ left: `${(i / TOTAL_HOURS) * 100}%` }}
              />
            ))}
            {/* Current time indicator with pulse animation */}
            <motion.div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
              style={{ left: `${nowPct}%` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="absolute -top-1.5 -left-2 w-4 h-4 bg-red-500 rounded-full"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [1, 0.6, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              {/* Current time label */}
              <span className="absolute -top-5 -left-7 text-[9px] font-mono text-red-500 font-medium bg-background/80 px-1 rounded">
                {formatHour(currentHour)}
              </span>
            </motion.div>
          </div>

          {lanes.map((lane) => (
            <div
              key={`lane-${lane.laneIndex}`}
              className="relative"
              style={{
                height: LANE_HEIGHT,
                marginBottom: LANE_GAP,
                marginTop: lane.laneIndex === 0 ? LANE_GAP : 0,
              }}
            >
              {/* Lane label */}
              <div className="absolute -left-0 top-0 bottom-0 flex items-center">
                <span className="text-[10px] text-muted-foreground/60 font-medium">
                  L{lane.laneIndex + 1}
                </span>
              </div>

              {lane.blocks.map((block) => {
                const startH = timeToHours(block.startTime)
                const endH = timeToHours(block.endTime)
                const leftPct = (startH / TOTAL_HOURS) * 100
                const widthPct = ((endH - startH) / TOTAL_HOURS) * 100
                const isSelected = selectedBlockId === block.id
                const isHovered = hoveredBlockId === block.id
                const blockConflicts = getBlockConflicts(block.id)
                const hasConflict = blockConflicts.length > 0
                const dept = block.department
                const colors = DEPT_COLORS[dept] || DEPT_COLORS.combined
                const lightColors = DEPT_LIGHT_COLORS[dept] || DEPT_LIGHT_COLORS.combined
                const deptLabel = DEPT_LABELS[dept] || dept.toUpperCase().slice(0, 4)

                return (
                  <HoverCard key={block.id} open={isHovered ? undefined : false}>
                    <HoverCardTrigger asChild>
                      <motion.button
                        data-block-id={block.id}
                        className={cn(
                          'absolute top-1 bottom-1 text-left cursor-pointer transition-all duration-150 outline-none group/block',
                          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                          // Rounded corners and shadows
                          'rounded-lg shadow-sm',
                          // AI recommended: dashed border with teal tint, else solid
                          block.isAiRecommended
                            ? cn(lightColors.bg, 'border-2 border-dashed', lightColors.border)
                            : cn(colors.bg, 'border border-solid', colors.border),
                          isSelected && 'ring-2 ring-offset-1 ring-offset-background ring-[#1a237e] shadow-md',
                          isHovered && !isSelected && 'ring-1 ring-offset-1 ring-offset-background ring-[#3f51b5]/60 shadow-md',
                        )}
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                        }}
                        whileHover={{
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          y: -1,
                        }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        onClick={() => onSelectBlock(isSelected ? null : block.id)}
                        onMouseEnter={() => setHoveredBlockId(block.id)}
                        onMouseLeave={() => setHoveredBlockId(null)}
                        aria-label={`${block.name}, ${block.department}, ${formatHour(startH)} to ${formatHour(endH)}${hasConflict ? ', has conflicts' : ''}`}
                        layout
                      >
                        {/* Hover glow effect */}
                        <div className="absolute inset-0 rounded-lg opacity-0 group-hover/block:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-b from-white/20 to-transparent" />

                        {/* Drag handle indicator on hover */}
                        <div className="absolute left-0 top-0 bottom-0 w-4 flex items-center justify-center opacity-0 group-hover/block:opacity-60 transition-opacity duration-150 pointer-events-none">
                          <GripVertical className={cn(
                            'h-3 w-3',
                            block.isAiRecommended ? lightColors.text : 'text-white/60',
                          )} />
                        </div>

                        {/* Block content */}
                        <div className="flex items-center gap-1 px-2 h-full overflow-hidden">
                          {/* Department label */}
                          <span className={cn(
                            'text-[9px] font-bold uppercase shrink-0 px-1 py-0.5 rounded-sm',
                            block.isAiRecommended
                              ? 'bg-white/60 text-muted-foreground'
                              : 'bg-white/20 text-white/80',
                          )}>
                            {deptLabel}
                          </span>
                          {/* AI indicator */}
                          {block.isAiRecommended && (
                            <Bot className={cn('h-3 w-3 shrink-0', lightColors.text)} />
                          )}
                          {/* Conflict indicator */}
                          {hasConflict && (
                            <AlertTriangle className="h-3 w-3 shrink-0 text-red-500" />
                          )}
                          <span
                            className={cn(
                              'text-[11px] font-medium truncate leading-tight',
                              block.isAiRecommended ? lightColors.text : colors.text,
                            )}
                          >
                            {block.name}
                          </span>
                        </div>
                      </motion.button>
                    </HoverCardTrigger>
                    <HoverCardContent side="top" className="w-72 text-xs p-3" sideOffset={8}>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm">{block.name}</p>
                          {block.isAiRecommended && (
                            <Badge className="text-[9px] px-1.5 py-0 h-4 bg-[#e8eaf6] text-[#0d47a1] border-[#9fa8da]">
                              AI
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
                        <div className="flex items-center gap-1.5 text-muted-foreground capitalize">
                          <span>Line: {block.line} · Dept: {block.department}</span>
                        </div>
                        {block.isAiRecommended && (
                          <div className="pt-1 border-t border-border">
                            <p className="text-[#283593] font-medium text-[11px]">
                              AI Recommendation · Confidence: {Math.round(block.aiConfidence * 100)}%
                            </p>
                            <p className="text-muted-foreground text-[10px] mt-1 line-clamp-2">
                              {block.aiReasoning}
                            </p>
                          </div>
                        )}
                        {hasConflict && (
                          <div className="pt-1 border-t border-border">
                            <p className="text-red-600 font-medium text-[11px]">
                              ⚠ {blockConflicts.length} conflict{blockConflicts.length > 1 ? 's' : ''} detected
                            </p>
                            {blockConflicts.map(c => (
                              <p key={c.id} className="text-[10px] text-muted-foreground mt-0.5">{c.description}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                )
              })}
            </div>
          ))}
        </div>

        {/* Legend - improved with better spacing and icons */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-3 pb-1 border-t border-border mt-2">
          <span className="text-xs text-muted-foreground font-semibold tracking-wide uppercase">Dept</span>
          {Object.entries({
            engineering: 'Engineering',
            snt: 'S&T',
            traction: 'Traction',
            combined: 'Combined',
          }).map(([code, label]) => {
            const legendColor = DEPT_LEGEND_COLORS[code]
            return (
              <span key={code} className="flex items-center gap-1.5">
                <span
                  className="h-3 w-3 rounded-sm shadow-sm"
                  style={{ backgroundColor: legendColor }}
                />
                <span className="text-xs text-muted-foreground font-medium">{label}</span>
              </span>
            )
          })}
          <span className="text-border mx-1">|</span>
          <span className="flex items-center gap-1.5">
            <Bot className="h-3.5 w-3.5 text-[#283593]" />
            <span className="text-xs text-muted-foreground font-medium">AI Recommended</span>
            <span className="h-3 w-3 rounded-sm border-2 border-dashed border-[#3f51b5] bg-[#e8eaf6]" />
          </span>
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
            <span className="text-xs text-muted-foreground font-medium">Conflict</span>
          </span>
          <span className="flex items-center gap-1.5">
            <motion.span
              className="h-3 w-0.5 bg-red-500 rounded-full"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <span className="text-xs text-muted-foreground font-medium">Now</span>
          </span>
          <span className="flex items-center gap-1.5">
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50" />
            <span className="text-xs text-muted-foreground font-medium">Drag</span>
          </span>
        </div>
      </div>
    </div>
  )
}

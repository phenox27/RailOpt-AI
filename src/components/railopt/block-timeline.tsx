'use client'

import { useMemo, useState, useRef, useCallback } from 'react'
import { SimBlock, SimConflict, blocks, conflicts } from '@/data/simulated-data'
import { Badge } from '@/components/ui/badge'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { AlertTriangle, Bot, Clock, MapPin, GripVertical, MoveHorizontal } from 'lucide-react'
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

const TOTAL_HOURS = 24
const LANE_HEIGHT = 52
const HEADER_HEIGHT = 28
const LANE_GAP = 6
const SNAP_H = 0.25 // 15-minute snap grid
const DRAG_THRESHOLD_PX = 4 // px before a press becomes a drag (click still selects)

interface BlockTimelineProps {
  selectedDate: string
  selectedBlockId: string | null
  onSelectBlock: (blockId: string | null) => void
  planBlockIds?: string[]
  extraBlocks?: SimBlock[]
  /** When provided, manual (custom-*) blocks can be dragged horizontally to reschedule.
   *  conflictBlockNames = same-day blocks the new slot overlaps; source distinguishes drag vs keyboard nudge. */
  onMoveBlock?: (blockId: string, newStartH: number, conflictBlockNames: string[], source?: 'drag' | 'keyboard') => void
}

/** A manual block is draggable: DB-loaded blocks carry isManual, localStorage ones use the custom- id prefix. */
export function isMovable(block: SimBlock, canMove: boolean): boolean {
  if (!canMove) return false
  return (block as { isManual?: boolean }).isManual === true || block.id.startsWith('custom-')
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

/** Names of same-day blocks whose time window overlaps [startH, startH+durationH]. */
export function computeOverlaps(dayBlocks: SimBlock[], draggedId: string, startH: number, durationH: number): string[] {
  const endH = startH + durationH
  return dayBlocks
    .filter((b) => {
      if (b.id === draggedId) return false
      const bs = timeToHours(b.startTime)
      const be = timeToHours(b.endTime)
      return startH < be && endH > bs
    })
    .map((b) => b.name)
}

interface DragState {
  blockId: string
  origStartH: number
  durationH: number
  deltaH: number // snapped shift, may be 0
  active: boolean // passed the movement threshold
}

export function BlockTimeline({ selectedDate, selectedBlockId, onSelectBlock, planBlockIds, extraBlocks, onMoveBlock }: BlockTimelineProps) {
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    blockId: string
    origStartH: number
    durationH: number
    startX: number
    widthPx: number
    moved: boolean
  } | null>(null)
  // Mirrors the latest committed drag state so commit-time side effects
  // (calling onMoveBlock) never run inside a setState updater.
  const dragValueRef = useRef<DragState | null>(null)
  // Suppresses the synthetic click that follows a completed drag pointerup.
  const suppressClickRef = useRef(false)

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

  // Live conflict detection while dragging: same-day blocks the proposed slot overlaps
  const dragConflicts = useMemo(() => {
    if (!drag?.active) return [] as string[]
    return computeOverlaps(dayBlocks, drag.blockId, drag.origStartH + drag.deltaH, drag.durationH)
  }, [drag, dayBlocks])

  const clampStart = useCallback((startH: number, durationH: number) => {
    return Math.min(Math.max(0, startH), TOTAL_HOURS - durationH)
  }, [])

  // ---- Drag to reschedule (manual blocks only) ----

  const handleDragPointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>, block: SimBlock) => {
    if (!onMoveBlock || e.button !== 0) return
    const laneEl = e.currentTarget.closest('[data-lane]') as HTMLElement | null
    const widthPx = (laneEl ?? e.currentTarget).getBoundingClientRect().width
    if (widthPx <= 0) return
    dragRef.current = {
      blockId: block.id,
      origStartH: timeToHours(block.startTime),
      durationH: Math.max(block.duration, 15) / 60,
      startX: e.clientX,
      widthPx,
      moved: false,
    }
  }, [onMoveBlock])

  const handleDragPointerMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const st = dragRef.current
    if (!st) return
    const dx = e.clientX - st.startX
    if (!st.moved && Math.abs(dx) < DRAG_THRESHOLD_PX) return
    st.moved = true
    const rawDelta = (dx / st.widthPx) * TOTAL_HOURS
    const deltaH = Math.round(rawDelta / SNAP_H) * SNAP_H
    const nextDelta = clampStart(st.origStartH + deltaH, st.durationH) - st.origStartH
    const prev = dragValueRef.current
    if (prev && prev.blockId === st.blockId && prev.deltaH === nextDelta && prev.active) return
    const next: DragState = { blockId: st.blockId, origStartH: st.origStartH, durationH: st.durationH, deltaH: nextDelta, active: true }
    dragValueRef.current = next
    setDrag(next)
  }, [clampStart])

  const endDrag = useCallback((commit: boolean) => {
    const st = dragRef.current
    const current = dragValueRef.current
    suppressClickRef.current = st?.moved === true
    if (commit && st && current && current.blockId === st.blockId && current.active && current.deltaH !== 0) {
      const newStart = current.origStartH + current.deltaH
      const conflicts = computeOverlaps(dayBlocks, st.blockId, newStart, current.durationH)
      onMoveBlock?.(st.blockId, newStart, conflicts)
    }
    dragValueRef.current = null
    dragRef.current = null
    setDrag(null)
  }, [onMoveBlock, dayBlocks])

  const handleDragPointerUp = useCallback(() => endDrag(true), [endDrag])
  const handleDragPointerCancel = useCallback(() => endDrag(false), [endDrag])

  // Keyboard nudge (Shift+←/→ moves a focused manual block by 15 min)
  const handleBlockKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>, block: SimBlock) => {
    if (!onMoveBlock || !(e.shiftKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight'))) return
    e.preventDefault()
    e.stopPropagation()
    const durationH = Math.max(block.duration, 15) / 60
    const orig = timeToHours(block.startTime)
    const next = clampStart(orig + (e.key === 'ArrowRight' ? SNAP_H : -SNAP_H), durationH)
    if (next !== orig) {
      const conflicts = computeOverlaps(dayBlocks, block.id, next, durationH)
      onMoveBlock(block.id, next, conflicts, 'keyboard')
    }
  }, [onMoveBlock, clampStart, dayBlocks])

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
            {/* 15-min snap guides while dragging — red when the slot overlaps another block */}
            {drag?.active && (
              <div className="absolute inset-0 opacity-30" aria-hidden="true">
                {Array.from({ length: TOTAL_HOURS * 4 + 1 }, (_, i) => (
                  <div
                    key={`snap-${i}`}
                    className={cn(
                      'absolute top-0 bottom-0 w-px',
                      dragConflicts.length > 0 ? 'bg-red-500/70' : 'bg-[#FF9933]/50',
                    )}
                    style={{ left: `${((i * SNAP_H) / TOTAL_HOURS) * 100}%` }}
                  />
                ))}
              </div>
            )}
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
              data-lane
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
                const isSelected = selectedBlockId === block.id
                const isHovered = hoveredBlockId === block.id
                const blockConflicts = getBlockConflicts(block.id)
                const hasConflict = blockConflicts.length > 0
                const dept = block.department
                const colors = DEPT_COLORS[dept] || DEPT_COLORS.combined
                const lightColors = DEPT_LIGHT_COLORS[dept] || DEPT_LIGHT_COLORS.combined
                const deptLabel = DEPT_LABELS[dept] || dept.toUpperCase().slice(0, 4)

                // ---- Drag state for this block ----
                const movable = isMovable(block, !!onMoveBlock)
                const isDragging = drag?.active === true && drag.blockId === block.id
                const shownStartH = isDragging ? drag.origStartH + drag.deltaH : startH
                const shownEndH = isDragging ? shownStartH + drag.durationH : endH
                const leftPct = (shownStartH / TOTAL_HOURS) * 100
                const widthPct = ((shownEndH - shownStartH) / TOTAL_HOURS) * 100
                const origLeftPct = (startH / TOTAL_HOURS) * 100
                const origWidthPct = ((endH - startH) / TOTAL_HOURS) * 100

                return (
                  <HoverCard key={block.id} open={isDragging ? false : isHovered ? undefined : false}>
                    <HoverCardTrigger asChild>
                      <motion.button
                        data-block-id={block.id}
                        className={cn(
                          'absolute top-1 bottom-1 text-left transition-all duration-150 outline-none group/block',
                          movable ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-pointer',
                          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                          // Rounded corners and shadows
                          'rounded-lg shadow-sm',
                          // AI recommended: dashed border with teal tint, else solid
                          block.isAiRecommended
                            ? cn(lightColors.bg, 'border-2 border-dashed', lightColors.border)
                            : cn(colors.bg, 'border border-solid', colors.border),
                          isSelected && 'ring-2 ring-offset-1 ring-offset-background ring-[#1a237e] shadow-md',
                          isHovered && !isSelected && 'ring-1 ring-offset-1 ring-offset-background ring-[#3f51b5]/60 shadow-md',
                          isDragging && 'z-20 shadow-xl ring-2 ring-[#FF9933] ring-offset-1 ring-offset-background brightness-110 saturate-150',
                          // Focus effect: dim everything else while a drag is in progress
                          drag?.active && !isDragging && 'opacity-50 saturate-50',
                          // Blocks the dragged block would overlap flash a red ring
                          drag?.active && !isDragging && dragConflicts.includes(block.name) && 'opacity-100 saturate-100 ring-2 ring-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]',
                        )}
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                          touchAction: movable ? 'none' : undefined,
                        }}
                        whileHover={isDragging ? undefined : {
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          y: -1,
                        }}
                        animate={isDragging ? { scale: 1.02 } : { scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        onClick={() => {
                          // A completed drag must not also toggle selection
                          if (suppressClickRef.current) {
                            suppressClickRef.current = false
                            return
                          }
                          onSelectBlock(isSelected ? null : block.id)
                        }}
                        onMouseEnter={() => setHoveredBlockId(block.id)}
                        onMouseLeave={() => setHoveredBlockId(null)}
                        onPointerDown={movable ? (e) => handleDragPointerDown(e, block) : undefined}
                        onPointerMove={movable ? handleDragPointerMove : undefined}
                        onPointerUp={movable ? handleDragPointerUp : undefined}
                        onPointerCancel={movable ? handleDragPointerCancel : undefined}
                        onKeyDown={movable ? (e) => handleBlockKeyDown(e, block) : undefined}
                        aria-label={`${block.name}, ${block.department}, ${formatHour(shownStartH)} to ${formatHour(shownEndH)}${hasConflict ? ', has conflicts' : ''}${movable ? ', drag or press Shift with arrow keys to reschedule' : ''}`}
                        layout={false}
                      >
                        {/* Drag handle indicator — persistent on movable blocks, hover-only otherwise */}
                        <div className={cn(
                          'absolute left-0 top-0 bottom-0 w-4 flex items-center justify-center transition-opacity duration-150 pointer-events-none',
                          movable ? 'opacity-35 group-hover/block:opacity-90' : 'opacity-0 group-hover/block:opacity-60',
                        )}>
                          <GripVertical className={cn(
                            'h-3 w-3',
                            block.isAiRecommended ? lightColors.text : 'text-white/60',
                          )} />
                        </div>

                        {/* Block content */}
                        <div className={cn('flex items-center gap-1 h-full overflow-hidden', movable ? 'pl-4 pr-2' : 'px-2')}>
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
                          <span>{formatHour(shownStartH)} – {formatHour(shownEndH)} ({block.duration} min)</span>
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
                        {movable && (
                          <div className="pt-1 border-t border-border flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <MoveHorizontal className="h-3 w-3 text-[#c2410c]" />
                            <span>Drag to reschedule · Shift + ←/→ nudges 15 min</span>
                          </div>
                        )}
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                )
              })}

              {/* Ghost outline at the original slot + live time chip for the block being dragged (rendered inside its lane) */}
              {drag?.active && lane.blocks.some((b) => b.id === drag.blockId) && (() => {
                const dragged = lane.blocks.find((b) => b.id === drag.blockId)!
                const ghostLeft = (timeToHours(dragged.startTime) / TOTAL_HOURS) * 100
                const ghostWidth = ((Math.max(dragged.duration, 15) / 60) / TOTAL_HOURS) * 100
                const newStart = drag.origStartH + drag.deltaH
                const hasOverlap = dragConflicts.length > 0
                return (
                  <>
                    <div
                      className={cn(
                        'absolute top-1 bottom-1 rounded-lg border-2 border-dashed pointer-events-none',
                        hasOverlap ? 'border-red-500/60 bg-red-500/5' : 'border-muted-foreground/40 bg-muted-foreground/5',
                      )}
                      style={{ left: `${ghostLeft}%`, width: `${ghostWidth}%` }}
                      aria-hidden="true"
                    />
                    {/* Live time chip pinned above the dragged block — turns red on overlap */}
                    <div
                      className="absolute -top-1 z-30 pointer-events-none -translate-x-1/2"
                      style={{ left: `${((newStart + drag.durationH / 2) / TOTAL_HOURS) * 100}%` }}
                      role="status"
                    >
                      <span
                        className={cn(
                          'whitespace-nowrap rounded-md px-2 py-0.5 text-[10px] font-semibold text-white shadow-lg border max-w-[280px] truncate inline-block',
                          hasOverlap
                            ? 'bg-red-600 border-red-700 animate-pulse'
                            : 'bg-[#c2410c] border-[#9a3412]',
                        )}
                      >
                        {hasOverlap
                          ? `⚠ Overlaps ${dragConflicts.slice(0, 2).join(', ')}${dragConflicts.length > 2 ? ` +${dragConflicts.length - 2}` : ''}`
                          : `${formatHour(newStart)} → ${formatHour(newStart + drag.durationH)}`}
                      </span>
                      <span
                        className={cn(
                          'absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent',
                          hasOverlap ? 'border-t-red-600' : 'border-t-[#c2410c]',
                        )}
                      />
                    </div>
                  </>
                )
              })()}
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
          {onMoveBlock && (
            <span className="flex items-center gap-1.5">
              <MoveHorizontal className="h-3.5 w-3.5 text-[#c2410c]" />
              <span className="text-xs text-muted-foreground font-medium">Drag custom blocks</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

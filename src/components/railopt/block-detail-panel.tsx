'use client'

import { useState } from 'react'
import { SimBlock, SimConflict, blocks, conflicts, maintenanceRequests } from '@/data/simulated-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Clock,
  MapPin,
  ArrowRight,
  GitBranch,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  AlertOctagon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, parseISO, addMinutes, subMinutes } from 'date-fns'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface BlockDetailPanelProps {
  block: SimBlock
  onEdit?: () => void
  onClose?: () => void
  onReject?: () => void
  onAdvance?: (nextStatus: 'edited' | 'verified' | 'finalized' | 'approved') => void
}

// Block status config
const BLOCK_STATUS_CONFIG: Record<
  string,
  { label: string; className: string; stepIndex: number }
> = {
  recommended: {
    label: 'Recommended',
    className: 'bg-[#e8eaf6] text-[#0d47a1] border-[#9fa8da]',
    stepIndex: 0,
  },
  edited: {
    label: 'Edited',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
    stepIndex: 1,
  },
  verified: {
    label: 'Verified',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    stepIndex: 2,
  },
  finalized: {
    label: 'Finalized',
    className: 'bg-violet-50 text-violet-700 border-violet-200',
    stepIndex: 3,
  },
  approved: {
    label: 'Approved',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    stepIndex: 4,
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-50 text-red-700 border-red-200',
    stepIndex: -1,
  },
}

const WORKFLOW_STEPS = ['Recommend', 'Edit', 'Verify', 'Finalize', 'Approve']

// Department colors
const DEPT_BADGE_COLORS: Record<string, string> = {
  engineering: 'bg-blue-50 text-blue-700 border-blue-200',
  snt: 'bg-[#e8eaf6] text-[#0d47a1] border-[#9fa8da]',
  traction: 'bg-amber-50 text-amber-700 border-amber-200',
  combined: 'bg-violet-50 text-violet-700 border-violet-200',
}

// Check if a time range [newStart, newEnd] overlaps with an existing block
function wouldOverlap(
  blockId: string,
  newStartMs: number,
  newEndMs: number,
  section: string
): SimBlock[] {
  return blocks.filter((b) => {
    if (b.id === blockId) return false
    // Only check blocks on same section for conflict
    if (b.section !== section) return false
    const bStart = new Date(b.startTime).getTime()
    const bEnd = new Date(b.endTime).getTime()
    return newStartMs < bEnd && newEndMs > bStart
  })
}

export function BlockDetailPanel({ block, onEdit, onClose, onReject, onAdvance }: BlockDetailPanelProps) {
  const statusConfig = BLOCK_STATUS_CONFIG[block.status] || BLOCK_STATUS_CONFIG.recommended

  // Time shift state (in minutes)
  const [shiftMinutes, setShiftMinutes] = useState(0)

  // Get conflicts for this block
  const blockConflicts = conflicts.filter((c) => c.blockId === block.id && !c.resolved)

  // Get maintenance requests for this block
  const blockRequests = maintenanceRequests.filter((mr) =>
    block.maintenanceReqIds.includes(mr.id)
  )

  // Parse times
  const startDate = parseISO(block.startTime)
  const endDate = parseISO(block.endTime)
  const startStr = format(startDate, 'HH:mm')
  const endStr = format(endDate, 'HH:mm')

  // Compute shifted times
  const shiftedStart = shiftMinutes >= 0 ? addMinutes(startDate, shiftMinutes) : subMinutes(startDate, Math.abs(shiftMinutes))
  const shiftedEnd = shiftMinutes >= 0 ? addMinutes(endDate, shiftMinutes) : subMinutes(endDate, Math.abs(shiftMinutes))
  const shiftedStartStr = format(shiftedStart, 'HH:mm')
  const shiftedEndStr = format(shiftedEnd, 'HH:mm')

  // Check for overlaps at the new position
  const overlappingBlocks = shiftMinutes === 0
    ? []
    : wouldOverlap(
        block.id,
        shiftedStart.getTime(),
        shiftedEnd.getTime(),
        block.section
      )

  const hasOverlap = overlappingBlocks.length > 0

  // Check if shifted time goes out of day bounds (0:00 - 23:59)
  const isOutOfBounds =
    shiftedStart.getDate() !== startDate.getDate() ||
    shiftedEnd.getDate() !== startDate.getDate() ||
    shiftedStart.getHours() < 0

  // Apply time shift
  const handleApply = () => {
    if (hasOverlap) {
      toast.warning(`Block "${block.name}" moved to ${shiftedStartStr} – ${shiftedEndStr}`, {
        description: `Potential conflict detected with ${overlappingBlocks.length} block(s): ${overlappingBlocks.map((b) => b.name).join(', ')}`,
        duration: 5000,
      })
    } else {
      toast.success(`Block "${block.name}" moved to ${shiftedStartStr} – ${shiftedEndStr}`, {
        description: `Time shifted by ${shiftMinutes > 0 ? '+' : ''}${shiftMinutes} min`,
        duration: 3000,
      })
    }
    setShiftMinutes(0)
  }

  const handleCancel = () => {
    setShiftMinutes(0)
  }

  // Duration in hours and minutes
  const durHours = Math.floor(block.duration / 60)
  const durMins = block.duration % 60
  const durStr = durHours > 0 ? `${durHours}h ${durMins}m` : `${durMins}m`

  const isRejected = block.status === 'rejected'
  const currentStep = isRejected ? -1 : statusConfig.stepIndex

  const shiftAmounts = [
    { label: '1h', minutes: -60, icon: ChevronLeft },
    { label: '15m', minutes: -15, icon: ChevronLeft },
    { label: '15m', minutes: 15, icon: ChevronRight },
    { label: '1h', minutes: 60, icon: ChevronRight },
  ]

  return (
    <Card className="py-0 gap-0">
      <CardHeader className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold truncate">{block.name}</CardTitle>
          <Badge
            variant="outline"
            className={cn('rounded-full text-[10px] px-2 py-0 h-5 shrink-0', statusConfig.className)}
          >
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-3">
        {/* Block info grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <div className="space-y-0.5">
            <span className="text-muted-foreground">Section</span>
            <p className="font-medium">{block.section}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-muted-foreground">Line</span>
            <p className="font-medium capitalize">{block.line}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-muted-foreground">From</span>
            <p className="font-medium">{block.stationFrom}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-muted-foreground">To</span>
            <p className="font-medium">{block.stationTo}</p>
          </div>
        </div>

        {/* Time info */}
        <div className="flex items-center gap-3 bg-muted/40 rounded-md px-3 py-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs font-medium">
            {startStr} – {endStr}
          </span>
          <span className="text-xs text-muted-foreground">({durStr})</span>
        </div>

        {/* Time Shift Controls */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Reschedule Block</span>
            {shiftMinutes !== 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-[10px] h-5 px-1.5 text-muted-foreground"
                onClick={() => setShiftMinutes(0)}
              >
                <RotateCcw className="h-2.5 w-2.5 mr-0.5" />
                Reset
              </Button>
            )}
          </div>

          {/* Shift buttons */}
          <div className="flex items-center gap-1">
            {shiftAmounts.map(({ label, minutes, icon: ShiftIcon }) => (
              <Button
                key={`${label}-${minutes}`}
                variant="outline"
                size="sm"
                className={cn(
                  'text-[10px] h-7 px-2 gap-0.5 font-mono',
                  minutes < 0 ? 'pr-2' : 'pl-2',
                )}
                onClick={() => setShiftMinutes((prev) => prev + minutes)}
                disabled={isOutOfBounds && minutes > 0 && shiftMinutes > 0}
              >
                <ShiftIcon className="h-2.5 w-2.5" />
                {label}
              </Button>
            ))}
          </div>

          {/* Preview of shifted time */}
          <AnimatePresence mode="wait">
            {shiftMinutes !== 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -4, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div
                  className={cn(
                    'rounded-md px-3 py-2 space-y-1.5',
                    hasOverlap
                      ? 'bg-red-50 border border-red-200'
                      : isOutOfBounds
                        ? 'bg-amber-50 border border-amber-200'
                        : 'bg-[#e8eaf6] border border-[#9fa8da]',
                  )}
                >
                  <div className="flex items-center gap-2 text-xs">
                    <Clock className={cn(
                      'h-3 w-3 shrink-0',
                      hasOverlap ? 'text-red-500' : isOutOfBounds ? 'text-amber-500' : 'text-[#1a237e]',
                    )} />
                    <span className={cn(
                      'font-medium',
                      hasOverlap ? 'text-red-700' : isOutOfBounds ? 'text-amber-700' : 'text-[#0d47a1]',
                    )}>
                      {shiftedStartStr} – {shiftedEndStr}
                    </span>
                    <span className={cn(
                      'text-[10px]',
                      hasOverlap ? 'text-red-500' : isOutOfBounds ? 'text-amber-500' : 'text-[#1a237e]',
                    )}>
                      ({shiftMinutes > 0 ? '+' : ''}{shiftMinutes} min)
                    </span>
                  </div>

                  {/* Conflict warning */}
                  {hasOverlap && (
                    <div className="flex items-start gap-1.5 text-[10px]">
                      <AlertOctagon className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />
                      <span className="text-red-600">
                        Conflict with: {overlappingBlocks.map((b) => b.name).join(', ')}
                      </span>
                    </div>
                  )}

                  {/* Out of bounds warning */}
                  {isOutOfBounds && (
                    <div className="flex items-start gap-1.5 text-[10px]">
                      <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                      <span className="text-amber-600">
                        Shifted time crosses day boundary
                      </span>
                    </div>
                  )}

                  {/* Apply / Cancel */}
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      className={cn(
                        'text-[10px] h-6 px-3',
                        hasOverlap
                          ? 'bg-red-500 hover:bg-red-600 text-white'
                          : 'bg-[#283593] hover:bg-[#0d47a1] text-white',
                      )}
                      onClick={handleApply}
                      disabled={isOutOfBounds}
                    >
                      Apply
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[10px] h-6 px-3"
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Department */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Department:</span>
          <Badge
            variant="outline"
            className={cn(
              'rounded-full text-[10px] px-2 py-0 h-5 capitalize',
              DEPT_BADGE_COLORS[block.department] || DEPT_BADGE_COLORS.combined,
            )}
          >
            {block.department === 'snt' ? 'S&T' : block.department}
          </Badge>
        </div>

        <Separator />

        {/* Workflow stepper */}
        <div className="space-y-1.5">
          <span className="text-xs font-medium">Approval Workflow</span>
          <div className="flex items-center gap-0">
            {WORKFLOW_STEPS.map((step, i) => {
              const isCompleted = i < currentStep
              const isCurrent = i === currentStep
              const isRejection = isRejected && i === 0

              return (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-medium',
                        isCompleted && 'bg-emerald-500 text-white',
                        isCurrent && 'bg-[#1a237e] text-white ring-2 ring-[#1a237e]/30',
                        !isCompleted && !isCurrent && 'bg-muted text-muted-foreground',
                        isRejection && 'bg-red-100 text-red-500',
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-2.5 w-2.5" />
                      ) : isRejection ? (
                        <XCircle className="h-2.5 w-2.5" />
                      ) : (
                        <Circle className="h-2.5 w-2.5" />
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-[9px] mt-0.5 text-center leading-tight',
                        isCurrent ? 'text-foreground font-medium' : 'text-muted-foreground',
                      )}
                    >
                      {step}
                    </span>
                  </div>
                  {i < WORKFLOW_STEPS.length - 1 && (
                    <div
                      className={cn(
                        'h-px flex-1 mx-0.5 mt-[-10px]',
                        i < currentStep ? 'bg-emerald-500' : 'bg-border',
                      )}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <Separator />

        {/* Assigned maintenance requests */}
        <div className="space-y-1.5">
          <span className="text-xs font-medium">Maintenance Requests ({blockRequests.length})</span>
          {blockRequests.length === 0 ? (
            <p className="text-xs text-muted-foreground">No requests assigned</p>
          ) : (
            <ul className="space-y-1.5">
              {blockRequests.map((mr) => (
                <li
                  key={mr.id}
                  className="flex items-center gap-2 text-xs bg-muted/30 rounded-md px-2 py-1.5"
                >
                  <Wrench className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="truncate flex-1">{mr.title}</span>
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1 py-0 h-4 rounded-full shrink-0"
                  >
                    P{mr.priority}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Conflicts */}
        {blockConflicts.length > 0 && (
          <>
            <Separator />
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-red-600">
                Conflicts ({blockConflicts.length})
              </span>
              <ul className="space-y-1.5">
                {blockConflicts.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-start gap-2 text-xs bg-red-50 rounded-md px-2 py-1.5 border border-red-100"
                  >
                    <AlertTriangle className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-red-700 font-medium capitalize">
                        {c.type.replace('_', ' ')}
                      </span>
                      <p className="text-red-600 mt-0.5">{c.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          {block.status === 'recommended' && (
            <>
              <Button size="sm" className="text-xs h-8" onClick={onEdit} disabled={!onEdit}>
                Edit Block
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30"
                onClick={() => {
                  if (onReject) {
                    onReject()
                  } else {
                    toast.info('Reject action is not available here')
                  }
                }}
              >
                Reject
              </Button>
            </>
          )}
          {block.status === 'edited' && (
            <Button size="sm" className="text-xs h-8" onClick={() => onAdvance?.('verified')} disabled={!onAdvance}>
              Submit for Verification
            </Button>
          )}
          {block.status === 'verified' && (
            <Button size="sm" className="text-xs h-8" onClick={() => onAdvance?.('finalized')} disabled={!onAdvance}>
              Finalize Block
            </Button>
          )}
          {block.status === 'finalized' && (
            <Button size="sm" className="text-xs h-8" onClick={() => onAdvance?.('approved')} disabled={!onAdvance}>
              Submit for Approval
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="sm" className="text-xs h-8 ml-auto" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ApprovalStepper, getBlockWorkflowSteps, getPlanWorkflowSteps } from './approval-stepper'
import { useAppStore, type Role } from '@/store/app-store'
import { CheckCircle2, XCircle, Clock, User, ShieldCheck, Blocks, FileText, Calendar } from 'lucide-react'
import type { SimBlock, SimPlan } from '@/data/simulated-data'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface ApprovalItemProps {
  item: SimBlock | SimPlan
  type: 'block' | 'plan'
  onApprove?: (id: string) => void
  onReject?: (id: string, reason: string) => void
  /** Optional index for stagger animation */
  index?: number
}

// Determine which role is needed at each workflow stage
function getRequiredApprover(status: string): Role | null {
  switch (status) {
    case 'recommended':
      return 'planner'
    case 'edited':
      return 'engineering'
    case 'verified':
      return 'planner'
    case 'finalized':
      return 'control_office'
    default:
      return null
  }
}

function getAwaitingLabel(status: string): string {
  switch (status) {
    case 'recommended':
      return 'Planner Review'
    case 'edited':
      return 'Department Verification'
    case 'verified':
      return 'Planner Finalization'
    case 'finalized':
      return 'Control Office Review'
    case 'approved':
      return 'Fully Approved'
    case 'rejected':
      return 'Rejected'
    default:
      return status
  }
}

// Get the person who needs to act next (for avatar initials)
function getNextActorInitials(status: string): { initials: string; name: string } {
  switch (status) {
    case 'recommended':
      return { initials: 'JT', name: 'Jeet' }
    case 'edited':
      return { initials: 'DB', name: 'Debarshi' }
    case 'verified':
      return { initials: 'JT', name: 'Jeet' }
    case 'finalized':
      return { initials: 'CO', name: 'Control Office' }
    default:
      return { initials: '?', name: 'Unknown' }
  }
}

const BLOCK_STATUS_COLORS: Record<string, string> = {
  recommended: 'bg-[#e8eaf6] text-[#0d47a1] border-[#9fa8da]',
  edited: 'bg-sky-50 text-sky-700 border-sky-200',
  verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  finalized: 'bg-violet-50 text-violet-700 border-violet-200',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  rejected: 'bg-red-50 text-red-700 border-red-200',
}

// Left border accent colors per status
const STATUS_BORDER_COLORS: Record<string, string> = {
  recommended: 'border-l-[#1a237e]',
  edited: 'border-l-sky-500',
  verified: 'border-l-emerald-500',
  finalized: 'border-l-violet-500',
  approved: 'border-l-emerald-600',
  rejected: 'border-l-red-500',
}

// Department badge colors
const DEPARTMENT_COLORS: Record<string, string> = {
  engineering: 'bg-blue-50 text-blue-700 border-blue-200',
  snt: 'bg-[#e8eaf6] text-[#0d47a1] border-[#9fa8da]',
  traction: 'bg-amber-50 text-amber-700 border-amber-200',
  combined: 'bg-violet-50 text-violet-700 border-violet-200',
}

// Generate a pseudo-timestamp based on the item ID for display
function getTimestamp(item: SimBlock | SimPlan): string {
  // Use a deterministic date based on the item ID
  const hash = item.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const day = (hash % 28) + 1
  const hour = (hash % 12) + 8
  const min = hash % 60
  return `Jan ${day}, 2025 • ${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
}

export function ApprovalItem({ item, type, onApprove, onReject, index = 0 }: ApprovalItemProps) {
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const { currentRole } = useAppStore()

  const isBlock = type === 'block'
  const block = isBlock ? (item as SimBlock) : null
  const plan = !isBlock ? (item as SimPlan) : null

  const status = item.status
  const requiredApprover = getRequiredApprover(status)
  const canAct = requiredApprover === currentRole || currentRole === 'admin'
  const isApproved = status === 'approved'
  const isRejected = status === 'rejected'
  const nextActor = getNextActorInitials(status)

  const workflowSteps = isBlock
    ? getBlockWorkflowSteps(block!.status)
    : getPlanWorkflowSteps(plan!.status)

  const handleReject = () => {
    if (rejectReason.trim() && onReject) {
      onReject(item.id, rejectReason.trim())
      setRejectOpen(false)
      setRejectReason('')
    }
  }

  const department = isBlock ? block!.department : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
    >
      <Card className={cn(
        'border border-border border-l-4 transition-all duration-150',
        STATUS_BORDER_COLORS[status] || 'border-l-border',
        'hover:shadow-sm hover:border-border',
      )}>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            {/* Header row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className={cn('flex items-center justify-center w-9 h-9 rounded-lg shrink-0',
                  isBlock ? 'bg-sky-50' : 'bg-violet-50'
                )}>
                  {isBlock ? (
                    <Blocks className="w-4 h-4 text-sky-600" />
                  ) : (
                    <FileText className="w-4 h-4 text-violet-600" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate">{item.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-muted-foreground">
                      {isBlock ? `${block!.stationFrom} → ${block!.stationTo}` : `${plan!.startDate} → ${plan!.endDate}`}
                    </span>
                    {/* Department badge with color coding */}
                    {department && (
                      <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-4', DEPARTMENT_COLORS[department] ?? 'bg-muted/50 text-muted-foreground border-border')}>
                        {department === 'snt' ? 'S&T' : department.charAt(0).toUpperCase() + department.slice(1)}
                      </Badge>
                    )}
                    {!isBlock && plan!.type && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                        {plan!.type}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Status + awaiting badge + avatar */}
              <div className="flex items-center gap-2 shrink-0">
                {!isApproved && !isRejected && (
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-semibold">
                      {nextActor.initials}
                    </AvatarFallback>
                  </Avatar>
                )}
                <Badge
                  variant="outline"
                  className={cn('text-[11px] px-2 py-0.5', BLOCK_STATUS_COLORS[status] ?? 'bg-muted/50 text-muted-foreground border-border')}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Badge>
                {!isApproved && !isRejected && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-amber-50 text-amber-700 border-amber-200">
                    <Clock className="w-3 h-3 mr-1" />
                    {getAwaitingLabel(status)}
                  </Badge>
                )}
              </div>
            </div>

            {/* Timestamp display */}
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>{getTimestamp(item)}</span>
            </div>

            {/* Workflow stepper */}
            <div className="px-1">
              <ApprovalStepper steps={workflowSteps} />
            </div>

            {/* Action row */}
            {!isApproved && !isRejected && canAct && (
              <div className="flex items-center gap-2 pt-1 border-t border-border/50 mt-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-auto">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Your action required</span>
                </div>
                <Button
                  size="sm"
                  className="h-7 text-xs gap-1 focus-visible:ring-2 focus-visible:ring-offset-1"
                  onClick={() => onApprove?.(item.id)}
                  aria-label={`Approve ${item.id}`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:ring-2 focus-visible:ring-offset-1"
                  onClick={() => setRejectOpen(true)}
                  aria-label={`Reject ${item.id}`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Reject
                </Button>
              </div>
            )}

            {isApproved && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 pt-1 border-t border-border/50 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Fully approved</span>
              </div>
            )}

            {isRejected && (
              <div className="flex items-center gap-1.5 text-xs text-red-600 pt-1 border-t border-border/50 mt-1">
                <XCircle className="w-3.5 h-3.5" />
                <span>Rejected — requires revision</span>
              </div>
            )}
          </div>
        </CardContent>

        {/* Reject Dialog */}
        <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Reject {isBlock ? 'Block' : 'Plan'}</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting &ldquo;{item.name}&rdquo;. This will be recorded in the audit log.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-2">
                <Label htmlFor="reject-reason" className="text-sm">Rejection Reason</Label>
                <Textarea
                  id="reject-reason"
                  placeholder="Enter the reason for rejection..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={() => setRejectOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleReject}
                disabled={!rejectReason.trim()}
              >
                Confirm Rejection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    </motion.div>
  )
}

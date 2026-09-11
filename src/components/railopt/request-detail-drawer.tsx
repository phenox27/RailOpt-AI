'use client'

import { useState, useCallback } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatusBadge, type MaintenanceStatus } from './status-badge'
import { PriorityScore } from './priority-score'
import type { SimMaintenanceRequest, SimBlock } from '@/data/simulated-data'
import { toast } from 'sonner'
import {
  CheckCircle2, XCircle, Edit3, Brain, Clock, AlertTriangle, MapPin, Building2, Gauge,
  FileText, User, Send, MessageSquare, Sparkles, Users, ShieldCheck, CircleDot,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Department config
const DEPT_CONFIG = {
  engineering: { label: 'Engineering', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  snt: { label: 'Signal & Telecom', color: '#0EA5A4', bg: '#F0FDFA', border: '#99F6E4' },
  traction: { label: 'Traction Distribution', color: '#B77900', bg: '#FFFBEB', border: '#FDE68A' },
} as const

const LEVEL_LABEL: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

const LEVEL_DOT: Record<string, string> = {
  low: 'bg-emerald-400',
  medium: 'bg-amber-400',
  high: 'bg-orange-500',
  critical: 'bg-red-500',
}

// Status progression timeline definition
const STATUS_STEPS = [
  { key: 'pending', label: 'Created', icon: FileText, actor: 'System' },
  { key: 'scored', label: 'Priority Scored', icon: Sparkles, actor: 'AI Engine' },
  { key: 'assigned', label: 'Assigned', icon: Users, actor: 'Planner' },
  { key: 'verified', label: 'Verified', icon: ShieldCheck, actor: 'Verifier' },
] as const

// Comment type
interface TimelineComment {
  id: string
  author: string
  initials: string
  timestamp: string
  message: string
}

// Pre-populated realistic comments
function getInitialComments(request: SimMaintenanceRequest): TimelineComment[] {
  const base: TimelineComment[] = [
    {
      id: 'c1',
      author: 'System',
      initials: 'SY',
      timestamp: request.requestedDate,
      message: `Maintenance request created for ${request.section} — ${request.stationFrom} to ${request.stationTo}.`,
    },
  ]

  if (request.status === 'scored' || request.status === 'assigned' || request.status === 'verified') {
    base.push({
      id: 'c2',
      author: 'Jeet',
      initials: 'JT',
      timestamp: '2025-01-15T10:30:00',
      message: 'Priority adjusted due to safety concern. Severity factor weighted higher for this corridor section.',
    })
  }

  if (request.status === 'assigned' || request.status === 'verified') {
    base.push({
      id: 'c3',
      author: 'Debarshi',
      initials: 'DB',
      timestamp: '2025-01-16T09:15:00',
      message: 'Assigned to engineering team. Block window proposed for next available corridor slot.',
    })
  }

  if (request.status === 'verified') {
    base.push({
      id: 'c4',
      author: 'Rupam',
      initials: 'RP',
      timestamp: '2025-01-17T14:45:00',
      message: 'Verification pending signal team review. All safety checks passed preliminarily.',
    })
    base.push({
      id: 'c5',
      author: 'Alivia',
      initials: 'AL',
      timestamp: '2025-01-17T16:20:00',
      message: 'Verified and approved. Block scheduling confirmed with no train conflicts detected.',
    })
  }

  return base
}

// Status step index helper
function getStepIndex(status: string): number {
  const map: Record<string, number> = { pending: 0, scored: 1, assigned: 2, verified: 3, rejected: -1 }
  return map[status] ?? 0
}

// Map internal creator ids to team member names
const CREATOR_NAME_MAP: Record<string, string> = {
  'eng-anil': 'Debarshi',
  'eng-ramesh': 'Debarshi',
  'snt-priya': 'Rupam',
  'snt-amit': 'Rupam',
  'trac-vikram': 'Alivia',
  'trac-sunil': 'Alivia',
  'planner-rk': 'Jeet',
  'control-office': 'Diya',
  'admin': 'Dhittika',
}

interface RequestDetailDrawerProps {
  request: SimMaintenanceRequest | null
  open: boolean
  onOpenChange: (open: boolean) => void
  blocks?: SimBlock[]
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-4 py-1.5">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <div className="text-sm text-foreground text-right">{children}</div>
    </div>
  )
}

function FactorBar({ label, value }: { label: string; value: string }) {
  const pct: Record<string, number> = { low: 25, medium: 50, high: 75, critical: 100 }
  const color: Record<string, string> = { low: '#16A34A', medium: '#D97706', high: '#EA580C', critical: '#DC2626' }
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-medium text-foreground capitalize">{value}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-1.5 rounded-full transition-all"
          style={{ width: `${pct[value] ?? 0}%`, backgroundColor: color[value] ?? '#999' }}
        />
      </div>
    </div>
  )
}

export function RequestDetailDrawer({ request, open, onOpenChange, blocks = [] }: RequestDetailDrawerProps) {
  // Local state for current status (allows action button updates)
  const [currentStatus, setCurrentStatus] = useState<MaintenanceStatus>('pending')
  const [comments, setComments] = useState<TimelineComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [initialized, setInitialized] = useState(false)
  // Edit + Reject dialogs
  const [editOpen, setEditOpen] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDuration, setEditDuration] = useState('')
  const [localEdits, setLocalEdits] = useState<{ title?: string; duration?: number }>({})
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  // Initialize state when request changes
  const initRequest = useCallback(() => {
    if (request && !initialized) {
      setCurrentStatus(request.status as MaintenanceStatus)
      setComments(getInitialComments(request))
      setInitialized(true)
    }
    if (!request) {
      setInitialized(false)
    }
  }, [request, initialized])

  // Reset when request changes
  if (request && !initialized) {
    initRequest()
  }

  if (!request) return null

  const dept = DEPT_CONFIG[request.department]
  const assignedBlock = request.blockId ? blocks.find((b) => b.id === request.blockId) : null

  const formatDuration = (mins: number) => {
    if (mins >= 60) {
      const h = Math.floor(mins / 60)
      const m = mins % 60
      return m > 0 ? `${h}h ${m}m` : `${h}h`
    }
    return `${mins}m`
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const formatTimestamp = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true,
    })
  }

  // Timeline step index
  const stepIndex = getStepIndex(currentStatus)
  const isRejected = currentStatus === 'rejected'

  // Handle action button clicks
  const handleScorePriority = () => {
    setCurrentStatus('scored')
    setComments((prev) => [
      ...prev,
      {
        id: `c-${Date.now()}`,
        author: 'AI Engine',
        initials: 'AI',
        timestamp: new Date().toISOString(),
        message: 'Priority scoring completed. Score calculated based on severity, safety risk, asset criticality, and traffic impact factors.',
      },
    ])
  }

  const handleAssignDepartment = () => {
    setCurrentStatus('assigned')
    setComments((prev) => [
      ...prev,
      {
        id: `c-${Date.now()}`,
        author: 'Debarshi',
        initials: 'DB',
        timestamp: new Date().toISOString(),
        message: `Assigned to ${dept.label} department. Block window will be proposed by AI optimization engine.`,
      },
    ])
  }

  const handleMarkVerified = () => {
    setCurrentStatus('verified')
    setComments((prev) => [
      ...prev,
      {
        id: `c-${Date.now()}`,
        author: 'Rupam',
        initials: 'RP',
        timestamp: new Date().toISOString(),
        message: 'Verification completed. All safety and scheduling checks passed. Request is now verified.',
      },
    ])
  }

  const handleAddComment = () => {
    if (!newComment.trim()) return
    setComments((prev) => [
      ...prev,
      {
        id: `c-${Date.now()}`,
        author: 'Current User',
        initials: 'CU',
        timestamp: new Date().toISOString(),
        message: newComment.trim(),
      },
    ])
    setNewComment('')
  }

  const handleOpenEdit = () => {
    setEditTitle(localEdits.title ?? request.title)
    setEditDuration(String(localEdits.duration ?? request.duration))
    setEditOpen(true)
  }

  const handleSaveEdit = () => {
    const durationNum = parseInt(editDuration, 10)
    if (!editTitle.trim() || Number.isNaN(durationNum) || durationNum < 15 || durationNum > 1440) {
      toast.error('Invalid values', { description: 'Title is required and duration must be 15–1440 minutes.' })
      return
    }
    setLocalEdits({ title: editTitle.trim(), duration: durationNum })
    setComments((prev) => [
      ...prev,
      {
        id: `c-${Date.now()}`,
        author: 'Current User',
        initials: 'CU',
        timestamp: new Date().toISOString(),
        message: `Request updated — title revised, duration set to ${formatDuration(durationNum)}.`,
      },
    ])
    setEditOpen(false)
    toast.success('Request updated')
  }

  const handleConfirmReject = () => {
    const reason = rejectReason.trim() || 'No reason provided'
    setCurrentStatus('rejected')
    setComments((prev) => [
      ...prev,
      {
        id: `c-${Date.now()}`,
        author: 'Current User',
        initials: 'CU',
        timestamp: new Date().toISOString(),
        message: `Request rejected. Reason: ${reason}`,
      },
    ])
    setRejectOpen(false)
    setRejectReason('')
    toast.error('Request rejected', { description: reason })
  }

  // Action buttons based on status
  const canEdit = currentStatus !== 'verified' && currentStatus !== 'rejected'
  const effectiveTitle = localEdits.title ?? request.title
  const effectiveDuration = localEdits.duration ?? request.duration

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setInitialized(false) }}>
      <SheetContent side="right" className="sm:max-w-[480px] w-full overflow-y-auto p-0">
        <SheetHeader className="p-6 pb-3 border-b" >
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-lg leading-snug">{effectiveTitle}</SheetTitle>
              <SheetDescription className="text-sm mt-1">{request.id}</SheetDescription>
            </div>
            <StatusBadge status={currentStatus} />
          </div>
        </SheetHeader>

        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <p className="text-sm text-foreground/80 leading-relaxed">{request.description}</p>
          </div>

          {/* Department & Category */}
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="rounded-full text-xs font-medium px-2.5"
              style={{ color: dept.color, backgroundColor: dept.bg, borderColor: dept.border }}
            >
              <Building2 className="w-3 h-3 mr-1" />
              {dept.label}
            </Badge>
            <Badge variant="outline" className="rounded-full text-xs font-medium px-2.5 text-muted-foreground border-border bg-muted/50">
              {request.category}
            </Badge>
          </div>

          <Separator  />

          {/* ===== Status Progression Timeline ===== */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Status Timeline
            </h4>
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />

              {STATUS_STEPS.map((step, idx) => {
                const isCompleted = idx < stepIndex
                const isCurrent = idx === stepIndex && !isRejected
                const isFuture = idx > stepIndex || isRejected
                const StepIcon = step.icon

                return (
                  <motion.div
                    key={step.key}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: idx * 0.08 }}
                    className="relative flex items-start gap-3 pb-4 last:pb-0"
                  >
                    {/* Dot */}
                    <div className="relative z-10 mt-0.5">
                      {isCurrent ? (
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <StepIcon className="w-4 h-4 text-primary" />
                          </div>
                          {/* Pulsing ring */}
                          <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-30" />
                        </div>
                      ) : isCompleted ? (
                        <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-success" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center">
                          <CircleDot className="w-4 h-4 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${isFuture ? 'text-muted-foreground/50' : 'text-foreground'}`}>
                          {step.label}
                        </span>
                        {isCompleted && (
                          <span className="text-[10px] text-success font-medium">Done</span>
                        )}
                        {isCurrent && (
                          <span className="text-[10px] text-primary font-medium animate-pulse">In Progress</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs ${isFuture ? 'text-muted-foreground/40' : 'text-muted-foreground'}`}>
                          {step.actor}
                        </span>
                        {(isCompleted || isCurrent) && (
                          <span className="text-[10px] text-muted-foreground/60">
                            {formatTimestamp(
                              isCompleted
                                ? `2025-01-${String(14 + idx).padStart(2, '0')}T${String(9 + idx * 2).padStart(2, '0')}:${String(idx * 15).padStart(2, '0')}:00`
                                : new Date().toISOString()
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}

              {/* Rejected step (shown only when rejected) */}
              {isRejected && (
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: 0.4 }}
                  className="relative flex items-start gap-3"
                >
                  <div className="relative z-10 mt-0.5">
                    <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                      <XCircle className="w-4 h-4 text-destructive" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <span className="text-sm font-medium text-destructive">Rejected</span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Request was rejected — {formatTimestamp(new Date().toISOString())}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          <Separator  />

          {/* Priority Score */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5" />
              Priority Score
            </h4>
            <div className="flex items-center gap-3 mb-4">
              <PriorityScore
                score={request.priority}
                severity={request.severity}
                safetyRisk={request.safetyRisk}
                assetCriticality={request.assetCriticality}
                trafficImpact={request.trafficImpact}
                showLabel={false}
                size="md"
              />
              <span className="text-2xl font-bold tabular-nums" style={{
                color: request.priority >= 90 ? '#DC2626' : request.priority >= 75 ? '#EA580C' : request.priority >= 50 ? '#D97706' : '#16A34A'
              }}>
                {request.priority}
              </span>
              <span className="text-xs text-muted-foreground/60">/100</span>
            </div>
            <div className="space-y-2.5 bg-muted/50 rounded-lg p-3">
              <FactorBar label="Severity" value={request.severity} />
              <FactorBar label="Safety Risk" value={request.safetyRisk} />
              <FactorBar label="Asset Criticality" value={request.assetCriticality} />
              <FactorBar label="Traffic Impact" value={request.trafficImpact} />
            </div>
          </div>

          <Separator  />

          {/* Details */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Details
            </h4>
            <div className="bg-muted/50 rounded-lg p-3 space-y-0.5">
              <InfoRow label="Section">
                <span className="font-mono">{request.section}</span>
              </InfoRow>
              <InfoRow label="From">
                {request.stationFrom}
              </InfoRow>
              <InfoRow label="To">
                {request.stationTo}
              </InfoRow>
              <InfoRow label="Duration">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-muted-foreground/60" />
                  {formatDuration(effectiveDuration)}
                </span>
              </InfoRow>
              <InfoRow label="Requested">
                {formatDate(request.requestedDate)}
              </InfoRow>
              {request.isOverdue && (
                <InfoRow label="Overdue">
                  <span className="text-red-600 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Yes
                  </span>
                </InfoRow>
              )}
              <InfoRow label="Created By">
                <span className="text-xs">{CREATOR_NAME_MAP[request.createdBy] ?? request.createdBy}</span>
              </InfoRow>
            </div>
          </div>

          {/* AI Recommendation */}
          {assignedBlock && (
            <>
              <Separator  />
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5" />
                  AI Recommendation
                </h4>
                <div className="bg-[#e8eaf6] border border-[#9fa8da] rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#1a237e]">{assignedBlock.name}</span>
                    <Badge variant="outline" className="rounded-full text-[10px] px-1.5 bg-teal-100 text-[#0d47a1] border-[#5c6bc0]">
                      {Math.round(assignedBlock.aiConfidence * 100)}% confidence
                    </Badge>
                  </div>
                  <p className="text-xs text-[#0d47a1] leading-relaxed">{assignedBlock.aiReasoning}</p>
                  <div className="flex items-center gap-2 text-[11px] text-[#283593]">
                    <Clock className="w-3 h-3" />
                    {new Date(assignedBlock.startTime).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    {' — '}
                    {new Date(assignedBlock.endTime).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Risk Factors Summary */}
          <Separator  />
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Risk Assessment
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {([
                { label: 'Severity', value: request.severity },
                { label: 'Safety', value: request.safetyRisk },
                { label: 'Asset', value: request.assetCriticality },
                { label: 'Traffic', value: request.trafficImpact },
              ] as const).map((item) => (
                <div key={item.label} className="flex items-center gap-2 bg-muted/50 rounded-md px-2.5 py-2">
                  <div className={`w-2 h-2 rounded-full ${LEVEL_DOT[item.value]}`} />
                  <span className="text-[11px] text-muted-foreground">{item.label}</span>
                  <span className="text-xs font-medium text-foreground capitalize ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator  />

          {/* ===== Comments / Activity Log ===== */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              Activity & Comments
            </h4>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              <AnimatePresence mode="popLayout">
                {comments.map((comment) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                    className="flex gap-2.5"
                  >
                    {/* Avatar */}
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 text-[10px] font-semibold text-muted-foreground">
                      {comment.initials}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-foreground">{comment.author}</span>
                        <span className="text-[10px] text-muted-foreground/60">
                          {formatTimestamp(comment.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/80 leading-relaxed mt-0.5">
                        {comment.message}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Add Comment Input */}
            <div className="flex items-center gap-2 mt-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment() }}
                  placeholder="Add a comment..."
                  className="w-full h-9 px-3 pr-10 text-xs bg-muted/50 border border-border rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ===== Action Buttons ===== */}
        <SheetFooter className="p-6 pt-4 border-t bg-muted/50/50 print:hidden" >
          <div className="flex gap-2 w-full">
            {/* Status-specific action buttons */}
            {currentStatus === 'pending' && (
              <Button className="flex-1" size="sm" onClick={handleScorePriority} style={{ backgroundColor: '#0EA5A4' }}>
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Score Priority
              </Button>
            )}
            {currentStatus === 'scored' && (
              <Button className="flex-1" size="sm" onClick={handleAssignDepartment} style={{ backgroundColor: '#2563EB' }}>
                <Users className="w-3.5 h-3.5 mr-1.5" />
                Assign to Dept
              </Button>
            )}
            {currentStatus === 'assigned' && (
              <Button className="flex-1" size="sm" onClick={handleMarkVerified} style={{ backgroundColor: '#16A34A' }}>
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                Mark Verified
              </Button>
            )}
            {canEdit && currentStatus !== 'pending' && currentStatus !== 'scored' && currentStatus !== 'assigned' && (
              <Button variant="outline" className="flex-1" size="sm" onClick={handleOpenEdit}>
                <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                Edit
              </Button>
            )}
            {currentStatus !== 'verified' && currentStatus !== 'rejected' && (
              <Button variant="destructive" className="flex-1" size="sm" onClick={() => setRejectOpen(true)}>
                <XCircle className="w-3.5 h-3.5 mr-1.5" />
                Reject
              </Button>
            )}
          </div>
        </SheetFooter>
      </SheetContent>

      {/* Edit Request Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-base">Edit Request</DialogTitle>
            <DialogDescription className="text-xs">
              Update the request title and estimated duration. Changes are logged in the activity feed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="edit-title" className="text-xs font-medium">Title</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-sm h-9"
                placeholder="Request title"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-duration" className="text-xs font-medium">Duration (minutes, 15–1440)</Label>
              <Input
                id="edit-duration"
                type="number"
                min={15}
                max={1440}
                value={editDuration}
                onChange={(e) => setEditDuration(e.target.value)}
                className="text-sm h-9"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSaveEdit} style={{ backgroundColor: '#0EA5A4' }}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Request Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-base text-destructive">Reject Request</DialogTitle>
            <DialogDescription className="text-xs">
              Provide a reason for rejecting this maintenance request. The reason will be recorded in the activity feed.
            </DialogDescription>
          </DialogHeader>
          <div className="py-1">
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Conflicts with scheduled Rajdhani movement; re-submit after Holi week."
              rows={3}
              className="text-sm"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={handleConfirmReject}>
              <XCircle className="w-3.5 h-3.5 mr-1.5" />
              Confirm Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  )
}

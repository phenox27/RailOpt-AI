'use client'

import { useState, useMemo, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ApprovalStepper, getBlockWorkflowSteps, getPlanWorkflowSteps } from './approval-stepper'
import { ApprovalItem } from './approval-item'
import { ApprovalTimeline } from './approval-timeline'
import { blocks, plans, type SimBlock, type SimPlan } from '@/data/simulated-data'
import { useAppStore, type Role } from '@/store/app-store'
import { ShieldCheck, Clock, CheckCircle2, XCircle, List, GitBranch, CheckCheck, XSquare, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useIsMobile } from '@/hooks/use-mobile'
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
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Undo2 } from 'lucide-react'

type ApprovalTab = 'my-action' | 'dept-verification' | 'control-office' | 'all' | 'timeline'

function getRequiredApproverRole(status: string): Role | null {
  switch (status) {
    case 'recommended': return 'planner'
    case 'edited': return 'engineering'
    case 'verified': return 'planner'
    case 'finalized': return 'control_office'
    default: return null
  }
}

function getApprovalCategory(status: string): 'my-action' | 'dept-verification' | 'control-office' | 'done' | null {
  switch (status) {
    case 'recommended':
    case 'verified': return 'my-action'
    case 'edited': return 'dept-verification'
    case 'finalized': return 'control-office'
    case 'approved':
    case 'rejected': return 'done'
    default: return null
  }
}

const workflowStages = [
  { label: 'AI Engine', color: 'bg-[#1a237e]', nextColor: 'bg-[#3f51b5]' },
  { label: 'Planner Review', color: 'bg-sky-500', nextColor: 'bg-sky-400' },
  { label: 'Dept Verification', color: 'bg-amber-500', nextColor: 'bg-amber-400' },
  { label: 'Planner Finalize', color: 'bg-violet-500', nextColor: 'bg-violet-400' },
  { label: 'Control Office', color: 'bg-emerald-500', nextColor: '' },
]

export function ApprovalsView() {
  const { currentRole } = useAppStore()
  const [activeTab, setActiveTab] = useState<ApprovalTab>('my-action')
  const [viewMode, setViewMode] = useState<'card' | 'timeline'>('card')
  const [localBlocks, setLocalBlocks] = useState<SimBlock[]>(blocks)
  const [localPlans, setLocalPlans] = useState<SimPlan[]>(plans)
  const isMobile = useIsMobile()

  // Batch action state
  const [batchConfirmOpen, setBatchConfirmOpen] = useState<'approve' | 'reject' | null>(null)
  const [batchRejectReason, setBatchRejectReason] = useState('')
  const [batchProcessing, setBatchProcessing] = useState(false)

  const pendingBlocks = useMemo(() => localBlocks.filter(b => b.status !== 'approved' && b.status !== 'rejected'), [localBlocks])
  const pendingPlans = useMemo(() => localPlans.filter(p => p.status !== 'approved' && p.status !== 'rejected'), [localPlans])

  const approvedCount = useMemo(() =>
    localBlocks.filter(b => b.status === 'approved').length + localPlans.filter(p => p.status === 'approved').length,
    [localBlocks, localPlans]
  )
  const rejectedCount = useMemo(() =>
    localBlocks.filter(b => b.status === 'rejected').length + localPlans.filter(p => p.status === 'rejected').length,
    [localBlocks, localPlans]
  )
  const totalItems = localBlocks.length + localPlans.length
  const pendingCount = totalItems - approvedCount - rejectedCount
  const approvalProgress = totalItems > 0 ? Math.round((approvedCount / totalItems) * 100) : 0

  const myActionItems = useMemo(() => {
    const items: { item: SimBlock | SimPlan; type: 'block' | 'plan' }[] = []
    pendingBlocks.forEach(b => {
      if (getApprovalCategory(b.status) === 'my-action') {
        const required = getRequiredApproverRole(b.status)
        if (required === currentRole || currentRole === 'admin') items.push({ item: b, type: 'block' })
      }
    })
    pendingPlans.forEach(p => {
      if (getApprovalCategory(p.status) === 'my-action') {
        const required = getRequiredApproverRole(p.status)
        if (required === currentRole || currentRole === 'admin') items.push({ item: p, type: 'plan' })
      }
    })
    return items
  }, [pendingBlocks, pendingPlans, currentRole])

  const deptVerificationItems = useMemo(() => {
    return pendingBlocks
      .filter(b => getApprovalCategory(b.status) === 'dept-verification')
      .map(b => ({ item: b as SimBlock | SimPlan, type: 'block' as const }))
  }, [pendingBlocks])

  const controlOfficeItems = useMemo(() => {
    const items: { item: SimBlock | SimPlan; type: 'block' | 'plan' }[] = []
    pendingBlocks.forEach(b => { if (getApprovalCategory(b.status) === 'control-office') items.push({ item: b, type: 'block' }) })
    pendingPlans.forEach(p => { if (getApprovalCategory(p.status) === 'control-office') items.push({ item: p, type: 'plan' }) })
    return items
  }, [pendingBlocks, pendingPlans])

  const allItems = useMemo(() => {
    const items: { item: SimBlock | SimPlan; type: 'block' | 'plan' }[] = []
    localBlocks.forEach(b => items.push({ item: b, type: 'block' }))
    localPlans.forEach(p => items.push({ item: p, type: 'plan' }))
    return items
  }, [localBlocks, localPlans])

  const currentItems = useMemo(() => {
    switch (activeTab) {
      case 'my-action': return myActionItems
      case 'dept-verification': return deptVerificationItems
      case 'control-office': return controlOfficeItems
      case 'all': return allItems
    }
  }, [activeTab, myActionItems, deptVerificationItems, controlOfficeItems, allItems])

  const handleApprove = useCallback((id: string) => {
    setLocalBlocks(prev => prev.map(b => {
      if (b.id !== id) return b
      const nextStatus: Record<string, SimBlock['status']> = { recommended: 'edited', edited: 'verified', verified: 'finalized', finalized: 'approved' }
      return { ...b, status: nextStatus[b.status] ?? b.status }
    }))
    setLocalPlans(prev => prev.map(p => {
      if (p.id !== id) return p
      const nextStatus: Record<string, SimPlan['status']> = { recommended: 'reviewed', reviewed: 'verified', verified: 'finalized', finalized: 'approved' }
      return { ...p, status: nextStatus[p.status] ?? p.status }
    }))
  }, [])

  const handleReject = useCallback((id: string, _reason: string) => {
    setLocalBlocks(prev => prev.map(b => b.id === id ? { ...b, status: 'rejected' as const } : b))
    setLocalPlans(prev => prev.map(p => p.id === id ? { ...p, status: 'rejected' as const } : p))
  }, [])

  // Batch approve all pending items (with undo)
  const handleBatchApprove = useCallback(() => {
    setBatchProcessing(true)
    const itemsToProcess = currentItems.filter(({ item }) => item.status !== 'approved' && item.status !== 'rejected')
    // Snapshot current state so the batch can be undone
    const snapshotBlocks = localBlocks
    const snapshotPlans = localPlans
    const undoBatch = () => {
      setLocalBlocks(snapshotBlocks)
      setLocalPlans(snapshotPlans)
      toast.info('Batch approval undone', { description: 'All items restored to their previous status' })
    }
    setTimeout(() => {
      itemsToProcess.forEach(({ item }) => {
        handleApprove(item.id)
      })
      setBatchProcessing(false)
      setBatchConfirmOpen(null)
      toast.success(`${itemsToProcess.length} item${itemsToProcess.length === 1 ? '' : 's'} approved`, {
        description: 'Advanced to the next workflow stage',
        action: { label: 'Undo', icon: <Undo2 className="h-3.5 w-3.5" />, onClick: undoBatch },
        duration: 8000,
      })
    }, 600)
  }, [currentItems, handleApprove, localBlocks, localPlans])

  // Batch reject all pending items (with undo)
  const handleBatchReject = useCallback(() => {
    if (!batchRejectReason.trim()) return
    setBatchProcessing(true)
    const itemsToProcess = currentItems.filter(({ item }) => item.status !== 'approved' && item.status !== 'rejected')
    const snapshotBlocks = localBlocks
    const snapshotPlans = localPlans
    const undoBatch = () => {
      setLocalBlocks(snapshotBlocks)
      setLocalPlans(snapshotPlans)
      toast.info('Batch rejection undone', { description: 'All items restored to their previous status' })
    }
    setTimeout(() => {
      itemsToProcess.forEach(({ item }) => {
        handleReject(item.id, batchRejectReason.trim())
      })
      setBatchProcessing(false)
      setBatchRejectReason('')
      setBatchConfirmOpen(null)
      toast.success(`${itemsToProcess.length} item${itemsToProcess.length === 1 ? '' : 's'} rejected`, {
        description: `Reason: “${batchRejectReason.trim().slice(0, 80)}”`,
        action: { label: 'Undo', icon: <Undo2 className="h-3.5 w-3.5" />, onClick: undoBatch },
        duration: 8000,
      })
    }, 600)
  }, [currentItems, handleReject, batchRejectReason, localBlocks, localPlans])

  const batchableCount = currentItems.filter(({ item }) => item.status !== 'approved' && item.status !== 'rejected').length

  const exampleSteps = getBlockWorkflowSteps('recommended')

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 pt-4 sm:pt-6 pb-2 gap-2"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-50 shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">Approvals</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground">
                <span className="text-emerald-600 font-medium">{approvedCount}</span> approved,
                {' '}<span className="text-amber-600 font-medium">{pendingCount}</span> pending,
                {' '}<span className="text-red-600 font-medium">{rejectedCount}</span> rejected
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
            <Clock className="w-3 h-3 mr-1" />
            {myActionItems.length} awaiting you
          </Badge>
          <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
            <Button variant={viewMode === 'card' ? 'secondary' : 'ghost'} size="sm" className="h-7 w-7 p-0" onClick={() => setViewMode('card')}>
              <List className="h-3.5 w-3.5" />
            </Button>
            <Button variant={viewMode === 'timeline' ? 'secondary' : 'ghost'} size="sm" className="h-7 w-7 p-0" onClick={() => setViewMode('timeline')}>
              <GitBranch className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Progress bar */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05 }}
        className="px-4 sm:px-6 pb-2"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground shrink-0">Approval Progress</span>
          <div className="flex-1">
            <Progress value={approvalProgress} className="h-2" />
          </div>
          <span className="text-xs font-bold text-foreground tabular-nums">{approvalProgress}%</span>
        </div>
      </motion.div>

      {/* Batch action buttons */}
      {batchableCount > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.08 }}
          className="px-4 sm:px-6 pb-2"
        >
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 min-h-[44px] sm:h-7 text-xs gap-1.5 font-medium text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
              onClick={() => setBatchConfirmOpen('approve')}
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Approve All ({batchableCount})
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 min-h-[44px] sm:h-7 text-xs gap-1.5 font-medium text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
              onClick={() => setBatchConfirmOpen('reject')}
            >
              <XSquare className="w-3.5 h-3.5" />
              Reject All ({batchableCount})
            </Button>
          </div>
        </motion.div>
      )}

      {/* Workflow visualization */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.1 }} className="px-4 sm:px-6 py-3">
        <Card className="border border-border bg-muted/30 shadow-sm glass-card">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Approval Workflow
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {isMobile ? (
              <div className="flex flex-col items-start gap-0 mt-2 ml-1">
                {workflowStages.map((stage, idx) => (
                  <div key={stage.label} className="flex items-center gap-3">
                    {idx > 0 && <div className={cn('w-1 h-4 ml-[15px] rounded-full workflow-line-pulse', workflowStages[idx - 1].nextColor)} />}
                    <div className="flex items-center gap-3">
                      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm shrink-0 backdrop-blur-sm bg-opacity-90', stage.color)}>
                        {idx + 1}
                      </div>
                      <span className="text-[11px] font-medium text-muted-foreground">{stage.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-0 mt-2">
                {workflowStages.map((stage, idx) => (
                  <div key={stage.label} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm backdrop-blur-sm', stage.color)}>
                        {idx + 1}
                      </div>
                      <span className="text-[10px] mt-1.5 text-center leading-tight font-medium text-muted-foreground">
                        {stage.label}
                      </span>
                    </div>
                    {idx < workflowStages.length - 1 && (
                      <div className={cn('h-1 flex-1 min-w-6 -mt-4 rounded-full workflow-line-pulse', stage.nextColor)} />
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3">
              <ApprovalStepper steps={exampleSteps} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <div className="px-4 sm:px-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ApprovalTab)}>
          <div className="overflow-x-auto shrink-0 -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="h-9">
              <TabsTrigger value="my-action" className="text-xs gap-1.5 whitespace-nowrap">
                Pending My Action
                {myActionItems.length > 0 && (
                  <Badge className="ml-1 h-4 px-1.5 text-[10px]">{myActionItems.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="dept-verification" className="text-xs gap-1.5 whitespace-nowrap">
                Dept. Verification
                {deptVerificationItems.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">{deptVerificationItems.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="control-office" className="text-xs gap-1.5 whitespace-nowrap">
                Control Office
                {controlOfficeItems.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">{controlOfficeItems.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="all" className="text-xs whitespace-nowrap">
                All
              </TabsTrigger>
              <TabsTrigger value="timeline" className="text-xs gap-1.5 whitespace-nowrap">
                Timeline
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab content with stagger animation */}
          <div className="mt-4">
            {activeTab === 'timeline' ? (
              <motion.div
                key="timeline-view"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <ApprovalTimeline />
              </motion.div>
            ) : (
            <AnimatePresence mode="wait">
              {currentItems.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-12 sm:py-16 text-center"
                >
                  <CheckCircle2 className="w-12 h-12 text-emerald-300 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No items in this category</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">All items have been processed</p>
                </motion.div>
              ) : viewMode === 'card' ? (
                <motion.div
                  key={`card-${activeTab}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-3 pb-6"
                >
                  {currentItems.map(({ item, type }, idx) => (
                    <ApprovalItem key={item.id} item={item} type={type} onApprove={handleApprove} onReject={handleReject} index={idx} />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key={`timeline-${activeTab}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative pb-6"
                >
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />
                  {currentItems.map(({ item, type }, idx) => {
                    const status = item.status
                    const dotColor = status === 'approved' ? 'bg-emerald-500' : status === 'rejected' ? 'bg-red-500' : 'bg-amber-500'
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: idx * 0.05 }}
                        className="flex items-start gap-4 mb-4 relative"
                      >
                        <div className={cn('w-3 h-3 rounded-full mt-1.5 shrink-0 z-10 ring-4 ring-background', dotColor)} />
                        <div className="flex-1">
                          <ApprovalItem item={item} type={type} onApprove={handleApprove} onReject={handleReject} index={idx} />
                        </div>
                      </motion.div>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
            )}
          </div>
        </Tabs>
      </div>

      {/* Batch Approve Confirmation Dialog */}
      <Dialog open={batchConfirmOpen === 'approve'} onOpenChange={(open) => !open && setBatchConfirmOpen(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve All Items</DialogTitle>
            <DialogDescription>
              This will advance all {batchableCount} pending items to their next approval stage. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setBatchConfirmOpen(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleBatchApprove} disabled={batchProcessing} className="gap-1.5">
              {batchProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
              Confirm Approve All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Reject Confirmation Dialog with Reason */}
      <Dialog open={batchConfirmOpen === 'reject'} onOpenChange={(open) => { if (!open) { setBatchConfirmOpen(null); setBatchRejectReason('') } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject All Items</DialogTitle>
            <DialogDescription>
              This will reject all {batchableCount} pending items. Please provide a reason that will be recorded for all items.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="batch-reject-reason" className="text-sm">Rejection Reason</Label>
              <Textarea
                id="batch-reject-reason"
                placeholder="Enter the reason for rejecting all items..."
                value={batchRejectReason}
                onChange={(e) => setBatchRejectReason(e.target.value)}
                rows={3}
                className="text-sm"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => { setBatchConfirmOpen(null); setBatchRejectReason('') }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBatchReject}
              disabled={batchProcessing || !batchRejectReason.trim()}
              className="gap-1.5"
            >
              {batchProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XSquare className="w-3.5 h-3.5" />}
              Confirm Reject All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

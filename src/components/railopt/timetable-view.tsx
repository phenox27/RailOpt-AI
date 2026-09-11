'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { TrainTimetable } from './train-timetable'
import { ConflictList } from './conflict-list'
import { ConflictImpactPanel } from './conflict-impact-panel'
import { ConflictResolutionWorkflow } from './conflict-resolution-workflow'
import { TrainFront, AlertTriangle, AlertOctagon, Zap, Users, Package, Info } from 'lucide-react'
import { BlockConflictVisualizer } from './block-conflict-visualizer'
import { conflicts, trains, type SimConflict } from '@/data/simulated-data'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'

type TrainTypeFilter = 'all' | 'express' | 'passenger' | 'goods'
type SeverityFilter = 'all' | 'critical' | 'warning' | 'info'

export function TimetableView() {
  const [trainTypeFilter, setTrainTypeFilter] = useState<TrainTypeFilter>('all')
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all')
  const [localConflicts, setLocalConflicts] = useState<SimConflict[]>(conflicts)
  const [selectedConflict, setSelectedConflict] = useState<SimConflict | null>(null)
  const [selectedConflictForWorkflow, setSelectedConflictForWorkflow] = useState<SimConflict | null>(null)
  const [workflowOpen, setWorkflowOpen] = useState(false)
  const isMobile = useIsMobile()

  const handleConflictSelect = (conflict: SimConflict) => {
    setSelectedConflict(conflict)
  }

  const handleCloseImpactPanel = () => {
    setSelectedConflict(null)
  }

  const unresolvedConflicts = useMemo(() => localConflicts.filter(c => !c.resolved), [localConflicts])

  const trainCounts = useMemo(() => ({
    total: trains.length,
    express: trains.filter(t => t.type === 'express').length,
    passenger: trains.filter(t => t.type === 'passenger').length,
    goods: trains.filter(t => t.type === 'goods').length,
  }), [])

  const handleResolve = (id: string) => {
    setLocalConflicts(prev => prev.map(c => c.id === id ? { ...c, resolved: true } : c))
  }

  const handleOpenWorkflow = (conflict: SimConflict) => {
    setSelectedConflictForWorkflow(conflict)
    setWorkflowOpen(true)
  }

  const handleWorkflowResolved = (id: string) => {
    setLocalConflicts(prev => prev.map(c => c.id === id ? { ...c, resolved: true } : c))
  }

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
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#e8eaf6] shrink-0">
            <TrainFront className="w-5 h-5 text-[#283593]" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">Timetable & Conflicts</h1>
            <p className="text-sm text-muted-foreground">Train schedules and detected conflicts</p>
          </div>
        </div>
        {unresolvedConflicts.length > 0 && (
          <div className="flex items-center gap-1.5 bg-red-50 rounded-md px-3 py-1.5 border border-red-100 self-start">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            <span className="text-xs font-medium text-red-700">{unresolvedConflicts.length} unresolved conflicts</span>
          </div>
        )}
      </motion.div>

      {/* Summary bar */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05 }}
        className="px-4 sm:px-6 pb-2"
      >
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Total trains */}
          <div className="flex items-center gap-1.5 bg-muted/50 rounded-md px-2.5 py-1.5 border border-border/50">
            <TrainFront className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">Total</span>
            <span className="text-xs font-semibold text-foreground tabular-nums">{trainCounts.total}</span>
          </div>
          {/* Express */}
          <div className="flex items-center gap-1.5 bg-[#e8eaf6] rounded-md px-2.5 py-1.5 border border-teal-100">
            <Zap className="w-3.5 h-3.5 text-[#1a237e]" />
            <span className="text-[11px] text-[#283593]">Express</span>
            <span className="text-xs font-semibold text-[#1a237e] tabular-nums">{trainCounts.express}</span>
          </div>
          {/* Passenger */}
          <div className="flex items-center gap-1.5 bg-sky-50 rounded-md px-2.5 py-1.5 border border-sky-100">
            <Users className="w-3.5 h-3.5 text-sky-500" />
            <span className="text-[11px] text-sky-600">Passenger</span>
            <span className="text-xs font-semibold text-sky-800 tabular-nums">{trainCounts.passenger}</span>
          </div>
          {/* Freight */}
          <div className="flex items-center gap-1.5 bg-amber-50 rounded-md px-2.5 py-1.5 border border-amber-100">
            <Package className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[11px] text-amber-600">Freight</span>
            <span className="text-xs font-semibold text-amber-800 tabular-nums">{trainCounts.goods}</span>
          </div>
          {/* Unresolved conflicts */}
          {unresolvedConflicts.length > 0 && (
            <div className="flex items-center gap-1.5 bg-red-50 rounded-md px-2.5 py-1.5 border border-red-100">
              <AlertOctagon className="w-3.5 h-3.5 text-red-500" />
              <span className="text-[11px] text-red-600">Unresolved</span>
              <span className="text-xs font-semibold text-red-800 tabular-nums">{unresolvedConflicts.length}</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Block Conflict Visualization */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08 }}
        className="px-4 sm:px-6"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-red-50 dark:bg-red-950/40 shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">Block Conflict Visualization / ब्लॉक विरोध दृश्य</h2>
        </div>
        <BlockConflictVisualizer />
      </motion.div>

      {/* Main content area with optional impact panel */}
      <div className="flex-1 min-h-0 px-4 sm:px-6 pb-4 sm:pb-6 flex gap-3 sm:gap-4 overflow-auto">
        {/* Left: Two-panel layout (Timetable + Conflicts) */}
        <div className={cn(
          'grid gap-3 sm:gap-4 flex-1 min-w-0',
          selectedConflict && !isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'
        )}>
          {/* Train Timetable */}
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex flex-col min-h-0"
          >
            <Card className="flex flex-col min-h-0 border border-border flex-1">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrainFront className="w-4 h-4 text-[#283593]" />
                  Train Timetable
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 px-4 pb-4 overflow-auto">
                <TrainTimetable
                  typeFilter={trainTypeFilter}
                  onTypeFilterChange={setTrainTypeFilter}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Conflict List */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex flex-col min-h-0"
          >
            <Card className="flex flex-col min-h-0 border border-border flex-1">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Conflict List
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 px-4 pb-4 overflow-auto">
                <ConflictList
                  severityFilter={severityFilter}
                  onSeverityFilterChange={setSeverityFilter}
                  onResolve={handleResolve}
                  localConflicts={localConflicts}
                  onConflictsChange={setLocalConflicts}
                  onConflictSelect={handleConflictSelect}
                  onOpenWorkflow={handleOpenWorkflow}
                />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Impact Panel — Desktop only (right side panel) */}
        <AnimatePresence>
          {selectedConflict && !isMobile && (
            <motion.div
              key="impact-panel"
              initial={{ opacity: 0, x: 24, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 380 }}
              exit={{ opacity: 0, x: 24, width: 0 }}
              transition={{ duration: 0.25 }}
              className="shrink-0 overflow-hidden border border-border rounded-lg bg-background shadow-md"
            >
              <ConflictImpactPanel conflict={selectedConflict} onClose={handleCloseImpactPanel} onOpenWorkflow={handleOpenWorkflow} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Conflict Resolution Workflow Dialog */}
      <ConflictResolutionWorkflow
        conflict={selectedConflictForWorkflow}
        open={workflowOpen}
        onOpenChange={setWorkflowOpen}
        onResolved={handleWorkflowResolved}
      />

      {/* Impact Panel — Mobile (Sheet / drawer) */}
      <Sheet open={!!selectedConflict && isMobile} onOpenChange={(open) => { if (!open) handleCloseImpactPanel() }}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-auto">
          <SheetHeader className="sr-only">
            <SheetTitle>Conflict Impact Analysis</SheetTitle>
            <SheetDescription>Detailed impact analysis for the selected conflict</SheetDescription>
          </SheetHeader>
          {selectedConflict && (
            <ConflictImpactPanel conflict={selectedConflict} onClose={handleCloseImpactPanel} onOpenWorkflow={handleOpenWorkflow} />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

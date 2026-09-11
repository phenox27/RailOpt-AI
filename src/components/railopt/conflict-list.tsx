'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { conflicts, blocks, type SimConflict } from '@/data/simulated-data'
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  TrainFront,
  ShieldAlert,
  Ban,
  Filter,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

type SeverityFilter = 'all' | 'critical' | 'warning' | 'info'
type TypeFilter = 'all' | 'train_conflict' | 'department_conflict' | 'corridor_unavailable' | 'safety_violation'
type ResolvedFilter = 'all' | 'unresolved' | 'resolved'

const SEVERITY_CONFIG: Record<string, { icon: typeof AlertOctagon; color: string; bgColor: string; borderColor: string }> = {
  critical: {
    icon: AlertOctagon,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-l-red-500',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-l-amber-500',
  },
  info: {
    icon: Info,
    color: 'text-[#283593]',
    bgColor: 'bg-[#e8eaf6]',
    borderColor: 'border-l-[#1a237e]',
  },
}

const TYPE_CONFIG: Record<string, { label: string; icon: typeof TrainFront }> = {
  train_conflict: { label: 'Train Conflict', icon: TrainFront },
  department_conflict: { label: 'Dept. Conflict', icon: ShieldAlert },
  corridor_unavailable: { label: 'Corridor Unavailable', icon: Ban },
  safety_violation: { label: 'Safety Violation', icon: AlertOctagon },
}

const SEVERITY_BADGE: Record<string, string> = {
  critical: 'bg-red-50 text-red-700 border-red-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  info: 'bg-[#e8eaf6] text-[#0d47a1] border-[#9fa8da]',
}

// Severity pill config for external filter
const SEVERITY_PILLS: { value: SeverityFilter; label: string; color: string }[] = [
  { value: 'critical', label: 'Critical', color: 'bg-red-50 text-red-700 border-red-200' },
  { value: 'warning', label: 'Warning', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'info', label: 'Info', color: 'bg-[#e8eaf6] text-[#0d47a1] border-[#9fa8da]' },
]

interface ConflictListProps {
  severityFilter?: SeverityFilter
  onSeverityFilterChange?: (filter: SeverityFilter) => void
  onResolve?: (id: string) => void
  localConflicts?: SimConflict[]
  onConflictsChange?: (conflicts: SimConflict[]) => void
  onConflictSelect?: (conflict: SimConflict) => void
  onOpenWorkflow?: (conflict: SimConflict) => void
}

export function ConflictList({
  severityFilter: externalSeverityFilter,
  onSeverityFilterChange,
  onResolve,
  localConflicts: externalConflicts,
  onConflictsChange,
  onConflictSelect,
  onOpenWorkflow,
}: ConflictListProps) {
  const [internalSeverityFilter, setInternalSeverityFilter] = useState<SeverityFilter>('all')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [resolvedFilter, setResolvedFilter] = useState<ResolvedFilter>('unresolved')
  const [internalConflicts, setInternalConflicts] = useState<SimConflict[]>(conflicts)
  const [selectedConflict, setSelectedConflict] = useState<SimConflict | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const severityFilter = externalSeverityFilter ?? internalSeverityFilter
  const setSeverityFilter = onSeverityFilterChange ?? setInternalSeverityFilter
  const localConflicts = externalConflicts ?? internalConflicts

  const handleResolveLocal = (id: string) => {
    if (onResolve) {
      onResolve(id)
    } else if (onConflictsChange) {
      onConflictsChange(localConflicts.map(c => c.id === id ? { ...c, resolved: true } : c))
    } else {
      setInternalConflicts(prev => prev.map(c => c.id === id ? { ...c, resolved: true } : c))
    }
    setDetailOpen(false)
  }

  const filteredConflicts = useMemo(() => {
    return localConflicts.filter((c) => {
      if (severityFilter !== 'all' && c.severity !== severityFilter) return false
      if (typeFilter !== 'all' && c.type !== typeFilter) return false
      if (resolvedFilter === 'resolved' && !c.resolved) return false
      if (resolvedFilter === 'unresolved' && c.resolved) return false
      return true
    })
  }, [localConflicts, severityFilter, typeFilter, resolvedFilter])

  const stats = useMemo(() => {
    const unresolved = localConflicts.filter(c => !c.resolved)
    return {
      total: localConflicts.length,
      unresolved: unresolved.length,
      critical: unresolved.filter(c => c.severity === 'critical').length,
      warning: unresolved.filter(c => c.severity === 'warning').length,
      info: unresolved.filter(c => c.severity === 'info').length,
    }
  }, [localConflicts])

  const handleConflictClick = (conflict: SimConflict) => {
    setSelectedConflict(conflict)
    setDetailOpen(true)
    onConflictSelect?.(conflict)
  }

  const activeFilterCount = [severityFilter, typeFilter, resolvedFilter].filter(f => f !== 'all').length

  return (
    <div className="flex flex-col h-full">
      {/* Stats strip */}
      <div className="flex items-center gap-2 pb-3 flex-wrap">
        <div className="flex items-center gap-1.5 bg-red-50 rounded-md px-2.5 py-1 border border-red-100">
          <AlertOctagon className="w-3 h-3 text-red-500" />
          <span className="text-[11px] text-red-600">Critical</span>
          <span className="text-xs font-semibold text-red-800 tabular-nums">{stats.critical}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-amber-50 rounded-md px-2.5 py-1 border border-amber-100">
          <AlertTriangle className="w-3 h-3 text-amber-500" />
          <span className="text-[11px] text-amber-600">Warning</span>
          <span className="text-xs font-semibold text-amber-800 tabular-nums">{stats.warning}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-[#e8eaf6] rounded-md px-2.5 py-1 border border-teal-100">
          <Info className="w-3 h-3 text-[#1a237e]" />
          <span className="text-[11px] text-[#283593]">Info</span>
          <span className="text-xs font-semibold text-[#1a237e] tabular-nums">{stats.info}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-muted/50 rounded-md px-2.5 py-1 border border-border/50">
          <span className="text-[11px] text-muted-foreground">Unresolved</span>
          <span className="text-xs font-semibold text-foreground tabular-nums">{stats.unresolved}/{stats.total}</span>
        </div>
      </div>

      {/* Severity filter pills */}
      <div className="flex items-center gap-1.5 pb-3 flex-wrap">
        <Button
          variant={severityFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          className={cn('h-7 text-xs px-3 rounded-full', severityFilter === 'all' && 'shadow-sm')}
          onClick={() => setSeverityFilter('all')}
        >
          All
        </Button>
        {SEVERITY_PILLS.map((pill) => (
          <Button
            key={pill.value}
            variant={severityFilter === pill.value ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'h-7 text-xs px-3 rounded-full transition-all',
              severityFilter === pill.value
                ? 'shadow-sm'
                : 'hover:bg-muted/80',
            )}
            onClick={() => setSeverityFilter(pill.value)}
          >
            {pill.label}
          </Button>
        ))}
        <div className="flex-1" />
        {/* Type and Resolved filters */}
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
          <SelectTrigger className="w-[130px] h-7 text-xs">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="train_conflict">Train Conflict</SelectItem>
            <SelectItem value="department_conflict">Dept. Conflict</SelectItem>
            <SelectItem value="corridor_unavailable">Corridor Unavailable</SelectItem>
            <SelectItem value="safety_violation">Safety Violation</SelectItem>
          </SelectContent>
        </Select>
        <Select value={resolvedFilter} onValueChange={(v) => setResolvedFilter(v as ResolvedFilter)}>
          <SelectTrigger className="w-[110px] h-7 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="unresolved">Unresolved</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Conflict list with stagger animation */}
      <div className="flex-1 min-h-0 overflow-auto space-y-2 pr-1">
        <AnimatePresence mode="popLayout">
          {filteredConflicts.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <CheckCircle2 className="w-8 h-8 text-emerald-300 mb-2" />
              <p className="text-sm text-muted-foreground">No conflicts match your filters</p>
            </motion.div>
          ) : (
            filteredConflicts.map((conflict, idx) => {
              const sevConfig = SEVERITY_CONFIG[conflict.severity]
              const typeConfig = TYPE_CONFIG[conflict.type]
              const SevIcon = sevConfig.icon
              const TypeIcon = typeConfig.icon
              const relatedBlock = conflict.blockId ? blocks.find(b => b.id === conflict.blockId) : null

              return (
                <motion.div
                  key={conflict.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15, delay: idx * 0.04 }}
                >
                  <Card
                    className={cn(
                      'border border-l-4 cursor-pointer transition-all duration-150 hover:shadow-sm',
                      sevConfig.borderColor,
                      conflict.resolved ? 'opacity-60' : '',
                      conflict.severity === 'critical' && !conflict.resolved ? 'bg-red-50/20' : '',
                    )}
                    onClick={() => handleConflictClick(conflict)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2.5">
                        <div className={cn('flex items-center justify-center w-7 h-7 rounded-md shrink-0', sevConfig.bgColor)}>
                          <TypeIcon className={cn('w-3.5 h-3.5', sevConfig.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-4', SEVERITY_BADGE[conflict.severity])}>
                              {conflict.severity}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-muted/50 text-muted-foreground border-border">
                              {typeConfig.label}
                            </Badge>
                            {conflict.resolved && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-emerald-50 text-emerald-700 border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 mr-0.5" />
                                Resolved
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-foreground/80 leading-relaxed">{conflict.description}</p>
                          {relatedBlock && (
                            <p className="text-[10px] text-muted-foreground mt-1">
                              Block: {relatedBlock.name}
                            </p>
                          )}
                          {conflict.trainName && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Train: {conflict.trainName}
                            </p>
                          )}
                        </div>
                        {/* Resolve / Guided Workflow button for unresolved conflicts */}
                        {!conflict.resolved && (
                          onOpenWorkflow ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-[10px] px-2 gap-1 text-[#283593] border-[#9fa8da] hover:bg-[#e8eaf6] hover:text-[#0d47a1] shrink-0 dark:text-[#3f51b5] dark:border-[#1a237e] dark:hover:bg-[#0d1442]/30"
                              onClick={(e) => {
                                e.stopPropagation()
                                onOpenWorkflow(conflict)
                              }}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Resolve
                            </Button>
                          ) : conflict.severity === 'critical' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-[10px] px-2 gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 shrink-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleResolveLocal(conflict.id)
                              }}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Resolve
                            </Button>
                          ) : null
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>

      {/* Conflict Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Conflict Details</DialogTitle>
            <DialogDescription>
              Detailed information about this conflict
            </DialogDescription>
          </DialogHeader>
          {selectedConflict && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn('text-xs px-2 py-0.5', SEVERITY_BADGE[selectedConflict.severity])}>
                  {selectedConflict.severity.charAt(0).toUpperCase() + selectedConflict.severity.slice(1)}
                </Badge>
                <Badge variant="outline" className="text-xs px-2 py-0.5 bg-muted/50 text-muted-foreground border-border">
                  {TYPE_CONFIG[selectedConflict.type]?.label}
                </Badge>
                {selectedConflict.resolved && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 border-emerald-200">
                    Resolved
                  </Badge>
                )}
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">{selectedConflict.description}</p>
              {selectedConflict.blockId && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Block: </span>
                  {blocks.find(b => b.id === selectedConflict.blockId)?.name ?? selectedConflict.blockId}
                </div>
              )}
              {selectedConflict.trainName && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Train: </span>
                  {selectedConflict.trainName}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">ID: </span>
                <span className="font-mono">{selectedConflict.id}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            {selectedConflict && !selectedConflict.resolved && (
              <Button
                size="sm"
                className="gap-1"
                onClick={() => handleResolveLocal(selectedConflict.id)}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Mark Resolved
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

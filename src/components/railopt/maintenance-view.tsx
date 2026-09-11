'use client'

import { useState, useMemo } from 'react'
import { Plus, Search, Wrench, Clock, AlertTriangle, CheckCircle2, Filter, ClipboardList, BarChart3, CalendarClock, ArrowUpDown, LayoutGrid } from 'lucide-react'
import { EmptyState } from './empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { maintenanceRequests as initialRequests, blocks, type SimMaintenanceRequest } from '@/data/simulated-data'
import { MaintenanceTable } from './maintenance-table'
import { CreateRequestDialog } from './create-request-dialog'
import { RequestDetailDrawer } from './request-detail-drawer'
import { PriorityMatrix } from './priority-matrix'
import { motion } from 'framer-motion'
import { useIsMobile } from '@/hooks/use-mobile'

type DeptFilter = 'all' | 'engineering' | 'snt' | 'traction'
type StatusFilter = 'all' | 'pending' | 'scored' | 'assigned' | 'verified' | 'rejected'
type SeverityFilter = 'all' | 'low' | 'medium' | 'high' | 'critical'
type ViewTab = 'all' | 'overdue' | 'this-week' | 'by-priority' | 'matrix'

export function MaintenanceView() {
  // State
  const [requests, setRequests] = useState<SimMaintenanceRequest[]>(initialRequests)
  const [selectedRequest, setSelectedRequest] = useState<SimMaintenanceRequest | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const isMobile = useIsMobile()

  // View tab
  const [viewTab, setViewTab] = useState<ViewTab>('all')

  // Filters
  const [deptFilter, setDeptFilter] = useState<DeptFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Overdue items
  const overdueRequests = useMemo(() => requests.filter((r) => r.isOverdue), [requests])

  // This week items (created within the current week)
  const thisWeekRequests = useMemo(() => {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 7)
    return requests.filter((r) => {
      const d = new Date(r.requestedDate)
      return d >= startOfWeek && d < endOfWeek
    })
  }, [requests])

  // By priority (sorted highest first)
  const byPriorityRequests = useMemo(
    () => [...requests].sort((a, b) => b.priority - a.priority),
    [requests]
  )

  // Base list depending on view tab
  const baseRequests = useMemo(() => {
    switch (viewTab) {
      case 'overdue': return overdueRequests
      case 'this-week': return thisWeekRequests
      case 'by-priority': return byPriorityRequests
      default: return requests
    }
  }, [viewTab, overdueRequests, thisWeekRequests, byPriorityRequests, requests])

  // Filtered requests (apply dropdown filters + search on top of base)
  const filteredRequests = useMemo(() => {
    return baseRequests.filter((req) => {
      if (deptFilter !== 'all' && req.department !== deptFilter) return false
      if (statusFilter !== 'all' && req.status !== statusFilter) return false
      if (severityFilter !== 'all' && req.severity !== severityFilter) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          req.title.toLowerCase().includes(q) ||
          req.description.toLowerCase().includes(q) ||
          req.section.toLowerCase().includes(q) ||
          req.category.toLowerCase().includes(q) ||
          req.id.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [baseRequests, deptFilter, statusFilter, severityFilter, searchQuery])

  // Summary stats
  const stats = useMemo(() => {
    const all = requests
    return {
      total: all.length,
      pending: all.filter((r) => r.status === 'pending').length,
      overdue: all.filter((r) => r.isOverdue).length,
      assigned: all.filter((r) => r.status === 'assigned').length,
      scored: all.filter((r) => r.status === 'scored').length,
      verified: all.filter((r) => r.status === 'verified').length,
      critical: all.filter((r) => r.severity === 'critical').length,
    }
  }, [requests])

  // Count how many items match each filter for badge counts
  const filterCounts = useMemo(() => {
    return {
      engineering: requests.filter(r => r.department === 'engineering').length,
      snt: requests.filter(r => r.department === 'snt').length,
      traction: requests.filter(r => r.department === 'traction').length,
      pending: requests.filter(r => r.status === 'pending').length,
      scored: requests.filter(r => r.status === 'scored').length,
      assigned: requests.filter(r => r.status === 'assigned').length,
      verified: requests.filter(r => r.status === 'verified').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
      low: requests.filter(r => r.severity === 'low').length,
      medium: requests.filter(r => r.severity === 'medium').length,
      high: requests.filter(r => r.severity === 'high').length,
      critical: requests.filter(r => r.severity === 'critical').length,
    }
  }, [requests])

  // Handlers
  const handleRequestClick = (req: SimMaintenanceRequest) => {
    setSelectedRequest(req)
    setDrawerOpen(true)
  }

  const handleCreate = (newReq: SimMaintenanceRequest) => {
    const sevMap: Record<string, number> = { low: 15, medium: 35, high: 65, critical: 90 }
    const riskMap: Record<string, number> = { low: 5, medium: 15, high: 35, critical: 55 }
    const priority = Math.min(100, Math.round(
      sevMap[newReq.severity] * 0.3 +
      riskMap[newReq.safetyRisk] * 0.3 +
      riskMap[newReq.assetCriticality] * 0.2 +
      riskMap[newReq.trafficImpact] * 0.2
    ))
    const scored: SimMaintenanceRequest = { ...newReq, priority, status: 'scored' }
    setRequests((prev) => [scored, ...prev])
  }

  const activeFilterCount = [deptFilter, statusFilter, severityFilter].filter((f) => f !== 'all').length

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-6 pb-2 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/30 shrink-0">
            <Wrench className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate">Maintenance Requests</h1>
            <p className="text-sm text-muted-foreground">{stats.total} total requests</p>
          </div>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="gap-1.5 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-sm h-9 min-h-[44px] sm:h-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Create Request</span>
          <span className="sm:hidden">Create</span>
        </Button>
      </div>

      {/* Summary Stat Cards - 2 cols on mobile */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 px-4 sm:px-6 py-3"
      >
        <Card className="py-0 border-l-4 border-l-[var(--info)]">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Total</div>
            <div className="text-2xl font-bold tabular-nums">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="py-0 border-l-4 border-l-[var(--warning)]">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> Pending
            </div>
            <div className="text-2xl font-bold tabular-nums text-[var(--warning)]">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card className="py-0 border-l-4 border-l-[#1a237e]">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Scored</div>
            <div className="text-2xl font-bold tabular-nums text-[#283593] dark:text-[#7986cb]">{stats.scored}</div>
          </CardContent>
        </Card>
        <Card className="py-0 border-l-4 border-l-[var(--primary)]">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Assigned</div>
            <div className="text-2xl font-bold tabular-nums text-[var(--primary)]">{stats.assigned}</div>
          </CardContent>
        </Card>
        <Card className="py-0 border-l-4 border-l-[var(--success)]">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Verified
            </div>
            <div className="text-2xl font-bold tabular-nums text-[var(--success)]">{stats.verified}</div>
          </CardContent>
        </Card>
        {stats.overdue > 0 && (
          <Card className="py-0 border-l-4 border-l-[var(--danger)] ring-pulse">
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Overdue
              </div>
              <div className="text-2xl font-bold tabular-nums text-[var(--danger)]">{stats.overdue}</div>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* View Tabs */}
      <div className="px-4 sm:px-6 py-2">
        <Tabs value={viewTab} onValueChange={(v) => setViewTab(v as ViewTab)}>
          <TabsList className="h-9">
            <TabsTrigger value="all" className="text-xs gap-1.5 whitespace-nowrap">
              <ClipboardList className="w-3.5 h-3.5 hidden sm:inline-block" />
              All Requests
              <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">{stats.total}</Badge>
            </TabsTrigger>
            <TabsTrigger value="overdue" className="text-xs gap-1.5 whitespace-nowrap">
              <AlertTriangle className="w-3.5 h-3.5 hidden sm:inline-block" />
              Overdue
              <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px] bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">{stats.overdue}</Badge>
            </TabsTrigger>
            <TabsTrigger value="this-week" className="text-xs gap-1.5 whitespace-nowrap">
              <CalendarClock className="w-3.5 h-3.5 hidden sm:inline-block" />
              This Week
              <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">{thisWeekRequests.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="by-priority" className="text-xs gap-1.5 whitespace-nowrap">
              <ArrowUpDown className="w-3.5 h-3.5 hidden sm:inline-block" />
              By Priority
              <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">{stats.total}</Badge>
            </TabsTrigger>
            <TabsTrigger value="matrix" className="text-xs gap-1.5 whitespace-nowrap">
              <LayoutGrid className="w-3.5 h-3.5 hidden sm:inline-block" />
              Matrix
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Filter Bar - stacks vertically on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 bg-muted/50 rounded-lg mx-4 sm:mx-6 border border-border/50">
        <div className="flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-muted-foreground/60" />
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 rounded-full">
              {activeFilterCount}
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Select value={deptFilter} onValueChange={(v) => setDeptFilter(v as DeptFilter)}>
            <SelectTrigger className="w-full sm:w-[150px] h-9 min-h-[44px] sm:h-8 text-xs">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="engineering">
                Engineering <span className="text-muted-foreground ml-1">({filterCounts.engineering})</span>
              </SelectItem>
              <SelectItem value="snt">
                Signal & Telecom <span className="text-muted-foreground ml-1">({filterCounts.snt})</span>
              </SelectItem>
              <SelectItem value="traction">
                Traction <span className="text-muted-foreground ml-1">({filterCounts.traction})</span>
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-full sm:w-[130px] h-9 min-h-[44px] sm:h-8 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending ({filterCounts.pending})</SelectItem>
              <SelectItem value="scored">Scored ({filterCounts.scored})</SelectItem>
              <SelectItem value="assigned">Assigned ({filterCounts.assigned})</SelectItem>
              <SelectItem value="verified">Verified ({filterCounts.verified})</SelectItem>
              <SelectItem value="rejected">Rejected ({filterCounts.rejected})</SelectItem>
            </SelectContent>
          </Select>

          <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as SeverityFilter)}>
            <SelectTrigger className="w-full sm:w-[120px] h-9 min-h-[44px] sm:h-8 text-xs">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              <SelectItem value="low">Low ({filterCounts.low})</SelectItem>
              <SelectItem value="medium">Medium ({filterCounts.medium})</SelectItem>
              <SelectItem value="high">High ({filterCounts.high})</SelectItem>
              <SelectItem value="critical">Critical ({filterCounts.critical})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="relative flex-1 min-w-0 sm:min-w-[200px] sm:max-w-[320px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
          <Input
            placeholder="Search requests..."
            className="h-9 sm:h-8 text-xs pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search maintenance requests"
          />
        </div>

        {(activeFilterCount > 0 || searchQuery) && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground h-9 min-h-[44px] sm:h-8"
            onClick={() => {
              setDeptFilter('all')
              setStatusFilter('all')
              setSeverityFilter('all')
              setSearchQuery('')
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Results count */}
      <div className="px-4 sm:px-6 py-1.5">
        <span className="text-xs text-muted-foreground/60">
          Showing {filteredRequests.length} of {baseRequests.length} requests
          {viewTab !== 'all' && (
            <> · <span className={
              viewTab === 'overdue'
                ? 'text-red-600 dark:text-red-400 font-medium'
                : 'text-muted-foreground/60'
            }>{viewTab === 'overdue' ? 'Overdue' : viewTab === 'this-week' ? 'This Week' : 'Sorted by Priority'}</span></>
          )}
        </span>
      </div>

      {/* Content area - Priority Matrix or Table */}
      <div className="flex-1 min-h-0 px-4 sm:px-6 pb-4 sm:pb-6 overflow-auto">
        {viewTab === 'matrix' ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="py-2"
          >
            <PriorityMatrix requests={requests} />
          </motion.div>
        ) : filteredRequests.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="No requests match your filters"
            description="Try adjusting your filter criteria or create a new maintenance request."
            action={{
              label: 'Clear Filters',
              onClick: () => {
                setDeptFilter('all')
                setStatusFilter('all')
                setSeverityFilter('all')
                setSearchQuery('')
              },
            }}
          />
        ) : (
          <>
            {/* Scroll hint on mobile */}
            {isMobile && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
                <span>↔ Scroll horizontally for more columns</span>
              </div>
            )}
            <MaintenanceTable
              requests={filteredRequests}
              onRequestClick={handleRequestClick}
            />
          </>
        )}
      </div>

      {/* Create Dialog */}
      <CreateRequestDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
      />

      {/* Detail Drawer */}
      <RequestDetailDrawer
        request={selectedRequest}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        blocks={blocks}
      />
    </div>
  )
}

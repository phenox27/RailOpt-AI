'use client'

import { useMemo, useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { auditEntries, type SimAuditEntry } from '@/data/simulated-data'
import { ScrollText, Filter, ArrowUpDown, Search, Download, ChevronDown, ChevronRight, CalendarRange, Radio } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { EmptyState } from './empty-state'

type ActionFilter = 'all' | string
type EntityTypeFilter = 'all' | string
type SortOrder = 'desc' | 'asc'

/** Raw audit row returned by GET /api/audit (Prisma AuditLog include user). */
interface DbAuditEntry {
  id: string
  action: string
  entityType: string
  entityId: string | null
  userName: string | null
  details: string | null
  createdAt: string
  user?: { name?: string; email?: string } | null
}

/** Merged view-model: simulated entries + live DB entries (tagged isLive). */
type MergedAuditEntry = SimAuditEntry & { isLive?: boolean }

function mapDbEntry(e: DbAuditEntry): MergedAuditEntry {
  return {
    id: `db-${e.id}`,
    action: e.action,
    entityType: e.entityType,
    entityId: e.entityId ?? '—',
    userName: e.userName ?? e.user?.name ?? 'System',
    details: e.details ?? '(no details)',
    timestamp: e.createdAt,
    isLive: true,
  }
}

const ACTION_BADGE: Record<string, string> = {
  RUN_OPTIMIZATION: 'bg-[#e8eaf6] text-[#0d47a1] border-[#9fa8da] dark:bg-[#1a237e]/30 dark:text-[#7986cb] dark:border-[#3f51b5]/50',
  CREATE_REQUEST: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800/50',
  PRIORITY_SCORED: 'bg-[#e8eaf6] text-[#0d47a1] border-[#9fa8da] dark:bg-[#1a237e]/30 dark:text-[#7986cb] dark:border-[#3f51b5]/50',
  BLOCK_RECOMMENDED: 'bg-[#e8eaf6] text-[#0d47a1] border-[#9fa8da] dark:bg-[#1a237e]/30 dark:text-[#7986cb] dark:border-[#3f51b5]/50',
  CONFLICT_DETECTED: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/50',
  PLAN_REVIEWED: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50',
  // Live plan/block/user actions (saffron family = create, red = delete, neutral = update)
  CUSTOM_PLAN_CREATED: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800/50',
  CUSTOM_PLAN_UPDATED: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50',
  CUSTOM_PLAN_DELETED: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/50',
  BLOCK_ADDED_TO_PLAN: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50',
  BLOCK_REMOVED_FROM_PLAN: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50',
  MANUAL_BLOCK_CREATED: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50',
  MANUAL_BLOCK_DELETED: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/50',
  USER_INVITED: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-800/50',
  USER_UPDATED: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50',
  USER_REMOVED: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/50',
}

export function AuditView() {
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all')
  const [entityTypeFilter, setEntityTypeFilter] = useState<EntityTypeFilter>('all')
  const [userFilter, setUserFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [liveEntries, setLiveEntries] = useState<MergedAuditEntry[]>([])
  const [liveStatus, setLiveStatus] = useState<'loading' | 'connected' | 'unavailable'>('loading')

  // Hydrate live audit trail from the server (admin-only endpoint; fail soft)
  useEffect(() => {
    let cancelled = false
    const t = setTimeout(async () => {
      try {
        const res = await fetch('/api/audit?limit=50', { cache: 'no-store' })
        if (cancelled) return
        if (!res.ok) {
          setLiveStatus('unavailable')
          return
        }
        const json = await res.json()
        const rows: DbAuditEntry[] = Array.isArray(json?.data) ? json.data : []
        setLiveEntries(rows.map(mapDbEntry))
        setLiveStatus('connected')
      } catch {
        if (!cancelled) setLiveStatus('unavailable')
      }
    }, 0)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [])

  const allEntries = useMemo<MergedAuditEntry[]>(() => {
    // Live entries first — they carry real timestamps from today and dominate
    // recency sort anyway; simulated history follows.
    return [...liveEntries, ...auditEntries]
  }, [liveEntries])

  const uniqueActions = useMemo(() => [...new Set(allEntries.map(e => e.action))], [allEntries])
  const uniqueEntityTypes = useMemo(() => [...new Set(allEntries.map(e => e.entityType))], [allEntries])
  const uniqueUsers = useMemo(() => [...new Set(allEntries.map(e => e.userName))], [allEntries])

  const filteredEntries = useMemo(() => {
    let result = allEntries.filter((entry) => {
      if (actionFilter !== 'all' && entry.action !== actionFilter) return false
      if (entityTypeFilter !== 'all' && entry.entityType !== entityTypeFilter) return false
      if (userFilter !== 'all' && entry.userName !== userFilter) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          entry.action.toLowerCase().includes(q) ||
          entry.details.toLowerCase().includes(q) ||
          entry.entityId.toLowerCase().includes(q) ||
          entry.userName.toLowerCase().includes(q)
        )
      }
      return true
    })
    result = [...result].sort((a, b) => {
      const diff = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      return sortOrder === 'desc' ? -diff : diff
    })
    return result
  }, [allEntries, actionFilter, entityTypeFilter, userFilter, sortOrder, searchQuery])

  const activeFilterCount = [actionFilter, entityTypeFilter, userFilter].filter(f => f !== 'all').length

  // Date range of filtered entries
  const dateRange = useMemo(() => {
    if (filteredEntries.length === 0) return null
    const timestamps = filteredEntries.map(e => new Date(e.timestamp).getTime())
    const min = new Date(Math.min(...timestamps))
    const max = new Date(Math.max(...timestamps))
    return { from: min, to: max }
  }, [filteredEntries])

  // CSV export
  const exportCSV = useCallback(() => {
    const headers = ['Timestamp', 'Action', 'Entity Type', 'Entity ID', 'User', 'Details']
    const rows = filteredEntries.map(e => [
      format(parseISO(e.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      e.action,
      e.entityType,
      e.entityId,
      e.userName,
      `"${e.details.replace(/"/g, '""')}"`,
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [filteredEntries])

  const toggleRow = (id: string) => {
    setExpandedRow(prev => prev === id ? null : id)
  }

  const rowVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.03, duration: 0.25, ease: 'easeOut' },
    }),
    exit: { opacity: 0, y: -4, transition: { duration: 0.15 } },
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted shrink-0">
            <ScrollText className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">Audit Logs</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                {filteredEntries.length} of {allEntries.length} entries
              </Badge>
              {liveStatus === 'connected' && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 h-4 gap-1 border-emerald-200 text-emerald-700 bg-emerald-50/70 dark:border-emerald-800/60 dark:text-emerald-400 dark:bg-emerald-950/30"
                  title="Server-recorded actions from custom plans, blocks and user management"
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                  LIVE · {liveEntries.length} server
                </Badge>
              )}
              {dateRange && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <CalendarRange className="w-3 h-3" />
                  {format(dateRange.from, 'dd MMM')} – {format(dateRange.to, 'dd MMM yyyy')}
                </span>
              )}
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={exportCSV}
          disabled={filteredEntries.length === 0}
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </Button>
      </div>

      {/* Filters - stack vertically on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2 px-4 sm:px-6 py-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-muted-foreground/60" />
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 rounded-full">
              {activeFilterCount}
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-full sm:w-[160px] h-9 min-h-[44px] sm:h-7 text-xs">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {uniqueActions.map(a => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
            <SelectTrigger className="w-full sm:w-[130px] h-9 min-h-[44px] sm:h-7 text-xs">
              <SelectValue placeholder="Entity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              {uniqueEntityTypes.map(e => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={userFilter} onValueChange={setUserFilter}>
            <SelectTrigger className="w-full sm:w-[140px] h-9 min-h-[44px] sm:h-7 text-xs">
              <SelectValue placeholder="User" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {uniqueUsers.map(u => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative min-w-0 sm:min-w-[160px] sm:max-w-[220px] flex-1 sm:flex-initial">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/60" />
          <Input
            placeholder="Search logs..."
            className="h-9 sm:h-7 text-xs pl-7 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search audit logs"
          />
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-9 min-h-[44px] sm:h-7 text-xs gap-1"
          onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
        >
          <ArrowUpDown className="w-3 h-3" />
          {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
        </Button>

        {(activeFilterCount > 0 || searchQuery) && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground h-9 min-h-[44px] sm:h-7"
            onClick={() => {
              setActionFilter('all')
              setEntityTypeFilter('all')
              setUserFilter('all')
              setSearchQuery('')
            }}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Table - horizontally scrollable */}
      <div className="flex-1 min-h-0 px-4 sm:px-6 pb-4 sm:pb-6 overflow-auto">
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-[11px] font-semibold h-8 w-[24px]" />
                <TableHead className="text-[11px] font-semibold h-8 w-[160px]">Timestamp</TableHead>
                <TableHead className="text-[11px] font-semibold h-8 w-[160px]">Action</TableHead>
                <TableHead className="text-[11px] font-semibold h-8 w-[90px]">Entity</TableHead>
                <TableHead className="text-[11px] font-semibold h-8 w-[100px]">Entity ID</TableHead>
                <TableHead className="text-[11px] font-semibold h-8 w-[120px]">User</TableHead>
                <TableHead className="text-[11px] font-semibold h-8">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {filteredEntries.map((entry, index) => {
                  const isExpanded = expandedRow === entry.id
                  return (
                    <motion.tr
                      key={entry.id}
                      custom={index}
                      variants={rowVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className={`hover:bg-muted/30 cursor-pointer ${isExpanded ? 'bg-muted/20' : ''}`}
                      onClick={() => toggleRow(entry.id)}
                    >
                      <TableCell className="py-2 w-[24px]">
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-mono tabular-nums py-2 text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          {entry.isLive && (
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_0_3px] shadow-emerald-500/15"
                              title="Recorded live on the server"
                            />
                          )}
                          {format(parseISO(entry.timestamp), 'dd MMM yyyy HH:mm')}
                        </span>
                      </TableCell>
                      <TableCell className="py-2">
                        <span className="flex items-center gap-1">
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 h-4 font-mono ${ACTION_BADGE[entry.action] ?? 'bg-muted/50 text-muted-foreground border-border'}`}
                          >
                            {entry.action}
                          </Badge>
                          {entry.isLive && (
                            <Badge
                              variant="outline"
                              className="text-[8px] px-1 py-0 h-3 font-semibold tracking-wide border-emerald-300/70 text-emerald-600 bg-emerald-50/60 dark:border-emerald-700/60 dark:text-emerald-400 dark:bg-emerald-950/30"
                            >
                              LIVE
                            </Badge>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs py-2 capitalize">{entry.entityType}</TableCell>
                      <TableCell className="text-xs font-mono py-2 text-muted-foreground">{entry.entityId}</TableCell>
                      <TableCell className="text-xs py-2">{entry.userName}</TableCell>
                      <TableCell className="text-xs py-2 text-muted-foreground max-w-[200px] sm:max-w-[300px] truncate">
                        {entry.details}
                      </TableCell>
                    </motion.tr>
                  )
                })}
              </AnimatePresence>
            </TableBody>
          </Table>

          {/* Expandable detail row */}
          <AnimatePresence>
            {expandedRow && (() => {
              const entry = filteredEntries.find(e => e.id === expandedRow)
              if (!entry) return null
              return (
                <motion.div
                  key={`detail-${entry.id}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="overflow-hidden border-t border-border"
                >
                  <div className="px-6 py-4 bg-muted/10">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h4 className="text-xs font-semibold text-foreground">Entry Details</h4>
                      {entry.isLive && (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                          <Radio className="w-3 h-3" />
                          Recorded live on the server
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">ID</p>
                        <p className="text-xs font-mono text-foreground mt-0.5">{entry.id}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Timestamp</p>
                        <p className="text-xs font-mono text-foreground mt-0.5">{format(parseISO(entry.timestamp), 'yyyy-MM-dd HH:mm:ss')}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Action</p>
                        <p className="text-xs font-mono text-foreground mt-0.5">{entry.action}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Entity Type</p>
                        <p className="text-xs capitalize text-foreground mt-0.5">{entry.entityType}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Entity ID</p>
                        <p className="text-xs font-mono text-foreground mt-0.5">{entry.entityId}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">User</p>
                        <p className="text-xs text-foreground mt-0.5">{entry.userName}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Full Details</p>
                      <p className="text-xs text-foreground mt-0.5 leading-relaxed">{entry.details}</p>
                    </div>
                  </div>
                </motion.div>
              )
            })()}
          </AnimatePresence>
        </div>

        {filteredEntries.length === 0 && (
          <EmptyState
            icon={ScrollText}
            title="No audit entries match your filters"
            description="Try adjusting your filter criteria or search terms."
            action={{
              label: 'Clear Filters',
              onClick: () => {
                setActionFilter('all')
                setEntityTypeFilter('all')
                setUserFilter('all')
                setSearchQuery('')
              },
            }}
          />
        )}
      </div>
    </div>
  )
}

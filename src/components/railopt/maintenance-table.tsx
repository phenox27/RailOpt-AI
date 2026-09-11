'use client'

import { useState, useMemo } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown, Eye } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge, type MaintenanceStatus } from './status-badge'
import { PriorityScore } from './priority-score'
import type { SimMaintenanceRequest } from '@/data/simulated-data'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

// Department color config
const DEPARTMENT_CONFIG = {
  engineering: { label: 'Engineering', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  snt: { label: 'S&T', color: '#0EA5A4', bg: '#F0FDFA', border: '#99F6E4' },
  traction: { label: 'Traction', color: '#B77900', bg: '#FFFBEB', border: '#FDE68A' },
} as const

// Severity color config
const SEVERITY_CONFIG = {
  low: { className: 'bg-muted/50 text-muted-foreground border-border' },
  medium: { className: 'bg-amber-50 text-amber-700 border-amber-200' },
  high: { className: 'bg-orange-50 text-orange-700 border-orange-200' },
  critical: { className: 'bg-red-50 text-red-700 border-red-200' },
} as const

type SortField = 'priority' | 'severity' | 'status' | 'date' | 'title'
type SortDirection = 'asc' | 'desc'

interface MaintenanceTableProps {
  requests: SimMaintenanceRequest[]
  onRequestClick: (request: SimMaintenanceRequest) => void
}

const SEVERITY_ORDER: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 }
const STATUS_ORDER: Record<string, number> = { pending: 1, scored: 2, assigned: 3, verified: 4, rejected: 5 }

function SortIcon({ field, currentSort, currentDir }: { field: SortField; currentSort: SortField; currentDir: SortDirection }) {
  if (field !== currentSort) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />
  return currentDir === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />
}

// Mini progress bar for priority score column
function MiniPriorityBar({ score }: { score: number }) {
  const barColor = score >= 90 ? '#DC2626' : score >= 75 ? '#EA580C' : score >= 50 ? '#D97706' : '#16A34A'
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-12 rounded-full bg-muted/60 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
          className="h-1.5 rounded-full"
          style={{ backgroundColor: barColor }}
        />
      </div>
    </div>
  )
}

// Staggered row wrapper
function AnimatedRow({
  children,
  idx,
  className,
  style,
  onClick,
}: {
  children: React.ReactNode
  idx: number
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
}) {
  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.2,
        delay: Math.min(idx * 0.03, 0.3), // cap max delay at 0.3s
        ease: 'easeOut',
      }}
      className={className}
      style={style}
      onClick={onClick}
    >
      {children}
    </motion.tr>
  )
}

export function MaintenanceTable({ requests, onRequestClick }: MaintenanceTableProps) {
  const [sortField, setSortField] = useState<SortField>('priority')
  const [sortDir, setSortDir] = useState<SortDirection>('desc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir(field === 'date' ? 'desc' : 'desc')
    }
  }

  const sortedRequests = useMemo(() => {
    const sorted = [...requests].sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'priority':
          cmp = a.priority - b.priority
          break
        case 'severity':
          cmp = (SEVERITY_ORDER[a.severity] ?? 0) - (SEVERITY_ORDER[b.severity] ?? 0)
          break
        case 'status':
          cmp = (STATUS_ORDER[a.status] ?? 0) - (STATUS_ORDER[b.status] ?? 0)
          break
        case 'date':
          cmp = new Date(a.requestedDate).getTime() - new Date(b.requestedDate).getTime()
          break
        case 'title':
          cmp = a.title.localeCompare(b.title)
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [requests, sortField, sortDir])

  const formatDuration = (mins: number) => {
    if (mins >= 60) {
      const h = Math.floor(mins / 60)
      const m = mins % 60
      return m > 0 ? `${h}h ${m}m` : `${h}h`
    }
    return `${mins}m`
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="rounded-lg border overflow-hidden border-border">
      <Table>
        <TableHeader className="sticky top-0 z-10">
          <TableRow className="bg-muted/40 hover:bg-muted/40 backdrop-blur-sm supports-[backdrop-filter]:bg-muted/60">
            <TableHead className="w-[40px] text-center text-[11px] font-semibold text-muted-foreground">#</TableHead>
            <TableHead className="min-w-[200px] text-[11px] font-semibold text-muted-foreground">
              <button className="flex items-center hover:text-foreground" onClick={() => handleSort('title')} aria-label="Sort by title">
                Title
                <SortIcon field="title" currentSort={sortField} currentDir={sortDir} />
              </button>
            </TableHead>
            <TableHead className="min-w-[100px] text-[11px] font-semibold text-muted-foreground">Department</TableHead>
            <TableHead className="min-w-[80px] text-[11px] font-semibold text-muted-foreground">Section</TableHead>
            <TableHead className="min-w-[80px] text-[11px] font-semibold text-muted-foreground">
              <button className="flex items-center hover:text-foreground" onClick={() => handleSort('severity')} aria-label="Sort by severity">
                Severity
                <SortIcon field="severity" currentSort={sortField} currentDir={sortDir} />
              </button>
            </TableHead>
            <TableHead className="min-w-[110px] text-[11px] font-semibold text-muted-foreground">
              <button className="flex items-center hover:text-foreground" onClick={() => handleSort('priority')} aria-label="Sort by priority">
                Priority
                <SortIcon field="priority" currentSort={sortField} currentDir={sortDir} />
              </button>
            </TableHead>
            <TableHead className="min-w-[90px] text-[11px] font-semibold text-muted-foreground">
              <button className="flex items-center hover:text-foreground" onClick={() => handleSort('status')} aria-label="Sort by status">
                Status
                <SortIcon field="status" currentSort={sortField} currentDir={sortDir} />
              </button>
            </TableHead>
            <TableHead className="min-w-[60px] text-[11px] font-semibold text-muted-foreground">Duration</TableHead>
            <TableHead className="min-w-[100px] text-[11px] font-semibold text-muted-foreground">
              <button className="flex items-center hover:text-foreground" onClick={() => handleSort('date')} aria-label="Sort by date">
                Requested
                <SortIcon field="date" currentSort={sortField} currentDir={sortDir} />
              </button>
            </TableHead>
            <TableHead className="w-[40px] text-[11px] font-semibold text-muted-foreground" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRequests.map((req, idx) => {
            const dept = DEPARTMENT_CONFIG[req.department]
            const sev = SEVERITY_CONFIG[req.severity]

            return (
              <AnimatedRow
                key={req.id}
                idx={idx}
                className={cn(
                  'cursor-pointer transition-all duration-150 group/row border-border',
                  'hover:bg-muted/60',
                  // Alternating row striping
                  idx % 2 === 1 && 'bg-muted/20',
                )}
                style={{
                  // Left border color matching department (visible on hover via CSS)
                  borderLeft: `3px solid transparent`,
                }}
                onClick={() => onRequestClick(req)}
              >
                <TableCell className="text-center text-xs text-muted-foreground/60 tabular-nums">
                  {idx + 1}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-foreground truncate max-w-[220px]" title={req.title}>
                      {req.title}
                    </span>
                    {req.isOverdue && (
                      <span className="text-[10px] font-medium text-red-600 flex items-center gap-0.5">
                        ● Overdue
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="rounded-full text-[10px] font-semibold px-2 py-0 h-5 min-w-[52px] text-center"
                    style={{
                      color: dept.color,
                      backgroundColor: dept.bg,
                      borderColor: dept.border,
                    }}
                  >
                    {dept.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground font-mono">
                  {req.section}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`rounded-full text-[10px] font-semibold px-2 py-0 h-5 min-w-[52px] text-center capitalize ${sev.className}`}
                  >
                    {req.severity}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <PriorityScore
                      score={req.priority}
                      severity={req.severity}
                      safetyRisk={req.safetyRisk}
                      assetCriticality={req.assetCriticality}
                      trafficImpact={req.trafficImpact}
                      size="sm"
                    />
                    <MiniPriorityBar score={req.priority} />
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={req.status as MaintenanceStatus} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground tabular-nums">
                  {formatDuration(req.duration)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground tabular-nums">
                  {formatDate(req.requestedDate)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRequestClick(req)
                    }}
                  >
                    <Eye className="h-3.5 w-3.5 text-muted-foreground/60" />
                  </Button>
                </TableCell>
              </AnimatedRow>
            )
          })}
        </TableBody>
      </Table>
      {sortedRequests.length === 0 && (
        <div className="flex items-center justify-center py-12 text-muted-foreground/60 text-sm">
          No maintenance requests found matching your filters.
        </div>
      )}
    </div>
  )
}

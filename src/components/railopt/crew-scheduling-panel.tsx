'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Users,
  UserCheck,
  Clock,
  Filter,
  Search,
  Star,
  Wrench,
  HardHat,
  CheckCircle2,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────────────────────

type CrewRole = 'Gangman' | 'Keyman' | 'Welder' | 'Supervisor' | 'Machine Operator'
type CrewStatus = 'Available' | 'Assigned' | 'On Leave'
type Department = 'Engineering' | 'S&T' | 'Traction' | 'Combined'

interface CrewMember {
  id: string
  name: string
  role: CrewRole
  department: Department
  assignedBlock: string | null
  section: string
  timeSlot: string
  status: CrewStatus
  skillLevel: number // 1–5
}

// ─── Realistic Indian Railways Crew Data ─────────────────────────────────────

const CREW_DATA: CrewMember[] = [
  { id: 'CREW-001', name: 'Ramesh Kumar',    role: 'Gangman',         department: 'Engineering', assignedBlock: 'A1', section: 'NDLS-GZB', timeSlot: '06:00–10:00', status: 'Assigned',   skillLevel: 4 },
  { id: 'CREW-002', name: 'Suresh Yadav',    role: 'Keyman',          department: 'Engineering', assignedBlock: 'A1', section: 'NDLS-GZB', timeSlot: '06:00–10:00', status: 'Assigned',   skillLevel: 5 },
  { id: 'CREW-003', name: 'Mohan Singh',     role: 'Supervisor',      department: 'Engineering', assignedBlock: 'A2', section: 'NDLS-GZB', timeSlot: '10:00–14:00', status: 'Assigned',   skillLevel: 5 },
  { id: 'CREW-004', name: 'Rajendra Prasad', role: 'Welder',          department: 'Traction',   assignedBlock: 'B1', section: 'AGC-BPL',  timeSlot: '06:00–10:00', status: 'Assigned',   skillLevel: 3 },
  { id: 'CREW-005', name: 'Vijay Sharma',    role: 'Machine Operator',department: 'Traction',   assignedBlock: 'B1', section: 'AGC-BPL',  timeSlot: '06:00–10:00', status: 'Assigned',   skillLevel: 4 },
  { id: 'CREW-006', name: 'Anil Verma',      role: 'Gangman',         department: 'Engineering', assignedBlock: null,  section: 'AGC-BPL',  timeSlot: '—',           status: 'Available',  skillLevel: 3 },
  { id: 'CREW-007', name: 'Deepak Tiwari',   role: 'Keyman',          department: 'S&T',        assignedBlock: 'B2', section: 'AGC-BPL',  timeSlot: '14:00–18:00', status: 'Assigned',   skillLevel: 4 },
  { id: 'CREW-008', name: 'Manoj Pandey',    role: 'Welder',          department: 'Traction',   assignedBlock: null,  section: 'BPL-NGP',  timeSlot: '—',           status: 'Available',  skillLevel: 2 },
  { id: 'CREW-009', name: 'Prakash Jha',     role: 'Supervisor',      department: 'Combined',   assignedBlock: 'C1', section: 'BPL-NGP',  timeSlot: '06:00–10:00', status: 'Assigned',   skillLevel: 5 },
  { id: 'CREW-010', name: 'Sanjay Mishra',   role: 'Machine Operator',department: 'Combined',   assignedBlock: 'C1', section: 'BPL-NGP',  timeSlot: '06:00–10:00', status: 'Assigned',   skillLevel: 3 },
  { id: 'CREW-011', name: 'Kamal Gupta',     role: 'Gangman',         department: 'Engineering', assignedBlock: null,  section: 'NGP-SC',   timeSlot: '—',           status: 'On Leave',   skillLevel: 4 },
  { id: 'CREW-012', name: 'Nitin Patil',     role: 'Keyman',          department: 'S&T',        assignedBlock: null,  section: 'NGP-SC',   timeSlot: '—',           status: 'Available',  skillLevel: 3 },
  { id: 'CREW-013', name: 'Gopal Rao',       role: 'Welder',          department: 'Traction',   assignedBlock: 'A2', section: 'NDLS-GZB', timeSlot: '10:00–14:00', status: 'Assigned',   skillLevel: 4 },
  { id: 'CREW-014', name: 'Ashok Meena',     role: 'Supervisor',      department: 'Combined',   assignedBlock: null,  section: 'BPL-NGP',  timeSlot: '—',           status: 'On Leave',   skillLevel: 3 },
  { id: 'CREW-015', name: 'Harish Lodhi',    role: 'Machine Operator',department: 'Engineering', assignedBlock: null,  section: 'NGP-SC',   timeSlot: '—',           status: 'Available',  skillLevel: 2 },
]

// ─── Hindi Labels ────────────────────────────────────────────────────────────

const HINDI = {
  title: 'Crew / कर्मचारी',
  crewId: 'Crew ID / कर्मचारी ID',
  name: 'Name / नाम',
  role: 'Role / भूमिका',
  block: 'Block / खंड',
  section: 'Section / वर्ग',
  timeSlot: 'Time Slot / समय',
  status: 'Status / स्थिति',
  skillLevel: 'Skill / कौशल',
  available: 'Available / उपलब्ध',
  assigned: 'Assigned / नियुक्त',
  onLeave: 'On Leave / अवकाश',
  total: 'Total / कुल',
  filterDept: 'Department / विभाग',
  filterStatus: 'Status / स्थिति',
  filterSection: 'Section / वर्ग',
  all: 'All / सभी',
  requestCrew: 'Request Crew / कर्मचारी माँगें',
  comingSoon: 'This feature is coming soon. Crew requests will be routed through the controlling section officer.',
  summary: 'Summary / सारांश',
} as const

// ─── Status Config ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<CrewStatus, { label: string; className: string }> = {
  'Available': { label: HINDI.available,  className: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' },
  'Assigned':  { label: HINDI.assigned,   className: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800' },
  'On Leave':  { label: HINDI.onLeave,    className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' },
}

// ─── Skill Stars ─────────────────────────────────────────────────────────────

function SkillStars({ level }: { level: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${level} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'h-3 w-3',
            i < level
              ? 'fill-amber-400 text-amber-400'
              : 'fill-muted text-muted-foreground/30'
          )}
        />
      ))}
    </span>
  )
}

// ─── Animation Variants ──────────────────────────────────────────────────────

const rowVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.04, duration: 0.3, ease: 'easeOut' },
  }),
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CrewSchedulingPanel() {
  const [deptFilter, setDeptFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sectionFilter, setSectionFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [crewRequested, setCrewRequested] = useState(false)

  const filtered = useMemo(() => {
    return CREW_DATA.filter((c) => {
      if (deptFilter !== 'all' && c.department !== deptFilter) return false
      if (statusFilter !== 'all' && c.status !== statusFilter) return false
      if (sectionFilter !== 'all' && c.section !== sectionFilter) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          c.id.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.role.toLowerCase().includes(q) ||
          (c.assignedBlock ?? '').toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [deptFilter, statusFilter, sectionFilter, searchQuery])

  const summary = useMemo(() => {
    const total = filtered.length
    const assigned = filtered.filter((c) => c.status === 'Assigned').length
    const available = filtered.filter((c) => c.status === 'Available').length
    const onLeave = filtered.filter((c) => c.status === 'On Leave').length
    return { total, assigned, available, onLeave }
  }, [filtered])

  const sections = [...new Set(CREW_DATA.map((c) => c.section))]
  const departments: Department[] = ['Engineering', 'S&T', 'Traction', 'Combined']
  const statuses: CrewStatus[] = ['Available', 'Assigned', 'On Leave']

  return (
    <Card className="border border-border bg-background shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <HardHat className="h-5 w-5 text-[#283593] dark:text-[#3f51b5]" />
            <CardTitle className="text-base font-semibold text-foreground">
              {HINDI.title}
            </CardTitle>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 text-muted-foreground border-border">
              {CREW_DATA.length}
            </Badge>
          </div>

          {/* Request Crew – submits a crew request */}
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0} className="inline-flex">
                <Button
                  variant="outline"
                  size="sm"
                  className={cn('text-xs h-8 gap-1.5', crewRequested && 'border-emerald-300 text-emerald-700 dark:text-emerald-400')}
                  onClick={() => {
                    if (crewRequested) {
                      toast.info('Crew request already submitted', { description: 'The controlling section officer will review it shortly.' })
                    } else {
                      setCrewRequested(true)
                      toast.success('Crew request submitted', { description: 'Routed to the controlling section officer for approval.' })
                    }
                  }}
                >
                  {crewRequested ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
                  {crewRequested ? 'Requested ✓' : HINDI.requestCrew}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[260px] text-xs">
              {crewRequested ? 'Crew request pending section officer approval' : HINDI.comingSoon}
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 p-3 bg-muted/30 rounded-lg border border-border/50">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Filters</span>
          </div>

          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger size="sm" className="w-full sm:w-[150px] text-xs h-8">
              <SelectValue placeholder={HINDI.filterDept} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{HINDI.all}</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger size="sm" className="w-full sm:w-[170px] text-xs h-8">
              <SelectValue placeholder={HINDI.filterStatus} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{HINDI.all}</SelectItem>
              {statuses.map((s) => (
                <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sectionFilter} onValueChange={setSectionFilter}>
            <SelectTrigger size="sm" className="w-full sm:w-[150px] text-xs h-8">
              <SelectValue placeholder={HINDI.filterSection} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{HINDI.all}</SelectItem>
              {sections.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative sm:ml-auto">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search crew…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 h-8 text-xs w-full sm:w-[180px] bg-background border-border"
            />
          </div>
        </div>

        {/* Summary Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            {HINDI.summary}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-background border border-border text-xs">
            <Users className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">{HINDI.total}:</span>
            <span className="font-semibold text-foreground">{summary.total}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-50 border border-sky-200 text-xs dark:bg-sky-900/20 dark:border-sky-800">
            <UserCheck className="h-3 w-3 text-sky-600 dark:text-sky-400" />
            <span className="text-sky-700 dark:text-sky-300">{HINDI.assigned}:</span>
            <span className="font-semibold text-sky-800 dark:text-sky-200">{summary.assigned}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-xs dark:bg-emerald-900/20 dark:border-emerald-800">
            <Clock className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            <span className="text-emerald-700 dark:text-emerald-300">{HINDI.available}:</span>
            <span className="font-semibold text-emerald-800 dark:text-emerald-200">{summary.available}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-xs dark:bg-amber-900/20 dark:border-amber-800">
            <Wrench className="h-3 w-3 text-amber-600 dark:text-amber-400" />
            <span className="text-amber-700 dark:text-amber-300">{HINDI.onLeave}:</span>
            <span className="font-semibold text-amber-800 dark:text-amber-200">{summary.onLeave}</span>
          </span>
        </div>

        {/* Crew Table */}
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-[11px] font-semibold">{HINDI.crewId}</TableHead>
                  <TableHead className="text-[11px] font-semibold">{HINDI.name}</TableHead>
                  <TableHead className="text-[11px] font-semibold">{HINDI.role}</TableHead>
                  <TableHead className="text-[11px] font-semibold">{HINDI.block}</TableHead>
                  <TableHead className="text-[11px] font-semibold">{HINDI.section}</TableHead>
                  <TableHead className="text-[11px] font-semibold">{HINDI.timeSlot}</TableHead>
                  <TableHead className="text-[11px] font-semibold">{HINDI.status}</TableHead>
                  <TableHead className="text-[11px] font-semibold">{HINDI.skillLevel}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground text-xs">
                      No crew members match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((crew, i) => (
                    <motion.tr
                      key={crew.id}
                      custom={i}
                      variants={rowVariants}
                      initial="hidden"
                      animate="visible"
                      className="border-b border-border hover:bg-muted/40 transition-colors"
                    >
                      <TableCell className="text-xs font-mono font-medium text-foreground">
                        {crew.id}
                      </TableCell>
                      <TableCell className="text-xs text-foreground">
                        {crew.name}
                      </TableCell>
                      <TableCell className="text-xs text-foreground/80">
                        {crew.role}
                      </TableCell>
                      <TableCell className="text-xs">
                        {crew.assignedBlock ? (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-border">
                            {crew.assignedBlock}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {crew.section}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {crew.timeSlot}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] px-1.5 py-0 h-5',
                            STATUS_CONFIG[crew.status].className
                          )}
                        >
                          {STATUS_CONFIG[crew.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <SkillStars level={crew.skillLevel} />
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-muted/30 hover:bg-muted/30 font-semibold">
                  <TableCell colSpan={2} className="text-xs text-foreground">
                    {HINDI.summary}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">—</TableCell>
                  <TableCell className="text-xs text-muted-foreground">—</TableCell>
                  <TableCell className="text-xs text-muted-foreground">—</TableCell>
                  <TableCell className="text-xs text-muted-foreground">—</TableCell>
                  <TableCell className="text-xs">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="text-emerald-600 dark:text-emerald-400">{summary.available}</span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-sky-600 dark:text-sky-400">{summary.assigned}</span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-amber-600 dark:text-amber-400">{summary.onLeave}</span>
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-foreground">
                    {summary.total}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

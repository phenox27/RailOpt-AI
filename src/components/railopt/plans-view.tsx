'use client'

import { useState, useEffect, useMemo } from 'react'
import { plans, blocks, maintenanceRequests, conflicts, type SimPlan } from '@/data/simulated-data'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useAppStore } from '@/store/app-store'
import { FileText, Calendar, GitBranch, Clock, CheckCircle2, AlertCircle, ChevronRight, Download, Share2, Printer, FileDown, GitCompare, Trophy, Sparkles, ShieldAlert, Plus, Trash2, CalendarPlus, Boxes, Gauge, Bot } from 'lucide-react'
import { PrintHeader } from './print-header'
import { EmptyState } from './empty-state'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { useIsMobile } from '@/hooks/use-mobile'

// Custom plans created by the user (persisted to localStorage)
interface CustomPlan extends SimPlan {
  isCustom: boolean
}

const CUSTOM_PLANS_KEY = 'railopt-custom-plans'

function loadCustomPlans(): CustomPlan[] {
  try {
    const raw = localStorage.getItem(CUSTOM_PLANS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CustomPlan[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persistCustomPlans(list: CustomPlan[]) {
  try {
    localStorage.setItem(CUSTOM_PLANS_KEY, JSON.stringify(list))
  } catch {
    // storage unavailable — plans stay in memory for this session
  }
}

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  optimizing: 'bg-info/10 text-info border-info/20',
  recommended: 'bg-info/10 text-info border-info/20',
  reviewed: 'bg-primary/10 text-primary border-primary/20',
  verified: 'bg-success/10 text-success border-success/20',
  finalized: 'bg-success/10 text-success border-success/20',
  approved: 'bg-success/10 text-success border-success/20',
}

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  optimizing: 'Optimizing',
  recommended: 'AI Recommended',
  reviewed: 'Reviewed',
  verified: 'Verified',
  finalized: 'Finalized',
  approved: 'Approved',
}

const workflowSteps = ['Draft', 'Optimizing', 'Recommended', 'Reviewed', 'Verified', 'Finalized', 'Approved']

function getStepIndex(status: string): number {
  const map: Record<string, number> = {
    draft: 0, optimizing: 1, recommended: 2, reviewed: 3, verified: 4, finalized: 5, approved: 6,
  }
  return map[status] ?? 0
}

// Plan health scores (simulated)
const planHealthScores: Record<string, number> = {
  'plan-001': 85,
  'plan-002': 72,
}

// Last optimized timestamps (simulated)
const lastOptimized: Record<string, string> = {
  'plan-001': '2025-01-26T14:32:00',
  'plan-002': '2025-01-25T10:15:00',
}

// Circular progress indicator component
function CircularProgress({ value, size = 40, strokeWidth = 3 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = ((100 - value) / 100) * circumference

  const color = value >= 80 ? 'text-emerald-500' : value >= 60 ? 'text-amber-500' : 'text-red-500'
  const strokeColor = value >= 80 ? '#10b981' : value >= 60 ? '#f59e0b' : '#ef4444'
  const bgColor = value >= 80 ? '#10b98120' : value >= 60 ? '#f59e0b20' : '#ef444420'

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={bgColor} strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className={`absolute text-[10px] font-bold ${color}`}>{value}</span>
    </div>
  )
}

function exportPlanAsJSON(plan: typeof plans[0], planBlocks: typeof blocks, planRequests: typeof maintenanceRequests) {
  const exportData = {
    plan: { id: plan.id, name: plan.name, type: plan.type, startDate: plan.startDate, endDate: plan.endDate, status: plan.status, version: plan.version },
    blocks: planBlocks.map(b => ({ id: b.id, name: b.name, section: b.section, stationFrom: b.stationFrom, stationTo: b.stationTo, startTime: b.startTime, endTime: b.endTime, duration: b.duration, department: b.department, line: b.line, isAiRecommended: b.isAiRecommended, confidence: b.aiConfidence })),
    maintenanceRequests: planRequests.map(r => ({ id: r.id, title: r.title, department: r.department, priority: r.priority, severity: r.severity, status: r.status })),
    exportedAt: new Date().toISOString(),
  }
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `plan-${plan.id}-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
  toast.success('Plan exported', { description: `${plan.name} downloaded as JSON` })
}

function exportPlanAsCSV(plan: typeof plans[0], planBlocks: typeof blocks) {
  const headers = ['Block ID', 'Name', 'Section', 'From', 'To', 'Start', 'End', 'Duration (min)', 'Department', 'Line', 'AI Recommended', 'Confidence']
  const rows = planBlocks.map(b => [b.id, b.name, b.section, b.stationFrom, b.stationTo, b.startTime, b.endTime, b.duration, b.department, b.line, b.isAiRecommended ? 'Yes' : 'No', b.aiConfidence.toFixed(2)])
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `plan-${plan.id}-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
  toast.success('Plan exported', { description: `${plan.name} downloaded as CSV` })
}

async function sharePlan(plan: typeof plans[0], planBlocks: typeof blocks) {
  const summary = `📋 ${plan.name}\nStatus: ${statusLabels[plan.status]}\nPeriod: ${plan.startDate} → ${plan.endDate}\nBlocks: ${planBlocks.length}\nTotal Duration: ${Math.round(planBlocks.reduce((s, b) => s + b.duration, 0) / 60)}h\n\nBlocks:\n${planBlocks.map(b => `• ${b.name} (${b.section}, ${b.department})`).join('\n')}`
  try {
    await navigator.clipboard.writeText(summary)
    toast.success('Plan summary copied', { description: 'Paste it anywhere to share' })
  } catch {
    toast.error('Failed to copy', { description: 'Please try again' })
  }
}

function exportAllPlansAsJSON(planList: (typeof plans[0])[]) {
  const exportData = {
    plans: planList.map((plan) => {
      const planBlocks = blocks.filter((b) => plan.blockIds.includes(b.id))
      const planRequests = maintenanceRequests.filter((mr) => planBlocks.some((b) => b.maintenanceReqIds.includes(mr.id)))
      return {
        plan: { id: plan.id, name: plan.name, type: plan.type, startDate: plan.startDate, endDate: plan.endDate, status: plan.status, version: plan.version },
        blocks: planBlocks.map(b => ({ id: b.id, name: b.name, section: b.section, startTime: b.startTime, endTime: b.endTime, duration: b.duration, department: b.department })),
        maintenanceRequests: planRequests.map(r => ({ id: r.id, title: r.title, department: r.department, priority: r.priority, status: r.status })),
      }
    }),
    exportedAt: new Date().toISOString(),
  }
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `railopt-all-plans-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
  toast.success('All plans exported', { description: `${planList.length} plans downloaded as JSON` })
}

function exportAllPlansAsCSV(planList: (typeof plans[0])[]) {
  const headers = ['Plan', 'Block ID', 'Name', 'Section', 'From', 'To', 'Start', 'End', 'Duration (min)', 'Department', 'Line', 'AI Recommended']
  const rows: string[] = []
  for (const plan of planList) {
    const planBlocks = blocks.filter((b) => plan.blockIds.includes(b.id))
    for (const b of planBlocks) {
      rows.push([plan.name, b.id, b.name, b.section, b.stationFrom, b.stationTo, b.startTime, b.endTime, String(b.duration), b.department, b.line, b.isAiRecommended ? 'Yes' : 'No'].join(','))
    }
  }
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `railopt-all-plans-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
  toast.success('All plans exported', { description: `${planList.length} plans downloaded as CSV` })
}

// Comparison table component
function PlanComparisonTable() {
  const weeklyPlan = plans.find(p => p.type === 'weekly')
  const monthlyPlan = plans.find(p => p.type === 'monthly')

  if (!weeklyPlan || !monthlyPlan) return null

  const weeklyBlocks = blocks.filter(b => weeklyPlan.blockIds.includes(b.id))
  const monthlyBlocks = blocks.filter(b => monthlyPlan.blockIds.includes(b.id))
  const weeklyDuration = weeklyBlocks.reduce((s, b) => s + b.duration, 0)
  const monthlyDuration = monthlyBlocks.reduce((s, b) => s + b.duration, 0)
  const weeklyDepts = new Set(weeklyBlocks.map(b => b.department))
  const monthlyDepts = new Set(monthlyBlocks.map(b => b.department))
  const weeklyAiCount = weeklyBlocks.filter(b => b.isAiRecommended).length
  const monthlyAiCount = monthlyBlocks.filter(b => b.isAiRecommended).length
  const weeklyConflicts = conflicts.filter(c => weeklyBlocks.some(b => b.id === c.blockId)).length
  const monthlyConflicts = conflicts.filter(c => monthlyBlocks.some(b => b.id === c.blockId)).length
  const weeklyHealth = planHealthScores[weeklyPlan.id] ?? 0
  const monthlyHealth = planHealthScores[monthlyPlan.id] ?? 0

  const metrics = [
    { label: 'Block Count', weekly: weeklyBlocks.length, monthly: monthlyBlocks.length, better: 'higher' as const },
    { label: 'Total Hours', weekly: Math.round(weeklyDuration / 60), monthly: Math.round(monthlyDuration / 60), better: 'higher' as const },
    { label: 'Departments', weekly: weeklyDepts.size, monthly: monthlyDepts.size, better: 'higher' as const },
    { label: 'AI Recommendations', weekly: weeklyAiCount, monthly: monthlyAiCount, better: 'higher' as const },
    { label: 'Conflicts', weekly: weeklyConflicts, monthly: monthlyConflicts, better: 'lower' as const },
    { label: 'Health Score', weekly: weeklyHealth, monthly: monthlyHealth, better: 'higher' as const },
  ]

  return (
    <Card className="overflow-hidden border-[#9fa8da] dark:border-[#1a237e]">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-[#1a237e]/10 flex items-center justify-center shrink-0">
            <GitCompare className="h-4 w-4 text-[#283593] dark:text-[#3f51b5]" />
          </div>
          <div>
            <CardTitle className="text-sm">Plan Comparison</CardTitle>
            <CardDescription className="text-xs">Side-by-side analysis of Weekly vs Monthly plans</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Metric</th>
                <th className="text-center py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <span className="flex items-center justify-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    Weekly Plan
                  </span>
                </th>
                <th className="text-center py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <span className="flex items-center justify-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    Monthly Plan
                  </span>
                </th>
                <th className="text-center py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <span className="flex items-center justify-center gap-1.5">
                    <Trophy className="h-3 w-3" />
                    Winner
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric) => {
                const weeklyWins = metric.better === 'higher' ? metric.weekly > metric.monthly : metric.weekly < metric.monthly
                const monthlyWins = metric.better === 'higher' ? metric.monthly > metric.weekly : metric.monthly < metric.weekly
                const tie = metric.weekly === metric.monthly

                const formatValue = (label: string, value: number) => {
                  if (label === 'Total Hours') return `${value}h`
                  if (label === 'Health Score') return `${value}/100`
                  if (label === 'Conflicts') return `${value}`
                  return String(value)
                }

                return (
                  <tr key={metric.label} className="border-b border-border/50 last:border-0">
                    <td className="py-2.5 px-3 text-xs font-medium text-foreground">{metric.label}</td>
                    <td className={`text-center py-2.5 px-3 text-xs font-semibold tabular-nums ${weeklyWins ? 'text-[#283593] dark:text-[#3f51b5]' : ''}`}>
                      <span className="flex items-center justify-center gap-1">
                        {weeklyWins && <Sparkles className="h-3 w-3 text-[#1a237e]" />}
                        {formatValue(metric.label, metric.weekly)}
                      </span>
                    </td>
                    <td className={`text-center py-2.5 px-3 text-xs font-semibold tabular-nums ${monthlyWins ? 'text-[#283593] dark:text-[#3f51b5]' : ''}`}>
                      <span className="flex items-center justify-center gap-1">
                        {monthlyWins && <Sparkles className="h-3 w-3 text-[#1a237e]" />}
                        {formatValue(metric.label, metric.monthly)}
                      </span>
                    </td>
                    <td className="text-center py-2.5 px-3">
                      {tie ? (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-muted/50">Tie</Badge>
                      ) : weeklyWins ? (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-[#e8eaf6] text-[#0d47a1] border-[#9fa8da] dark:bg-[#0d1442]/30 dark:text-[#3f51b5] dark:border-[#1a237e]">Weekly</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-[#e8eaf6] text-[#0d47a1] border-[#9fa8da] dark:bg-[#0d1442]/30 dark:text-[#3f51b5] dark:border-[#1a237e]">Monthly</Badge>
                      )}
                    </td>
                  </tr>
                )
              })}
              {/* Status row */}
              <tr className="border-b border-border/50">
                <td className="py-2.5 px-3 text-xs font-medium text-foreground">Status</td>
                <td className="text-center py-2.5 px-3">
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${statusColors[weeklyPlan.status]}`}>{statusLabels[weeklyPlan.status]}</Badge>
                </td>
                <td className="text-center py-2.5 px-3">
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${statusColors[monthlyPlan.status]}`}>{statusLabels[monthlyPlan.status]}</Badge>
                </td>
                <td className="text-center py-2.5 px-3">
                  {getStepIndex(weeklyPlan.status) > getStepIndex(monthlyPlan.status) ? (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-[#e8eaf6] text-[#0d47a1] border-[#9fa8da] dark:bg-[#0d1442]/30 dark:text-[#3f51b5] dark:border-[#1a237e]">Weekly</Badge>
                  ) : getStepIndex(monthlyPlan.status) > getStepIndex(weeklyPlan.status) ? (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-[#e8eaf6] text-[#0d47a1] border-[#9fa8da] dark:bg-[#0d1442]/30 dark:text-[#3f51b5] dark:border-[#1a237e]">Monthly</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-muted/50">Tie</Badge>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-3 p-2.5 rounded-md bg-[#e8eaf6]/50 dark:bg-[#0d1442]/20 border border-teal-100 dark:border-teal-900/50">
          <p className="text-[10px] text-[#0d47a1] dark:text-[#3f51b5] flex items-center gap-1.5">
            <ShieldAlert className="h-3 w-3" />
            Weekly plan leads in most metrics. Monthly plan is still in draft — run AI optimization to improve its score.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export function PlansView() {
  const { setActiveView, currentUserName } = useAppStore()
  const isMobile = useIsMobile()
  const [compareMode, setCompareMode] = useState(false)
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null)
  // Custom plan wizard
  const [customPlans, setCustomPlans] = useState<CustomPlan[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [newPlanName, setNewPlanName] = useState('')
  const [newPlanType, setNewPlanType] = useState<'weekly' | 'monthly'>('weekly')
  const [newPlanStart, setNewPlanStart] = useState('')
  const [newPlanEnd, setNewPlanEnd] = useState('')
  const [newPlanNotes, setNewPlanNotes] = useState('')
  const [deletePlanId, setDeletePlanId] = useState<string | null>(null)

  // Load persisted custom plans on mount (async hydration to avoid render cascade)
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const raw = localStorage.getItem(CUSTOM_PLANS_KEY)
        if (!raw) return
        const parsed = JSON.parse(raw) as CustomPlan[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCustomPlans(parsed)
        }
      } catch {
        // ignore malformed persisted data
      }
    }, 0)
    return () => clearTimeout(t)
  }, [])

  // Base plans first, then user-created plans
  const allPlans = useMemo(() => [...customPlans, ...plans], [customPlans])

  // Portfolio stats strip
  const stats = useMemo(() => {
    const allBlockIds = new Set(allPlans.flatMap((p) => p.blockIds))
    const allBlocks = blocks.filter((b) => allBlockIds.has(b.id))
    const totalMinutes = allBlocks.reduce((s, b) => s + b.duration, 0)
    const aiCount = allBlocks.filter((b) => b.isAiRecommended).length
    return {
      plans: allPlans.length,
      blocks: allBlocks.length,
      hours: Math.round(totalMinutes / 60),
      aiPct: allBlocks.length > 0 ? Math.round((aiCount / allBlocks.length) * 100) : 0,
    }
  }, [allPlans])

  const handleCreatePlan = () => {
    const name = newPlanName.trim()
    if (!name) {
      toast.error('Plan name is required')
      return
    }
    if (!newPlanStart || !newPlanEnd) {
      toast.error('Start and end dates are required')
      return
    }
    if (newPlanEnd < newPlanStart) {
      toast.error('End date must be on or after the start date')
      return
    }
    const plan: CustomPlan = {
      id: `custom-plan-${Date.now()}`,
      name,
      type: newPlanType,
      startDate: newPlanStart,
      endDate: newPlanEnd,
      status: 'draft',
      version: 1,
      createdBy: currentUserName || 'You',
      blockIds: [],
      isCustom: true,
    }
    const next = [plan, ...customPlans]
    setCustomPlans(next)
    persistCustomPlans(next)
    setCreateOpen(false)
    setNewPlanName('')
    setNewPlanStart('')
    setNewPlanEnd('')
    setNewPlanNotes('')
    setExpandedPlanId(plan.id)
    toast.success(`Plan "${name}" created`, {
      description: `${newPlanType === 'weekly' ? 'Weekly' : 'Monthly'} · ${newPlanStart} → ${newPlanEnd}. Add blocks from Planning, then run AI optimization.`,
    })
  }

  const handleDeletePlan = () => {
    if (!deletePlanId) return
    const target = customPlans.find((p) => p.id === deletePlanId)
    const next = customPlans.filter((p) => p.id !== deletePlanId)
    setCustomPlans(next)
    persistCustomPlans(next)
    if (expandedPlanId === deletePlanId) setExpandedPlanId(null)
    setDeletePlanId(null)
    if (target) {
      toast.success('Plan deleted', { description: `"${target.name}" was removed.` })
    }
  }

  const openCreateDialog = () => {
    // Suggest a sensible default window starting next Monday
    const today = new Date()
    const nextMonday = new Date(today)
    nextMonday.setDate(today.getDate() + ((8 - today.getDay()) % 7 || 7))
    const sunday = new Date(nextMonday)
    sunday.setDate(nextMonday.getDate() + 6)
    const iso = (d: Date) => d.toISOString().split('T')[0]
    setNewPlanName(`Block Plan — ${iso(nextMonday)} week`)
    setNewPlanType('weekly')
    setNewPlanStart(iso(nextMonday))
    setNewPlanEnd(iso(sunday))
    setCreateOpen(true)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 print-area">
      {/* Print Header - hidden on screen, visible when printing */}
      <PrintHeader
        title="RailOpt AI — Block Planning Report"
        corridor="Delhi–Howrah & Delhi–Mumbai"
        planName="All Plans"
      />
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Plans</h1>
          <p className="text-sm text-muted-foreground mt-1">Weekly and monthly maintenance block plans</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Compare toggle */}
          <div className="flex items-center gap-2 mr-1 px-2 py-1 rounded-md border border-border bg-muted/30">
            <GitCompare className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground hidden sm:inline">Compare</span>
            <Switch
              checked={compareMode}
              onCheckedChange={setCompareMode}
              className="scale-75 origin-left"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" className="h-9 min-h-[44px] sm:h-auto"><FileText className="h-4 w-4 mr-1" />Export</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportAllPlansAsJSON}>
                <Download className="h-3.5 w-3.5 mr-2" /> All Plans (JSON)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportAllPlansAsCSV}>
                <FileText className="h-3.5 w-3.5 mr-2" /> All Plans (CSV)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" className="h-9 min-h-[44px] sm:h-auto gap-1" onClick={openCreateDialog}>
            <Plus className="h-3.5 w-3.5" />
            New Plan
          </Button>
          {/* Print button */}
          <Button variant="outline" size="sm" className="h-9 min-h-[44px] sm:h-auto gap-1" onClick={handlePrint}>
            <Printer className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Print Report</span>
            <span className="sm:hidden">Print</span>
          </Button>
        </div>
      </motion.div>

      {/* Portfolio stats strip */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3"
      >
        {([
          { icon: FileText, label: 'Plans', value: String(stats.plans), tint: 'text-[#0d47a1] dark:text-[#9fa8da]', ring: 'border-[#9fa8da]/40' },
          { icon: Boxes, label: 'Blocks Planned', value: String(stats.blocks), tint: 'text-violet-600 dark:text-violet-400', ring: 'border-violet-300/40' },
          { icon: Clock, label: 'Engineer Hours', value: `${stats.hours}h`, tint: 'text-amber-600 dark:text-amber-400', ring: 'border-amber-300/40' },
          { icon: Bot, label: 'AI Recommended', value: `${stats.aiPct}%`, tint: 'text-emerald-600 dark:text-emerald-400', ring: 'border-emerald-300/40' },
        ] as const).map((s) => (
          <div key={s.label} className={`flex items-center gap-2.5 rounded-xl border ${s.ring} bg-card/60 px-3 py-2.5 shadow-sm`}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-lg bg-muted/60 shrink-0`}>
              <s.icon className={`h-4 w-4 ${s.tint}`} />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold leading-none text-foreground tabular-nums">{s.value}</p>
              <p className="text-[10px] text-muted-foreground mt-1 truncate">{s.label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Comparison Table (shown when compare mode is on) */}
      <AnimatePresence>
        {compareMode && (
          <motion.div
            key="comparison"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <PlanComparisonTable />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Plans List */}
      <div className="space-y-4">
        {allPlans.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No plans created yet"
            description="Create your first block plan to start optimizing maintenance schedules."
          />
        ) : null}
        {allPlans.map((plan, planIdx) => {
          const isCustomPlan = (plan as CustomPlan).isCustom === true
          const planBlocks = blocks.filter((b) => plan.blockIds.includes(b.id))
          const planRequests = maintenanceRequests.filter((mr) => planBlocks.some((b) => b.maintenanceReqIds.includes(mr.id)))
          const stepIndex = getStepIndex(plan.status)
          const totalDuration = planBlocks.reduce((sum, b) => sum + b.duration, 0)
          const healthScore = planHealthScores[plan.id] ?? (planBlocks.length > 0 ? Math.min(90, 40 + planBlocks.length * 10) : 25)
          const optimizedAt = lastOptimized[plan.id]

          return (
            <Card key={plan.id} className={`overflow-hidden print-keep print-card transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${planIdx > 0 ? 'print-break-before' : ''}`} data-card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base truncate">{plan.name}</CardTitle>
                        {/* Health Score Circular Indicator */}
                        <CircularProgress value={healthScore} size={32} strokeWidth={2.5} />
                      </div>
                      <CardDescription className="text-xs mt-0.5">
                        Version {plan.version} · Created by {plan.createdBy === 'planner-rk' ? 'Jeet' : plan.createdBy}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isCustomPlan && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-[#fff7ed] text-[#c2570b] border-[#fdba74] dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800">
                        <CalendarPlus className="h-2.5 w-2.5 mr-0.5" />
                        Custom
                      </Badge>
                    )}
                    <Badge variant="outline" className={statusColors[plan.status]}>{statusLabels[plan.status]}</Badge>
                    <Badge variant="outline" className="text-xs">{plan.type === 'weekly' ? 'Weekly' : 'Monthly'}</Badge>
                    {isCustomPlan && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        aria-label={`Delete plan ${plan.name}`}
                        onClick={() => setDeletePlanId(plan.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Plan metadata - 2 cols on mobile */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0"><p className="text-xs text-muted-foreground">Period</p><p className="font-medium text-xs sm:text-sm truncate">{plan.startDate} — {plan.endDate}</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div><p className="text-xs text-muted-foreground">Blocks</p><p className="font-medium">{planBlocks.length} blocks</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div><p className="text-xs text-muted-foreground">Requests</p><p className="font-medium">{planRequests.length} requests</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div><p className="text-xs text-muted-foreground">Duration</p><p className="font-medium">{Math.round(totalDuration / 60)}h {totalDuration % 60}m</p></div>
                  </div>
                </div>

                {/* Health Score Bar + Last Optimized */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-md bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Health Score:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${healthScore >= 80 ? 'bg-emerald-500' : healthScore >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${healthScore}%` }}
                        />
                      </div>
                      <span className={`text-xs font-semibold tabular-nums ${healthScore >= 80 ? 'text-emerald-600 dark:text-emerald-400' : healthScore >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                        {healthScore}/100
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Last optimized: {optimizedAt ? new Date(optimizedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : 'Never'}</span>
                  </div>
                </div>

                {/* Workflow Stepper - vertical on mobile */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Approval Workflow</p>
                  {isMobile ? (
                    /* Vertical stepper */
                    <div className="flex flex-col items-start gap-0 ml-1">
                      {workflowSteps.map((step, idx) => (
                        <div key={step} className="flex items-center gap-2">
                          {idx > 0 && (
                            <div className={`w-1 h-3 ml-[11px] rounded-full ${idx - 1 < stepIndex ? 'bg-success' : 'bg-border'}`} />
                          )}
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${idx < stepIndex ? 'bg-success text-white' : idx === stepIndex ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                              {idx < stepIndex ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
                            </div>
                            <span className={`text-[11px] ${idx <= stepIndex ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{step}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Horizontal stepper */
                    <div className="flex items-center gap-1">
                      {workflowSteps.map((step, idx) => (
                        <div key={step} className="flex items-center gap-1 flex-1">
                          <div className="flex flex-col items-center flex-1">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${idx < stepIndex ? 'bg-success text-white' : idx === stepIndex ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                              {idx < stepIndex ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
                            </div>
                            <span className={`text-[10px] mt-1 text-center leading-tight ${idx <= stepIndex ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{step}</span>
                          </div>
                          {idx < workflowSteps.length - 1 && (
                            <div className={`h-0.5 flex-1 min-w-4 -mt-3 ${idx < stepIndex ? 'bg-success' : 'bg-border'}`} />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Blocks in this plan - compact on mobile */}
                {planBlocks.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Blocks in Plan</p>
                    <div className="space-y-1.5">
                      {planBlocks.map((block) => (
                        <div
                          key={block.id}
                          role="button"
                          tabIndex={0}
                          className="flex items-center justify-between p-2 rounded-md bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                          onClick={() => { toast.info(`Opening "${block.name}" in Planning`, { description: block.section }); setActiveView('planning') }}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { toast.info(`Opening "${block.name}" in Planning`, { description: block.section }); setActiveView('planning') } }}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${block.department === 'engineering' ? 'bg-primary' : block.department === 'snt' ? 'bg-info' : block.department === 'traction' ? 'bg-warning' : 'bg-violet-500'}`} />
                            <span className="text-sm font-medium truncate">{block.name}</span>
                            {block.isAiRecommended && (
                              <Badge variant="outline" className="text-[10px] px-1 py-0 text-info border-info/30 shrink-0">AI</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-muted-foreground font-mono hidden sm:inline">
                              {new Date(block.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}—
                              {new Date(block.endTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {planBlocks.length === 0 && (
                  <div className="flex items-center gap-2 p-4 rounded-md bg-muted/50 text-sm text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    No blocks assigned yet. Run AI optimization to generate recommendations.
                  </div>
                )}

                {/* Actions - wrap on mobile */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
                  <div className="text-xs text-muted-foreground">
                    Last updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button variant="ghost" size="sm" className="text-xs h-8 min-h-[44px] sm:h-7 gap-1" onClick={() => exportPlanAsJSON(plan, planBlocks, planRequests)}>
                      <Download className="h-3 w-3" /> JSON
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs h-8 min-h-[44px] sm:h-7 gap-1" onClick={() => exportPlanAsCSV(plan, planBlocks)}>
                      <FileText className="h-3 w-3" /> CSV
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs h-8 min-h-[44px] sm:h-7 gap-1 border-[#9fa8da] text-[#0d47a1] hover:bg-[#e8eaf6] hover:text-[#1a237e] dark:border-[#1a237e] dark:text-[#3f51b5] dark:hover:bg-[#0d1442]/30" onClick={() => window.open(`/api/export/plan-pdf?planId=${plan.id}`, '_blank')}>
                      <FileDown className="h-3 w-3" /> PDF
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs h-8 min-h-[44px] sm:h-7 gap-1" onClick={() => sharePlan(plan, planBlocks)}>
                      <Share2 className="h-3 w-3" /> Share
                    </Button>
                    <Separator orientation="vertical" className="h-4 hidden sm:block" />
                    <Button variant="ghost" size="sm" className="text-xs h-8 min-h-[44px] sm:h-7 hidden sm:inline-flex" onClick={() => setActiveView('planning')}>Open in Planning</Button>
                    <Button variant="secondary" size="sm" className="h-8 min-h-[44px] sm:h-7" onClick={() => setExpandedPlanId(expandedPlanId === plan.id ? null : plan.id)}>
                      {expandedPlanId === plan.id ? 'Hide Details' : 'View Details'}
                    </Button>
                  </div>
                </div>

                {/* Expanded details: maintenance requests in this plan */}
                <AnimatePresence>
                  {expandedPlanId === plan.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-2 space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Requests Linked to This Plan</p>
                        {planRequests.length === 0 ? (
                          <p className="text-xs text-muted-foreground p-3 rounded-md bg-muted/40 border border-border/50">No maintenance requests linked yet.</p>
                        ) : (
                          <div className="space-y-1.5">
                            {planRequests.map((mr) => (
                              <div key={mr.id} className="flex items-center justify-between gap-2 p-2.5 rounded-md border border-border/60 bg-card">
                                <div className="min-w-0">
                                  <p className="text-xs font-medium truncate">{mr.title}</p>
                                  <p className="text-[10px] text-muted-foreground">{mr.department.toUpperCase()} · Severity: {mr.severity} · {mr.duration} min</p>
                                </div>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 shrink-0">P{Math.round(mr.priority)}</Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Summary */}
      <Card className="print-keep print-card" data-card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground">{allPlans.length} plan{allPlans.length !== 1 ? 's' : ''} total{customPlans.length > 0 ? ` · ${customPlans.length} custom` : ''}</span>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-success" />{allPlans.filter((p) => p.status === 'approved').length} approved</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary" />{allPlans.filter((p) => ['recommended', 'reviewed', 'verified', 'finalized'].includes(p.status)).length} in progress</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-muted-foreground" />{allPlans.filter((p) => p.status === 'draft').length} draft</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Plan Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <CalendarPlus className="h-4 w-4 text-primary" />
              Create New Plan
            </DialogTitle>
            <DialogDescription className="text-xs">
              Define the planning window. Add blocks from the Planning view, then run AI optimization to fill this plan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3.5 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="plan-name" className="text-xs font-medium">Plan Name <span className="text-red-500">*</span></Label>
              <Input
                id="plan-name"
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
                placeholder="e.g. Weekly Block Plan — March Week 2"
                className="text-sm h-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Plan Type</Label>
                <Select value={newPlanType} onValueChange={(v) => setNewPlanType(v as 'weekly' | 'monthly')}>
                  <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Created By</Label>
                <div className="flex items-center h-9 px-3 rounded-md border border-input bg-muted/40 text-xs text-muted-foreground truncate">
                  {currentUserName || 'You'}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="plan-start" className="text-xs font-medium">Start Date <span className="text-red-500">*</span></Label>
                <Input id="plan-start" type="date" value={newPlanStart} onChange={(e) => setNewPlanStart(e.target.value)} className="text-sm h-9" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="plan-end" className="text-xs font-medium">End Date <span className="text-red-500">*</span></Label>
                <Input id="plan-end" type="date" value={newPlanEnd} onChange={(e) => setNewPlanEnd(e.target.value)} className="text-sm h-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plan-notes" className="text-xs font-medium">Notes (optional)</Label>
              <Input
                id="plan-notes"
                value={newPlanNotes}
                onChange={(e) => setNewPlanNotes(e.target.value)}
                placeholder="e.g. Prioritise NDLS-GZB track renewal blocks"
                className="text-sm h-9"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleCreatePlan} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Create Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Custom Plan Confirmation */}
      <AlertDialog open={!!deletePlanId} onOpenChange={(open) => { if (!open) setDeletePlanId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Delete this plan?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              "
              {customPlans.find((p) => p.id === deletePlanId)?.name}
              " will be permanently removed from this device. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white" onClick={handleDeletePlan}>
              Delete Plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

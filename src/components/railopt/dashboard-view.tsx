'use client'

import { useState, useEffect } from 'react'
import { KpiCard } from './kpi-card'
import { DepartmentChart } from './department-chart'
import { CorridorChart } from './corridor-chart'
import { ActivityFeed } from './activity-feed'
import { ConflictsSummary } from './conflicts-summary'
import { PlanStatus } from './plan-status'
import { CorridorHeatmap } from './corridor-heatmap'
import { BlockUtilizationChart } from './block-utilization-chart'
import { RailwayNetworkMap } from './railway-network-map'
import { CorridorPerformanceChart } from './corridor-performance-chart'
import { ResourceAllocationWidget } from './resource-allocation-widget'
import { DepartmentWorkloadChart } from './department-workload-chart'
import { ActivityTicker } from './activity-ticker'
import { WeatherAlert } from './weather-alert'
import { SectionComparisonChart } from './section-comparison-chart'
import { CorridorHealthRing } from './corridor-health-ring'
import { kpiData } from '@/data/simulated-data'
import { useAppStore } from '@/store/app-store'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  ClipboardList,
  Clock,
  AlertOctagon,
  Blocks,
  AlertTriangle,
  Activity,
  Gauge,
  TrainFront,
  Sparkles,
  ShieldCheck,
  Plus,
  Wifi,
  WifiOff,
  Cpu,
  CheckCircle2,
  RefreshCw,
  LayoutDashboard,
  BarChart3,
  Zap,
  ChevronDown,
  ChevronUp,
  MapPin,
  Route,
  Layers,
  Network,
  Server,
  TrendingUp,
  Users,
  Package,
  Target,
  Info,
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { useIsMobile } from '@/hooks/use-mobile'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  planner: 'Block Planner',
  control_office: 'Control Office',
  engineering: 'Engineering Dept',
  snt: 'Signal & Telecom',
  traction: 'Traction Dept',
}

const kpiCards = [
  { icon: ClipboardList, label: 'Total Requests', value: kpiData.totalRequests, status: 'info' as const },
  { icon: Clock, label: 'Pending Score', value: kpiData.pendingRequests, trend: 'up' as const, trendValue: '+2', status: 'warning' as const },
  { icon: AlertOctagon, label: 'Overdue Items', value: kpiData.overdueRequests, trend: 'down' as const, trendValue: '-1', status: 'danger' as const },
  { icon: Blocks, label: 'Active Blocks', value: kpiData.totalBlocks, status: 'default' as const },
  { icon: AlertTriangle, label: 'Critical Conflicts', value: kpiData.criticalConflicts, status: 'danger' as const },
  { icon: Activity, label: 'Asset Availability', value: kpiData.assetAvailability, unit: '%', status: 'success' as const },
  { icon: Gauge, label: 'Block Utilization', value: kpiData.blockUtilization, unit: '%', status: 'default' as const },
  { icon: TrainFront, label: 'Train Disruption', value: kpiData.trainDisruption, unit: 'trains', status: 'warning' as const },
]

export function DashboardView() {
  const { currentRole, currentUserName, setActiveView } = useAppStore()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [activityExpanded, setActivityExpanded] = useState(false)
  const [railwayStatsExpanded, setRailwayStatsExpanded] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const greeting = (() => {
    const h = currentTime.getHours()
    if (h < 12) return 'Good Morning'
    if (h < 17) return 'Good Afternoon'
    return 'Good Evening'
  })()

  // Typing effect state
  const [typedGreeting, setTypedGreeting] = useState('')
  const [isTypingDone, setIsTypingDone] = useState(false)
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false)

  useEffect(() => {
    const firstName = (currentUserName || 'User').split(' ')[0]
    const fullText = `${greeting}, ${firstName}`
    let index = 0
    setTypedGreeting('')
    setIsTypingDone(false)
    const interval = setInterval(() => {
      if (index < fullText.length) {
        setTypedGreeting(fullText.slice(0, index + 1))
        index++
      } else {
        setIsTypingDone(true)
        clearInterval(interval)
      }
    }, 60)
    return () => clearInterval(interval)
  }, [greeting, currentUserName])

  // Today's Focus items
  const focusItems = [
    { text: '2 critical conflicts need resolution', color: 'bg-red-500' },
    { text: '5 blocks awaiting approval', color: 'bg-amber-500' },
    { text: '3 overdue maintenance requests', color: 'bg-orange-500' },
  ]

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-4 md:p-6 max-w-[1400px] mx-auto dot-grid relative">
      {/* Gradient mesh background behind the welcome section */}
      <div
        className="absolute inset-0 pointer-events-none -z-10 opacity-30"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 20% 10%, color-mix(in srgb, var(--info) 15%, transparent), transparent), radial-gradient(ellipse 60% 40% at 80% 20%, color-mix(in srgb, var(--primary) 10%, transparent), transparent), radial-gradient(ellipse 50% 50% at 50% 50%, color-mix(in srgb, var(--info) 8%, transparent), transparent)',
          backgroundSize: '200% 200%',
          animation: 'gradient-mesh 12s ease-in-out infinite',
        }}
      />
      {/* Live Activity Ticker - Full width */}
      <ActivityTicker />

      {/* Simulated Data Transparency Badge */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-400 w-fit" role="status" aria-label="Data source indicator">
        <Info className="w-3 h-3 shrink-0" />
        <span className="text-[11px] font-medium">Simulated Data — Prototype</span>
      </div>

      {/* Welcome Section - Enhanced with gradient background and decorative icon */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="rounded-xl bg-card border border-border/30 bg-gradient-to-r from-[#1a237e]/5 via-background to-[#FF9933]/5 p-4 sm:p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            {/* Decorative railway icon with subtle animation */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9933]/20 to-[#1a237e]/20 shrink-0"
            >
              <TrainFront className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </motion.div>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={typedGreeting}
                    className="inline"
                  >
                    {typedGreeting.split('').map((char, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15, delay: i * 0.01 }}
                        className={char === ' ' ? 'inline' : 'inline-block'}
                      >
                        {char === ' ' ? '\u00A0' : char}
                      </motion.span>
                    ))}
                  </motion.span>
                </AnimatePresence>
                {isTypingDone && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="inline-block ml-0.5"
                  >|</motion.span>
                )}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                <Clock className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{format(currentTime, 'EEEE, MMMM d, yyyy · HH:mm')}</span>
                <span className="sm:hidden">{format(currentTime, 'EEE, MMM d · HH:mm')}</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-normal">
                  {ROLE_LABELS[currentRole]}
                </Badge>
              </p>
              {/* Today's Focus — staggered pills */}
              {isTypingDone && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-wrap items-center gap-2 mt-2"
                >
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mr-1">Today&apos;s Focus</span>
                  {focusItems.map((item, index) => (
                    <motion.div
                      key={item.text}
                      initial={{ opacity: 0, x: -8, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ duration: 0.25, delay: index * 0.1 }}
                      className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 border border-border/50 px-2.5 py-0.5 text-[11px] font-medium text-foreground/80 transition-transform duration-150 hover:scale-105 cursor-default"
                    >
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${item.color} shrink-0`} />
                      {item.text}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
          {/* Quick Actions - Enhanced with border and background */}
          <div className="flex items-center gap-2 flex-wrap rounded-xl p-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  className="bg-[#283593] hover:bg-[#0d47a1] text-white text-xs h-10 min-h-[44px] sm:h-9 px-4 gap-1.5 font-medium shadow-sm rounded-full"
                  onClick={() => setActiveView('planning')}
                >
                  <Sparkles className="h-4 w-4" />
                  Run Optimization
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">AI-powered block optimization engine</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-10 min-h-[44px] sm:h-9 px-3 gap-1.5 font-medium rounded-full bg-muted/30 border border-border/50"
                  onClick={() => setActiveView('timetable')}
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span className="hidden xs:inline">View </span>Conflicts
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">View timetable conflicts & resolutions</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-10 min-h-[44px] sm:h-9 px-3 gap-1.5 font-medium rounded-full bg-muted/30 border border-border/50"
                  onClick={() => setActiveView('maintenance')}
                >
                  <Plus className="h-4 w-4" />
                  Create Request
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Create a new maintenance request</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </motion.div>

      <Separator />

      {/* KPI Strip - Staggered animation per card with border glow */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2 sm:gap-3 border-glow rounded-lg p-1">
        {kpiCards.map((kpi, index) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.05 + index * 0.05 }}
          >
            <KpiCard
              icon={kpi.icon}
              label={kpi.label}
              value={kpi.value}
              unit={kpi.unit}
              trend={kpi.trend}
              trendValue={kpi.trendValue}
              status={kpi.status}
            />
          </motion.div>
        ))}
      </div>

      <Separator />

      {/* Charts Row + Workload + System Status + Weather */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="md:col-span-1"
        >
          <div className="flex items-center gap-2 mb-3 border-l-2 border-primary/40 pl-2">
            <BarChart3 className="h-4 w-4 text-primary/70" />
            <h2 className="text-sm font-semibold heading-gradient-underline">Department Distribution</h2>
          </div>
          <DepartmentChart />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.15 }}
          className="md:col-span-1"
        >
          <div className="flex items-center gap-2 mb-3 border-l-2 border-primary/40 pl-2">
            <Route className="h-4 w-4 text-primary/70" />
            <h2 className="text-sm font-semibold heading-gradient-underline">Corridor Analysis</h2>
          </div>
          <CorridorChart />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.175 }}
          className="md:col-span-1"
        >
          <div className="flex items-center gap-2 mb-3 border-l-2 border-[#1a237e]/40 pl-2">
            <Users className="h-4 w-4 text-[#283593] dark:text-[#3f51b5]" />
            <h2 className="text-sm font-semibold heading-gradient-underline">Department Workload</h2>
          </div>
          <DepartmentWorkloadChart />
        </motion.div>
        {/* System Status - Enhanced with pulsing dot and progress bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.2 }}
        >
          <Card className="h-full">
            <CardContent className="p-4 space-y-3">
              {/* Section heading with icon and border accent */}
              <div className="flex items-center gap-2 border-l-2 border-primary/40 pl-2">
                <Zap className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">System Status</h3>
              </div>

              {/* Connectivity with pulsing green dot */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">Connectivity</span>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-2 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800">
                    {/* R8-1: Mini heartbeat SVG next to Online status */}
                    <svg width="14" height="10" viewBox="0 0 14 10" className="mr-1 inline-block heartbeat-line" fill="none">
                      <polyline points="0,5 2,5 3,2 4,8 5,1 6,9 7,3 8,5 9,5 10,5 11,5 12,5 14,5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Online
                  </Badge>
                </div>
              </div>

              {/* Last Sync */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">Last Sync</span>
                <span className="text-xs font-medium tabular-nums">{format(new Date(), 'HH:mm:ss')}</span>
              </div>

              {/* AI Engine with progress bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">AI Engine</span>
                  <Badge variant="outline" className="bg-[#e8eaf6] text-[#0d47a1] border-[#9fa8da] text-[10px] px-2 dark:bg-[#0d1442]/30 dark:text-[#3f51b5] dark:border-[#1a237e]">
                    <Cpu className="h-2.5 w-2.5 mr-1" />
                    Active
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">Utilization</span>
                  <Progress value={68} className="h-1.5 flex-1" />
                  <span className="text-[10px] font-medium tabular-nums">68%</span>
                </div>
              </div>

              {/* Optimization Status */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">Optimization</span>
                <span className="text-xs text-muted-foreground">Idle</span>
              </div>

              {/* Uptime */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">Uptime</span>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">99.8%</span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs h-9 min-h-[44px] sm:h-7 gap-1.5 mt-1"
                onClick={() => {
                  setIsRefreshingStatus(true)
                  useAppStore.setState({ lastSyncTime: new Date().toISOString() })
                  setTimeout(() => {
                    setIsRefreshingStatus(false)
                    toast.success('System status refreshed', { description: `Last sync ${format(new Date(), 'HH:mm:ss')}` })
                  }, 900)
                }}
                disabled={isRefreshingStatus}
              >
                <RefreshCw className={cn('h-3 w-3', isRefreshingStatus && 'animate-spin')} />
                {isRefreshingStatus ? 'Refreshing…' : 'Refresh Status'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Weather Alert Widget */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.22 }}
        >
          <WeatherAlert />
        </motion.div>
      </div>

      <Separator />

      {/* Activity & Conflicts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.25 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 border-l-2 border-primary/40 pl-2">
              <Activity className="h-4 w-4 text-primary/70" />
              <h2 className="text-sm font-semibold heading-gradient-underline">Recent Activity</h2>
            </div>
            {/* Collapsible toggle on mobile */}
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setActivityExpanded(!activityExpanded)}
              >
                {activityExpanded ? (
                  <>Less <ChevronUp className="h-3 w-3" /></>
                ) : (
                  <>More <ChevronDown className="h-3 w-3" /></>
                )}
              </Button>
            )}
          </div>
          <div className={isMobile && !activityExpanded ? 'max-h-32 overflow-hidden' : ''}>
            <ActivityFeed />
          </div>
          {isMobile && !activityExpanded && (
            <div className="relative mt-0">
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
            </div>
          )}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-3 border-l-2 border-destructive/40 pl-2">
            <AlertTriangle className="h-4 w-4 text-destructive/70" />
            <h2 className="text-sm font-semibold heading-gradient-underline">Active Conflicts</h2>
          </div>
          <ConflictsSummary />
        </motion.div>
      </div>

      <Separator />

      {/* Corridor Performance Trends — Full width */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.33 }}
      >
        <div className="flex items-center gap-2 mb-3 border-l-2 border-[#1a237e]/40 pl-2">
          <TrendingUp className="h-4 w-4 text-[#283593] dark:text-[#3f51b5]" />
          <h2 className="text-sm font-semibold heading-gradient-underline">Corridor Performance Trends</h2>
        </div>
        <CorridorPerformanceChart />
      </motion.div>

      <Separator />

      {/* Resource Allocation Widget */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.36 }}
      >
        <div className="flex items-center gap-2 mb-3 border-l-2 border-[#1a237e]/40 pl-2">
          <Package className="h-4 w-4 text-[#283593] dark:text-[#3f51b5]" />
          <h2 className="text-sm font-semibold heading-gradient-underline">Resource Allocation / संसाधन आवंटन</h2>
        </div>
        <ResourceAllocationWidget />
      </motion.div>

      <Separator />

      {/* Data Visualization Row: Heatmap + Donut + Radar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.35 }}
        >
          <div className="flex items-center gap-2 mb-3 border-l-2 border-primary/40 pl-2">
            <MapPin className="h-4 w-4 text-primary/70" />
            <h2 className="text-sm font-semibold heading-gradient-underline">Corridor Heatmap</h2>
          </div>
          <CorridorHeatmap />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-3 border-l-2 border-primary/40 pl-2">
            <Gauge className="h-4 w-4 text-primary/70" />
            <h2 className="text-sm font-semibold heading-gradient-underline">Block Utilization</h2>
          </div>
          <BlockUtilizationChart />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.45 }}
        >
          <div className="flex items-center gap-2 mb-3 border-l-2 border-[#1a237e] pl-2">
            <Target className="h-4 w-4 text-[#283593] dark:text-[#3f51b5]" />
            <h2 className="text-sm font-semibold heading-gradient-underline">Section Comparison / खंड तुलना</h2>
          </div>
          <SectionComparisonChart />
        </motion.div>
      </div>

      <Separator />

      {/* Railway Network Map + Corridor Health Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.45 }}
          className="md:col-span-2"
        >
          <RailwayNetworkMap />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.5 }}
        >
          <CorridorHealthRing />
        </motion.div>
      </div>

      <Separator />

      {/* Corridor Chart Row */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.52 }}
      >
        <CorridorChart />
      </motion.div>

      <Separator />

      {/* Plan Status */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.55 }}
      >
        <div className="flex items-center gap-2 mb-3 border-l-2 border-primary/40 pl-2">
          <LayoutDashboard className="h-4 w-4 text-primary/70" />
          <h2 className="text-sm font-semibold heading-gradient-underline">Plan Status</h2>
        </div>
        <PlanStatus />
      </motion.div>

      <Separator />

      {/* Railway Stats Footer Section - Collapsible */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.5 }}
      >
        <Card className="border-border/60">
          <CardContent className="p-4 sm:p-5">
            {/* Header with toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 border-l-2 border-[#1a237e]/40 pl-2">
                <TrainFront className="h-4 w-4 text-[#283593] dark:text-[#3f51b5]" />
                <h2 className="text-sm font-semibold heading-gradient-underline">Indian Railways Network</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                onClick={() => setRailwayStatsExpanded(!railwayStatsExpanded)}
              >
                {railwayStatsExpanded ? (
                  <>Show Less <ChevronUp className="h-3 w-3" /></>
                ) : (
                  <>Show More <ChevronDown className="h-3 w-3" /></>
                )}
              </Button>
            </div>

            {/* Always visible summary line */}
            <p className="text-xs text-muted-foreground mt-1.5 pl-3.5">
              One of the world&apos;s largest railway networks — connecting the nation
            </p>

            {/* Collapsible stats grid */}
            {railwayStatsExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.25 }}
                className="mt-4"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Total Route */}
                  <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3 border border-border/40">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#1a237e]/10 shrink-0">
                      <Route className="h-4 w-4 text-[#283593] dark:text-[#3f51b5]" />
                    </div>
                    <div>
                      <div className="text-lg font-bold tracking-tight">67,956</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">km Total Route</div>
                    </div>
                  </div>
                  {/* Daily Trains */}
                  <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3 border border-border/40">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 shrink-0">
                      <TrainFront className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-lg font-bold tracking-tight">13,000+</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Daily Trains</div>
                    </div>
                  </div>
                  {/* Zones */}
                  <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3 border border-border/40">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500/10 shrink-0">
                      <Layers className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <div className="text-lg font-bold tracking-tight">18</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Zones</div>
                    </div>
                  </div>
                  {/* Divisions */}
                  <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3 border border-border/40">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/10 shrink-0">
                      <Network className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-lg font-bold tracking-tight">72</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Divisions</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

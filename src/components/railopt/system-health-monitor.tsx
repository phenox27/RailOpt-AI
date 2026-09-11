'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { motion } from 'framer-motion'
import {
  Server,
  Zap,
  Wifi,
  WifiOff,
  Database,
  HardDrive,
  Users,
  Clock,
  HeartPulse,
  RefreshCw,
} from 'lucide-react'

// --- Types ---
interface HealthMetrics {
  serverUptime: number
  apiResponseMs: number
  wsStatus: 'connected' | 'disconnected' | 'reconnecting'
  dbQueryLatencyMs: number
  dbPoolUsed: number
  dbPoolTotal: number
  memoryUsed: number
  activeUsers: number
  lastSyncAgo: number
  overallScore: number
}

// --- Helpers ---
function randBetween(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10
}

function generateMetrics(): HealthMetrics {
  const serverUptime = randBetween(99.5, 99.9)
  const apiResponseMs = randBetween(45, 120)
  const wsRoll = Math.random()
  const wsStatus: HealthMetrics['wsStatus'] = wsRoll < 0.85 ? 'connected' : wsRoll < 0.95 ? 'reconnecting' : 'disconnected'
  const dbQueryLatencyMs = randBetween(8, 35)
  const dbPoolUsed = Math.round(randBetween(12, 28))
  const dbPoolTotal = 32
  const memoryUsed = randBetween(62, 78)
  const activeUsers = Math.round(randBetween(14, 38))
  const lastSyncAgo = randBetween(1, 30)

  // Overall health score (0-100)
  const uptimeScore = serverUptime > 99.7 ? 30 : serverUptime > 99.5 ? 22 : 15
  const apiScore = apiResponseMs < 60 ? 20 : apiResponseMs < 90 ? 15 : 8
  const wsScore = wsStatus === 'connected' ? 20 : wsStatus === 'reconnecting' ? 12 : 5
  const dbScore = dbQueryLatencyMs < 15 ? 15 : dbQueryLatencyMs < 25 ? 10 : 5
  const memScore = memoryUsed < 70 ? 15 : memoryUsed < 80 ? 10 : 5
  const overallScore = Math.min(100, uptimeScore + apiScore + wsScore + dbScore + memScore)

  return {
    serverUptime,
    apiResponseMs,
    wsStatus,
    dbQueryLatencyMs,
    dbPoolUsed,
    dbPoolTotal,
    memoryUsed,
    activeUsers,
    lastSyncAgo,
    overallScore,
  }
}

function getScoreColor(score: number) {
  if (score >= 80) return { stroke: '#14b8a6', text: 'text-[#283593] dark:text-[#3f51b5]', bg: 'bg-[#1a237e]/10', label: 'Healthy' }
  if (score >= 50) return { stroke: '#f59e0b', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', label: 'Warning' }
  return { stroke: '#ef4444', text: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10', label: 'Critical' }
}

function getStatusDot(status: 'connected' | 'disconnected' | 'reconnecting') {
  if (status === 'connected') return { color: 'bg-emerald-500', ring: 'ring-emerald-500/30', label: 'Connected' }
  if (status === 'reconnecting') return { color: 'bg-amber-500', ring: 'ring-amber-500/30', label: 'Reconnecting' }
  return { color: 'bg-red-500', ring: 'ring-red-500/30', label: 'Disconnected' }
}

function formatSyncAgo(seconds: number) {
  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${Math.round(seconds)}s ago`
  return `${Math.round(seconds / 60)}m ago`
}

// --- SVG Gauge ---
function HealthGauge({ value, size = 96 }: { value: number; size?: number }) {
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  const colors = getScoreColor(value)

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="currentColor"
          className="text-muted/30"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className={`text-xl font-bold tabular-nums ${colors.text}`}
          key={value}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {value}
        </motion.span>
        <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Score</span>
      </div>
    </div>
  )
}

// --- Sub-card metric ---
function MetricCard({
  icon: Icon,
  label,
  value,
  unit,
  children,
  delay = 0,
}: {
  icon: typeof Server
  label: string
  value: string | number
  unit?: string
  children?: React.ReactNode
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      className="flex flex-col gap-1.5 rounded-lg bg-muted/40 border border-border/40 p-3"
    >
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold tabular-nums text-foreground">{value}</span>
        {unit && <span className="text-[11px] text-muted-foreground">{unit}</span>}
      </div>
      {children}
    </motion.div>
  )
}

// --- Main Component ---
export function SystemHealthMonitor() {
  const [metrics, setMetrics] = useState<HealthMetrics>(generateMetrics)
  const [pulseKey, setPulseKey] = useState(0)

  const refresh = useCallback(() => {
    setMetrics(generateMetrics())
    setPulseKey((k) => k + 1)
  }, [])

  // Auto-update every 5 seconds
  useEffect(() => {
    const interval = setInterval(refresh, 5000)
    return () => clearInterval(interval)
  }, [refresh])

  const scoreColors = getScoreColor(metrics.overallScore)
  const wsDot = getStatusDot(metrics.wsStatus)
  const dbPoolPct = Math.round((metrics.dbPoolUsed / metrics.dbPoolTotal) * 100)
  const memPct = Math.round(metrics.memoryUsed)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-l-2 border-l-[#1a237e]/60 overflow-hidden">
        {/* Subtle grid background pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
          aria-hidden="true"
        />
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HeartPulse className="w-4.5 h-4.5 text-[#283593] dark:text-[#3f51b5]" />
              <CardTitle className="text-base">
                System Health / सिस्टम स्वास्थ्य
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`text-[10px] ${scoreColors.bg} ${scoreColors.text} border-current/20`}
              >
                {scoreColors.label}
              </Badge>
              <button
                onClick={refresh}
                className="p-1 rounded-md hover:bg-muted/60 transition-colors"
                aria-label="Refresh health metrics"
              >
                <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Overall Health Score */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center gap-2 rounded-lg bg-muted/40 border border-border/40 p-3 sm:col-span-1 lg:row-span-2"
            >
              <HealthGauge value={metrics.overallScore} size={96} />
              <span className="text-[11px] text-muted-foreground">Overall Health</span>
            </motion.div>

            {/* Server Status */}
            <MetricCard
              icon={Server}
              label="Server Uptime"
              value={metrics.serverUptime.toFixed(1)}
              unit="%"
              delay={0.05}
            >
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${metrics.serverUptime >= 99.7 ? 'bg-emerald-500' : metrics.serverUptime >= 99.5 ? 'bg-amber-500' : 'bg-red-500'}`} />
                <span className="text-[10px] text-muted-foreground">
                  {metrics.serverUptime >= 99.7 ? 'Healthy' : metrics.serverUptime >= 99.5 ? 'Degraded' : 'Critical'}
                </span>
              </div>
            </MetricCard>

            {/* API Response Time */}
            <MetricCard
              icon={Zap}
              label="API Response"
              value={Math.round(metrics.apiResponseMs)}
              unit="ms"
              delay={0.1}
            >
              <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    backgroundColor:
                      metrics.apiResponseMs < 60 ? '#14b8a6' : metrics.apiResponseMs < 90 ? '#f59e0b' : '#ef4444',
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (metrics.apiResponseMs / 150) * 100)}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
            </MetricCard>

            {/* WebSocket */}
            <MetricCard
              icon={metrics.wsStatus === 'connected' ? Wifi : WifiOff}
              label="WebSocket"
              value={wsDot.label}
              delay={0.15}
            >
              <div className="flex items-center gap-1.5">
                <span className={`relative flex h-2 w-2`}>
                  {metrics.wsStatus === 'connected' && (
                    <motion.span
                      key={pulseKey}
                      className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
                      animate={{ scale: [1, 1.8], opacity: [0.75, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    />
                  )}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${wsDot.color}`} />
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {metrics.wsStatus === 'connected' ? 'Live' : metrics.wsStatus === 'reconnecting' ? 'Retrying...' : 'Down'}
                </span>
              </div>
            </MetricCard>

            {/* Database Health */}
            <MetricCard
              icon={Database}
              label="DB Query Latency"
              value={Math.round(metrics.dbQueryLatencyMs)}
              unit="ms"
              delay={0.2}
            >
              <div className="space-y-1">
                <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: metrics.dbQueryLatencyMs < 15 ? '#14b8a6' : metrics.dbQueryLatencyMs < 25 ? '#f59e0b' : '#ef4444',
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (metrics.dbQueryLatencyMs / 50) * 100)}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-muted-foreground">
                  <span>Pool: {metrics.dbPoolUsed}/{metrics.dbPoolTotal}</span>
                  <span>{dbPoolPct}%</span>
                </div>
              </div>
            </MetricCard>

            {/* Memory Usage */}
            <MetricCard
              icon={HardDrive}
              label="Memory Usage"
              value={memPct}
              unit="%"
              delay={0.25}
            >
              <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: memPct < 70 ? '#14b8a6' : memPct < 80 ? '#f59e0b' : '#ef4444',
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${memPct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
            </MetricCard>

            {/* Active Users */}
            <MetricCard
              icon={Users}
              label="Active Users"
              value={metrics.activeUsers}
              delay={0.3}
            >
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <motion.span
                    key={pulseKey}
                    className="absolute inline-flex h-full w-full rounded-full bg-[#3f51b5] opacity-75"
                    animate={{ scale: [1, 1.6], opacity: [0.75, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1a237e]" />
                </span>
                <span className="text-[10px] text-muted-foreground">Online now</span>
              </div>
            </MetricCard>

            {/* Last Sync */}
            <MetricCard
              icon={Clock}
              label="Last Sync"
              value={formatSyncAgo(metrics.lastSyncAgo)}
              delay={0.35}
            >
              <div className="h-1.5 w-full">
                <Progress
                  value={Math.max(0, 100 - (metrics.lastSyncAgo / 30) * 100)}
                  className="h-1.5 [&>[data-slot=progress-indicator]]:bg-[#1a237e]"
                />
              </div>
            </MetricCard>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

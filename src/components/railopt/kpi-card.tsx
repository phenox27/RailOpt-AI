'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import { useAnimatedCounter } from '@/hooks/use-animated-counter'

export type KpiStatus = 'default' | 'info' | 'success' | 'warning' | 'danger'

export interface KpiCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  unit?: string
  trend?: 'up' | 'down' | 'flat'
  trendValue?: string
  status?: KpiStatus
  sparklineData?: number[]
  progress?: number // 0-100, shown as thin bar at bottom for danger/warning
}

const statusColors: Record<KpiStatus, { bg: string; icon: string; border: string; borderTop: string; gradient: string; gradientOverlay: string; progressColor: string; glowColor: string }> = {
  default: { bg: '', icon: 'text-foreground', border: '', borderTop: 'border-t-muted-foreground/20', gradient: 'from-muted to-muted', gradientOverlay: 'from-transparent via-transparent to-muted/5', progressColor: 'bg-muted-foreground/20', glowColor: 'shadow-muted-foreground/10' },
  info: { bg: 'bg-[var(--info)]/10', icon: 'text-[var(--info)]', border: 'border-[var(--info)]/40', borderTop: 'border-t-blue-500', gradient: 'from-[var(--info)]/20 to-[var(--info)]/5', gradientOverlay: 'from-transparent via-transparent to-blue-500/5', progressColor: 'bg-[var(--info)]', glowColor: 'shadow-blue-500/15' },
  success: { bg: 'bg-[var(--info)]/10', icon: 'text-[var(--info)]', border: 'border-[var(--info)]/40', borderTop: 'border-t-emerald-500', gradient: 'from-[var(--info)]/20 to-[var(--info)]/5', gradientOverlay: 'from-transparent via-transparent to-emerald-500/5', progressColor: 'bg-[var(--info)]', glowColor: 'shadow-emerald-500/15' },
  warning: { bg: 'bg-[var(--warning)]/10', icon: 'text-[var(--warning)]', border: 'border-[var(--warning)]/40', borderTop: 'border-t-amber-500', gradient: 'from-[var(--warning)]/20 to-[var(--warning)]/5', gradientOverlay: 'from-transparent via-transparent to-amber-500/5', progressColor: 'bg-[var(--warning)]', glowColor: 'shadow-amber-500/15' },
  danger: { bg: 'bg-[var(--danger)]/10', icon: 'text-[var(--danger)]', border: 'border-[var(--danger)]/40', borderTop: 'border-t-red-500', gradient: 'from-[var(--danger)]/20 to-[var(--danger)]/5', gradientOverlay: 'from-transparent via-transparent to-red-500/5', progressColor: 'bg-[var(--danger)]', glowColor: 'shadow-red-500/15' },
}

const trendIcons = {
  up: '↑',
  down: '↓',
  flat: '→',
}

const trendColors = {
  up: 'text-[var(--success)]',
  down: 'text-[var(--danger)]',
  flat: 'text-[var(--text-muted)]',
}

// Generate default sparkline data from value
function generateSparkline(value: number): number[] {
  const base = typeof value === 'number' ? value : parseInt(String(value)) || 50
  return Array.from({ length: 7 }, (_, i) => {
    const variation = (Math.sin(i * 0.8) * base * 0.15) + (Math.random() - 0.5) * base * 0.1
    return Math.max(0, base + variation - base * 0.3)
  })
}

// Shimmer loading skeleton
function KpiSkeleton() {
  return (
    <Card className="py-0 gap-0 border-l-4">
      <CardContent className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="h-9 w-9 rounded-lg bg-muted animate-pulse" />
          <div className="h-4 w-12 rounded bg-muted/60 animate-pulse" />
        </div>
        <div className="mt-3">
          <div className="h-8 w-20 rounded bg-muted animate-pulse" />
          <div className="h-3 w-28 rounded bg-muted/60 animate-pulse mt-2" />
        </div>
        <div className="h-8 mt-2 rounded bg-muted/40 animate-pulse" />
      </CardContent>
      <div className="h-1 w-full bg-muted/30 rounded-b-lg" />
    </Card>
  )
}

export function KpiCard({ icon: Icon, label, value, unit, trend, trendValue, status = 'default', sparklineData, progress }: KpiCardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const colors = statusColors[status]
  const numericValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0
  const sparkData = sparklineData ?? generateSparkline(numericValue)
  const showProgress = progress !== undefined || status === 'danger' || status === 'warning'
  const progressValue = progress ?? (status === 'danger' ? Math.min(numericValue * 10, 100) : status === 'warning' ? Math.min(numericValue * 5, 80) : undefined)

  // Animated counter — starts after loading skeleton resolves
  const animatedValue = useAnimatedCounter(numericValue, 1200, !isLoading)
  // Decide what to display: use animated value for numbers, raw value for strings
  const displayValue = typeof value === 'number' ? animatedValue : value

  // Shimmer loading for 300ms on initial mount
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) return <KpiSkeleton />

  const ariaLabel = `${label}: ${value}${unit ? ' ' + unit : ''}${trend && trendValue ? `, trend ${trend} ${trendValue}` : ''}`

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <Card
        className={cn(
          'py-0 gap-0 transition-all duration-200 cursor-default group relative overflow-hidden',
          'border-l-4 border-t-4',
          colors.border,
          colors.borderTop,
          // Glow effect on hover with border-glow
          'hover:shadow-lg border-glow-hover',
          // Inner shadow on hover for depth
          'hover:shadow-inner',
          colors.glowColor
        )}
        role="status"
        aria-label={ariaLabel}
        tabIndex={0}
      >
        {/* Animated gradient border (conic-gradient pseudo-element) */}
        <div className="gradient-border absolute inset-0 rounded-[inherit] pointer-events-none" />
        {/* Shimmer/glow effect on hover — pronounced animated highlight sweep */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className={cn(
            'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500',
            'bg-gradient-to-r from-transparent via-white/20 to-transparent',
            'translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700'
          )} />
        </div>
        {/* Subtle gradient overlay in the background */}
        <div className={cn(
          'absolute inset-0 bg-gradient-to-b pointer-events-none',
          colors.gradientOverlay
        )} />
        <CardContent className="p-4 pb-2 relative">
          <div className="flex items-start justify-between gap-2">
            <div className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg shrink-0 bg-gradient-to-br transition-transform duration-300',
              status === 'default' ? 'from-muted to-muted/60' : colors.gradient,
              'group-hover:scale-105 group-hover:animate-pulse'
            )}>
              <Icon className={cn('h-4.5 w-4.5', colors.icon)} />
            </div>
            {trend && trendValue && (
              <span className={cn('text-xs font-medium inline-flex items-center gap-0.5 tabular-nums', trendColors[trend])}>
                <span className="text-[11px] leading-none">{trendIcons[trend]}</span> {trendValue}
              </span>
            )}
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold tabular-nums tracking-tight">
              {displayValue}
              {unit && <span className="text-sm font-normal text-muted-foreground ml-0.5">{unit}</span>}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
          </div>
          {/* Sparkline */}
          <div className="h-8 mt-2 -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData.map((v, i) => ({ x: i, y: v }))}>
                <defs>
                  <linearGradient id={`spark-${label}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={status === 'danger' ? 'var(--danger)' : status === 'warning' ? 'var(--warning)' : status === 'success' ? 'var(--success)' : 'var(--info)'} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={status === 'danger' ? 'var(--danger)' : status === 'warning' ? 'var(--warning)' : status === 'success' ? 'var(--success)' : 'var(--info)'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="y"
                  stroke={status === 'danger' ? 'var(--danger)' : status === 'warning' ? 'var(--warning)' : status === 'success' ? 'var(--success)' : 'var(--info)'}
                  strokeWidth={1.5}
                  fill={`url(#spark-${label})`}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
        {/* Progress bar at bottom */}
        {showProgress && progressValue !== undefined && (
          <div className="h-1 w-full bg-muted/50 rounded-b-lg overflow-hidden">
            <div
              className={cn('h-full transition-all duration-500', colors.progressColor)}
              style={{ width: `${Math.min(progressValue, 100)}%` }}
            />
          </div>
        )}
      </Card>
    </motion.div>
  )
}

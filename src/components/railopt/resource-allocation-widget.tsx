'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'
import {
  Wrench,
  Cog,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

// ─── Data Types ───────────────────────────────────────────────

interface ResourceItem {
  label: string
  labelHi: string
  total: number
  allocated: number
  weekChange: number // percentage change vs last week (e.g., +3, -2)
}

interface ResourceCategory {
  category: string
  categoryHi: string
  icon: LucideIcon
  items: ResourceItem[]
}

// ─── Static Data ─────────────────────────────────────────────

const resourceCategories: ResourceCategory[] = [
  {
    category: 'Track Machines',
    categoryHi: 'ट्रैक मशीन',
    icon: Cog,
    items: [
      { label: 'Tamping', labelHi: 'टैम्पिंग', total: 8, allocated: 6, weekChange: 5 },
      { label: 'Ballast Cleaning', labelHi: 'बैलास्ट क्लीनिंग', total: 4, allocated: 3, weekChange: -2 },
      { label: 'Rail Grinding', labelHi: 'रेल ग्राइंडिंग', total: 3, allocated: 3, weekChange: 10 },
      { label: 'Dynamic Stabilizer', labelHi: 'डायनामिक स्टेबलाइज़र', total: 5, allocated: 4, weekChange: -1 },
    ],
  },
  {
    category: 'Tools & Equipment',
    categoryHi: 'उपकरण एवं उपकरण',
    icon: Wrench,
    items: [
      { label: 'Welding Sets', labelHi: 'वेल्डिंग सेट', total: 12, allocated: 9, weekChange: 3 },
      { label: 'Track Jacks', labelHi: 'ट्रैक जैक', total: 20, allocated: 14, weekChange: -4 },
      { label: 'Measuring Instruments', labelHi: 'माप उपकरण', total: 15, allocated: 10, weekChange: 1 },
    ],
  },
  {
    category: 'Materials',
    categoryHi: 'सामग्री',
    icon: Package,
    items: [
      { label: 'Rails', labelHi: 'रेल', total: 500, allocated: 420, weekChange: 2 },
      { label: 'Sleepers', labelHi: 'स्लीपर', total: 2000, allocated: 1650, weekChange: -3 },
      { label: 'Ballast', labelHi: 'बैलास्ट', total: 10000, allocated: 8500, weekChange: 1 },
      { label: 'Fastenings', labelHi: 'फास्टनिंग', total: 8000, allocated: 7200, weekChange: 4 },
    ],
  },
]

// ─── Helper Functions ────────────────────────────────────────

function getUtilization(allocated: number, total: number): number {
  return Math.round((allocated / total) * 100)
}

function getUtilizationColor(utilization: number) {
  if (utilization > 90) return 'red'
  if (utilization >= 70) return 'amber'
  return 'green'
}

function getUtilizationClasses(color: 'green' | 'amber' | 'red') {
  switch (color) {
    case 'red':
      return {
        progressBg: 'bg-red-500/20',
        progressIndicator: 'bg-red-500',
        badge: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800',
        text: 'text-red-600 dark:text-red-400',
      }
    case 'amber':
      return {
        progressBg: 'bg-amber-500/20',
        progressIndicator: 'bg-amber-500',
        badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800',
        text: 'text-amber-600 dark:text-amber-400',
      }
    case 'green':
      return {
        progressBg: 'bg-emerald-500/20',
        progressIndicator: 'bg-emerald-500',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800',
        text: 'text-emerald-600 dark:text-emerald-400',
      }
  }
}

function TrendIndicator({ value }: { value: number }) {
  if (value > 0) {
    return (
      <div className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
        <TrendingUp className="h-3 w-3" />
        <span className="text-[10px] font-medium">+{value}%</span>
      </div>
    )
  }
  if (value < 0) {
    return (
      <div className="flex items-center gap-0.5 text-red-600 dark:text-red-400">
        <TrendingDown className="h-3 w-3" />
        <span className="text-[10px] font-medium">{value}%</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-0.5 text-muted-foreground">
      <Minus className="h-3 w-3" />
      <span className="text-[10px] font-medium">0%</span>
    </div>
  )
}

// ─── Mini Sparkline SVG ──────────────────────────────────────

function MiniSparkline({ data, color }: { data: number[]; color: 'green' | 'amber' | 'red' }) {
  const colorMap = {
    green: '#10b981',
    amber: '#f59e0b',
    red: '#ef4444',
  }
  const strokeColor = colorMap[color]

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const width = 40
  const height = 16
  const padding = 2

  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding)
    const y = height - padding - ((val - min) / range) * (height - 2 * padding)
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height} className="opacity-70">
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ─── Compute Summary Stats ───────────────────────────────────

function computeSummary() {
  let totalResources = 0
  let totalAllocated = 0
  let criticalShortages = 0

  resourceCategories.forEach((cat) => {
    cat.items.forEach((item) => {
      totalResources += item.total
      totalAllocated += item.allocated
      if (getUtilization(item.allocated, item.total) > 90) {
        criticalShortages++
      }
    })
  })

  const utilizationPct = Math.round((totalAllocated / totalResources) * 100)

  return { totalResources, totalAllocated, utilizationPct, criticalShortages }
}

// ─── Sparkline data generator (simulated weekly trend) ───────

function generateSparklineData(current: number, change: number): number[] {
  // Generate 7 points leading up to current utilization, with the given week-over-week change
  const base = current - change
  const points: number[] = []
  for (let i = 0; i < 6; i++) {
    const noise = Math.round((Math.random() - 0.5) * 4)
    points.push(Math.max(0, Math.min(100, base + Math.round((change / 6) * i) + noise)))
  }
  points.push(current)
  return points
}

// ─── Main Component ──────────────────────────────────────────

export function ResourceAllocationWidget() {
  const summary = computeSummary()

  return (
    <div className="space-y-4">
      {/* Hindi sub-labels header */}
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground font-medium">
        <span>Resource / संसाधन</span>
        <span className="text-border">|</span>
        <span>Utilization / उपयोग</span>
        <span className="text-border">|</span>
        <span>Available / उपलब्ध</span>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0 }}
        >
          <Card className="border-border/60">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1a237e]/10 shrink-0">
                <Package className="h-4.5 w-4.5 text-[#283593] dark:text-[#3f51b5]" />
              </div>
              <div>
                <div className="text-lg font-bold tracking-tight">{summary.totalResources.toLocaleString()}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Total Resources</div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
        >
          <Card className="border-border/60">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 shrink-0">
                <Cog className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <div className="text-lg font-bold tracking-tight">{summary.utilizationPct}%</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Utilization / उपयोग</div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
        >
          <Card className="border-border/60">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 shrink-0">
                <AlertTriangle className="h-4.5 w-4.5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <div className="text-lg font-bold tracking-tight">{summary.criticalShortages}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Critical Shortages</div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Resource Cards by Category */}
      {resourceCategories.map((category, catIdx) => {
        const CategoryIcon = category.icon
        return (
          <div key={category.category} className="space-y-3">
            {/* Category Header */}
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: catIdx * 0.1 }}
              className="flex items-center gap-2"
            >
              <CategoryIcon className="h-4 w-4 text-[#283593] dark:text-[#3f51b5]" />
              <h3 className="text-sm font-semibold">{category.category}</h3>
              <span className="text-[11px] text-muted-foreground">/ {category.categoryHi}</span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-normal ml-1">
                {category.items.length} items
              </Badge>
            </motion.div>

            {/* Resource Items Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
              {category.items.map((item, itemIdx) => {
                const utilization = getUtilization(item.allocated, item.total)
                const available = item.total - item.allocated
                const color = getUtilizationColor(utilization)
                const classes = getUtilizationClasses(color)
                const sparklineData = generateSparklineData(utilization, item.weekChange)

                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.1 + catIdx * 0.08 + itemIdx * 0.04 }}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Card className="border-border/60 hover:border-border transition-colors cursor-default">
                          <CardContent className="p-3 sm:p-4 space-y-2.5">
                            {/* Label + sparkline row */}
                            <div className="flex items-start justify-between gap-1">
                              <div className="min-w-0">
                                <div className="text-xs font-semibold truncate">{item.label}</div>
                                <div className="text-[10px] text-muted-foreground truncate">{item.labelHi}</div>
                              </div>
                              <div className="shrink-0">
                                <MiniSparkline data={sparklineData} color={color} />
                              </div>
                            </div>

                            {/* Counts row */}
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-muted-foreground">
                                Alloc: <span className="font-medium text-foreground">{item.allocated}</span>
                              </span>
                              <span className="text-muted-foreground">
                                Avail: <span className="font-medium text-foreground">{available}</span>
                              </span>
                            </div>

                            {/* Progress bar with custom colors */}
                            <div className="space-y-1">
                              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                                <motion.div
                                  className={cn('h-full rounded-full', classes.progressIndicator)}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${utilization}%` }}
                                  transition={{ duration: 0.6, delay: 0.2 + catIdx * 0.08 + itemIdx * 0.04, ease: 'easeOut' }}
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <Badge
                                  variant="outline"
                                  className={cn('text-[9px] px-1.5 py-0 h-4 font-medium', classes.badge)}
                                >
                                  {utilization}%
                                </Badge>
                                <TrendIndicator value={item.weekChange} />
                              </div>
                            </div>

                            {/* Total count footer */}
                            <div className="text-[10px] text-muted-foreground font-medium pt-0.5 border-t border-border/40">
                              Total: {item.total.toLocaleString()}
                            </div>
                          </CardContent>
                        </Card>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-[11px]">
                        <div className="space-y-1">
                          <div className="font-semibold">{item.label} ({item.labelHi})</div>
                          <div>Total: {item.total.toLocaleString()} | Allocated: {item.allocated.toLocaleString()} | Available: {available.toLocaleString()}</div>
                          <div>Utilization: {utilization}% | Week Change: {item.weekChange > 0 ? '+' : ''}{item.weekChange}%</div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

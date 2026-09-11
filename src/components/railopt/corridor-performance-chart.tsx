'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

// --- Data ---
interface DataPoint {
  period: string
  availability: number
  utilization: number
  disruptions: number
}

const weeklyData: DataPoint[] = [
  { period: 'Mon', availability: 88, utilization: 72, disruptions: 3 },
  { period: 'Tue', availability: 85, utilization: 68, disruptions: 4 },
  { period: 'Wed', availability: 92, utilization: 75, disruptions: 2 },
  { period: 'Thu', availability: 87, utilization: 70, disruptions: 3 },
  { period: 'Fri', availability: 90, utilization: 78, disruptions: 2 },
  { period: 'Sat', availability: 94, utilization: 65, disruptions: 1 },
  { period: 'Sun', availability: 95, utilization: 60, disruptions: 0 },
]

const monthlyData: DataPoint[] = [
  { period: 'Week 1', availability: 88, utilization: 72, disruptions: 12 },
  { period: 'Week 2', availability: 86, utilization: 70, disruptions: 15 },
  { period: 'Week 3', availability: 90, utilization: 74, disruptions: 10 },
  { period: 'Week 4', availability: 87, utilization: 71, disruptions: 13 },
]

type TimeRange = 'weekly' | 'monthly'

// --- Custom Tooltip ---
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="rounded-lg border border-border bg-background p-3 shadow-md">
      <p className="text-xs font-semibold text-foreground mb-2">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-[11px] text-muted-foreground">{entry.name}:</span>
            <span className="text-[11px] font-semibold text-foreground tabular-nums">
              {entry.value}{entry.name === 'Train Disruptions' ? '' : '%'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// --- Custom Legend ---
function CustomLegend({ payload }: { payload?: Array<{ value: string; color: string }> }) {
  if (!payload) return null

  const icons: Record<string, string> = {
    'Availability': '━━',
    'Utilization': '██',
    'Disruptions': '╌╌',
  }

  return (
    <div className="flex items-center justify-center gap-4 mt-2">
      {payload.map((entry) => (
        <div key={entry.value} className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono" style={{ color: entry.color }}>
            {icons[entry.value] ?? '●'}
          </span>
          <span className="text-[10px] text-muted-foreground font-medium">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

// --- Component ---
export function CorridorPerformanceChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>('weekly')

  const data = timeRange === 'weekly' ? weeklyData : monthlyData

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border border-border">
        <CardContent className="p-4">
          {/* Header with time range toggle */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-[#e8eaf6] dark:bg-[#0d1442]/30 shrink-0">
                <TrendingUp className="w-4 h-4 text-[#283593] dark:text-[#3f51b5]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Corridor Performance</h3>
                <p className="text-[10px] text-muted-foreground">Trends & utilization over time</p>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-muted/50 rounded-md p-0.5 border border-border/40">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-7 text-[11px] px-3 rounded-sm font-medium transition-all',
                  timeRange === 'weekly'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                onClick={() => setTimeRange('weekly')}
              >
                Weekly
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-7 text-[11px] px-3 rounded-sm font-medium transition-all',
                  timeRange === 'monthly'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                onClick={() => setTimeRange('monthly')}
              >
                Monthly
              </Button>
            </div>
          </div>

          {/* Chart */}
          <div className="w-full" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={data}
                margin={{ top: 4, right: 8, left: -12, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  strokeOpacity={0.4}
                />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--color-border)', strokeOpacity: 0.4 }}
                />
                <YAxis
                  yAxisId="percent"
                  tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <YAxis
                  yAxisId="count"
                  orientation="right"
                  tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 'auto']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
                <Bar
                  yAxisId="percent"
                  dataKey="utilization"
                  name="Utilization"
                  fill="var(--color-primary)"
                  fillOpacity={0.6}
                  radius={[3, 3, 0, 0]}
                  barSize={timeRange === 'weekly' ? 20 : 28}
                />
                <Line
                  yAxisId="percent"
                  type="monotone"
                  dataKey="availability"
                  name="Availability"
                  stroke="#14b8a6"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#14b8a6', stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#14b8a6', stroke: '#fff', strokeWidth: 2 }}
                />
                <Line
                  yAxisId="count"
                  type="monotone"
                  dataKey="disruptions"
                  name="Disruptions"
                  stroke="var(--color-destructive)"
                  strokeWidth={2}
                  strokeDasharray="5 3"
                  dot={{ r: 3, fill: 'var(--color-destructive)', stroke: '#fff', strokeWidth: 1.5 }}
                  activeDot={{ r: 5, fill: 'var(--color-destructive)', stroke: '#fff', strokeWidth: 1.5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

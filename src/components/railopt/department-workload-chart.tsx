'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { Users, UserPlus } from 'lucide-react'

interface DepartmentData {
  name: string
  capacity: number
  assigned: number
  team: number
}

const departmentData: DepartmentData[] = [
  { name: 'Engineering', capacity: 8, assigned: 5, team: 7 },
  { name: 'S&T', capacity: 6, assigned: 5, team: 5 },
  { name: 'Traction', capacity: 5, assigned: 4, team: 4 },
  { name: 'Combined', capacity: 3, assigned: 2, team: 3 },
]

function getWorkloadColor(percentage: number): string {
  if (percentage < 70) return 'text-emerald-600 dark:text-emerald-400'
  if (percentage <= 90) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

function getWorkloadBgColor(percentage: number): string {
  if (percentage < 70) return 'bg-emerald-500/15 border-emerald-500/25'
  if (percentage <= 90) return 'bg-amber-500/15 border-amber-500/25'
  return 'bg-red-500/15 border-red-500/25'
}

function getBarColor(percentage: number): string {
  if (percentage < 70) return '#10b981' // emerald-500
  if (percentage <= 90) return '#f59e0b' // amber-500
  return '#ef4444' // red-500
}

// Transform data for recharts horizontal bar chart
const chartData = departmentData.map((d) => ({
  name: d.name,
  assigned: d.assigned,
  capacity: d.capacity - d.assigned, // the remaining portion to fill up to capacity
  ...d,
}))

export function DepartmentWorkloadChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 shrink-0">
              <Users className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">Department Workload</CardTitle>
              <CardDescription className="text-[11px]">Team capacity vs assignments</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 px-4 pb-4 space-y-3">
          {/* Horizontal Bar Chart */}
          <div className="w-full h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 4, right: 20, left: 4, bottom: 4 }}
                barCategoryGap="20%"
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" opacity={0.4} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={70}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: '11px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-background)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'assigned') return [`${value}`, 'Assigned']
                    if (name === 'capacity') return [`${value}`, 'Available']
                    return [value, name]
                  }}
                />
                <Bar
                  dataKey="assigned"
                  stackId="workload"
                  radius={[0, 0, 0, 0]}
                >
                  {chartData.map((entry, index) => {
                    const pct = (entry.assigned / entry.capacity) * 100
                    return <Cell key={`assigned-${index}`} fill={getBarColor(pct)} />
                  })}
                </Bar>
                <Bar
                  dataKey="capacity"
                  stackId="workload"
                  fill="var(--color-muted)"
                  radius={[0, 4, 4, 0]}
                  stroke="var(--color-border)"
                  strokeWidth={1}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Department Details Grid */}
          <div className="space-y-2">
            {departmentData.map((dept, index) => {
              const pct = Math.round((dept.assigned / dept.capacity) * 100)
              const available = dept.capacity - dept.assigned
              return (
                <motion.div
                  key={dept.name}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: 0.1 + index * 0.05 }}
                  className="flex items-center gap-2 text-xs py-1.5 px-2.5 rounded-lg border border-border/40 bg-muted/20"
                >
                  {/* Department name */}
                  <span className="font-medium min-w-[70px]">{dept.name}</span>

                  {/* Workload % badge */}
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 h-5 font-semibold tabular-nums ${getWorkloadBgColor(pct)} ${getWorkloadColor(pct)}`}
                  >
                    {pct}%
                  </Badge>

                  {/* Assigned / Capacity */}
                  <span className="text-muted-foreground tabular-nums">
                    {dept.assigned}/{dept.capacity}
                  </span>

                  {/* Team member count */}
                  <span className="flex items-center gap-0.5 text-muted-foreground ml-auto">
                    <Users className="h-3 w-3" />
                    {dept.team}
                  </span>

                  {/* Available slots */}
                  <span className={`flex items-center gap-0.5 tabular-nums ${available > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    <UserPlus className="h-3 w-3" />
                    {available}
                  </span>
                </motion.div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

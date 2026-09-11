'use client'

import { useMemo } from 'react'
import { blocks } from '@/data/simulated-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Donut } from 'lucide-react'

// Department colors matching the project's visual language
const DEPT_CONFIG = [
  { department: 'engineering', label: 'Engineering', color: '#2563EB', lightColor: '#DBEAFE' },
  { department: 'snt', label: 'S&T', color: '#0EA5A4', lightColor: '#CCFBF1' },
  { department: 'traction', label: 'Traction', color: '#B77900', lightColor: '#FEF3C7' },
  { department: 'combined', label: 'Combined', color: '#7C3AED', lightColor: '#EDE9FE' },
]

interface BlockUtilizationChartProps {
  compact?: boolean
}

export function BlockUtilizationChart({ compact = false }: BlockUtilizationChartProps) {
  // Calculate utilization by department
  const chartData = useMemo(() => {
    const totalDuration = blocks.reduce((sum, b) => sum + b.duration, 0)

    return DEPT_CONFIG.map((dept) => {
      const deptBlocks = blocks.filter((b) => b.department === dept.department)
      const duration = deptBlocks.reduce((sum, b) => sum + b.duration, 0)
      const count = deptBlocks.length
      const utilization = totalDuration > 0 ? (duration / totalDuration) * 100 : 0

      return {
        name: dept.label,
        department: dept.department,
        value: duration,
        count,
        utilization: Math.round(utilization * 10) / 10,
        color: dept.color,
        lightColor: dept.lightColor,
      }
    }).filter((d) => d.value > 0)
  }, [])

  // Total utilization percentage
  const totalUtilization = useMemo(() => {
    // Simulated: blocks cover X% of the available time windows
    // Available = 5 corridors × 24 hours × 60 min = 7200 min/day
    const totalBlockMin = blocks.reduce((sum, b) => sum + b.duration, 0)
    const totalAvailableMin = 5 * 24 * 60
    return Math.round((totalBlockMin / totalAvailableMin) * 100 * 10) / 10
  }, [])

  // Custom label in center of donut
  const renderCenterLabel = () => (
    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="fill-foreground">
      <tspan fontSize={compact ? 18 : 24} fontWeight="700">{totalUtilization}%</tspan>
      <tspan x="50%" dy={compact ? 14 : 18} fontSize={compact ? 9 : 10} className="fill-muted-foreground">Utilization</tspan>
    </text>
  )

  return (
    <Card>
      <CardHeader className={compact ? 'pb-1' : 'pb-2'}>
        <CardTitle className={cn('flex items-center gap-2', compact ? 'text-xs' : 'text-sm')}>
          <Donut className={cn('text-primary', compact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
          Block Utilization
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          {/* Donut chart */}
          <div className={compact ? 'w-[120px] h-[120px]' : 'w-[160px] h-[160px]'}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={compact ? 35 : 48}
                  outerRadius={compact ? 50 : 68}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [`${value} min`, name]}
                  contentStyle={{
                    fontSize: '11px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ position: 'relative', marginTop: compact ? '-120px' : '-160px', height: compact ? '120px' : '160px' }}>
              <div className="text-center">
                <p className={cn('font-bold text-foreground', compact ? 'text-lg' : 'text-2xl')}>{totalUtilization}%</p>
                <p className={cn('text-muted-foreground', compact ? 'text-[8px]' : 'text-[10px]')}>Utilization</p>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-1.5">
            {chartData.map((dept) => (
              <div key={dept.department} className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: dept.color }}
                />
                <span className={cn('text-muted-foreground truncate', compact ? 'text-[9px]' : 'text-[10px]')}>
                  {dept.name}
                </span>
                <span className="flex-1" />
                <span className={cn('font-medium tabular-nums', compact ? 'text-[9px]' : 'text-[10px]')}>
                  {dept.utilization}%
                </span>
                <span className={cn('text-muted-foreground', compact ? 'text-[8px]' : 'text-[9px]')}>
                  ({dept.count})
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function cn(...args: (string | false | undefined | null)[]) {
  return args.filter(Boolean).join(' ')
}

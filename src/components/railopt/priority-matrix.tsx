'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { maintenanceRequests as initialRequests, type SimMaintenanceRequest } from '@/data/simulated-data'
import { motion } from 'framer-motion'
import { LayoutGrid, Wrench, Gauge, AlertTriangle, CircleDot } from 'lucide-react'

interface PriorityMatrixProps {
  requests?: SimMaintenanceRequest[]
}

// Severity to urgency score (Y-axis)
const severityToUrgency: Record<string, number> = {
  low: 20,
  medium: 45,
  high: 72,
  critical: 92,
}

// Priority is already the impact score (X-axis)

const deptColors: Record<string, string> = {
  engineering: '#3b82f6', // blue
  snt: '#14b8a6',         // teal
  traction: '#f59e0b',    // amber
}

const deptNames: Record<string, string> = {
  engineering: 'Engineering',
  snt: 'S&T',
  traction: 'Traction',
}

const quadrantConfig = [
  { label: 'DELEGATE', labelHi: 'सौंपें', color: 'rgba(56, 189, 248, 0.08)', borderColor: 'rgba(56, 189, 248, 0.2)', textColor: 'text-sky-600 dark:text-sky-400' },
  { label: 'DO FIRST', labelHi: 'पहले करें', color: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.2)', textColor: 'text-red-600 dark:text-red-400' },
  { label: 'ELIMINATE', labelHi: 'हटाएं', color: 'rgba(107, 114, 128, 0.06)', borderColor: 'rgba(107, 114, 128, 0.15)', textColor: 'text-muted-foreground' },
  { label: 'SCHEDULE', labelHi: 'निर्धारित करें', color: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.2)', textColor: 'text-amber-600 dark:text-amber-400' },
]

export function PriorityMatrix({ requests = initialRequests }: PriorityMatrixProps) {
  // Map requests to matrix points
  const points = useMemo(() =>
    requests.map((req) => ({
      id: req.id,
      title: req.title,
      department: req.department,
      severity: req.severity,
      status: req.status,
      // X: impact (priority score 0-100)
      x: req.priority,
      // Y: urgency (derived from severity)
      y: severityToUrgency[req.severity] ?? 30,
    })),
    [requests]
  )

  // SVG dimensions
  const width = 420
  const height = 340
  const padding = { top: 20, right: 20, bottom: 40, left: 50 }
  const plotW = width - padding.left - padding.right
  const plotH = height - padding.top - padding.bottom

  const toSvgX = (val: number) => padding.left + (val / 100) * plotW
  const toSvgY = (val: number) => padding.top + plotH - (val / 100) * plotH

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-l-2 border-l-[#1a237e]/60 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-4.5 h-4.5 text-[#283593]" />
            <CardTitle className="text-base">
              Priority Matrix / प्राथमिकता मैट्रिक्स
            </CardTitle>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Urgency vs Impact — {requests.length} requests plotted
          </p>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full min-w-[320px] h-auto"
              role="img"
              aria-label="Priority Matrix chart showing requests by urgency and impact"
            >
              {/* Quadrant backgrounds */}
              {/* Top-Left: Schedule (High Urgency, Low Impact) */}
              <rect
                x={toSvgX(0)} y={toSvgY(100)}
                width={plotW / 2} height={plotH / 2}
                fill={quadrantConfig[3].color}
                stroke={quadrantConfig[3].borderColor}
                strokeWidth={1}
              />
              {/* Top-Right: DO FIRST (High Urgency, High Impact) */}
              <rect
                x={toSvgX(50)} y={toSvgY(100)}
                width={plotW / 2} height={plotH / 2}
                fill={quadrantConfig[1].color}
                stroke={quadrantConfig[1].borderColor}
                strokeWidth={1}
              />
              {/* Bottom-Left: ELIMINATE */}
              <rect
                x={toSvgX(0)} y={toSvgY(50)}
                width={plotW / 2} height={plotH / 2}
                fill={quadrantConfig[2].color}
                stroke={quadrantConfig[2].borderColor}
                strokeWidth={1}
              />
              {/* Bottom-Right: DELEGATE */}
              <rect
                x={toSvgX(50)} y={toSvgY(50)}
                width={plotW / 2} height={plotH / 2}
                fill={quadrantConfig[0].color}
                stroke={quadrantConfig[0].borderColor}
                strokeWidth={1}
              />

              {/* Quadrant labels */}
              <text x={toSvgX(25)} y={toSvgY(75) - 8} textAnchor="middle" className="fill-muted-foreground/60 text-[9px] font-medium" style={{ fontSize: '9px' }}>
                {quadrantConfig[3].label}
              </text>
              <text x={toSvgX(75)} y={toSvgY(75) - 8} textAnchor="middle" className="text-[9px] font-medium" fill="rgba(239,68,68,0.5)" style={{ fontSize: '9px' }}>
                {quadrantConfig[1].label}
              </text>
              <text x={toSvgX(25)} y={toSvgY(25) + 16} textAnchor="middle" className="fill-muted-foreground/40 text-[9px] font-medium" style={{ fontSize: '9px' }}>
                {quadrantConfig[2].label}
              </text>
              <text x={toSvgX(75)} y={toSvgY(25) + 16} textAnchor="middle" className="text-[9px] font-medium" fill="rgba(56,189,248,0.5)" style={{ fontSize: '9px' }}>
                {quadrantConfig[0].label}
              </text>

              {/* Center crosshair lines */}
              <line
                x1={toSvgX(50)} y1={padding.top}
                x2={toSvgX(50)} y2={padding.top + plotH}
                stroke="hsl(var(--border))" strokeWidth={1} strokeDasharray="4 3"
              />
              <line
                x1={padding.left} y1={toSvgY(50)}
                x2={padding.left + plotW} y2={toSvgY(50)}
                stroke="hsl(var(--border))" strokeWidth={1} strokeDasharray="4 3"
              />

              {/* Axis labels */}
              <text x={width / 2} y={height - 4} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: '10px' }}>
                Impact (Priority Score) →
              </text>
              <text x={12} y={height / 2} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: '10px' }} transform={`rotate(-90, 12, ${height / 2})`}>
                Urgency →
              </text>

              {/* Tick marks */}
              {[0, 25, 50, 75, 100].map((v) => (
                <g key={`x-${v}`}>
                  <text x={toSvgX(v)} y={padding.top + plotH + 14} textAnchor="middle" className="fill-muted-foreground/60" style={{ fontSize: '8px' }}>{v}</text>
                </g>
              ))}
              {[0, 25, 50, 75, 100].map((v) => (
                <g key={`y-${v}`}>
                  <text x={padding.left - 8} y={toSvgY(v) + 3} textAnchor="end" className="fill-muted-foreground/60" style={{ fontSize: '8px' }}>{v}</text>
                </g>
              ))}

              {/* Request dots */}
              {points.map((pt, i) => (
                <motion.circle
                  key={pt.id}
                  cx={toSvgX(pt.x)}
                  cy={toSvgY(pt.y)}
                  r={6}
                  fill={deptColors[pt.department] || '#6b7280'}
                  fillOpacity={0.85}
                  stroke={deptColors[pt.department] || '#6b7280'}
                  strokeWidth={1.5}
                  strokeOpacity={0.3}
                  initial={{ r: 0, opacity: 0 }}
                  animate={{ r: 6, opacity: 1 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                >
                  <title>{`${pt.title}\nDept: ${deptNames[pt.department]}\nSeverity: ${pt.severity}\nPriority: ${pt.x}`}</title>
                </motion.circle>
              ))}
            </svg>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-border/50">
            <span className="text-xs text-muted-foreground font-medium">Departments:</span>
            {Object.entries(deptColors).map(([dept, color]) => (
              <div key={dept} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-xs text-muted-foreground">{deptNames[dept]}</span>
              </div>
            ))}
            <div className="ml-auto flex items-center gap-1.5">
              <CircleDot className="w-3.5 h-3.5 text-muted-foreground/50" />
              <span className="text-xs text-muted-foreground">Hover dots for details</span>
            </div>
          </div>

          {/* Quadrant summary counts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
            {[
              { label: 'Do First', count: points.filter(p => p.x >= 50 && p.y >= 50).length, icon: AlertTriangle, cls: 'text-red-600 dark:text-red-400' },
              { label: 'Schedule', count: points.filter(p => p.x < 50 && p.y >= 50).length, icon: Gauge, cls: 'text-amber-600 dark:text-amber-400' },
              { label: 'Delegate', count: points.filter(p => p.x >= 50 && p.y < 50).length, icon: Wrench, cls: 'text-sky-600 dark:text-sky-400' },
              { label: 'Eliminate', count: points.filter(p => p.x < 50 && p.y < 50).length, icon: LayoutGrid, cls: 'text-muted-foreground' },
            ].map((q) => (
              <div key={q.label} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/30">
                <q.icon className={`w-3 h-3 ${q.cls}`} />
                <span className="text-xs text-muted-foreground">{q.label}</span>
                <Badge variant="secondary" className="h-4 px-1.5 text-[10px] ml-auto">{q.count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

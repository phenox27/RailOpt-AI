'use client'

import { useMemo } from 'react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Target } from 'lucide-react'
import { motion } from 'framer-motion'

// Section data with 5 performance dimensions
const SECTIONS = [
  {
    name: 'NDLS-GZB',
    color: '#0d9488', // [#283593]
    Availability: 85,
    Utilization: 78,
    Safety: 92,
    OnTime: 88,
    CrewEfficiency: 75,
  },
  {
    name: 'AGC-BPL',
    color: '#f59e0b', // amber-500
    Availability: 72,
    Utilization: 82,
    Safety: 85,
    OnTime: 76,
    CrewEfficiency: 80,
  },
  {
    name: 'BPL-NGP',
    color: '#8b5cf6', // violet-500
    Availability: 90,
    Utilization: 68,
    Safety: 95,
    OnTime: 92,
    CrewEfficiency: 85,
  },
  {
    name: 'NGP-SC',
    color: '#ef4444', // red-500
    Availability: 65,
    Utilization: 88,
    Safety: 78,
    OnTime: 70,
    CrewEfficiency: 72,
  },
  {
    name: 'SC-CSMT',
    color: '#3b82f6', // blue-500
    Availability: 80,
    Utilization: 75,
    Safety: 88,
    OnTime: 85,
    CrewEfficiency: 90,
  },
]

const DIMENSIONS = [
  'Availability',
  'Utilization',
  'Safety',
  'OnTime',
  'CrewEfficiency',
]

const DIMENSION_LABELS: Record<string, string> = {
  Availability: 'Availability',
  Utilization: 'Utilization',
  Safety: 'Safety Score',
  OnTime: 'On-Time Perf.',
  CrewEfficiency: 'Crew Efficiency',
}

// Transform section data into the format Recharts RadarChart expects
// Each object is one dimension (axis), with a key per section
function buildRadarData() {
  return DIMENSIONS.map((dim) => {
    const point: Record<string, string | number> = {
      dimension: DIMENSION_LABELS[dim],
    }
    for (const section of SECTIONS) {
      point[section.name] = section[dim as keyof typeof section] as number
    }
    return point
  })
}

interface TooltipPayloadItem {
  name: string
  value: number
  color: string
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="rounded-lg border border-border bg-background/95 px-3 py-2 shadow-lg backdrop-blur-sm">
      <p className="mb-1.5 text-xs font-semibold text-foreground">{label}</p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 text-xs">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium text-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SectionComparisonChart() {
  const radarData = useMemo(() => buildRadarData(), [])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Card className="border-l-2 border-l-[#1a237e]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Target className="h-4 w-4 text-[#283593] dark:text-[#3f51b5]" />
            <span>Section Performance / खंड प्रदर्शन</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={340}>
            <RadarChart
              cx="50%"
              cy="50%"
              outerRadius="72%"
              data={radarData}
            >
              <PolarGrid
                stroke="hsl(var(--border))"
                strokeDasharray="3 3"
              />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{
                  fill: 'hsl(var(--muted-foreground))',
                  fontSize: 11,
                  fontWeight: 500,
                }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{
                  fill: 'hsl(var(--muted-foreground))',
                  fontSize: 10,
                }}
                tickCount={5}
              />
              {SECTIONS.map((section) => (
                <Radar
                  key={section.name}
                  name={section.name}
                  dataKey={section.name}
                  stroke={section.color}
                  fill={section.color}
                  fillOpacity={0.12}
                  strokeWidth={2}
                />
              ))}
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{
                  fontSize: '12px',
                  paddingTop: '8px',
                }}
                iconType="circle"
                iconSize={8}
              />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  )
}

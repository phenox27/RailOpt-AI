'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { HeartPulse, ArrowRight } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// Corridor health data
const corridors = [
  { name: 'NDLS-AGC', availability: 87, blocks: 2, conflicts: 0, km: 195 },
  { name: 'AGC-BPL', availability: 92, blocks: 1, conflicts: 0, km: 385 },
  { name: 'BPL-NGP', availability: 78, blocks: 3, conflicts: 2, km: 370 },
  { name: 'NGP-SC', availability: 85, blocks: 1, conflicts: 1, km: 570 },
  { name: 'SC-CSMT', availability: 95, blocks: 0, conflicts: 0, km: 280 },
]

function getHealthColor(avail: number) {
  if (avail >= 90) return { stroke: '#10b981', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' }
  if (avail >= 80) return { stroke: '#14b8a6', text: 'text-[#283593] dark:text-[#3f51b5]', bg: 'bg-[#1a237e]/10' }
  if (avail >= 70) return { stroke: '#f59e0b', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' }
  return { stroke: '#ef4444', text: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10' }
}

function RingChart({ value, size = 64, strokeWidth = 5, color }: { value: number; size?: number; strokeWidth?: number; color: string }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="currentColor"
        className="text-muted/40"
        strokeWidth={strokeWidth}
      />
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
      />
    </svg>
  )
}

export function CorridorHealthRing() {
  const overallHealth = useMemo(() => {
    const avg = corridors.reduce((sum, c) => sum + c.availability, 0) / corridors.length
    return Math.round(avg)
  }, [])

  const totalConflicts = corridors.reduce((sum, c) => sum + c.conflicts, 0)
  const overallColor = getHealthColor(overallHealth)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-l-2 border-l-emerald-500/60">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-4.5 h-4.5 text-emerald-600" />
            <CardTitle className="text-base">
              Corridor Health / गलियारा स्वास्थ्य
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          {/* Overall Health Ring */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <RingChart value={overallHealth} size={80} strokeWidth={6} color={overallColor.stroke} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-lg font-bold tabular-nums ${overallColor.text}`}>
                  {overallHealth}%
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-foreground">Overall Network Health</div>
              <div className="text-xs text-muted-foreground">
                {corridors.length} corridors · {corridors.reduce((s, c) => s + c.km, 0).toLocaleString()} km
              </div>
              <div className="flex items-center gap-2">
                {totalConflicts > 0 ? (
                  <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25">
                    {totalConflicts} conflict{totalConflicts > 1 ? 's' : ''}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25">
                    No conflicts
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Per-Corridor Health Bars */}
          <div className="space-y-2.5">
            {corridors.map((corridor, i) => {
              const colors = getHealthColor(corridor.availability)
              return (
                <TooltipProvider key={corridor.name} delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.div
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06, duration: 0.2 }}
                        className="flex items-center gap-2 group cursor-default"
                      >
                        <span className="text-xs font-medium text-foreground w-[62px] shrink-0">{corridor.name}</span>
                        <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: colors.stroke }}
                            initial={{ width: 0 }}
                            animate={{ width: `${corridor.availability}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 + i * 0.06 }}
                          />
                        </div>
                        <span className={`text-xs font-semibold tabular-nums w-8 text-right ${colors.text}`}>
                          {corridor.availability}%
                        </span>
                        {corridor.conflicts > 0 && (
                          <Badge variant="outline" className="text-[9px] px-1 h-4 bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25">
                            {corridor.conflicts}C
                          </Badge>
                        )}
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <div className="font-medium">{corridor.name}</div>
                      <div className="text-muted-foreground">
                        {corridor.km} km · {corridor.blocks} block{corridor.blocks !== 1 ? 's' : ''} · {corridor.availability}% available
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
              <span className="text-[10px] text-muted-foreground">≥90%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#1a237e]" aria-hidden="true" />
              <span className="text-[10px] text-muted-foreground">80-90%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" aria-hidden="true" />
              <span className="text-[10px] text-muted-foreground">70-80%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" aria-hidden="true" />
              <span className="text-[10px] text-muted-foreground">&lt;70%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

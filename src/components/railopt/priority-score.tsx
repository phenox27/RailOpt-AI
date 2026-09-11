'use client'

import { useState } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface PriorityScoreProps {
  score: number
  severity?: string
  safetyRisk?: string
  assetCriticality?: string
  trafficImpact?: string
  showLabel?: boolean
  size?: 'sm' | 'md'
}

function getScoreColor(score: number): string {
  if (score >= 90) return '#DC2626'    // critical red
  if (score >= 75) return '#EA580C'    // danger orange
  if (score >= 50) return '#D97706'    // warning amber
  return '#16A34A'                     // green
}

function getScoreBgColor(score: number): string {
  if (score >= 90) return '#FEE2E2'
  if (score >= 75) return '#FFEDD5'
  if (score >= 50) return '#FEF3C7'
  return '#DCFCE7'
}

function factorValue(label: string): number {
  const map: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 }
  return map[label.toLowerCase()] ?? 0
}

export function PriorityScore({
  score,
  severity,
  safetyRisk,
  assetCriticality,
  trafficImpact,
  showLabel = true,
  size = 'md',
}: PriorityScoreProps) {
  const [showBreakdown, setShowBreakdown] = useState(false)

  const color = getScoreColor(score)
  const bgColor = getScoreBgColor(score)
  const barHeight = size === 'sm' ? 'h-1.5' : 'h-2'
  const textClass = size === 'sm' ? 'text-[11px]' : 'text-xs'

  const hasBreakdown = severity || safetyRisk || assetCriticality || trafficImpact

  const breakdownItems = [
    { label: 'Severity', value: severity, weight: 30 },
    { label: 'Safety Risk', value: safetyRisk, weight: 30 },
    { label: 'Asset Criticality', value: assetCriticality, weight: 20 },
    { label: 'Traffic Impact', value: trafficImpact, weight: 20 },
  ].filter((item) => item.value)

  const content = (
    <div
      className="flex items-center gap-1.5 cursor-pointer"
      onClick={() => hasBreakdown && setShowBreakdown(!showBreakdown)}
    >
      <div
        className={`${barHeight} w-12 rounded-full overflow-hidden`}
        style={{ backgroundColor: bgColor }}
      >
        <div
          className={`${barHeight} rounded-full transition-all duration-300`}
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      {showLabel && (
        <span
          className={`${textClass} font-semibold tabular-nums`}
          style={{ color }}
        >
          {score}
        </span>
      )}
    </div>
  )

  if (!hasBreakdown) return content

  return (
    <Tooltip open={showBreakdown ? true : undefined} onOpenChange={hasBreakdown ? setShowBreakdown : undefined}>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="top" className="p-3 w-56" sideOffset={8}>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-white mb-1">Priority Breakdown</p>
          {breakdownItems.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-white/80">{item.label}</span>
              <div className="flex items-center gap-1.5">
                <div className="h-1 w-16 rounded-full bg-white/20 overflow-hidden">
                  <div
                    className="h-1 rounded-full bg-white"
                    style={{ width: `${(factorValue(item.value!) / 4) * 100}%` }}
                  />
                </div>
                <span className="text-[11px] text-white/90 w-14 text-right capitalize">{item.value}</span>
              </div>
            </div>
          ))}
          <div className="border-t border-white/20 pt-1.5 mt-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-white">Total Score</span>
              <span className="text-xs font-bold text-white">{score}/100</span>
            </div>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

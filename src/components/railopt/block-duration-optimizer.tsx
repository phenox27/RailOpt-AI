'use client'

import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { blocks } from '@/data/simulated-data'
import {
  Sparkles,
  Clock,
  TrendingDown,
  ShieldCheck,
  Gauge,
  CheckCircle2,
  X,
  ArrowRight,
  Brain,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

// --- Simulated AI optimization data per block ---
interface DurationSuggestion {
  recommendedDuration: number
  timeSavedHours: number
  conflictReductionPct: number
  efficiencyGainPct: number
  reasoning: string
}

const BLOCK_SUGGESTIONS: Record<string, DurationSuggestion> = {
  'blk-001': {
    recommendedDuration: 210,
    timeSavedHours: 0.5,
    conflictReductionPct: 40,
    efficiencyGainPct: 12,
    reasoning: 'Analysis of traffic patterns shows the block can be reduced by 30 minutes by deferring non-critical deep screening to the next window. The Rajdhani Express conflict is eliminated with this adjustment, and corridor availability improves from 82% to 91%.',
  },
  'blk-002': {
    recommendedDuration: 200,
    timeSavedHours: 0.67,
    conflictReductionPct: 60,
    efficiencyGainPct: 18,
    reasoning: 'Combined block can be optimized by parallel execution of Engineering and S&T work. Current sequential overlap of 30 minutes is unnecessary. Reducing to 3h20m eliminates the department conflict while maintaining safety buffers for all maintenance activities.',
  },
  'blk-003': {
    recommendedDuration: 180,
    timeSavedHours: 1.0,
    conflictReductionPct: 35,
    efficiencyGainPct: 15,
    reasoning: 'The UP line block duration can be reduced by 1 hour by staging Traction work concurrently with S&T instead of sequentially. The freight movement conflict at 03:00 is avoided by shifting start time 15 minutes earlier within the same window.',
  },
  'blk-004': {
    recommendedDuration: 150,
    timeSavedHours: 0.5,
    conflictReductionPct: 20,
    efficiencyGainPct: 8,
    reasoning: 'Electronic interlocking upgrade requires 2.5h of focused work with a 30-min testing buffer. Current 3h allocation includes redundant contingency. Reducing to 2h30m maintains full safety compliance while freeing corridor time for other maintenance.',
  },
  'blk-005': {
    recommendedDuration: 120,
    timeSavedHours: 0.5,
    conflictReductionPct: 50,
    efficiencyGainPct: 22,
    reasoning: 'OHE insulator replacement is a targeted activity requiring 2h for 4 spans. The current 2h30m allocation includes an unnecessary 30-min setup that can be done during the pre-block notification period. This eliminates the goods train re-routing need entirely.',
  },
}

const DEFAULT_SUGGESTION: DurationSuggestion = {
  recommendedDuration: 180,
  timeSavedHours: 0.5,
  conflictReductionPct: 25,
  efficiencyGainPct: 10,
  reasoning: 'Based on similar maintenance patterns in this corridor, the block duration can be reduced by optimizing crew deployment and parallelizing activities. This reduces overall corridor unavailability while maintaining safety compliance.',
}

// --- Component ---
interface BlockDurationOptimizerProps {
  blockId: string | null
  currentDuration: number
  onApply: (newDuration: number) => void
}

export function BlockDurationOptimizer({
  blockId,
  currentDuration,
  onApply,
}: BlockDurationOptimizerProps) {
  const suggestion = useMemo(() => {
    if (!blockId) return null
    return BLOCK_SUGGESTIONS[blockId] ?? DEFAULT_SUGGESTION
  }, [blockId])

  const blockName = useMemo(() => {
    if (!blockId) return ''
    return blocks.find(b => b.id === blockId)?.name ?? ''
  }, [blockId])

  if (!blockId || !suggestion) return null

  const currentHours = currentDuration / 60
  const recommendedHours = suggestion.recommendedDuration / 60
  const maxDuration = Math.max(currentDuration, suggestion.recommendedDuration)
  const currentBarPct = (currentDuration / maxDuration) * 100
  const recommendedBarPct = (suggestion.recommendedDuration / maxDuration) * 100

  const durHours = Math.floor(suggestion.recommendedDuration / 60)
  const durMins = suggestion.recommendedDuration % 60
  const recommendedDurStr = durHours > 0 ? `${durHours}h ${durMins}m` : `${durMins}m`

  const curHoursVal = Math.floor(currentDuration / 60)
  const curMinsVal = currentDuration % 60
  const currentDurStr = curHoursVal > 0 ? `${curHoursVal}h ${curMinsVal}m` : `${curMinsVal}m`

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <Card className="border border-[#9fa8da]/60 dark:border-[#1a237e]/40 overflow-hidden">
        {/* Header */}
        <div className="bg-[#e8eaf6] dark:bg-[#0d1442]/30 px-4 py-3 border-b border-[#9fa8da]/60 dark:border-[#1a237e]/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-[#283593] dark:text-[#3f51b5]" />
              <span className="text-sm font-semibold text-foreground">
                Duration Optimizer / अवधि अनुकूलक
              </span>
            </div>
            <Badge variant="outline" className="text-[10px] px-1.5 h-5 bg-[#e8eaf6] text-[#0d47a1] border-[#9fa8da] dark:bg-[#0d1442]/30 dark:text-[#3f51b5] dark:border-[#1a237e]">
              AI
            </Badge>
          </div>
          {blockName && (
            <p className="text-[11px] text-muted-foreground mt-1 truncate">{blockName}</p>
          )}
        </div>

        <CardContent className="p-4 space-y-4">
          {/* Comparison visualization: side-by-side bars */}
          <div className="space-y-3">
            {/* Current duration bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Current</span>
                <span className="font-semibold text-foreground tabular-nums">{currentDurStr}</span>
              </div>
              <div className="relative h-8 w-full rounded-md bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${currentBarPct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="absolute inset-y-0 left-0 rounded-md bg-muted-foreground/20 dark:bg-muted-foreground/15 flex items-center justify-end pr-2"
                >
                  <span className="text-[10px] font-medium text-muted-foreground">{currentHours.toFixed(1)}h</span>
                </motion.div>
              </div>
            </div>

            {/* Recommended duration bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#283593] dark:text-[#3f51b5] font-medium">AI Recommended</span>
                <span className="font-semibold text-[#0d47a1] dark:text-[#5c6bc0] tabular-nums">{recommendedDurStr}</span>
              </div>
              <div className="relative h-8 w-full rounded-md bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${recommendedBarPct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
                  className="absolute inset-y-0 left-0 rounded-md bg-[#1a237e]/30 dark:bg-[#1a237e]/25 flex items-center justify-end pr-2"
                >
                  <span className="text-[10px] font-medium text-[#0d47a1] dark:text-[#5c6bc0]">{recommendedHours.toFixed(1)}h</span>
                </motion.div>
              </div>
            </div>

            {/* Change indicator */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-[#283593] dark:text-[#3f51b5]">
              <TrendingDown className="w-3.5 h-3.5" />
              <span className="font-medium">
                {currentDuration - suggestion.recommendedDuration} min shorter
              </span>
              <ArrowRight className="w-3 h-3" />
              <span className="font-medium">{suggestion.timeSavedHours}h saved</span>
            </div>
          </div>

          <Separator />

          {/* Key metrics */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40">
              <Clock className="w-3.5 h-3.5 text-emerald-600 mx-auto mb-1" />
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">{suggestion.timeSavedHours}h</p>
              <p className="text-[9px] text-muted-foreground">Time Saved</p>
            </div>
            <div className="text-center p-2 rounded-md bg-[#e8eaf6] dark:bg-[#0d1442]/30 border border-[#9fa8da]/60 dark:border-[#1a237e]/40">
              <ShieldCheck className="w-3.5 h-3.5 text-[#283593] mx-auto mb-1" />
              <p className="text-sm font-bold text-[#0d47a1] dark:text-[#3f51b5] tabular-nums">{suggestion.conflictReductionPct}%</p>
              <p className="text-[9px] text-muted-foreground">Conflict ↓</p>
            </div>
            <div className="text-center p-2 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40">
              <Gauge className="w-3.5 h-3.5 text-amber-600 mx-auto mb-1" />
              <p className="text-sm font-bold text-amber-700 dark:text-amber-400 tabular-nums">{suggestion.efficiencyGainPct}%</p>
              <p className="text-[9px] text-muted-foreground">Efficiency ↑</p>
            </div>
          </div>

          <Separator />

          {/* AI Reasoning */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#283593] dark:text-[#3f51b5]" />
              <span className="text-xs font-semibold text-foreground">AI Reasoning</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {suggestion.reasoning}
            </p>
          </div>

          <Separator />

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="flex-1 gap-1.5 bg-[#283593] hover:bg-[#0d47a1] text-white"
              onClick={() => onApply(suggestion.recommendedDuration)}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Apply Suggestion
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={() => onApply(currentDuration)}
            >
              <X className="w-3.5 h-3.5" />
              Keep Current
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

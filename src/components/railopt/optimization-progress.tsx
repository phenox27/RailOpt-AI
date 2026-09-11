'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bot, CheckCircle2, Circle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OptimizationProgressProps {
  isRunning: boolean
  onComplete?: () => void
}

const STEPS = [
  { id: 'scoring', label: 'Scoring priorities' },
  { id: 'constraints', label: 'Checking constraints' },
  { id: 'generating', label: 'Generating recommendations' },
  { id: 'conflicts', label: 'Resolving conflicts' },
]

type OptState = { step: number; complete: boolean; running: boolean }

function optReducer(state: OptState, action: 'tick' | 'complete' | 'reset'): OptState {
  switch (action) {
    case 'tick':
      if (state.step >= STEPS.length - 1) return state
      return { ...state, step: state.step + 1 }
    case 'complete':
      return { ...state, complete: true }
    case 'reset':
      return { step: 0, complete: false, running: false }
    default:
      return state
  }
}

export function OptimizationProgress({ isRunning, onComplete }: OptimizationProgressProps) {
  const [optState, setOptState] = useState<OptState>({ step: 0, complete: false, running: false })
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Handle optimization lifecycle
  useEffect(() => {
    // Clear previous timers
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    if (!isRunning) return

    // Start step progression
    intervalRef.current = setInterval(() => {
      setOptState((prev) => {
        if (prev.step >= STEPS.length - 1) {
          // Already at last step, schedule completion
          if (intervalRef.current) clearInterval(intervalRef.current)
          intervalRef.current = null
          timeoutRef.current = setTimeout(() => {
            setOptState((s) => ({ ...s, complete: true }))
            onComplete?.()
          }, 800)
          return prev // don't change step
        }
        return { ...prev, step: prev.step + 1 }
      })
    }, 1500)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [isRunning, onComplete])

  // Reset state when optimization stops and is not complete
  const currentStep = isRunning || optState.complete ? optState.step : 0
  const isComplete = !isRunning ? false : optState.complete

  if (!isRunning && !optState.complete) return null

  return (
    <Card className="border-[#9fa8da] bg-[#e8eaf6]/20 py-0 gap-0">
      <CardHeader className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 text-[#283593]">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold text-[#1a237e]">
              {isComplete ? 'Optimization Complete' : 'Optimization in progress'}
            </CardTitle>
            {!isComplete && (
              <p className="text-xs text-[#283593]/70 mt-0.5">
                Evaluating maintenance requests against available planning windows...
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4">
        <div className="space-y-2.5">
          {STEPS.map((step, i) => {
            const isDone = isComplete || i < currentStep
            const isCurrent = !isComplete && i === currentStep
            const isPending = !isComplete && i > currentStep

            return (
              <div key={step.id} className="flex items-center gap-2.5">
                <div
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full shrink-0',
                    isDone && 'bg-[#1a237e] text-white',
                    isCurrent && 'bg-teal-100 text-[#283593]',
                    isPending && 'bg-muted text-muted-foreground',
                  )}
                >
                  {isCurrent ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : isDone ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <Circle className="h-3 w-3" />
                  )}
                </div>
                <span
                  className={cn(
                    'text-xs',
                    isDone && 'text-[#0d47a1] font-medium',
                    isCurrent && 'text-[#1a237e] font-medium',
                    isPending && 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </span>
                {isCurrent && (
                  <div className="flex gap-0.5 ml-auto">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1a237e] animate-pulse" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1a237e] animate-pulse [animation-delay:0.2s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1a237e] animate-pulse [animation-delay:0.4s]" />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {isComplete && (
          <div className="mt-3 pt-3 border-t border-[#9fa8da]/50">
            <p className="text-xs text-[#0d47a1] font-medium">
              ✓ AI recommendations generated for 5 blocks
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              2 conflicts detected — review required
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

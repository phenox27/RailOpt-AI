'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { plans, blocks } from '@/data/simulated-data'
import { Calendar, Blocks, CheckCircle2, Circle, Loader2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

const statusConfig: Record<string, { label: string; badgeClass: string; stepIndex: number }> = {
  draft: { label: 'Draft', badgeClass: 'bg-muted text-muted-foreground border-border', stepIndex: 0 },
  optimizing: { label: 'Optimizing', badgeClass: 'bg-[var(--info)]/15 text-[var(--info)] border-[var(--info)]/30', stepIndex: 1 },
  recommended: { label: 'Recommended', badgeClass: 'bg-[var(--warning)]/15 text-[var(--warning)] border-[var(--warning)]/30', stepIndex: 2 },
  reviewed: { label: 'Reviewed', badgeClass: 'bg-[var(--info)]/15 text-[var(--info)] border-[var(--info)]/30', stepIndex: 3 },
  verified: { label: 'Verified', badgeClass: 'bg-[var(--success)]/15 text-[var(--success)] border-[var(--success)]/30', stepIndex: 4 },
  finalized: { label: 'Finalized', badgeClass: 'bg-[var(--success)]/15 text-[var(--success)] border-[var(--success)]/30', stepIndex: 5 },
  approved: { label: 'Approved', badgeClass: 'bg-[var(--success)]/15 text-[var(--success)] border-[var(--success)]/30', stepIndex: 6 },
}

const workflowSteps = ['Draft', 'Optimize', 'Recommend', 'Review', 'Verify', 'Finalize', 'Approve']

export function PlanStatus() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {plans.map((plan) => {
        const config = statusConfig[plan.status] || statusConfig.draft
        const planBlocks = blocks.filter(b => plan.blockIds.includes(b.id))
        const startDate = parseISO(plan.startDate)
        const endDate = parseISO(plan.endDate)

        return (
          <Card key={plan.id} className="py-0 gap-0">
            <CardHeader className="px-4 pt-4 pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm font-semibold truncate">{plan.name}</CardTitle>
                <Badge className={cn('rounded-full text-[10px] px-1.5 py-0 h-4.5 shrink-0', config.badgeClass)}>
                  {config.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              {/* Metadata row */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(startDate, 'MMM d')} – {format(endDate, 'MMM d, yyyy')}
                </span>
                <span className="flex items-center gap-1">
                  <Blocks className="h-3 w-3" />
                  {planBlocks.length} block{planBlocks.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Workflow stepper */}
              <div className="flex items-center gap-0">
                {workflowSteps.map((step, i) => {
                  const isCompleted = i < config.stepIndex
                  const isCurrent = i === config.stepIndex
                  const isOptimizing = isCurrent && plan.status === 'optimizing'

                  return (
                    <div key={step} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          'flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-medium',
                          isCompleted && 'bg-[var(--success)] text-white',
                          isCurrent && !isOptimizing && 'bg-[var(--warning)] text-white ring-2 ring-[var(--warning)]/30',
                          isOptimizing && 'bg-[var(--info)] text-white',
                          !isCompleted && !isCurrent && 'bg-muted text-muted-foreground'
                        )}>
                          {isOptimizing ? (
                            <Loader2 className="h-2.5 w-2.5 animate-spin" />
                          ) : isCompleted ? (
                            <CheckCircle2 className="h-2.5 w-2.5" />
                          ) : (
                            <Circle className="h-2.5 w-2.5" />
                          )}
                        </div>
                        <span className={cn(
                          'text-[9px] mt-0.5 text-center leading-tight',
                          isCurrent ? 'text-foreground font-medium' : 'text-muted-foreground'
                        )}>
                          {step}
                        </span>
                      </div>
                      {i < workflowSteps.length - 1 && (
                        <div className={cn(
                          'h-px flex-1 mx-0.5 mt-[-10px]',
                          i < config.stepIndex ? 'bg-[var(--success)]' : 'bg-border'
                        )} />
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}



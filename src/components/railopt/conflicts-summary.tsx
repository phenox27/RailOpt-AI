'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { conflicts } from '@/data/simulated-data'
import { AlertTriangle, AlertCircle, Info, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const severityConfig = {
  critical: {
    badge: 'bg-[var(--danger)]/15 text-[var(--danger)] border-[var(--danger)]/30',
    icon: AlertTriangle,
    iconColor: 'text-[var(--danger)]',
    label: 'Critical',
  },
  warning: {
    badge: 'bg-[var(--warning)]/15 text-[var(--warning)] border-[var(--warning)]/30',
    icon: AlertCircle,
    iconColor: 'text-[var(--warning)]',
    label: 'Warning',
  },
  info: {
    badge: 'bg-[var(--info)]/15 text-[var(--info)] border-[var(--info)]/30',
    icon: Info,
    iconColor: 'text-[var(--info)]',
    label: 'Info',
  },
} as const

const typeLabels: Record<string, string> = {
  train_conflict: 'Train Conflict',
  department_conflict: 'Dept. Conflict',
  corridor_unavailable: 'Corridor Unavailable',
  safety_violation: 'Safety Violation',
}

export function ConflictsSummary() {
  const unresolvedConflicts = conflicts.filter(c => !c.resolved)
  const criticalCount = unresolvedConflicts.filter(c => c.severity === 'critical').length

  return (
    <Card className="py-0 gap-0">
      <CardHeader className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Active Conflicts</CardTitle>
          {criticalCount > 0 && (
            <Badge className="bg-[var(--danger)]/15 text-[var(--danger)] border-[var(--danger)]/30 rounded-full text-[10px]">
              {criticalCount} critical
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-2">
        <ScrollArea className="h-[200px]">
          <div className="flex flex-col">
            {unresolvedConflicts.map((conflict) => {
              const config = severityConfig[conflict.severity]
              const SevIcon = config.icon

              return (
                <div
                  key={conflict.id}
                  className="flex items-start gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors"
                >
                  <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-md bg-muted shrink-0">
                    <SevIcon className={cn('h-3.5 w-3.5', config.iconColor)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Badge className={cn('rounded-full text-[10px] px-1.5 py-0 h-4', config.badge)}>
                        {config.label}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground font-medium">
                        {typeLabels[conflict.type] || conflict.type}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/80 leading-snug line-clamp-2">
                      {conflict.description}
                    </p>
                  </div>
                </div>
              )
            })}
            {unresolvedConflicts.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                No active conflicts
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="px-4 pt-2 border-t border-border/50">
          <button className="flex items-center gap-1 text-xs text-[var(--info)] hover:underline font-medium w-full justify-center py-1.5">
            View all in Timetable
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </CardContent>
    </Card>
  )
}



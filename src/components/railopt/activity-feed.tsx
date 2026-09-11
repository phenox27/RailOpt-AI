'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { auditEntries } from '@/data/simulated-data'
import {
  Cpu,
  FilePlus,
  Star,
  ShieldCheck,
  AlertTriangle,
  Eye,
  type LucideIcon,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

const actionIcons: Record<string, LucideIcon> = {
  RUN_OPTIMIZATION: Cpu,
  CREATE_REQUEST: FilePlus,
  PRIORITY_SCORED: Star,
  BLOCK_RECOMMENDED: ShieldCheck,
  CONFLICT_DETECTED: AlertTriangle,
  PLAN_REVIEWED: Eye,
}

const actionColors: Record<string, string> = {
  RUN_OPTIMIZATION: 'text-[var(--info)]',
  CREATE_REQUEST: 'text-foreground',
  PRIORITY_SCORED: 'text-[var(--warning)]',
  BLOCK_RECOMMENDED: 'text-[var(--success)]',
  CONFLICT_DETECTED: 'text-[var(--danger)]',
  PLAN_REVIEWED: 'text-foreground',
}

export function ActivityFeed() {
  const sortedEntries = [...auditEntries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  return (
    <Card className="py-0 gap-0">
      <CardHeader className="px-4 pt-4 pb-2">
        <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-2">
        <ScrollArea className="h-[280px]">
          <div className="flex flex-col">
            {sortedEntries.map((entry) => {
              const Icon = actionIcons[entry.action] || FilePlus
              const iconColor = actionColors[entry.action] || 'text-foreground'
              const ts = new Date(entry.timestamp)
              const isAi = entry.userName === 'AI Engine'
              const isSystem = entry.userName === 'System'

              return (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors"
                >
                  <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-md bg-muted shrink-0">
                    <Icon className={cn('h-3.5 w-3.5', iconColor)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-snug truncate">{entry.details}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-muted-foreground">
                      <span className="font-medium">
                        {isAi ? '🤖 AI' : isSystem ? '⚙️ System' : entry.userName}
                      </span>
                      <span>·</span>
                      <span>{format(ts, 'MMM d, HH:mm')}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}



'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  XCircle,
  Clock,
  Bot,
  FileText,
  UserCheck,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react'

type TimelineAction =
  | 'created'
  | 'ai_reviewed'
  | 'planner_approved'
  | 'dept_verified'
  | 'pending_verification'
  | 'pending_review'
  | 'rejected'

interface TimelineEntry {
  timestamp: string
  action: TimelineAction
  actorName: string
  actorRole: string
  comments: string
}

const actionConfig: Record<
  TimelineAction,
  {
    label: string
    dotColor: string
    iconBg: string
    icon: React.ElementType
    badgeVariant: 'default' | 'secondary' | 'outline' | 'destructive'
    badgeClass: string
  }
> = {
  created: {
    label: 'Created',
    dotColor: 'bg-sky-500',
    iconBg: 'bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400',
    icon: FileText,
    badgeVariant: 'secondary',
    badgeClass: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400',
  },
  ai_reviewed: {
    label: 'AI Recommendation Generated',
    dotColor: 'bg-[#1a237e]',
    iconBg: 'bg-teal-100 text-[#283593] dark:bg-[#0d1442] dark:text-[#3f51b5]',
    icon: Bot,
    badgeVariant: 'secondary',
    badgeClass: 'bg-teal-100 text-[#0d47a1] dark:bg-[#0d1442] dark:text-[#3f51b5]',
  },
  planner_approved: {
    label: 'Planner Reviewed',
    dotColor: 'bg-emerald-500',
    iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
    icon: CheckCircle2,
    badgeVariant: 'secondary',
    badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  },
  dept_verified: {
    label: 'Engineering Verified',
    dotColor: 'bg-emerald-500',
    iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
    icon: UserCheck,
    badgeVariant: 'secondary',
    badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  },
  pending_verification: {
    label: 'S&T Verification Pending',
    dotColor: 'bg-amber-500',
    iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
    icon: Clock,
    badgeVariant: 'secondary',
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  },
  pending_review: {
    label: 'Control Office Review Pending',
    dotColor: 'bg-amber-500',
    iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
    icon: AlertCircle,
    badgeVariant: 'secondary',
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  },
  rejected: {
    label: 'Rejected',
    dotColor: 'bg-red-500',
    iconBg: 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400',
    icon: XCircle,
    badgeVariant: 'destructive',
    badgeClass: '',
  },
}

// Sample data for Block A1
const blockA1Timeline: TimelineEntry[] = [
  {
    timestamp: '2025-01-27 16:00',
    action: 'pending_review',
    actorName: 'DK Singh',
    actorRole: 'Control Office',
    comments: '',
  },
  {
    timestamp: '2025-01-27 15:30',
    action: 'pending_verification',
    actorName: 'Priya Patel',
    actorRole: 'S&T',
    comments: 'Awaiting signal isolation confirmation',
  },
  {
    timestamp: '2025-01-27 14:00',
    action: 'dept_verified',
    actorName: 'Amit Sharma',
    actorRole: 'Engineering',
    comments: 'Track conditions verified, crew available',
  },
  {
    timestamp: '2025-01-27 11:30',
    action: 'planner_approved',
    actorName: 'Jeet',
    actorRole: 'Planner',
    comments: 'Approved with time adjustment',
  },
  {
    timestamp: '2025-01-27 10:05',
    action: 'ai_reviewed',
    actorName: 'RailOpt AI',
    actorRole: 'AI Engine',
    comments: 'Priority score: 87/100. Recommended slot: 01:00-04:00',
  },
  {
    timestamp: '2025-01-27 10:00',
    action: 'created',
    actorName: 'Jeet',
    actorRole: 'Planner',
    comments: 'Initial block for NDLS-GZB track renewal',
  },
]

function formatTimestamp(ts: string): { date: string; time: string } {
  const [date, time] = ts.split(' ')
  return { date, time }
}

interface ApprovalTimelineProps {
  entries?: TimelineEntry[]
  title?: string
}

export function ApprovalTimeline({
  entries = blockA1Timeline,
  title = 'Block A1 — Approval Timeline',
}: ApprovalTimelineProps) {
  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="pb-3 pt-4 px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-4 pt-0">
        <div className="relative">
          {/* Vertical connecting line */}
          <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-border" />

          <div className="flex flex-col gap-0">
            {entries.map((entry, idx) => {
              const config = actionConfig[entry.action]
              const Icon = config.icon
              const { date, time } = formatTimestamp(entry.timestamp)

              return (
                <motion.div
                  key={entry.timestamp + entry.action}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: idx * 0.08,
                    ease: 'easeOut',
                  }}
                  className="flex items-start gap-3 relative pb-5 last:pb-0"
                >
                  {/* Dot on the timeline */}
                  <div
                    className={cn(
                      'w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 z-10 ring-[3px] ring-background shadow-sm',
                      config.dotColor
                    )}
                  >
                    <div className="w-2 h-2 rounded-full bg-white dark:bg-background" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                      <span className="text-sm font-medium text-foreground leading-tight">
                        {config.label}
                      </span>
                      <Badge
                        variant={config.badgeVariant}
                        className={cn(
                          'text-[10px] px-1.5 py-0 h-4 w-fit',
                          config.badgeClass
                        )}
                      >
                        {entry.actorRole}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className={cn(
                          'w-5 h-5 rounded-full flex items-center justify-center shrink-0',
                          config.iconBg
                        )}
                      >
                        <Icon className="w-3 h-3" />
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">
                        {entry.actorName}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60">•</span>
                      <span className="text-[10px] text-muted-foreground/80 tabular-nums">
                        {date} {time}
                      </span>
                    </div>

                    {entry.comments && (
                      <div className="ml-7 pl-3 border-l-2 border-border py-1">
                        <p className="text-xs text-muted-foreground leading-relaxed italic">
                          &ldquo;{entry.comments}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export { type TimelineEntry, type TimelineAction, blockA1Timeline }

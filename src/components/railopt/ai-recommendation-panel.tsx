'use client'

import { SimBlock, SimConflict, SimMaintenanceRequest, blocks, conflicts, maintenanceRequests } from '@/data/simulated-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Bot, CheckCircle2, XCircle, AlertTriangle, Wrench, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'

interface AiRecommendationPanelProps {
  block: SimBlock
  onAccept?: () => void
  onEdit?: () => void
  onReject?: () => void
}

export function AiRecommendationPanel({ block, onAccept, onEdit, onReject }: AiRecommendationPanelProps) {
  const confidencePct = Math.round(block.aiConfidence * 100)

  // Get conflicts for this block
  const blockConflicts = conflicts.filter((c) => c.blockId === block.id && !c.resolved)
  const hasConflicts = blockConflicts.length > 0

  // Get maintenance requests for this block
  const blockRequests = maintenanceRequests.filter((mr) =>
    block.maintenanceReqIds.includes(mr.id)
  )

  // Confidence bar color
  const confidenceColor = confidencePct >= 85 ? 'text-emerald-600' : confidencePct >= 70 ? 'text-[#283593]' : 'text-amber-600'
  const confidenceBg = confidencePct >= 85 ? '[&>div]:bg-emerald-500' : confidencePct >= 70 ? '[&>div]:bg-[#1a237e]' : '[&>div]:bg-amber-500'

  return (
    <Card className="border-[#9fa8da] bg-[#e8eaf6]/30 py-0 gap-0">
      <CardHeader className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 text-[#283593]">
              <Bot className="h-4 w-4" />
            </div>
            <CardTitle className="text-sm font-semibold text-[#1a237e]">AI Recommendation</CardTitle>
          </div>
          <Badge variant="outline" className="rounded-full text-[10px] bg-[#e8eaf6] text-[#0d47a1] border-[#9fa8da]">
            {block.id}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-3">
        {/* Block name */}
        <p className="text-sm font-medium text-foreground">{block.name}</p>

        {/* Confidence score */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">AI Confidence</span>
            <span className={cn('text-xs font-semibold', confidenceColor)}>{confidencePct}%</span>
          </div>
          <Progress value={confidencePct} className={cn('h-1.5', confidenceBg)} />
        </div>

        {/* AI Reasoning */}
        <div className="space-y-1">
          <span className="text-xs font-medium text-[#0d47a1]">Reasoning</span>
          <p className="text-xs text-muted-foreground leading-relaxed bg-background/60 rounded-md p-2 border border-teal-100">
            {block.aiReasoning}
          </p>
        </div>

        <Separator className="bg-[#9fa8da]/50" />

        {/* Constraint result */}
        <div className="flex items-start gap-2">
          {hasConflicts ? (
            <>
              <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-medium text-red-700">Conflicts detected</span>
                <ul className="mt-1 space-y-1">
                  {blockConflicts.map((c) => (
                    <li key={c.id} className="flex items-center gap-1 text-[11px] text-red-600">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      <span>{c.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-xs font-medium text-emerald-700">All hard constraints satisfied</span>
            </>
          )}
        </div>

        {/* Affected operations */}
        {blockConflicts.length > 0 && (
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Affected Operations</span>
            <ul className="space-y-1">
              {blockConflicts
                .filter((c) => c.trainName)
                .map((c) => (
                  <li key={c.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ChevronRight className="h-3 w-3 text-[#1a237e]" />
                    <span>{c.trainName}</span>
                    {c.trainType && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 rounded-full">
                        {c.trainType}
                      </Badge>
                    )}
                  </li>
                ))}
            </ul>
          </div>
        )}

        <Separator className="bg-[#9fa8da]/50" />

        {/* Maintenance requests included */}
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Maintenance Requests</span>
          <ul className="space-y-1.5">
            {blockRequests.map((mr) => (
              <li
                key={mr.id}
                className="flex items-center gap-2 text-xs bg-background/60 rounded-md px-2 py-1.5 border border-teal-100/60"
              >
                <Wrench className="h-3 w-3 text-[#1a237e] shrink-0" />
                <span className="truncate flex-1 text-foreground">{mr.title}</span>
                <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 rounded-full shrink-0">
                  {mr.id}
                </Badge>
              </li>
            ))}
          </ul>
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] text-[#283593]/70 italic leading-tight">
          This is an AI-generated recommendation. Review and approve before finalizing.
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            className="bg-[#283593] hover:bg-[#0d47a1] text-white text-xs h-8"
            onClick={onAccept}
          >
            Accept Recommendation
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8"
            onClick={onEdit}
          >
            Edit Block
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-8 text-muted-foreground"
            onClick={onReject}
          >
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

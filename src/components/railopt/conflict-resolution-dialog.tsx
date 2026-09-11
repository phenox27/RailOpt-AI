'use client'

import { useState } from 'react'
import type { SyncConflict } from '@/lib/offline-sync'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Merge,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConflictResolutionDialogProps {
  conflict: SyncConflict
  onResolve: (conflictId: string, resolution: 'keep_local' | 'keep_server' | 'merged', mergedData?: Record<string, unknown>) => void
  onClose: () => void
}

export function ConflictResolutionDialog({
  conflict,
  onResolve,
  onClose,
}: ConflictResolutionDialogProps) {
  const [mode, setMode] = useState<'choose' | 'merge'>('choose')
  const [mergedJson, setMergedJson] = useState(() => {
    try {
      return JSON.stringify(conflict.localData, null, 2)
    } catch {
      return '{}'
    }
  })

  const handleMerge = () => {
    try {
      const parsed = JSON.parse(mergedJson)
      onResolve(conflict.id, 'merged', parsed)
    } catch {
      // Invalid JSON — don't proceed
    }
  }

  const formatTimestamp = (ts: string) => {
    try {
      return new Date(ts).toLocaleString()
    } catch {
      return ts
    }
  }

  const renderDataView = (label: string, data: Record<string, unknown>, timestamp: string, accent: string) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className={cn('text-[9px] px-1.5', accent)}>
          {label}
        </Badge>
        <span className="text-[9px] text-muted-foreground">
          {formatTimestamp(timestamp)}
        </span>
      </div>
      <div className="bg-muted/30 rounded-md p-2.5 text-[10px] font-mono max-h-48 overflow-y-auto">
        <pre className="whitespace-pre-wrap break-all">{JSON.stringify(data, null, 2)}</pre>
      </div>
    </div>
  )

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Conflict Resolution
          </DialogTitle>
          <DialogDescription className="text-xs">
            A data conflict was detected while syncing. Choose how to resolve it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Entity Info */}
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="outline" className="text-[9px] px-1.5 capitalize">
              {conflict.entityType}
            </Badge>
            <span className="text-muted-foreground">ID:</span>
            <span className="font-mono text-[10px]">{conflict.entityId}</span>
          </div>

          {mode === 'choose' && (
            <>
              {/* Side by side comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {renderDataView('Your Version', conflict.localData, conflict.localTimestamp, 'bg-blue-50 text-blue-700 border-blue-200')}
                {renderDataView('Server Version', conflict.serverData, conflict.serverTimestamp, 'bg-amber-50 text-amber-700 border-amber-200')}
              </div>

              <Separator />

              {/* Resolution options */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-9 gap-1.5 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  onClick={() => onResolve(conflict.id, 'keep_local')}
                >
                  <ArrowLeft className="h-3 w-3" />
                  Keep Mine
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-9 gap-1.5 border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                  onClick={() => onResolve(conflict.id, 'keep_server')}
                >
                  <ArrowRight className="h-3 w-3" />
                  Keep Server
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-9 gap-1.5 border-[#9fa8da] hover:bg-[#e8eaf6] hover:text-[#0d47a1]"
                  onClick={() => setMode('merge')}
                >
                  <Merge className="h-3 w-3" />
                  Merge
                </Button>
              </div>
            </>
          )}

          {mode === 'merge' && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Merged Data (JSON)</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[10px] h-6 gap-1"
                    onClick={() => {
                      try {
                        setMergedJson(JSON.stringify(conflict.serverData, null, 2))
                      } catch {
                        // ignore
                      }
                    }}
                  >
                    Start from server
                  </Button>
                </div>
                <Textarea
                  value={mergedJson}
                  onChange={(e) => setMergedJson(e.target.value)}
                  className="font-mono text-[10px] min-h-[200px]"
                  placeholder="Edit JSON to merge data..."
                />
              </div>

              <div className="flex items-center gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => setMode('choose')}
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="text-xs h-8 bg-[#283593] hover:bg-[#0d47a1] text-white gap-1.5"
                  onClick={handleMerge}
                >
                  <Merge className="h-3 w-3" />
                  Apply Merge
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

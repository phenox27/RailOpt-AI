'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAppStore } from '@/store/app-store'
import {
  getPendingChangeCount,
  getPendingChanges,
  getUnresolvedConflicts,
  syncPendingChanges,
  resolveConflict,
  type PendingChange,
  type SyncConflict,
} from '@/lib/offline-sync'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  RefreshCw,
  CloudOff,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Database,
  ArrowUpDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { ConflictResolutionDialog } from './conflict-resolution-dialog'

type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error'

export function SyncEngine() {
  const { isOffline } = useAppStore()
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [pendingCount, setPendingCount] = useState(0)
  const [conflicts, setConflicts] = useState<SyncConflict[]>([])
  const [selectedConflict, setSelectedConflict] = useState<SyncConflict | null>(null)
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([])

  // Poll pending changes count
  const refreshState = useCallback(() => {
    setPendingCount(getPendingChangeCount())
    setConflicts(getUnresolvedConflicts())
    setPendingChanges(getPendingChanges())
  }, [])

  useEffect(() => {
    // Initial refresh via setTimeout to avoid synchronous setState in effect
    const initialTimer = setTimeout(refreshState, 0)
    const interval = setInterval(refreshState, 2000)
    return () => {
      clearTimeout(initialTimer)
      clearInterval(interval)
    }
  }, [refreshState])

  // handleSync ref for use in effects
  const handleSyncRef = useRef<() => void>(() => {})

  const handleSync = useCallback(async () => {
    setSyncStatus('syncing')
    try {
      const result = await syncPendingChanges()
      if (result.success) {
        setSyncStatus('synced')
        toast.success(`Synced ${result.syncedCount} change${result.syncedCount !== 1 ? 's' : ''}`)
      } else {
        setSyncStatus('error')
        toast.error(`Sync completed with ${result.errors.length} error(s)`)
      }
      if (result.conflictCount > 0) {
        toast.warning(`${result.conflictCount} conflict(s) need resolution`)
      }
      refreshState()
    } catch {
      setSyncStatus('error')
      toast.error('Sync failed')
    }
  }, [refreshState])

  // Keep ref in sync
  useEffect(() => {
    handleSyncRef.current = handleSync
  }, [handleSync])

  // When coming back online, trigger sync
  useEffect(() => {
    if (!isOffline && pendingCount > 0 && syncStatus === 'idle') {
      handleSyncRef.current()
    }
  }, [isOffline, pendingCount, syncStatus])

  const handleResolveConflict = (
    conflictId: string,
    resolution: 'keep_local' | 'keep_server' | 'merged',
    mergedData?: Record<string, unknown>
  ) => {
    resolveConflict(conflictId, resolution, mergedData)
    setSelectedConflict(null)
    refreshState()
    toast.success('Conflict resolved')
    // Re-sync after resolution
    if (!isOffline) {
      handleSync()
    }
  }

  return (
    <div className="space-y-4">
      {/* Sync Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            Sync Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Connection</span>
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] px-2',
                isOffline
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200',
              )}
            >
              {isOffline ? (
                <><CloudOff className="h-2.5 w-2.5 mr-1" /> Offline</>
              ) : (
                <><CheckCircle2 className="h-2.5 w-2.5 mr-1" /> Online</>
              )}
            </Badge>
          </div>

          {/* Sync Status */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Sync State</span>
            <div className="flex items-center gap-1.5">
              {syncStatus === 'syncing' && (
                <Badge variant="outline" className="text-[10px] px-2 bg-blue-50 text-blue-700 border-blue-200">
                  <RefreshCw className="h-2.5 w-2.5 mr-1 animate-spin" /> Syncing...
                </Badge>
              )}
              {syncStatus === 'synced' && (
                <Badge variant="outline" className="text-[10px] px-2 bg-emerald-50 text-emerald-700 border-emerald-200">
                  Synced
                </Badge>
              )}
              {syncStatus === 'error' && (
                <Badge variant="outline" className="text-[10px] px-2 bg-red-50 text-red-700 border-red-200">
                  Error
                </Badge>
              )}
              {syncStatus === 'idle' && (
                <Badge variant="outline" className="text-[10px] px-2">
                  Idle
                </Badge>
              )}
            </div>
          </div>

          {/* Pending Changes Count */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Pending Changes</span>
            <span className={cn(
              'text-xs font-semibold',
              pendingCount > 0 ? 'text-amber-600' : 'text-emerald-600',
            )}>
              {pendingCount}
            </span>
          </div>

          {/* Unresolved Conflicts */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Conflicts</span>
            <span className={cn(
              'text-xs font-semibold',
              conflicts.length > 0 ? 'text-red-600' : 'text-emerald-600',
            )}>
              {conflicts.length}
            </span>
          </div>

          <Separator />

          {/* Sync Button */}
          <Button
            size="sm"
            className="w-full text-xs h-8 gap-1.5"
            onClick={handleSync}
            disabled={isOffline || syncStatus === 'syncing' || pendingCount === 0}
          >
            {syncStatus === 'syncing' ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <ArrowUpDown className="h-3 w-3" />
            )}
            {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
          </Button>
        </CardContent>
      </Card>

      {/* Pending Changes List */}
      {pendingChanges.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              Pending Queue ({pendingChanges.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-40 overflow-y-auto space-y-1">
            {pendingChanges.map((change) => (
              <div
                key={change.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/30 text-[10px]"
              >
                <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 capitalize">
                  {change.type}
                </Badge>
                <span className="text-muted-foreground truncate">{change.entityType}</span>
                <span className="text-muted-foreground/60 truncate">{change.entityId}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Conflicts List */}
      {conflicts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs flex items-center gap-1.5 text-red-600">
              <AlertTriangle className="h-3.5 w-3.5" />
              Conflicts ({conflicts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {conflicts.map((conflict) => (
              <button
                key={conflict.id}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md border border-red-200 bg-red-50/50 hover:bg-red-50 transition-colors text-left"
                onClick={() => setSelectedConflict(conflict)}
              >
                <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-red-700 truncate">
                    {conflict.entityType} / {conflict.entityId}
                  </p>
                  <p className="text-[9px] text-red-500/70">
                    Needs resolution
                  </p>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Conflict Resolution Dialog */}
      {selectedConflict && (
        <ConflictResolutionDialog
          conflict={selectedConflict}
          onResolve={handleResolveConflict}
          onClose={() => setSelectedConflict(null)}
        />
      )}
    </div>
  )
}

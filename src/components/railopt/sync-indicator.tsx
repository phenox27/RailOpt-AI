'use client'

import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '@/store/app-store'
import { getPendingChangeCount } from '@/lib/offline-sync'
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type SyncStatus = 'synced' | 'syncing' | 'offline' | 'unsaved'

export function SyncIndicator() {
  const { isOffline } = useAppStore()
  const [status, setStatus] = useState<SyncStatus>('synced')
  const [unsavedCount, setUnsavedCount] = useState(0)
  const prevOfflineRef = useRef(isOffline)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Poll pending changes count from offline sync
  useEffect(() => {
    const pollCount = () => {
      const count = getPendingChangeCount()
      setUnsavedCount(count)
      if (count > 0 && !isOffline) {
        setStatus('unsaved')
      }
    }
    const interval = setInterval(pollCount, 3000)
    return () => clearInterval(interval)
  }, [isOffline])

  useEffect(() => {
    const wasOffline = prevOfflineRef.current
    prevOfflineRef.current = isOffline

    if (wasOffline && !isOffline) {
      // Transition: offline → online — schedule syncing via timer callback
      timerRef.current = setTimeout(() => {
        setStatus('syncing')
        timerRef.current = setTimeout(() => {
          setStatus('synced')
          setUnsavedCount(0)
        }, 1500)
      }, 0)
    } else if (!wasOffline && isOffline) {
      // Transition: online → offline — schedule via timer callback
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      timerRef.current = setTimeout(() => {
        setStatus('offline')
        setUnsavedCount(prev => prev + 1)
      }, 0)
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isOffline])

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {/* Status icon with animation */}
      <div className={cn(
        'flex items-center justify-center w-4 h-4 transition-all duration-200',
      )}>
        {status === 'synced' && (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
        )}
        {status === 'syncing' && (
          <RefreshCw className="h-3.5 w-3.5 text-primary animate-spin" />
        )}
        {status === 'offline' && (
          <WifiOff className="h-3.5 w-3.5 text-amber-500" />
        )}
        {status === 'unsaved' && (
          <Wifi className="h-3.5 w-3.5 text-amber-500" />
        )}
      </div>
      {/* Status text */}
      <span className={cn(
        'hidden sm:inline transition-all duration-200',
        status === 'synced' && 'text-emerald-600',
        status === 'syncing' && 'text-primary',
        status === 'offline' && 'text-amber-600',
        status === 'unsaved' && 'text-amber-600',
      )}>
        {status === 'synced' && 'Synced'}
        {status === 'syncing' && 'Syncing...'}
        {status === 'offline' && 'Offline'}
        {status === 'unsaved' && `${unsavedCount} unsaved`}
      </span>
    </div>
  )
}

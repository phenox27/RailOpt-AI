'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, WifiOff } from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { cn } from '@/lib/utils'

/**
 * Data refresh indicator with auto-refresh logic.
 * Shows "Last updated: X seconds ago" and auto-refreshes every 30s when online.
 */
export function DataRefreshIndicator() {
  const { isOffline, lastSyncTime } = useAppStore()
  const [secondsAgo, setSecondsAgo] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Update the "seconds ago" counter via interval
  useEffect(() => {
    const updateCounter = () => {
      if (!lastSyncTime) {
        setSecondsAgo(0)
        return
      }
      const diff = Math.floor((Date.now() - new Date(lastSyncTime).getTime()) / 1000)
      setSecondsAgo(Math.max(0, diff))
    }

    updateCounter()
    const interval = setInterval(updateCounter, 1000)
    return () => clearInterval(interval)
  }, [lastSyncTime])

  // Auto-refresh every 30 seconds when online
  useEffect(() => {
    if (isOffline) return

    const interval = setInterval(() => {
      // In a real app, this would refetch data from the API
      setIsRefreshing(true)
      setTimeout(() => setIsRefreshing(false), 1000)
    }, 30000)

    return () => clearInterval(interval)
  }, [isOffline])

  const formatTimeAgo = (secs: number): string => {
    if (secs < 5) return 'just now'
    if (secs < 60) return `${secs}s ago`
    const mins = Math.floor(secs / 60)
    if (mins < 60) return `${mins}m ago`
    return `${Math.floor(mins / 60)}h ago`
  }

  if (isOffline) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-amber-600">
        <WifiOff className="h-3 w-3" />
        <span>Offline</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <RefreshCw className={cn('h-3 w-3', isRefreshing && 'animate-spin')} />
      <span>Updated {formatTimeAgo(secondsAgo)}</span>
    </div>
  )
}

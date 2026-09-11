'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { WifiOff, X } from 'lucide-react'
import { format } from 'date-fns'

export function OfflineBanner() {
  const { isOffline, lastSyncTime } = useAppStore()
  const [dismissed, setDismissed] = useState(false)

  if (!isOffline || dismissed) return null

  const formattedSyncTime = lastSyncTime
    ? format(new Date(lastSyncTime), 'HH:mm:ss')
    : 'N/A'

  return (
    <div className="offline-banner relative flex items-center justify-between gap-3 px-4 py-2 text-sm font-semibold text-white shadow-sm">
      <div className="flex items-center gap-2">
        <WifiOff className="size-4 shrink-0" />
        <span>OFFLINE MODE</span>
        <span className="text-white/80 font-normal">
          — Last sync: {formattedSyncTime}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="size-6 shrink-0 text-white hover:bg-white/20"
        onClick={() => setDismissed(true)}
      >
        <X className="size-3.5" />
        <span className="sr-only">Dismiss offline banner</span>
      </Button>
    </div>
  )
}

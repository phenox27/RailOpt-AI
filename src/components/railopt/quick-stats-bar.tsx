'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { blocks, conflicts, maintenanceRequests } from '@/data/simulated-data'
import { Blocks, AlertTriangle, ShieldCheck, Clock, Wifi, ChevronUp, ChevronDown } from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { cn } from '@/lib/utils'

export function QuickStatsBar() {
  const [expanded, setExpanded] = useState(true)
  const [visible, setVisible] = useState(true)
  const [idleTimer, setIdleTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  const { isOffline } = useAppStore()

  // Compute stats
  const activeBlocks = blocks.filter(b => b.status !== 'rejected').length
  const unresolvedConflicts = conflicts.filter(c => !c.resolved).length
  const pendingApprovals = blocks.filter(b => b.status === 'recommended' || b.status === 'verified').length
  const overdueRequests = maintenanceRequests.filter(r => r.isOverdue).length

  // Auto-hide after 8s of inactivity on mobile
  const resetIdleTimer = useCallback(() => {
    if (idleTimer) clearTimeout(idleTimer)
    setVisible(true)
    const timer = setTimeout(() => {
      if (window.innerWidth < 640) setVisible(false)
    }, 8000)
    setIdleTimer(timer)
  }, [idleTimer])

  useEffect(() => {
    // Use rAF to defer setState out of synchronous effect body
    const raf = requestAnimationFrame(() => {
      resetIdleTimer()
    })
    window.addEventListener('scroll', resetIdleTimer, { passive: true })
    window.addEventListener('mousemove', resetIdleTimer, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', resetIdleTimer)
      window.removeEventListener('mousemove', resetIdleTimer)
      if (idleTimer) clearTimeout(idleTimer)
    }
  }, [resetIdleTimer, idleTimer])

  const stats = [
    {
      icon: Blocks,
      value: activeBlocks,
      label: 'Blocks',
      color: 'text-[#283593] dark:text-[#3f51b5]',
    },
    {
      icon: AlertTriangle,
      value: unresolvedConflicts,
      label: 'Conflicts',
      color: unresolvedConflicts > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400',
    },
    {
      icon: ShieldCheck,
      value: pendingApprovals,
      label: 'Pending',
      color: 'text-amber-600 dark:text-amber-400',
    },
    {
      icon: Clock,
      value: overdueRequests,
      label: 'Overdue',
      color: overdueRequests > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground',
    },
    {
      icon: Wifi,
      value: isOffline ? 'Off' : 'On',
      label: 'Status',
      color: isOffline ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400',
    },
  ]

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-16 left-1/2 -translate-x-1/2 z-20 print:hidden float-gentle"
          onMouseEnter={() => setVisible(true)}
        >
          <div
            className={cn(
              'flex items-center gap-1 sm:gap-2 rounded-full px-3 sm:px-4 py-1.5',
              'bg-background border border-border/30',
              'shadow-lg shadow-black/5',
              'border-glow',
              'transition-all duration-200'
            )}
          >
            {/* Collapse toggle */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors shrink-0"
              aria-label={expanded ? 'Collapse stats' : 'Expand stats'}
            >
              {expanded ? (
                <ChevronDown className="w-3 h-3 text-muted-foreground/60" />
              ) : (
                <ChevronUp className="w-3 h-3 text-muted-foreground/60" />
              )}
            </button>

            <AnimatePresence mode="wait">
              {expanded ? (
                <motion.div
                  key="expanded"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 'auto', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="flex items-center gap-1 sm:gap-3 overflow-hidden"
                >
                  {stats.map((stat, i) => (
                    <div
                      key={stat.label}
                      className="flex items-center gap-1 whitespace-nowrap"
                    >
                      <stat.icon className={cn('w-3 h-3 shrink-0', stat.color)} />
                      <span className={cn('text-xs font-semibold tabular-nums', stat.color)}>
                        {stat.value}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60 hidden sm:inline">
                        {stat.label}
                      </span>
                      {i < stats.length - 1 && (
                        <span className="w-px h-3 bg-border/40 ml-1 hidden sm:block" />
                      )}
                    </div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="collapsed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1"
                >
                  <span className="text-xs text-muted-foreground">
                    {activeBlocks}B · {unresolvedConflicts}C · {pendingApprovals}P
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

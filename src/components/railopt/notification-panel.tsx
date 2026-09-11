'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  Sparkles,
  Clock,
  ShieldCheck,
  FileText,
  ExternalLink,
  X,
  AlertCircle,
  RefreshCw,
  Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { toast } from 'sonner'

type NotificationCategory = 'urgent' | 'info' | 'system'

interface Notification {
  id: string
  type: 'approval' | 'conflict' | 'optimization' | 'overdue' | 'info' | 'sync'
  category: NotificationCategory
  title: string
  description: string
  time: string
  read: boolean
}

const NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    type: 'conflict',
    category: 'urgent',
    title: 'Critical conflict detected',
    description: 'Rajdhani Express 12302 overlaps with Block A1 at NDLS-GZB',
    time: '2025-01-27T14:20:00',
    read: false,
  },
  {
    id: 'n2',
    type: 'overdue',
    category: 'urgent',
    title: 'Overdue maintenance request',
    description: 'Track renewal between NDLS-GZB is past due date',
    time: '2025-01-26T09:00:00',
    read: false,
  },
  {
    id: 'n3',
    type: 'approval',
    category: 'info',
    title: 'Block A1 awaiting your approval',
    description: 'AI-recommended block for NDLS-GZB Engineering needs planner review',
    time: '2025-01-27T14:30:00',
    read: false,
  },
  {
    id: 'n4',
    type: 'approval',
    category: 'info',
    title: 'Block B1 approved by Engineering',
    description: 'Combined block for ALD-MGS passed department verification',
    time: '2025-01-26T16:45:00',
    read: true,
  },
  {
    id: 'n5',
    type: 'optimization',
    category: 'system',
    title: 'AI Optimization complete',
    description: 'Weekly plan optimization generated 5 block recommendations',
    time: '2025-01-27T14:15:00',
    read: false,
  },
  {
    id: 'n6',
    type: 'sync',
    category: 'system',
    title: 'Sync completed',
    description: 'All maintenance requests and blocks synced successfully',
    time: '2025-01-26T12:00:00',
    read: true,
  },
]

const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  approval: { icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  conflict: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  optimization: { icon: Sparkles, color: 'text-[#283593]', bg: 'bg-[#e8eaf6]' },
  overdue: { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
  info: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
  sync: { icon: RefreshCw, color: 'text-violet-600', bg: 'bg-violet-50' },
}

const CATEGORY_CONFIG: Record<NotificationCategory, { label: string; icon: typeof Info }> = {
  urgent: { label: 'Urgent', icon: AlertTriangle },
  info: { label: 'Info', icon: FileText },
  system: { label: 'System', icon: RefreshCw },
}

const staggerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  exit: { opacity: 0, transition: { staggerChildren: 0.03 } },
}

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, x: 12, transition: { duration: 0.12 } },
}

export function NotificationPanel() {
  const { notificationCount, setNotificationCount } = useAppStore()
  const [notifications, setNotifications] = useState<Notification[]>(NOTIFICATIONS)
  const [open, setOpen] = useState(false)

  const unreadCount = notifications.filter(n => !n.read).length

  // Group notifications by category
  const groupedNotifications = useMemo(() => {
    const groups: Record<NotificationCategory, Notification[]> = {
      urgent: [],
      info: [],
      system: [],
    }
    for (const n of notifications) {
      groups[n.category].push(n)
    }
    return groups
  }, [notifications])

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setNotificationCount(0)
  }

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    const newCount = notifications.filter(n => n.id !== id && !n.read).length
    setNotificationCount(newCount)
  }

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    const wasUnread = notifications.find(n => n.id === id && !n.read)
    if (wasUnread) {
      const newCount = Math.max(0, unreadCount - 1)
      setNotificationCount(newCount)
    }
  }

  // Expose unread count to parent via store — use useEffect to avoid setState-during-render
  const prevUnreadRef = useRef(unreadCount)
  useEffect(() => {
    if (prevUnreadRef.current !== unreadCount) {
      prevUnreadRef.current = unreadCount
      setNotificationCount(unreadCount)
    }
  }, [unreadCount, setNotificationCount])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8 relative">
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[14px] h-[14px] rounded-full bg-red-500 text-white text-[8px] font-bold px-1 ring-1 ring-background badge-bounce">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          <span className="sr-only">
            {unreadCount} unread notifications
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold">Notifications</h4>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-4 rounded-full">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] gap-1 text-muted-foreground"
                onClick={markAllRead}
              >
                <CheckCheck className="h-3 w-3" />
                Mark all read
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {(['urgent', 'info', 'system'] as NotificationCategory[]).map((category) => {
                const group = groupedNotifications[category]
                if (group.length === 0) return null
                const catConfig = CATEGORY_CONFIG[category]
                const CatIcon = catConfig.icon
                return (
                  <div key={category} className="px-4 py-2">
                    <div className="flex items-center gap-1.5 mb-2">
                      <CatIcon className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {catConfig.label}
                      </span>
                      <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5 rounded-full ml-auto">
                        {group.length}
                      </Badge>
                    </div>
                    <motion.div
                      variants={staggerVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="space-y-0.5"
                    >
                      {group.map((notification) => {
                        const config = TYPE_CONFIG[notification.type]
                        const Icon = config.icon
                        return (
                          <motion.div
                            key={notification.id}
                            variants={itemVariants}
                            layout
                            className={cn(
                              'relative flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-muted/50 group',
                              !notification.read && 'bg-muted/20',
                            )}
                          >
                            <div className={cn('flex items-center justify-center w-7 h-7 rounded-lg shrink-0', config.bg)}>
                              <Icon className={cn('h-3.5 w-3.5', config.color)} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-1.5">
                                <p className={cn(
                                  'text-[11px] leading-tight',
                                  !notification.read ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground',
                                )}>
                                  {notification.title}
                                </p>
                                <div className="flex items-center gap-1 shrink-0">
                                  {!notification.read && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1" />
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      dismissNotification(notification.id)
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted"
                                  >
                                    <X className="w-2.5 h-2.5 text-muted-foreground" />
                                  </button>
                                </div>
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                                {notification.description}
                              </p>
                              <p className="text-[9px] text-muted-foreground/60 mt-1">
                                {formatDistanceToNow(parseISO(notification.time), { addSuffix: true })}
                              </p>
                            </div>
                          </motion.div>
                        )
                      })}
                    </motion.div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
        <div className="border-t border-border p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs h-7 gap-1.5 text-muted-foreground"
            onClick={() => {
              setOpen(false)
              useAppStore.getState().setActiveView('approvals')
              useAppStore.getState().setNotificationCount(0)
              toast.info('Showing approval-related updates')
            }}
          >
            <ExternalLink className="h-3 w-3" />
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

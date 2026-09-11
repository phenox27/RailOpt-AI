'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { motion, AnimatePresence } from 'framer-motion'
import { Users } from 'lucide-react'

interface CollabUser {
  id: string
  name: string
  initials: string
  role: string
  status: 'active' | 'idle' | 'offline'
  action: string
  color: string
}

const VIEW_USERS: Record<string, CollabUser[]> = {
  dashboard: [
    { id: 'u1', name: 'Debarshi', initials: 'DB', role: 'Sr. Section Engineer', status: 'active', action: 'Viewing Dashboard', color: 'bg-rose-500' },
    { id: 'u2', name: 'Rupam', initials: 'RP', role: 'S&T Inspector', status: 'idle', action: 'Viewing Dashboard', color: 'bg-violet-500' },
    { id: 'u3', name: 'Alivia', initials: 'AL', role: 'Traction DE', status: 'active', action: 'Viewing Dashboard', color: 'bg-amber-500' },
  ],
  maintenance: [
    { id: 'u4', name: 'Diya', initials: 'DY', role: 'Engineering SSE', status: 'active', action: 'Editing MR-001', color: 'bg-emerald-500' },
    { id: 'u5', name: 'Jeet', initials: 'JT', role: 'Planner', status: 'idle', action: 'Viewing Requests', color: 'bg-primary' },
  ],
  planning: [
    { id: 'u6', name: 'Jeet', initials: 'JT', role: 'Chief Planner', status: 'active', action: 'Editing Block A1', color: 'bg-[#1a237e]' },
    { id: 'u7', name: 'Diya', initials: 'DY', role: 'Control Office', status: 'active', action: 'Viewing Timeline', color: 'bg-orange-500' },
    { id: 'u8', name: 'Rupam', initials: 'RP', role: 'S&T JE', status: 'idle', action: 'Viewing Planning', color: 'bg-pink-500' },
  ],
  approvals: [
    { id: 'u9', name: 'Dhittika', initials: 'DH', role: 'DOM', status: 'active', action: 'Reviewing Plan-001', color: 'bg-cyan-500' },
    { id: 'u2', name: 'Rupam', initials: 'RP', role: 'S&T Inspector', status: 'idle', action: 'Viewing Approvals', color: 'bg-violet-500' },
  ],
  timetable: [
    { id: 'u7', name: 'Diya', initials: 'DY', role: 'Control Office', status: 'active', action: 'Viewing Timetable', color: 'bg-orange-500' },
  ],
  plans: [
    { id: 'u6', name: 'Jeet', initials: 'JT', role: 'Chief Planner', status: 'active', action: 'Comparing Plans', color: 'bg-[#1a237e]' },
    { id: 'u5', name: 'Jeet', initials: 'JT', role: 'Planner', status: 'active', action: 'Viewing Plans', color: 'bg-primary' },
  ],
  audit: [
    { id: 'u1', name: 'Debarshi', initials: 'DB', role: 'Sr. Section Engineer', status: 'idle', action: 'Viewing Audit', color: 'bg-rose-500' },
  ],
  settings: [
    { id: 'u9', name: 'Dhittika', initials: 'DH', role: 'DOM', status: 'idle', action: 'Viewing Settings', color: 'bg-cyan-500' },
  ],
}

// Extra users that can "join" during simulation
const EXTRA_USERS: CollabUser[] = [
  { id: 'u10', name: 'Debarshi', initials: 'DB', role: 'Engineering JE', status: 'active', action: 'Viewing', color: 'bg-indigo-500' },
  { id: 'u11', name: 'Alivia', initials: 'AL', role: 'Traction SSE', status: 'active', action: 'Viewing', color: 'bg-lime-600' },
  { id: 'u12', name: 'Rupam', initials: 'RP', role: 'S&T SSE', status: 'idle', action: 'Viewing', color: 'bg-fuchsia-500' },
]

const STATUS_RING: Record<string, string> = {
  active: 'ring-2 ring-emerald-500',
  idle: 'ring-2 ring-amber-500',
  offline: 'ring-2 ring-muted-foreground/40',
}

const MAX_VISIBLE = 3

export function CollaborationIndicator({ currentView }: { currentView: string }) {
  const [viewKey, setViewKey] = useState(currentView)
  const [users, setUsers] = useState<CollabUser[]>(() => VIEW_USERS[currentView] ?? [])
  const [extraAdded, setExtraAdded] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Sync view changes and reset state
  if (viewKey !== currentView) {
    setViewKey(currentView)
    setUsers(VIEW_USERS[currentView] ?? [])
    setExtraAdded(false)
  }

  // Simulate periodic user join/leave (every 15-30 seconds)
  const simulateChange = useCallback(() => {
    setUsers((prev) => {
      // Toggle: add an extra user if none extra, or remove the last extra user
      if (!extraAdded && prev.length < MAX_VISIBLE + 2) {
        const extra = EXTRA_USERS[Math.floor(Math.random() * EXTRA_USERS.length)]
        if (!prev.some((u) => u.id === extra.id)) {
          setExtraAdded(true)
          return [...prev, extra]
        }
      }
      // Remove the last user if there are more than the base count
      if (prev.length > (VIEW_USERS[currentView]?.length ?? 0)) {
        setExtraAdded(false)
        return prev.slice(0, -1)
      }
      return prev
    })
  }, [currentView, extraAdded])

  useEffect(() => {
    // Randomize interval between 15-30 seconds
    const scheduleNext = () => {
      const delay = 15000 + Math.random() * 15000
      return setTimeout(() => {
        simulateChange()
      }, delay)
    }

    const timeoutId = scheduleNext()

    // Also set up a recurring interval as backup
    intervalRef.current = setInterval(() => {
      simulateChange()
    }, 25000)

    return () => {
      clearTimeout(timeoutId)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [simulateChange])

  // Randomize an action for the extra user
  const getAction = useCallback(
    (user: CollabUser) => {
      const viewLabel = currentView.charAt(0).toUpperCase() + currentView.slice(1)
      if (user.action === 'Viewing' || user.action === 'Editing') {
        return `${user.action} ${viewLabel}`
      }
      return user.action
    },
    [currentView]
  )

  const visibleUsers = users.slice(0, MAX_VISIBLE)
  const overflowCount = Math.max(0, users.length - MAX_VISIBLE)

  if (users.length === 0) return null

  return (
    <TooltipProvider delayDuration={200}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-card border border-border/50 shadow-sm"
      >
        <Users className="h-3 w-3 text-muted-foreground shrink-0" />

        {/* Avatar stack */}
        <div className="flex -space-x-2">
          <AnimatePresence mode="popLayout">
            {visibleUsers.map((user) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, x: -10, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -10, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Avatar className={`h-6 w-6 border-2 border-background ${STATUS_RING[user.status]}`}>
                      <AvatarFallback className={`${user.color} text-white text-[9px] font-semibold`}>
                        {user.initials}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-muted-foreground">{user.role}</p>
                    <p className="text-muted-foreground mt-0.5">{getAction(user)}</p>
                  </TooltipContent>
                </Tooltip>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Overflow indicator */}
        <AnimatePresence>
          {overflowCount > 0 && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-[10px] text-muted-foreground font-medium"
            >
              +{overflowCount}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Current activity text - hidden on mobile */}
        <span className="hidden md:inline text-[10px] text-muted-foreground truncate max-w-[140px]">
          {users.filter((u) => u.status === 'active').length > 0
            ? users.filter((u) => u.status === 'active')[0].action
            : 'No active viewers'}
        </span>
      </motion.div>
    </TooltipProvider>
  )
}

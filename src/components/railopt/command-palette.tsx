'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore, NAV_ITEMS, type ViewId, type Role } from '@/store/app-store'
import { useTheme } from 'next-themes'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command'
import {
  LayoutDashboard,
  Wrench,
  CalendarClock,
  TrainFront,
  ShieldCheck,
  FileText,
  ScrollText,
  Settings,
  Sparkles,
  Wifi,
  WifiOff,
  Sun,
  Moon,
  User,
  Clock,
} from 'lucide-react'

const VIEW_ICONS: Record<string, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  maintenance: Wrench,
  planning: CalendarClock,
  timetable: TrainFront,
  approvals: ShieldCheck,
  plans: FileText,
  audit: ScrollText,
  settings: Settings,
}

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  planner: 'Planner',
  control_office: 'Control Office',
  engineering: 'Engineering',
  snt: 'S&T',
  traction: 'Traction',
}

interface RecentCommand {
  label: string
  action: () => void
}

export function CommandPalette() {
  const { activeView, currentRole, isOffline, setActiveView, setCurrentRole, setOffline } = useAppStore()
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const [recentCommands, setRecentCommands] = useState<RecentCommand[]>([])

  // Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const addRecent = useCallback((label: string, action: () => void) => {
    setRecentCommands(prev => {
      const filtered = prev.filter(c => c.label !== label)
      return [{ label, action }, ...filtered].slice(0, 5)
    })
  }, [])

  const navigateTo = (viewId: ViewId) => {
    setActiveView(viewId)
    setOpen(false)
    const nav = NAV_ITEMS.find(n => n.id === viewId)
    addRecent(`Go to ${nav?.label ?? viewId}`, () => setActiveView(viewId))
  }

  const runOptimization = () => {
    setActiveView('planning')
    setOpen(false)
    addRecent('Run AI Optimization', () => setActiveView('planning'))
  }

  const toggleOffline = () => {
    setOffline(!isOffline)
    setOpen(false)
    addRecent(isOffline ? 'Go Online' : 'Go Offline', () => setOffline(!isOffline))
  }

  const switchRole = (role: Role) => {
    setCurrentRole(role)
    setOpen(false)
    addRecent(`Switch to ${ROLE_LABELS[role]}`, () => setCurrentRole(role))
  }

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    setOpen(false)
    addRecent(`Switch to ${newTheme} mode`, () => setTheme(newTheme))
  }

  const availableViews = NAV_ITEMS.filter(item => item.roles.includes(currentRole))

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search views, actions, or type a command..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Recent commands */}
        {recentCommands.length > 0 && (
          <>
            <CommandGroup heading="Recent">
              {recentCommands.map((cmd, idx) => (
                <CommandItem
                  key={`recent-${idx}`}
                  onSelect={cmd.action}
                >
                  <Clock className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  {cmd.label}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Navigation */}
        <CommandGroup heading="Navigate">
          {availableViews.map((item) => {
            const Icon = VIEW_ICONS[item.id] || LayoutDashboard
            return (
              <CommandItem
                key={item.id}
                onSelect={() => navigateTo(item.id)}
              >
                <Icon className="h-3.5 w-3.5 mr-2" />
                {item.label}
              </CommandItem>
            )
          })}
        </CommandGroup>

        {/* Actions */}
        <CommandGroup heading="Actions">
          <CommandItem onSelect={runOptimization}>
            <Sparkles className="h-3.5 w-3.5 mr-2 text-[#283593]" />
            Run AI Optimization
          </CommandItem>
          <CommandItem onSelect={toggleOffline}>
            {isOffline ? (
              <Wifi className="h-3.5 w-3.5 mr-2 text-emerald-600" />
            ) : (
              <WifiOff className="h-3.5 w-3.5 mr-2 text-amber-600" />
            )}
            {isOffline ? 'Go Online' : 'Go Offline'}
          </CommandItem>
          <CommandItem onSelect={toggleTheme}>
            {theme === 'dark' ? (
              <Sun className="h-3.5 w-3.5 mr-2" />
            ) : (
              <Moon className="h-3.5 w-3.5 mr-2" />
            )}
            Toggle Theme
          </CommandItem>
        </CommandGroup>

        {/* Role Switching */}
        <CommandGroup heading="Switch Role">
          {(Object.entries(ROLE_LABELS) as [Role, string][]).map(([role, label]) => (
            <CommandItem
              key={role}
              onSelect={() => switchRole(role)}
            >
              <User className="h-3.5 w-3.5 mr-2" />
              {label}
              {currentRole === role && (
                <span className="ml-auto text-[10px] text-muted-foreground">current</span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

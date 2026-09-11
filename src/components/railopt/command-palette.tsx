'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
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
  AlertTriangle,
  Plus,
  History,
  ArrowRight,
} from 'lucide-react'
import { maintenanceRequests, blocks, conflicts, plans, trains } from '@/data/simulated-data'

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

const RECENT_KEY = 'railopt-recent-commands'

interface RecentCommand {
  label: string
  viewId?: ViewId
}

/** Case-insensitive substring match across multiple fields */
function matches(query: string, ...fields: (string | number | undefined)[]) {
  if (!query) return false
  const q = query.toLowerCase()
  return fields.some((f) => f != null && String(f).toLowerCase().includes(q))
}

export function CommandPalette() {
  const {
    activeView,
    currentRole,
    isOffline,
    setActiveView,
    setCurrentRole,
    setOffline,
    pushDeepLink,
  } = useAppStore()
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [recentCommands, setRecentCommands] = useState<RecentCommand[]>([])

  // Hydrate recent commands from localStorage
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const raw = localStorage.getItem(RECENT_KEY)
        if (raw) setRecentCommands(JSON.parse(raw).slice(0, 5))
      } catch {
        /* ignore */
      }
    }, 0)
    return () => clearTimeout(t)
  }, [])

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

  // Reset search when closing
  useEffect(() => {
    if (open) return
    const t = setTimeout(() => setSearch(''), 0)
    return () => clearTimeout(t)
  }, [open])

  const persistRecent = useCallback((cmd: RecentCommand) => {
    setRecentCommands((prev) => {
      const next = [cmd, ...prev.filter((c) => c.label !== cmd.label)].slice(0, 5)
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next))
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  const navigateTo = useCallback(
    (viewId: ViewId) => {
      setActiveView(viewId)
      setOpen(false)
      const nav = NAV_ITEMS.find((n) => n.id === viewId)
      persistRecent({ label: `Go to ${nav?.label ?? viewId}`, viewId })
    },
    [setActiveView, persistRecent]
  )

  const deepLinkTo = useCallback(
    (viewId: ViewId, type: Parameters<typeof pushDeepLink>[0], id: string, label: string) => {
      setActiveView(viewId)
      setOpen(false)
      pushDeepLink(type, id)
      persistRecent({ label, viewId })
    },
    [setActiveView, pushDeepLink, persistRecent]
  )

  const runOptimization = () => {
    setActiveView('planning')
    setOpen(false)
    persistRecent({ label: 'Run AI Optimization', viewId: 'planning' })
  }

  const toggleOffline = () => {
    setOffline(!isOffline)
    setOpen(false)
    persistRecent({ label: isOffline ? 'Go Online' : 'Go Offline' })
  }

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'dark' : 'light'
    setTheme(newTheme)
    setOpen(false)
    persistRecent({ label: `Switch to ${newTheme} mode` })
  }

  const switchRole = (role: Role) => {
    setCurrentRole(role)
    setOpen(false)
    persistRecent({ label: `Switch to ${ROLE_LABELS[role]}` })
  }

  // --- Search query (trim once) ---
  const q = search.trim()

  const availableViews = NAV_ITEMS.filter((item) => item.roles.includes(currentRole))
  const canSeeMaintenance = NAV_ITEMS.find((n) => n.id === 'maintenance')!.roles.includes(currentRole)
  const canSeeTimetable = NAV_ITEMS.find((n) => n.id === 'timetable')!.roles.includes(currentRole)
  const canSeePlans = NAV_ITEMS.find((n) => n.id === 'plans')!.roles.includes(currentRole)
  const canPlan = NAV_ITEMS.find((n) => n.id === 'planning')!.roles.includes(currentRole)

  // Query-aware Navigate/Actions matching (so "create", "plan", "theme"… surface commands)
  const navMatches = useMemo(
    () => (q ? availableViews.filter((v) => matches(q, v.label)) : availableViews),
    [q, availableViews]
  )

  const requestResults = useMemo(() => {
    if (!q || !canSeeMaintenance) return []
    return maintenanceRequests
      .filter((r) => matches(q, r.title, r.id, r.section, r.category, r.stationFrom, r.stationTo))
      .slice(0, 4)
  }, [q, canSeeMaintenance])

  const blockResults = useMemo(() => {
    if (!q || !canPlan) return []
    return blocks
      .filter((b) => matches(q, b.name, b.id, b.section, b.department, b.stationFrom, b.stationTo))
      .slice(0, 4)
  }, [q, canPlan])

  const conflictResults = useMemo(() => {
    if (!q || !canSeeTimetable) return []
    return conflicts
      .filter((c) => matches(q, c.description, c.id, c.trainName, c.type))
      .slice(0, 4)
  }, [q, canSeeTimetable])

  const planResults = useMemo(() => {
    if (!q || !canSeePlans) return []
    return plans.filter((p) => matches(q, p.name, p.id, p.type)).slice(0, 4)
  }, [q, canSeePlans])

  const trainResults = useMemo(() => {
    if (!q || !canSeeTimetable) return []
    return trains
      .filter((t) => matches(q, t.name, t.number, t.fromStation, t.toStation))
      .slice(0, 4)
  }, [q, canSeeTimetable])

  const hasResults =
    requestResults.length +
      blockResults.length +
      conflictResults.length +
      planResults.length +
      trainResults.length >
    0

  // Quick actions (data-driven so they can be searched by label + keywords)
  const actions = [
    {
      label: 'Run AI Optimization',
      keywords: 'optimize ai engine blocks schedule',
      icon: <Sparkles className="text-[#283593]" />,
      show: true,
      run: runOptimization,
    },
    {
      label: 'Create Maintenance Request',
      keywords: 'new request maintenance add report',
      icon: <Plus className="text-emerald-600" />,
      show: canSeeMaintenance,
      run: () => {
        setActiveView('maintenance')
        setOpen(false)
        pushDeepLink('request-new')
        persistRecent({ label: 'Create Maintenance Request', viewId: 'maintenance' })
      },
    },
    {
      label: 'Create New Plan',
      keywords: 'new plan weekly monthly schedule',
      icon: <Plus className="text-[#FF9933]" />,
      show: canSeePlans,
      run: () => {
        setActiveView('plans')
        setOpen(false)
        pushDeepLink('plan-new')
        persistRecent({ label: 'Create New Plan', viewId: 'plans' })
      },
    },
    {
      label: isOffline ? 'Go Online' : 'Go Offline',
      keywords: 'offline online network connectivity sync',
      icon: isOffline ? <Wifi className="text-emerald-600" /> : <WifiOff className="text-amber-600" />,
      show: true,
      run: toggleOffline,
    },
    {
      label: 'Toggle Theme',
      keywords: 'theme dark light mode appearance',
      icon: theme === 'dark' ? <Sun /> : <Moon />,
      show: true,
      run: toggleTheme,
    },
  ].filter((a) => a.show)

  const actionMatches = q ? actions.filter((a) => matches(q, a.label, a.keywords)) : actions

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      commandProps={{ shouldFilter: false }}
    >
      <CommandInput
        placeholder="Search requests, blocks, conflicts, plans, trains…"
        value={search}
        onValueChange={setSearch}
      />
      <CommandList className="max-h-[420px]">
        {q && !hasResults && (
          <CommandEmpty>
            <div className="flex flex-col items-center gap-1 py-6 text-center">
              <AlertTriangle className="h-5 w-5 text-muted-foreground/50" />
              <span className="text-sm font-medium">No results for “{q}”</span>
              <span className="text-xs text-muted-foreground">
                Try a section code (NDLS), train number, or request ID
              </span>
            </div>
          </CommandEmpty>
        )}

        {/* Recent commands */}
        {recentCommands.length > 0 && !q && (
          <>
            <CommandGroup heading="Recent">
              {recentCommands.map((cmd, idx) => (
                <CommandItem
                  key={`recent-${idx}`}
                  onSelect={() => {
                    if (cmd.viewId) navigateTo(cmd.viewId)
                    else setOpen(false)
                  }}
                >
                  <History className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  {cmd.label}
                  <span className="ml-auto text-[10px] text-muted-foreground/60">Enter</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Navigation (search-aware) */}
        {(!q || navMatches.length > 0) && (
          <CommandGroup heading="Navigate">
            {navMatches.map((item) => {
              const Icon = VIEW_ICONS[item.id] || LayoutDashboard
              const isActive = activeView === item.id
              return (
                <CommandItem key={item.id} onSelect={() => navigateTo(item.id)}>
                  <Icon className="h-3.5 w-3.5 mr-2" />
                  {item.label}
                  {isActive && (
                    <span className="ml-auto text-[10px] text-muted-foreground">current</span>
                  )}
                </CommandItem>
              )
            })}
          </CommandGroup>
        )}

        {/* Real search results */}
        {requestResults.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Maintenance Requests">
              {requestResults.map((r) => (
                <CommandItem
                  key={r.id}
                  value={`req-${r.id}-${r.title}`}
                  onSelect={() =>
                    deepLinkTo('maintenance', 'request', r.id, `Open ${r.title}`)
                  }
                >
                  <Wrench className="h-3.5 w-3.5 mr-2 text-[#283593] shrink-0" />
                  <span className="truncate">{r.title}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground shrink-0">
                    {r.id.toUpperCase()} · {r.section} · P{r.priority}
                  </span>
                  <ArrowRight className="h-3 w-3 ml-1.5 text-muted-foreground/50 shrink-0" />
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {blockResults.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Blocks">
              {blockResults.map((b) => (
                <CommandItem
                  key={b.id}
                  value={`block-${b.id}-${b.name}`}
                  onSelect={() =>
                    deepLinkTo('planning', 'block', b.id, `Open block ${b.name}`)
                  }
                >
                  <CalendarClock className="h-3.5 w-3.5 mr-2 text-emerald-600 shrink-0" />
                  <span className="truncate">{b.name}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground shrink-0">
                    {b.section} · {b.startTime}–{b.endTime}
                  </span>
                  <ArrowRight className="h-3 w-3 ml-1.5 text-muted-foreground/50 shrink-0" />
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {conflictResults.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Conflicts">
              {conflictResults.map((c) => (
                <CommandItem
                  key={c.id}
                  value={`conflict-${c.id}`}
                  onSelect={() =>
                    deepLinkTo('timetable', 'conflict', c.id, `Open conflict ${c.id.toUpperCase()}`)
                  }
                >
                  <AlertTriangle
                    className={`h-3.5 w-3.5 mr-2 shrink-0 ${
                      c.severity === 'critical'
                        ? 'text-red-500'
                        : c.severity === 'warning'
                          ? 'text-amber-500'
                          : 'text-sky-600'
                    }`}
                  />
                  <span className="truncate">{c.description}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground shrink-0">
                    {c.resolved ? 'Resolved' : c.severity}
                  </span>
                  <ArrowRight className="h-3 w-3 ml-1.5 text-muted-foreground/50 shrink-0" />
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {planResults.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Plans">
              {planResults.map((p) => (
                <CommandItem
                  key={p.id}
                  value={`plan-${p.id}-${p.name}`}
                  onSelect={() =>
                    deepLinkTo('plans', 'plan', p.id, `Open plan ${p.name}`)
                  }
                >
                  <FileText className="h-3.5 w-3.5 mr-2 text-[#FF9933] shrink-0" />
                  <span className="truncate">{p.name}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground shrink-0">
                    {p.type} · v{p.version}
                  </span>
                  <ArrowRight className="h-3 w-3 ml-1.5 text-muted-foreground/50 shrink-0" />
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {trainResults.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Trains">
              {trainResults.map((t) => (
                <CommandItem
                  key={t.id}
                  value={`train-${t.id}-${t.name}`}
                  onSelect={() => {
                    navigateTo('timetable')
                  }}
                >
                  <TrainFront className="h-3.5 w-3.5 mr-2 text-[#138808] shrink-0" />
                  <span className="truncate">
                    {t.name} <span className="text-muted-foreground">({t.number})</span>
                  </span>
                  <span className="ml-auto text-[10px] text-muted-foreground shrink-0">
                    {t.fromStation} → {t.toStation}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Actions (search-aware) */}
        {actionMatches.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Actions">
              {actionMatches.map((a) => (
                <CommandItem key={a.label} onSelect={a.run} value={`action-${a.label}`}>
                  <span className="mr-2 shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5">{a.icon}</span>
                  {a.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Role Switching (only when not searching) */}
        {!q && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Switch Role">
              {(Object.entries(ROLE_LABELS) as [Role, string][]).map(([role, label]) => (
                <CommandItem key={role} onSelect={() => switchRole(role)}>
                  <User className="h-3.5 w-3.5 mr-2" />
                  {label}
                  {currentRole === role && (
                    <span className="ml-auto text-[10px] text-muted-foreground">current</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>

      {/* Footer hint bar */}
      <div className="flex items-center gap-4 border-t px-3 py-2 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-0.5 rounded border bg-muted px-1 font-mono text-[9px] font-medium">
            ↑↓
          </kbd>
          navigate
        </span>
        <span className="flex items-center gap-1">
          <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-0.5 rounded border bg-muted px-1 font-mono text-[9px] font-medium">
            ↵
          </kbd>
          open
        </span>
        <span className="flex items-center gap-1">
          <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-0.5 rounded border bg-muted px-1 font-mono text-[9px] font-medium">
            esc
          </kbd>
          close
        </span>
        <span className="ml-auto flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {q ? `${hasResults ? 'results found' : 'no matches'}` : 'Cmd+K'}
        </span>
      </div>
    </CommandDialog>
  )
}

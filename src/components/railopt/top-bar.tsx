'use client'

import { useEffect, useState } from 'react'
import { useAppStore, NAV_ITEMS, type Role } from '@/store/app-store'
import { useTheme } from 'next-themes'
import { useSidebar } from '@/components/ui/sidebar'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { signOut } from 'next-auth/react'
import {
  Sun,
  Moon,
  LogOut,
  User,
  Search,
  Clock,
  Mail,
} from 'lucide-react'
import { format } from 'date-fns'
import { NotificationPanel } from './notification-panel'
import { SyncIndicator } from './sync-indicator'
import { CollaborationIndicator } from './collaboration-indicator'
import { useIsMobile } from '@/hooks/use-mobile'

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  planner: 'Planner',
  control_office: 'Control Office',
  engineering: 'Eng',
  snt: 'S&T',
  traction: 'Traction',
}

export function TopBar({ realtimeConnected = false }: { realtimeConnected?: boolean }) {
  const {
    activeView,
    currentRole,
    currentUserName,
    currentUserEmail,
    lastLoginTime,
    setActiveView,
  } = useAppStore()
  const { theme, setTheme } = useTheme()
  const { state } = useSidebar()
  const [currentTime, setCurrentTime] = useState(new Date())
  const isMobile = useIsMobile()

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000)
    return () => clearInterval(timer)
  }, [])

  const currentNav = NAV_ITEMS.find((item) => item.id === activeView)
  const viewLabel = currentNav?.label ?? 'Dashboard'

  return (
    <header className="relative flex h-12 shrink-0 items-center gap-2 border-b px-3 transition-[width,height] duration-200 ease-linear backdrop-blur-lg bg-background/80 border-b-border/60" aria-label="Top bar" role="banner">
      {/* Sidebar toggle + Breadcrumb */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <SidebarTrigger className="-ml-1 h-9 w-9 min-h-[44px] min-w-[44px] sm:h-auto sm:w-auto sm:min-h-0 sm:min-w-0" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage className="text-muted-foreground text-xs hidden sm:inline">
                RailOpt AI
              </BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden sm:inline" />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium text-sm">
                {isMobile ? (viewLabel.length > 16 ? viewLabel.slice(0, 16) + '…' : viewLabel) : viewLabel}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Right section: actions */}
      <div className="flex items-center gap-1">
        {/* Collaboration Indicator - hidden on small mobile */}
        <div className="hidden sm:flex">
          <CollaborationIndicator currentView={activeView} />
        </div>

        {/* Search - opens command palette (Cmd+K) on mobile */}
        {isMobile ? (
          <Button
            variant="ghost"
            size="icon"
            className="size-9 min-h-[44px] min-w-[44px]"
            onClick={() => {
              // Trigger the global CommandPalette (same as Cmd/Ctrl+K)
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))
            }}
          >
            <Search className="size-4" />
            <span className="sr-only">Search</span>
          </Button>
        ) : (
          <span className="hidden lg:flex text-xs text-muted-foreground mr-2 tabular-nums">
            {format(currentTime, 'dd MMM yyyy · HH:mm')}
          </span>
        )}

        {/* Real-time connection indicator */}
        <div className="hidden sm:flex items-center gap-1.5" title={realtimeConnected ? 'Real-time connected' : 'Real-time disconnected'}>
          <span className={`relative flex h-2 w-2`}>
            {realtimeConnected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${realtimeConnected ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} />
          </span>
        </div>

        {/* Sync Indicator */}
        <div className="hidden sm:block">
          <SyncIndicator />
        </div>

        {/* Notification Panel */}
        <NotificationPanel />

        {/* Theme toggle - larger for touch */}
        <Button
          variant="ghost"
          size="icon"
          className="size-9 min-h-[44px] min-w-[44px] sm:size-8 sm:min-h-0 sm:min-w-0"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* User avatar + role - compact on mobile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 sm:h-8 gap-2 px-2 min-h-[44px] sm:min-h-0">
              <Avatar className="size-6">
                <AvatarFallback className="text-[10px] bg-[#1a237e]/10 text-[#1a237e] dark:bg-[#60a5fa]/10 dark:text-[#60a5fa] font-semibold">
                  {currentUserName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:inline text-xs font-medium max-w-[120px] truncate">
                {currentUserName}
              </span>
              <Badge variant="secondary" className="hidden lg:inline-flex text-[10px] px-1.5 py-0">
                {ROLE_LABELS[currentRole]}
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">{currentUserName || 'User'}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail className="size-3" />
                  {currentUserEmail || 'Not signed in'}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3" />
                  {lastLoginTime
                    ? `Last login: ${format(new Date(lastLoginTime), 'dd MMM HH:mm')}`
                    : 'Session active'
                  }
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setActiveView('settings')}
              aria-label="Open profile settings"
            >
              <User className="size-4" />
              Profile & Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                useAppStore.getState().clearUser()
                signOut({ callbackUrl: '/' })
              }}
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {/* Indian Government accent line - saffron to green */}
      <div className="absolute bottom-0 left-0 right-0 h-px pointer-events-none" aria-hidden="true">
        <div className="flex h-full w-full">
          <div className="flex-1 bg-[#FF9933]/30" />
          <div className="flex-1 bg-white/20" />
          <div className="flex-1 bg-[#138808]/30" />
        </div>
      </div>
    </header>
  )
}

'use client'

import Image from 'next/image'
import {
  LayoutDashboard,
  Wrench,
  CalendarClock,
  TrainFront,
  ShieldCheck,
  FileText,
  ScrollText,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import { useAppStore, NAV_ITEMS } from '@/store/app-store'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { RoleSelector } from '@/components/railopt/role-selector'
import { Badge } from '@/components/ui/badge'
import { WifiOff, TrainTrack } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Wrench,
  CalendarClock,
  TrainFront,
  ShieldCheck,
  FileText,
  ScrollText,
  Settings,
}

export function AppSidebar() {
  const { activeView, setActiveView, currentRole, isOffline } = useAppStore()

  const filteredNavItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(currentRole)
  )

  return (
    <Sidebar collapsible="icon" aria-label="Main navigation">
      {/* Header: Logo + App Name - Indian Government Style */}
      <SidebarHeader className="px-2 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="gap-2.5"
              onClick={() => setActiveView('dashboard')}
              title="Go to Dashboard"
            >
              {/* Logo with saffron-green gradient border ring */}
              <div className="relative shrink-0">
                <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-br from-[#FF9933] via-white to-[#138808] opacity-60" />
                <div className="relative size-8 rounded-md bg-white dark:bg-[#1a237e] flex items-center justify-center overflow-hidden shadow-sm">
                  <Image
                    src="/logo-icon.png"
                    alt="RailOpt AI"
                    width={28}
                    height={28}
                    className="object-contain"
                    style={{ width: 28, height: 28 }}
                    priority
                  />
                </div>
              </div>
              <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                <span className="font-bold text-sm tracking-wide text-[#1a237e] dark:text-white">
                  RailOpt AI
                </span>
                <span className="text-[9px] text-muted-foreground tracking-wide">
                  ब्लॉक योजना एवं अनुकूलन
                </span>
                <span className="text-[8px] text-muted-foreground/70">
                  Block Planning & Optimization
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Mini tricolor strip below logo */}
        <div className="flex h-[2px] mx-2 mt-1 rounded-full overflow-hidden group-data-[collapsible=icon]:mx-0 group-data-[collapsible=icon]:mt-2" aria-hidden="true">
          <div className="flex-1 bg-[#FF9933]" />
          <div className="flex-1 bg-white dark:bg-white/40" />
          <div className="flex-1 bg-[#138808]" />
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      {/* Navigation - larger tap targets on mobile */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavItems.map((item) => {
                const Icon = ICON_MAP[item.icon] || LayoutDashboard
                const isActive = activeView === item.id

                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setActiveView(item.id)}
                      tooltip={item.label}
                      aria-current={isActive ? 'page' : undefined}
                      className={`
                        relative transition-all duration-200 min-h-[44px] sm:min-h-0
                        hover:bg-sidebar-accent/60
                        ${isActive
                          ? 'bg-gradient-to-r from-[#1a237e]/8 via-[#0d47a1]/5 to-transparent text-sidebar-accent-foreground font-semibold shadow-sm shadow-[#1a237e]/5 border-l-[3px] border-l-[#1a237e] dark:border-l-[#60a5fa]'
                          : 'hover:scale-[1.01]'
                        }
                      `}
                      style={!isActive ? {} : undefined}
                    >
                      {/* Active indicator bar with navy gradient + slide-in animation */}
                      <AnimatePresence mode="wait">
                        {isActive && (
                          <motion.div
                            layoutId="activeIndicator"
                            className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-gradient-to-b from-[#1a237e] to-[#0d47a1] dark:from-[#60a5fa] dark:to-[#3b82f6]"
                            initial={{ scaleY: 0, opacity: 0 }}
                            animate={{ scaleY: 1, opacity: 1 }}
                            exit={{ scaleY: 0, opacity: 0 }}
                            transition={{
                              type: 'spring',
                              stiffness: 400,
                              damping: 30,
                              duration: 0.2,
                            }}
                          />
                        )}
                      </AnimatePresence>
                      <Icon className="size-4" />
                      <span>{item.label}</span>
                      {/* Animated dot indicator for active item */}
                      <AnimatePresence>
                        {isActive && (
                          <motion.span
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className="ml-auto size-1.5 rounded-full bg-[#1a237e] dark:bg-[#60a5fa] pulse-dot shrink-0"
                          />
                        )}
                      </AnimatePresence>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      {/* Footer: Role Selector + Offline Indicator */}
      <SidebarFooter className="p-2">
        {/* Offline indicator */}
        {isOffline && (
          <div className="flex items-center gap-2 rounded-md bg-rail-warning/10 px-2 py-1.5 text-xs text-rail-warning group-data-[collapsible=icon]:hidden">
            <WifiOff className="size-3.5 shrink-0" />
            <span className="truncate font-medium">Offline Mode</span>
          </div>
        )}
        {isOffline && (
          <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center rounded-md bg-rail-warning/10 p-2 text-rail-warning">
            <WifiOff className="size-4" />
          </div>
        )}

        {/* Role Selector */}
        <div className="group-data-[collapsible=icon]:hidden">
          <RoleSelector />
        </div>
        <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center">
          <Badge variant="secondary" className="text-[10px] px-1.5">
            {currentRole.charAt(0).toUpperCase()}
          </Badge>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

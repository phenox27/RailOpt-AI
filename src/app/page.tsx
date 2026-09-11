'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { AnimatePresence, motion } from 'framer-motion'
import { LandingPage } from '@/components/railopt/landing-page'
import { SignInForm } from '@/components/railopt/sign-in-form'
import { useAppStore, type Role } from '@/store/app-store'
import { AppSidebar } from '@/components/railopt/app-sidebar'
import { TopBar } from '@/components/railopt/top-bar'
import { GovernmentHeader } from '@/components/railopt/government-header'
import { GovernmentFooter } from '@/components/railopt/government-footer'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { DashboardView } from '@/components/railopt/dashboard-view'
import { MaintenanceView } from '@/components/railopt/maintenance-view'
import { PlanningView } from '@/components/railopt/planning-view'
import { ApprovalsView } from '@/components/railopt/approvals-view'
import { TimetableView } from '@/components/railopt/timetable-view'
import { AuditView } from '@/components/railopt/audit-view'
import { SettingsView } from '@/components/railopt/settings-view'
import { OfflineBanner } from '@/components/railopt/offline-banner'
import { PlansView } from '@/components/railopt/plans-view'
import { CommandPalette } from '@/components/railopt/command-palette'
import { ShortcutsHelpDialog } from '@/components/railopt/shortcuts-help-dialog'
import { DataRefreshIndicator } from '@/components/railopt/data-refresh-indicator'
import { DashboardSkeleton } from '@/components/railopt/dashboard-skeleton'
import { AiChatPanel } from '@/components/railopt/ai-chat-panel'
import { QuickStatsBar } from '@/components/railopt/quick-stats-bar'
import { useKeyboardShortcuts } from '@/lib/keyboard-shortcuts'
import { useRealtime } from '@/hooks/use-realtime'
import { useRef } from 'react'
import { Bot, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

function ViewRouter() {
  const { activeView } = useAppStore()
  const [displayedView, setDisplayedView] = useState(activeView)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mainContentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (activeView === displayedView) return

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      setDisplayedView(activeView)
    }, 150)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [activeView, displayedView])

  useEffect(() => {
    if (!mainContentRef.current) return
    const focusTimer = setTimeout(() => {
      const heading = mainContentRef.current?.querySelector('h1')
      if (heading && heading instanceof HTMLElement) {
        heading.setAttribute('tabindex', '-1')
        heading.focus({ preventScroll: true })
      }
    }, 200)
    return () => clearTimeout(focusTimer)
  }, [displayedView])

  const views: Record<string, React.ReactNode> = {
    dashboard: <DashboardView />,
    maintenance: <MaintenanceView />,
    planning: <PlanningView />,
    approvals: <ApprovalsView />,
    timetable: <TimetableView />,
    plans: <PlansView />,
    audit: <AuditView />,
    settings: <SettingsView />,
  }

  const isTransitioning = activeView !== displayedView

  if (isTransitioning) {
    return <DashboardSkeleton />
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={displayedView}
        ref={mainContentRef}
        id="main-content"
        layoutId="view-content"
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4, scale: 0.99 }}
        transition={{
          opacity: { duration: 0.12 },
          y: { duration: 0.15 },
          scale: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] },
          layout: { duration: 0.2 },
        }}
        className="flex-1 min-h-0 overflow-auto"
        role="main"
        aria-label={`${displayedView} view`}
      >
        {views[displayedView] || <DashboardView />}
      </motion.div>
    </AnimatePresence>
  )
}

function AppShell() {
  const [chatOpen, setChatOpen] = useState(false)
  const { isConnected: realtimeConnected } = useRealtime()

  useKeyboardShortcuts({
    onToggleChat: useCallback(() => setChatOpen((prev) => !prev), []),
  })

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <GovernmentHeader />

      <SidebarProvider className="flex-1 min-h-0">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md focus:outline-none"
        >
          Skip to main content
        </a>
        <AppSidebar />
        <SidebarInset className="flex flex-col min-h-0">
          <TopBar realtimeConnected={realtimeConnected} />
          <OfflineBanner />
          {/* Prototype Data Indicator */}
          <div className="flex items-center justify-center py-1 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200/50 dark:border-amber-800/30">
            <Badge variant="outline" className="text-[10px] px-2 py-0 h-5 border-amber-400 text-amber-700 dark:text-amber-400 bg-amber-100/50 dark:bg-amber-900/30">
              ⚡ Prototype Data — Simulated / Demo
            </Badge>
          </div>
          <ViewRouter />
          <GovernmentFooter />
        </SidebarInset>
        <CommandPalette />
        <ShortcutsHelpDialog />
        <QuickStatsBar />

        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[380px] shadow-2xl"
            >
              <AiChatPanel onClose={() => setChatOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setChatOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 sm:hidden"
            />
          )}
        </AnimatePresence>

        <div className="fixed bottom-4 right-4 z-30 print:hidden">
          <DataRefreshIndicator />
          <AnimatePresence>
            {!chatOpen && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setChatOpen(true)}
                className="mt-2 w-12 h-12 rounded-full bg-gradient-to-br from-[#1a237e] to-[#0d47a1] text-white shadow-lg shadow-[#1a237e]/25 flex items-center justify-center hover:shadow-xl hover:shadow-[#1a237e]/30 transition-shadow"
                aria-label="Open AI Assistant"
              >
                <Bot className="w-5 h-5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </SidebarProvider>
    </div>
  )
}

export default function Home() {
  const { data: session, status } = useSession()
  // Track whether user has clicked "Enter Dashboard" / "Login" / "Register" to show auth form
  const [showSignIn, setShowSignIn] = useState(false)
  // Track initial auth mode (signin or signup)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')

  // Sync session to app store — only update external store, no local setState
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) return
    const role = (session.user as Record<string, unknown>).role as Role
    const name = (session.user.name || '') as string
    const email = (session.user.email || '') as string
    const id = ((session.user as Record<string, unknown>).id || '') as string
    useAppStore.getState().setUserFromSession({ role, name, email, id })
  }, [session, status])

  // Derive the flow state from session status and user interaction
  const isAuthenticated = status === 'authenticated' && !!session?.user
  const isCheckingSession = status === 'loading'
  const showLanding = !isCheckingSession && !isAuthenticated && !showSignIn
  const showSignInForm = !isCheckingSession && !isAuthenticated && showSignIn

  const handleEnterApp = useCallback(() => {
    setAuthMode('signin')
    setShowSignIn(true)
  }, [])

  const handleSignUp = useCallback(() => {
    setAuthMode('signup')
    setShowSignIn(true)
  }, [])

  const handleBackToLanding = useCallback(() => {
    setShowSignIn(false)
  }, [])

  const handleSignInSuccess = useCallback(() => {
    // The sign-in form handles its own redirect via window.location.href = '/'
    // This callback is for any additional cleanup if needed
  }, [])

  // Loading state while checking session
  if (isCheckingSession) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading RailOpt AI...</p>
        </div>
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      {isAuthenticated && (
        <motion.div
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="h-screen"
        >
          <AppShell />
        </motion.div>
      )}

      {showLanding && (
        <motion.div
          key="landing"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <LandingPage onEnterApp={handleEnterApp} onSignUp={handleSignUp} />
        </motion.div>
      )}

      {showSignInForm && (
        <motion.div
          key="signin"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <SignInForm onSuccess={handleSignInSuccess} onBack={handleBackToLanding} initialTab={authMode} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

import { create } from 'zustand'

export type ViewId = 
  | 'dashboard'
  | 'maintenance'
  | 'planning'
  | 'timetable'
  | 'approvals'
  | 'plans'
  | 'audit'
  | 'settings'

export type Role = 'admin' | 'planner' | 'control_office' | 'engineering' | 'snt' | 'traction'

export type DeepLinkType = 'request' | 'request-new' | 'conflict' | 'block' | 'plan' | 'plan-new' | 'train'

export interface DeepLink {
  type: DeepLinkType
  id: string
  ts: number
}

export interface NavItem {
  id: ViewId
  label: string
  icon: string
  roles: Role[]
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', roles: ['admin', 'planner', 'control_office', 'engineering', 'snt', 'traction'] },
  { id: 'maintenance', label: 'Maintenance Requests', icon: 'Wrench', roles: ['admin', 'planner', 'engineering', 'snt', 'traction'] },
  { id: 'planning', label: 'Planning', icon: 'CalendarClock', roles: ['admin', 'planner'] },
  { id: 'timetable', label: 'Timetable & Conflicts', icon: 'TrainFront', roles: ['admin', 'planner', 'control_office'] },
  { id: 'approvals', label: 'Approvals', icon: 'ShieldCheck', roles: ['admin', 'planner', 'control_office', 'engineering', 'snt', 'traction'] },
  { id: 'plans', label: 'Plans', icon: 'FileText', roles: ['admin', 'planner', 'control_office'] },
  { id: 'audit', label: 'Audit Logs', icon: 'ScrollText', roles: ['admin'] },
  { id: 'settings', label: 'Settings', icon: 'Settings', roles: ['admin'] },
]

/** Where each role lands right after signing in. */
export const ROLE_HOME_VIEW: Record<Role, ViewId> = {
  admin: 'dashboard',
  planner: 'planning',
  control_office: 'timetable',
  engineering: 'maintenance',
  snt: 'maintenance',
  traction: 'maintenance',
}

const LAST_VIEW_KEY = 'railopt-last-view'

interface SessionUser {
  role: Role
  name: string
  email: string
  id: string
}

interface AppState {
  // Navigation
  activeView: ViewId
  setActiveView: (view: ViewId) => void
  
  // User / Role
  currentRole: Role
  setCurrentRole: (role: Role) => void
  currentUserName: string
  currentUserEmail: string
  currentUserId: string
  currentUserDepartment: string
  isSessionActive: boolean
  lastLoginTime: string | null
  setUserFromSession: (user: SessionUser) => void
  clearUser: () => void
  
  // Connectivity
  isOffline: boolean
  setOffline: (offline: boolean) => void
  lastSyncTime: string | null
  
  // Sidebar
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  
  // Plan context
  activePlanId: string | null
  setActivePlanId: (id: string | null) => void
  
  // Notifications
  notificationCount: number
  setNotificationCount: (count: number) => void

  // Deep linking (command palette → view selection)
  deepLink: DeepLink | null
  pushDeepLink: (type: DeepLinkType, id?: string) => void
  clearDeepLink: () => void
}

export const useAppStore = create<AppState>((set) => ({
  activeView: 'dashboard',
  setActiveView: (view) => {
    set({ activeView: view })
    // Remember the view for soft-refresh restoration (per-tab, cleared on logout)
    try {
      sessionStorage.setItem(LAST_VIEW_KEY, view)
    } catch {
      /* storage unavailable */
    }
  },
  
  currentRole: 'planner',
  setCurrentRole: (role) => set({ currentRole: role }),
  currentUserName: 'Jeet',
  currentUserEmail: 'planner@railopt.ai',
  currentUserId: 'u-001',
  currentUserDepartment: 'Operating',
  isSessionActive: true,
  lastLoginTime: new Date().toISOString(),
  setUserFromSession: (user) => {
    // Per-role landing view: restore the last visited view when it is still
    // allowed for this role, otherwise fall back to the role's home view.
    let landing: ViewId = ROLE_HOME_VIEW[user.role] ?? 'dashboard'
    try {
      const last = sessionStorage.getItem(LAST_VIEW_KEY) as ViewId | null
      if (last) {
        const item = NAV_ITEMS.find((n) => n.id === last)
        if (item && item.roles.includes(user.role)) landing = last
      }
    } catch {
      /* storage unavailable */
    }
    set({
      currentRole: user.role,
      currentUserName: user.name,
      currentUserEmail: user.email,
      currentUserId: user.id,
      isSessionActive: true,
      lastLoginTime: new Date().toISOString(),
      activeView: landing,
    })
  },
  clearUser: () => {
    try {
      sessionStorage.removeItem(LAST_VIEW_KEY)
    } catch {
      /* storage unavailable */
    }
    set({
      currentRole: 'planner',
      currentUserName: '',
      currentUserEmail: '',
      currentUserId: '',
      currentUserDepartment: '',
      isSessionActive: false,
      lastLoginTime: null,
    })
  },
  
  isOffline: false,
  setOffline: (offline) => set({ isOffline: offline }),
  lastSyncTime: new Date().toISOString(),
  
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  
  activePlanId: null,
  setActivePlanId: (id) => set({ activePlanId: id }),
  
  notificationCount: 3,
  setNotificationCount: (count) => set({ notificationCount: count }),

  deepLink: null,
  pushDeepLink: (type, id = '') => set({ deepLink: { type, id, ts: Date.now() } }),
  clearDeepLink: () => set({ deepLink: null }),
}))

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
}

export const useAppStore = create<AppState>((set) => ({
  activeView: 'dashboard',
  setActiveView: (view) => set({ activeView: view }),
  
  currentRole: 'planner',
  setCurrentRole: (role) => set({ currentRole: role }),
  currentUserName: 'Jeet',
  currentUserEmail: 'planner@railopt.ai',
  currentUserId: 'u-001',
  currentUserDepartment: 'Operating',
  isSessionActive: true,
  lastLoginTime: new Date().toISOString(),
  setUserFromSession: (user) => set({
    currentRole: user.role,
    currentUserName: user.name,
    currentUserEmail: user.email,
    currentUserId: user.id,
    isSessionActive: true,
    lastLoginTime: new Date().toISOString(),
  }),
  clearUser: () => set({
    currentRole: 'planner',
    currentUserName: '',
    currentUserEmail: '',
    currentUserId: '',
    currentUserDepartment: '',
    isSessionActive: false,
    lastLoginTime: null,
  }),
  
  isOffline: false,
  setOffline: (offline) => set({ isOffline: offline }),
  lastSyncTime: new Date().toISOString(),
  
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  
  activePlanId: null,
  setActivePlanId: (id) => set({ activePlanId: id }),
  
  notificationCount: 3,
  setNotificationCount: (count) => set({ notificationCount: count }),
}))

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useAppStore, type Role } from '@/store/app-store'
import { useTheme } from 'next-themes'
import { departmentSummary, maintenanceRequests } from '@/data/simulated-data'
import { toast } from 'sonner'
import {
  Settings,
  User,
  Building2,
  Wifi,
  WifiOff,
  CalendarClock,
  Palette,
  Sun,
  Moon,
  Monitor,
  Check,
  Clock,
  Save,
  Info,
  Code2,
  Shield,
  Calendar,
  FileText,
  Bell,
  BellRing,
  Mail,
  Megaphone,
  AlertTriangle,
  CheckCircle2,
  Zap,
  MoonStar,
  Eye,
  LayoutGrid,
  List,
  Pencil,
  UserPlus,
  MoreHorizontal,
  UserCheck,
  UserX,
  ShieldCheck,
  MapPin,
  LogOut,
  Search,
  Users,
} from 'lucide-react'

const USERS = [
  { id: 'u-001', name: 'Jeet', role: 'planner', department: 'Planning', status: 'active', email: 'jeet@railopt.ai' },
  { id: 'u-002', name: 'Debarshi', role: 'engineering', department: 'Engineering', status: 'active', email: 'debarshi@railopt.ai' },
  { id: 'u-003', name: 'Rupam', role: 'snt', department: 'Signal & Telecom', status: 'active', email: 'rupam@railopt.ai' },
  { id: 'u-004', name: 'Alivia', role: 'traction', department: 'Traction Distribution', status: 'active', email: 'alivia@railopt.ai' },
  { id: 'u-005', name: 'Diya', role: 'control_office', department: 'Control Office', status: 'active', email: 'diya@railopt.ai' },
  { id: 'u-006', name: 'Dhittika', role: 'admin', department: 'Administration', status: 'active', email: 'dhittika@railopt.ai' },
  { id: 'u-007', name: 'Ramesh Gupta', role: 'engineering', department: 'Engineering', status: 'active', email: 'ramesh.gupta@railway.gov.in' },
  { id: 'u-008', name: 'Sunil Yadav', role: 'traction', department: 'Traction Distribution', status: 'inactive', email: 'sunil.yadav@railway.gov.in' },
]

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin', planner: 'Planner', control_office: 'Control Office',
  engineering: 'Engineering', snt: 'S&T', traction: 'Traction',
}

const ROLE_BADGE_COLORS: Record<string, string> = {
  admin: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/50',
  planner: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800/50',
  control_office: 'bg-[#e8eaf6] text-[#0d47a1] border-[#9fa8da] dark:bg-[#1a237e]/30 dark:text-[#7986cb] dark:border-[#3f51b5]/50',
  engineering: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50',
  snt: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50',
  traction: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-800/50',
}

// ─── User management (admin) — persisted to localStorage ───
interface ManagedUser {
  id: string
  name: string
  role: string
  department: string
  status: string
  email: string
  invited?: boolean
}

const USER_OVERRIDES_KEY = 'railopt-user-overrides'
const INVITED_USERS_KEY = 'railopt-invited-users'

type UserOverride = { role?: string; status?: string }

function loadUserOverrides(): Record<string, UserOverride> {
  try {
    const raw = localStorage.getItem(USER_OVERRIDES_KEY)
    return raw ? (JSON.parse(raw) as Record<string, UserOverride>) : {}
  } catch {
    return {}
  }
}

function loadInvitedUsers(): ManagedUser[] {
  try {
    const raw = localStorage.getItem(INVITED_USERS_KEY)
    const parsed = raw ? (JSON.parse(raw) as ManagedUser[]) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const ACCENT_COLORS = [
  { name: 'Default', value: 'default', color: 'bg-blue-500' },
  { name: 'Teal', value: 'teal', color: 'bg-[#1a237e]' },
  { name: 'Emerald', value: 'emerald', color: 'bg-emerald-500' },
  { name: 'Violet', value: 'violet', color: 'bg-violet-500' },
  { name: 'Rose', value: 'rose', color: 'bg-rose-500' },
  { name: 'Amber', value: 'amber', color: 'bg-amber-500' },
]

const tabContentVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
}

export function SettingsView() {
  const { isOffline, setOffline, lastSyncTime, currentUserName, currentUserEmail, currentRole, currentUserDepartment, lastLoginTime, isSessionActive } = useAppStore()
  const [displayName, setDisplayName] = useState(currentUserName)
  const [isEditingName, setIsEditingName] = useState(false)
  const { theme, setTheme } = useTheme()
  const [systemName, setSystemName] = useState('RailOpt AI')
  const [timezone, setTimezone] = useState('Asia/Kolkata')
  const [dateFormat, setDateFormat] = useState('dd MMM yyyy')
  const [planningHorizon, setPlanningHorizon] = useState('7')
  const [optimizationMode, setOptimizationMode] = useState('balanced')
  const [conflictThreshold, setConflictThreshold] = useState('medium')
  const [accentColor, setAccentColor] = useState('default')
  const [syncInterval, setSyncInterval] = useState('5')
  const [defaultBlockDuration, setDefaultBlockDuration] = useState('4')
  const [nightBlockStart, setNightBlockStart] = useState('22:00')
  const [nightBlockEnd, setNightBlockEnd] = useState('06:00')
  const [minBufferTime, setMinBufferTime] = useState('30')
  const [activeTab, setActiveTab] = useState('general')

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(false)
  const [conflictAlerts, setConflictAlerts] = useState(true)
  const [approvalReminders, setApprovalReminders] = useState(true)
  const [optimizationCompletion, setOptimizationCompletion] = useState(true)
  const [overdueAlerts, setOverdueAlerts] = useState(true)
  const [quietFrom, setQuietFrom] = useState('22:00')
  const [quietTo, setQuietTo] = useState('07:00')

  // Display preferences
  const [compactMode, setCompactMode] = useState(false)
  const [animationEnabled, setAnimationEnabled] = useState(true)
  const [defaultView, setDefaultView] = useState('dashboard')
  const [itemsPerPage, setItemsPerPage] = useState('25')

  // ─── User management state ───
  const [userOverrides, setUserOverrides] = useState<Record<string, UserOverride>>({})
  const [invitedUsers, setInvitedUsers] = useState<ManagedUser[]>([])
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('engineering')
  const [inviteDept, setInviteDept] = useState('Engineering')
  const [userSearch, setUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('all')

  // Load persisted user management data on mount (async hydration to avoid render cascade)
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const overrides = loadUserOverrides()
        if (Object.keys(overrides).length > 0) {
          setUserOverrides(overrides)
        }
        const invited = loadInvitedUsers()
        if (invited.length > 0) {
          setInvitedUsers(invited)
        }
      } catch {
        // ignore malformed persisted data
      }
    }, 0)
    return () => clearTimeout(t)
  }, [])

  // Merge base users + invited users, then apply overrides
  const managedUsers: ManagedUser[] = [...USERS, ...invitedUsers].map((u) => {
    const o = userOverrides[u.id]
    return o ? { ...u, role: o.role ?? u.role, status: o.status ?? u.status } : u
  })

  const visibleUsers = managedUsers.filter((u) => {
    if (userRoleFilter !== 'all' && u.role !== userRoleFilter) return false
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase()
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    }
    return true
  })

  const persistOverrides = (next: Record<string, UserOverride>) => {
    setUserOverrides(next)
    try { localStorage.setItem(USER_OVERRIDES_KEY, JSON.stringify(next)) } catch { /* noop */ }
  }

  const handleRoleChange = (userId: string, userName: string, role: string) => {
    persistOverrides({ ...userOverrides, [userId]: { ...userOverrides[userId], role } })
    toast.success(`${userName} is now ${ROLE_LABELS[role] ?? role}`, {
      description: 'Role change takes effect on their next sign-in.',
    })
  }

  const handleToggleStatus = (userId: string, userName: string, current: string) => {
    const next = current === 'active' ? 'inactive' : 'active'
    persistOverrides({ ...userOverrides, [userId]: { ...userOverrides[userId], status: next } })
    if (next === 'inactive') {
      toast.warning(`${userName} deactivated`, { description: 'Their access will be suspended on next sign-in.' })
    } else {
      toast.success(`${userName} reactivated`, { description: 'Access restored.' })
    }
  }

  const handleInviteUser = () => {
    const name = inviteName.trim()
    const email = inviteEmail.trim().toLowerCase()
    if (!name || !email) {
      toast.error('Name and email are required')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Enter a valid email address')
      return
    }
    if (managedUsers.some((u) => u.email.toLowerCase() === email)) {
      toast.error('A user with this email already exists')
      return
    }
    const user: ManagedUser = {
      id: `invited-${Date.now()}`,
      name,
      email,
      role: inviteRole,
      department: inviteDept,
      status: 'active',
      invited: true,
    }
    const next = [user, ...invitedUsers]
    setInvitedUsers(next)
    try { localStorage.setItem(INVITED_USERS_KEY, JSON.stringify(next)) } catch { /* noop */ }
    setInviteOpen(false)
    setInviteName('')
    setInviteEmail('')
    toast.success(`Invitation sent to ${name}`, {
      description: `${email} · ${ROLE_LABELS[inviteRole] ?? inviteRole} · on first sign-in they set a password.`,
    })
  }

  const deptRequestCounts = departmentSummary.map(d => ({
    ...d,
    requestCount: maintenanceRequests.filter(m => m.department === d.code).length,
  }))

  // Load persisted settings on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('railopt-settings')
      if (!raw) return
      const saved = JSON.parse(raw) as Record<string, string | boolean>
      if (typeof saved.systemName === 'string') setSystemName(saved.systemName)
      if (typeof saved.timezone === 'string') setTimezone(saved.timezone)
      if (typeof saved.dateFormat === 'string') setDateFormat(saved.dateFormat)
      if (typeof saved.planningHorizon === 'string') setPlanningHorizon(saved.planningHorizon)
      if (typeof saved.optimizationMode === 'string') setOptimizationMode(saved.optimizationMode)
      if (typeof saved.conflictThreshold === 'string') setConflictThreshold(saved.conflictThreshold)
      if (typeof saved.accentColor === 'string') setAccentColor(saved.accentColor)
      if (typeof saved.syncInterval === 'string') setSyncInterval(saved.syncInterval)
      if (typeof saved.defaultBlockDuration === 'string') setDefaultBlockDuration(saved.defaultBlockDuration)
      if (typeof saved.nightBlockStart === 'string') setNightBlockStart(saved.nightBlockStart)
      if (typeof saved.nightBlockEnd === 'string') setNightBlockEnd(saved.nightBlockEnd)
      if (typeof saved.minBufferTime === 'string') setMinBufferTime(saved.minBufferTime)
      if (typeof saved.emailNotifications === 'boolean') setEmailNotifications(saved.emailNotifications)
      if (typeof saved.pushNotifications === 'boolean') setPushNotifications(saved.pushNotifications)
      if (typeof saved.conflictAlerts === 'boolean') setConflictAlerts(saved.conflictAlerts)
      if (typeof saved.approvalReminders === 'boolean') setApprovalReminders(saved.approvalReminders)
      if (typeof saved.optimizationCompletion === 'boolean') setOptimizationCompletion(saved.optimizationCompletion)
      if (typeof saved.overdueAlerts === 'boolean') setOverdueAlerts(saved.overdueAlerts)
      if (typeof saved.quietFrom === 'string') setQuietFrom(saved.quietFrom)
      if (typeof saved.quietTo === 'string') setQuietTo(saved.quietTo)
      if (typeof saved.compactMode === 'boolean') setCompactMode(saved.compactMode)
      if (typeof saved.animationEnabled === 'boolean') setAnimationEnabled(saved.animationEnabled)
      if (typeof saved.defaultView === 'string') setDefaultView(saved.defaultView)
      if (typeof saved.itemsPerPage === 'string') setItemsPerPage(saved.itemsPerPage)
    } catch {
      // Ignore malformed persisted settings
    }
  }, [])

  const handleSave = (tabName: string) => {
    try {
      const settings: Record<string, string | boolean> = {
        systemName, timezone, dateFormat, planningHorizon, optimizationMode, conflictThreshold,
        accentColor, syncInterval, defaultBlockDuration, nightBlockStart, nightBlockEnd, minBufferTime,
        emailNotifications, pushNotifications, conflictAlerts, approvalReminders, optimizationCompletion,
        overdueAlerts, quietFrom, quietTo, compactMode, animationEnabled, defaultView, itemsPerPage,
      }
      localStorage.setItem('railopt-settings', JSON.stringify(settings))
      toast.success(`${tabName} settings saved`, {
        description: 'Your changes have been applied and persisted.',
      })
    } catch {
      toast.error('Could not save settings', { description: 'Local storage is unavailable in this browser.' })
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-3 px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted shrink-0">
          <Settings className="w-5 h-5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">System configuration and preferences</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 px-4 sm:px-6 pb-4 sm:pb-6 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          {/* Scrollable tabs on mobile — shrink-0 prevents flex from collapsing the strip when panel content is tall */}
          <div className="overflow-x-auto shrink-0 -mx-4 px-4 sm:mx-0 sm:px-0 mb-4">
            <TabsList className="h-9">
              <TabsTrigger value="profile" className="text-xs whitespace-nowrap gap-1"><User className="h-3 w-3 hidden sm:inline" />Profile</TabsTrigger>
              <TabsTrigger value="general" className="text-xs whitespace-nowrap">General</TabsTrigger>
              <TabsTrigger value="notifications" className="text-xs whitespace-nowrap gap-1"><Bell className="h-3 w-3 hidden sm:inline" />Notifications</TabsTrigger>
              <TabsTrigger value="users" className="text-xs whitespace-nowrap">Users</TabsTrigger>
              <TabsTrigger value="departments" className="text-xs whitespace-nowrap">Departments</TabsTrigger>
              <TabsTrigger value="connectivity" className="text-xs whitespace-nowrap">Connectivity</TabsTrigger>
              <TabsTrigger value="planning" className="text-xs whitespace-nowrap">Planning</TabsTrigger>
              <TabsTrigger value="theme" className="text-xs whitespace-nowrap">Theme</TabsTrigger>
              <TabsTrigger value="about" className="text-xs whitespace-nowrap">About</TabsTrigger>
            </TabsList>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div key="profile" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
                <TabsContent value="profile" className="mt-0 space-y-4">
                  {/* Profile Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Profile</CardTitle>
                      <CardDescription className="text-xs">Your account information and preferences</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        {/* Avatar */}
                        <div className="relative">
                          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#1a237e]/10 dark:bg-[#60a5fa]/10 border-2 border-[#1a237e]/20 dark:border-[#60a5fa]/20">
                            <span className="text-xl font-bold text-[#1a237e] dark:text-[#60a5fa]">
                              {(displayName || 'U').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                            </span>
                          </div>
                          <div className="absolute -bottom-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 border-2 border-background">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </div>
                        </div>
                        {/* Name + Editable */}
                        <div className="flex-1 min-w-0 space-y-1">
                          {isEditingName ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="h-8 text-sm w-full sm:max-w-xs"
                                aria-label="Display name"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs gap-1"
                                onClick={() => {
                                  setIsEditingName(false)
                                  toast.success('Display name updated')
                                }}
                              >
                                <Check className="w-3 h-3" />
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-xs"
                                onClick={() => {
                                  setDisplayName(currentUserName)
                                  setIsEditingName(false)
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-semibold text-foreground">{displayName || 'User'}</h3>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => setIsEditingName(true)}
                                aria-label="Edit display name"
                              >
                                <Pencil className="w-3 h-3 text-muted-foreground" />
                              </Button>
                            </div>
                          )}
                          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5" />
                            {currentUserEmail || 'No email on file'}
                          </p>
                        </div>
                      </div>

                      <Separator />

                      {/* User Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Role</Label>
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-muted-foreground" />
                            <Badge variant="outline" className="text-xs">
                              {ROLE_LABELS[currentRole] || currentRole}
                            </Badge>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Department</Label>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{currentUserDepartment || 'Not assigned'}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Session Status</Label>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isSessionActive ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} aria-hidden="true" />
                            <span className="text-sm">{isSessionActive ? 'Active' : 'Inactive'}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Last Login</Label>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">
                              {lastLoginTime
                                ? new Date(lastLoginTime).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                : 'N/A'
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Session Info Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Session Information</CardTitle>
                      <CardDescription className="text-xs">Current session details and security</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">User ID</p>
                          <p className="font-mono text-xs text-foreground">{useAppStore.getState().currentUserId || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Authentication</p>
                          <p className="text-xs text-foreground flex items-center gap-1">
                            <Shield className="w-3 h-3 text-emerald-500" />
                            Government SSO
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Timezone</p>
                          <p className="text-xs text-foreground">Asia/Kolkata (IST)</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </motion.div>
            )}

            {activeTab === 'general' && (
              <motion.div key="general" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
                <TabsContent value="general" className="mt-0 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">General Settings</CardTitle>
                      <CardDescription className="text-xs">Basic system configuration</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="system-name" className="text-xs">System Name</Label>
                        <Input id="system-name" value={systemName} onChange={(e) => setSystemName(e.target.value)} className="h-9 sm:h-8 text-sm w-full sm:max-w-md" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="timezone" className="text-xs">Timezone</Label>
                        <Select value={timezone} onValueChange={setTimezone}>
                          <SelectTrigger className="w-full sm:w-[280px] h-9 sm:h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</SelectItem>
                            <SelectItem value="UTC">UTC</SelectItem>
                            <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                            <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date-format" className="text-xs">Date Format</Label>
                        <Select value={dateFormat} onValueChange={setDateFormat}>
                          <SelectTrigger className="w-full sm:w-[200px] h-9 sm:h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dd MMM yyyy">27 Jan 2025</SelectItem>
                            <SelectItem value="yyyy-MM-dd">2025-01-27</SelectItem>
                            <SelectItem value="MM/dd/yyyy">01/27/2025</SelectItem>
                            <SelectItem value="dd/MM/yyyy">27/01/2025</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2">
                      <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => handleSave('General')}>
                        <Save className="w-3.5 h-3.5" />
                        Save Changes
                      </Button>
                    </CardFooter>
                  </Card>

                  {/* Display Sub-section */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-sm">Display</CardTitle>
                      </div>
                      <CardDescription className="text-xs">Interface and layout preferences</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Compact mode */}
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <div className="flex items-center gap-3">
                          <LayoutGrid className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-sm font-medium">Compact Mode</p>
                            <p className="text-xs text-muted-foreground">Reduce padding and spacing for denser layouts</p>
                          </div>
                        </div>
                        <Switch checked={compactMode} onCheckedChange={setCompactMode} />
                      </div>

                      {/* Animation toggle */}
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <div className="flex items-center gap-3">
                          <Zap className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-sm font-medium">Animations</p>
                            <p className="text-xs text-muted-foreground">Enable smooth transitions and motion effects</p>
                          </div>
                        </div>
                        <Switch checked={animationEnabled} onCheckedChange={setAnimationEnabled} />
                      </div>

                      <Separator />

                      {/* Default view */}
                      <div className="space-y-2">
                        <Label htmlFor="default-view" className="text-xs">Default View</Label>
                        <Select value={defaultView} onValueChange={setDefaultView}>
                          <SelectTrigger className="w-full sm:w-[200px] h-9 sm:h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dashboard">Dashboard</SelectItem>
                            <SelectItem value="planning">Planning</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-[10px] text-muted-foreground">View shown when the application loads</p>
                      </div>

                      {/* Items per page */}
                      <div className="space-y-2">
                        <Label htmlFor="items-per-page" className="text-xs">Items Per Page</Label>
                        <Select value={itemsPerPage} onValueChange={setItemsPerPage}>
                          <SelectTrigger className="w-full sm:w-[200px] h-9 sm:h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-[10px] text-muted-foreground">Number of items shown per page in list views</p>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2">
                      <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => handleSave('Display')}>
                        <Save className="w-3.5 h-3.5" />
                        Save Changes
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div key="notifications" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
                <TabsContent value="notifications" className="mt-0 space-y-4">
                  {/* Notification Channels */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <BellRing className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-sm">Notification Channels</CardTitle>
                      </div>
                      <CardDescription className="text-xs">How you receive notifications</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-sm font-medium">Email Notifications</p>
                            <p className="text-xs text-muted-foreground">Receive alerts and updates via email</p>
                          </div>
                        </div>
                        <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <div className="flex items-center gap-3">
                          <Megaphone className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-sm font-medium">Push Notifications</p>
                            <p className="text-xs text-muted-foreground">Receive browser push notifications</p>
                          </div>
                        </div>
                        <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Notification Types */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-sm">Notification Types</CardTitle>
                      </div>
                      <CardDescription className="text-xs">Choose which events trigger notifications</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                          <div>
                            <p className="text-sm font-medium">Conflict Alerts</p>
                            <p className="text-xs text-muted-foreground">Alert when train or department conflicts are detected</p>
                          </div>
                        </div>
                        <Switch checked={conflictAlerts} onCheckedChange={setConflictAlerts} />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          <div>
                            <p className="text-sm font-medium">Approval Reminders</p>
                            <p className="text-xs text-muted-foreground">Remind when blocks or plans await your approval</p>
                          </div>
                        </div>
                        <Switch checked={approvalReminders} onCheckedChange={setApprovalReminders} />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <div className="flex items-center gap-3">
                          <Zap className="h-4 w-4 text-[#1a237e] shrink-0" />
                          <div>
                            <p className="text-sm font-medium">Optimization Completion</p>
                            <p className="text-xs text-muted-foreground">Notify when AI optimization finishes running</p>
                          </div>
                        </div>
                        <Switch checked={optimizationCompletion} onCheckedChange={setOptimizationCompletion} />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-red-500 shrink-0" />
                          <div>
                            <p className="text-sm font-medium">Overdue Alerts</p>
                            <p className="text-xs text-muted-foreground">Alert when maintenance requests become overdue</p>
                          </div>
                        </div>
                        <Switch checked={overdueAlerts} onCheckedChange={setOverdueAlerts} />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quiet Hours */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <MoonStar className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-sm">Quiet Hours</CardTitle>
                      </div>
                      <CardDescription className="text-xs">Suppress non-critical notifications during specified hours</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="quiet-from" className="text-xs">From</Label>
                          <Input
                            id="quiet-from"
                            type="time"
                            value={quietFrom}
                            onChange={(e) => setQuietFrom(e.target.value)}
                            className="h-9 sm:h-8 text-sm w-full sm:w-[160px]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="quiet-to" className="text-xs">To</Label>
                          <Input
                            id="quiet-to"
                            type="time"
                            value={quietTo}
                            onChange={(e) => setQuietTo(e.target.value)}
                            className="h-9 sm:h-8 text-sm w-full sm:w-[160px]"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                        <MoonStar className="h-3 w-3" />
                        Critical alerts (safety violations, critical conflicts) will still be delivered during quiet hours.
                      </p>
                    </CardContent>
                    <CardFooter className="pt-2">
                      <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => handleSave('Notification')}>
                        <Save className="w-3.5 h-3.5" />
                        Save Preferences
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
              </motion.div>
            )}

            {activeTab === 'users' && (
              <motion.div key="users" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
                <TabsContent value="users" className="mt-0">
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <CardTitle className="text-sm">User Management</CardTitle>
                          <CardDescription className="text-xs">{managedUsers.length} users · manage roles and access</CardDescription>
                        </div>
                        <Button size="sm" className="h-8 text-xs gap-1.5 shrink-0" onClick={() => setInviteOpen(true)}>
                          <UserPlus className="w-3.5 h-3.5" />
                          Invite User
                        </Button>
                      </div>
                      {/* Search + role filter */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-1">
                        <div className="relative flex-1">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            placeholder="Search by name or email…"
                            className="h-9 pl-8 text-xs"
                            aria-label="Search users"
                          />
                        </div>
                        <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                          <SelectTrigger className="w-full sm:w-[160px] h-9 text-xs">
                            <SelectValue placeholder="All roles" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            {Object.entries(ROLE_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/40">
                              <TableHead className="text-[11px] font-semibold h-8">Name</TableHead>
                              <TableHead className="text-[11px] font-semibold h-8">Role</TableHead>
                              <TableHead className="text-[11px] font-semibold h-8 hidden sm:table-cell">Department</TableHead>
                              <TableHead className="text-[11px] font-semibold h-8 hidden md:table-cell">Email</TableHead>
                              <TableHead className="text-[11px] font-semibold h-8">Status</TableHead>
                              <TableHead className="text-[11px] font-semibold h-8 text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {visibleUsers.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-6">
                                  No users match your search.
                                </TableCell>
                              </TableRow>
                            )}
                            {visibleUsers.map((user) => (
                              <TableRow key={user.id} className="hover:bg-muted/30">
                                <TableCell className="text-xs font-medium py-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground shrink-0">
                                      {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </div>
                                    <div className="min-w-0">
                                      <span className="truncate block flex items-center gap-1">
                                        {user.name}
                                        {user.invited && (
                                          <Badge variant="outline" className="text-[8px] px-1 py-0 h-3 border-[#fdba74] text-[#c2570b] bg-[#fff7ed] dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800 shrink-0">NEW</Badge>
                                        )}
                                      </span>
                                      <span className="text-muted-foreground block sm:hidden text-[10px]">{user.department}</span>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="py-2">
                                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${ROLE_BADGE_COLORS[user.role] ?? ''}`}>
                                    {ROLE_LABELS[user.role] ?? user.role}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs py-2 hidden sm:table-cell">{user.department}</TableCell>
                                <TableCell className="text-xs py-2 text-muted-foreground hidden md:table-cell">{user.email}</TableCell>
                                <TableCell className="py-2">
                                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${
                                    user.status === 'active'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50'
                                      : 'bg-muted/50 text-muted-foreground border-border'
                                  }`}>
                                    {user.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="py-2 text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        aria-label={`Manage ${user.name}`}
                                      >
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-44">
                                      <DropdownMenuSub>
                                        <DropdownMenuSubTrigger className="text-xs gap-2">
                                          <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                                          Change Role
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuSubContent className="w-44">
                                          {Object.entries(ROLE_LABELS).map(([value, label]) => (
                                            <DropdownMenuItem
                                              key={value}
                                              className="text-xs gap-2"
                                              disabled={user.role === value}
                                              onClick={() => handleRoleChange(user.id, user.name, value)}
                                            >
                                              {user.role === value && <Check className="h-3 w-3 text-primary" />}
                                              {label}
                                            </DropdownMenuItem>
                                          ))}
                                        </DropdownMenuSubContent>
                                      </DropdownMenuSub>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-xs gap-2"
                                        onClick={() => handleToggleStatus(user.id, user.name, user.status)}
                                      >
                                        {user.status === 'active' ? (
                                          <>
                                            <UserX className="h-3.5 w-3.5 text-red-500" />
                                            <span className="text-red-600 dark:text-red-400">Deactivate</span>
                                          </>
                                        ) : (
                                          <>
                                            <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                                            <span className="text-emerald-600 dark:text-emerald-400">Activate</span>
                                          </>
                                        )}
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2 justify-between">
                      <span className="text-[10px] text-muted-foreground">
                        Showing {visibleUsers.length} of {managedUsers.length} users · changes persist on this device
                      </span>
                      <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => handleSave('User')}>
                        <Save className="w-3.5 h-3.5" />
                        Save Changes
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
              </motion.div>
            )}

            {activeTab === 'departments' && (
              <motion.div key="departments" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
                <TabsContent value="departments" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Departments</CardTitle>
                      <CardDescription className="text-xs">Department overview and request distribution</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {deptRequestCounts.map((dept) => (
                          <div key={dept.code} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-border transition-colors">
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: dept.color }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">{dept.department}</p>
                              <p className="text-xs text-muted-foreground">{dept.code.toUpperCase()}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="text-sm font-semibold tabular-nums">{dept.requestCount}</p>
                                <p className="text-[10px] text-muted-foreground">requests</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold tabular-nums">{dept.assigned}</p>
                                <p className="text-[10px] text-muted-foreground">assigned</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2">
                      <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => handleSave('Department')}>
                        <Save className="w-3.5 h-3.5" />
                        Save Changes
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
              </motion.div>
            )}

            {activeTab === 'connectivity' && (
              <motion.div key="connectivity" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
                <TabsContent value="connectivity" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Connectivity</CardTitle>
                      <CardDescription className="text-xs">Online/offline mode and synchronization</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <div className="flex items-center gap-3">
                          {isOffline ? <WifiOff className="w-5 h-5 text-amber-500" /> : <Wifi className="w-5 h-5 text-emerald-500" />}
                          <div>
                            <p className="text-sm font-medium">Mode</p>
                            <p className="text-xs text-muted-foreground">
                              {isOffline ? 'Offline — changes sync when online' : 'Online — real-time sync active'}
                            </p>
                          </div>
                        </div>
                        <Switch checked={!isOffline} onCheckedChange={(checked) => setOffline(!checked)} />
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <Label className="text-xs">Last Sync Time</Label>
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {lastSyncTime ? new Date(lastSyncTime).toLocaleString() : 'Never'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sync-interval" className="text-xs">Sync Interval</Label>
                        <Select value={syncInterval} onValueChange={setSyncInterval}>
                          <SelectTrigger className="w-full sm:w-[200px] h-9 sm:h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Every 1 minute</SelectItem>
                            <SelectItem value="5">Every 5 minutes</SelectItem>
                            <SelectItem value="15">Every 15 minutes</SelectItem>
                            <SelectItem value="30">Every 30 minutes</SelectItem>
                            <SelectItem value="60">Every 60 minutes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2">
                      <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => handleSave('Connectivity')}>
                        <Save className="w-3.5 h-3.5" />
                        Save Changes
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
              </motion.div>
            )}

            {activeTab === 'planning' && (
              <motion.div key="planning" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
                <TabsContent value="planning" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Planning Parameters</CardTitle>
                      <CardDescription className="text-xs">Default settings for block plan optimization</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="planning-horizon" className="text-xs">Default Planning Horizon</Label>
                        <Select value={planningHorizon} onValueChange={setPlanningHorizon}>
                          <SelectTrigger className="w-full sm:w-[200px] h-9 sm:h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7">7 days (Weekly)</SelectItem>
                            <SelectItem value="14">14 days</SelectItem>
                            <SelectItem value="30">30 days (Monthly)</SelectItem>
                            <SelectItem value="90">90 days (Quarterly)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="optimization-mode" className="text-xs">Optimization Mode</Label>
                        <Select value={optimizationMode} onValueChange={setOptimizationMode}>
                          <SelectTrigger className="w-full sm:w-[200px] h-9 sm:h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="aggressive">Aggressive — Maximize block utilization</SelectItem>
                            <SelectItem value="balanced">Balanced — Equal weight to all factors</SelectItem>
                            <SelectItem value="conservative">Conservative — Prioritize safety margins</SelectItem>
                          </SelectContent>
                          <p className="text-[10px] text-muted-foreground mt-1.5">
                            {optimizationMode === 'aggressive' && 'Tries to pack maximum maintenance into available windows. May increase conflicts.'}
                            {optimizationMode === 'balanced' && 'Balances utilization, safety, and train disruption equally.'}
                            {optimizationMode === 'conservative' && 'Ensures large safety buffers. May reduce total blocks scheduled.'}
                          </p>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="conflict-threshold" className="text-xs">Conflict Alert Threshold</Label>
                        <Select value={conflictThreshold} onValueChange={setConflictThreshold}>
                          <SelectTrigger className="w-full sm:w-[200px] h-9 sm:h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low — Alert on all conflicts</SelectItem>
                            <SelectItem value="medium">Medium — Alert on warning and critical</SelectItem>
                            <SelectItem value="high">High — Alert on critical only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Separator />

                      {/* New Planning Settings */}
                      <div className="space-y-2">
                        <Label htmlFor="default-block-duration" className="text-xs">Default Block Duration</Label>
                        <Select value={defaultBlockDuration} onValueChange={setDefaultBlockDuration}>
                          <SelectTrigger className="w-full sm:w-[200px] h-9 sm:h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2">2 hours</SelectItem>
                            <SelectItem value="3">3 hours</SelectItem>
                            <SelectItem value="4">4 hours</SelectItem>
                            <SelectItem value="6">6 hours</SelectItem>
                            <SelectItem value="8">8 hours</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-[10px] text-muted-foreground">Default duration assigned to new maintenance blocks</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="night-block-start" className="text-xs">Night Block Start Time</Label>
                          <Input
                            id="night-block-start"
                            type="time"
                            value={nightBlockStart}
                            onChange={(e) => setNightBlockStart(e.target.value)}
                            className="h-9 sm:h-8 text-sm w-full sm:w-[160px]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="night-block-end" className="text-xs">Night Block End Time</Label>
                          <Input
                            id="night-block-end"
                            type="time"
                            value={nightBlockEnd}
                            onChange={(e) => setNightBlockEnd(e.target.value)}
                            className="h-9 sm:h-8 text-sm w-full sm:w-[160px]"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground">Preferred window for scheduling maintenance blocks with lower traffic impact</p>

                      <div className="space-y-2">
                        <Label htmlFor="min-buffer-time" className="text-xs">Minimum Buffer Time (minutes)</Label>
                        <Select value={minBufferTime} onValueChange={setMinBufferTime}>
                          <SelectTrigger className="w-full sm:w-[200px] h-9 sm:h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 minutes</SelectItem>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="45">45 minutes</SelectItem>
                            <SelectItem value="60">60 minutes</SelectItem>
                            <SelectItem value="90">90 minutes</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-[10px] text-muted-foreground">Minimum gap between a block and the nearest scheduled train</p>
                      </div>

                      <Separator />
                      <div className="space-y-2">
                        <Label className="text-xs">Constraint Rules</Label>
                        <div className="space-y-2">
                          {[
                            { label: 'Min buffer between block and train', value: `${minBufferTime} min` },
                            { label: 'Maximum block duration', value: `${defaultBlockDuration} hours` },
                            { label: 'Combined block for same section', value: 'Auto' },
                            { label: 'Overlap detection', value: 'Strict' },
                            { label: `Night block preference (${nightBlockStart}-${nightBlockEnd})`, value: 'Enabled' },
                          ].map((rule, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 rounded-md border border-border/50 gap-2">
                              <span className="text-xs text-foreground/80 truncate">{rule.label}</span>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-muted/50 shrink-0">
                                {rule.value}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2">
                      <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => handleSave('Planning')}>
                        <Save className="w-3.5 h-3.5" />
                        Save Changes
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
              </motion.div>
            )}

            {activeTab === 'theme' && (
              <motion.div key="theme" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
                <TabsContent value="theme" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Theme & Appearance</CardTitle>
                      <CardDescription className="text-xs">Customize the look and feel</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="space-y-2">
                        <Label className="text-xs">Mode</Label>
                        <div className="grid grid-cols-3 gap-2 max-w-sm">
                          {([
                            { value: 'light', icon: Sun, label: 'Light' },
                            { value: 'dark', icon: Moon, label: 'Dark' },
                            { value: 'system', icon: Monitor, label: 'System' },
                          ] as const).map(({ value, icon: Icon, label }) => (
                            <button
                              key={value}
                              onClick={() => setTheme(value)}
                              className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-colors min-h-[44px] ${
                                theme === value ? 'border-primary bg-primary/5' : 'border-border hover:border-border'
                              }`}
                            >
                              <Icon className="w-5 h-5" />
                              <span className="text-xs font-medium">{label}</span>
                              {theme === value && <Check className="w-3 h-3 text-primary" />}
                            </button>
                          ))}
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <Label className="text-xs">Accent Color</Label>
                        <div className="flex items-center gap-2 flex-wrap">
                          {ACCENT_COLORS.map((color) => (
                            <button
                              key={color.value}
                              onClick={() => setAccentColor(color.value)}
                              className={`flex items-center justify-center w-10 h-10 min-h-[44px] min-w-[44px] rounded-full ${color.color} transition-all ${
                                accentColor === color.value
                                  ? 'ring-2 ring-offset-2 ring-muted-foreground scale-110'
                                  : 'hover:scale-105'
                              }`}
                            >
                              {accentColor === color.value && (
                                <Check className="h-3.5 w-3.5 text-white" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2">
                      <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => handleSave('Theme')}>
                        <Save className="w-3.5 h-3.5" />
                        Save Changes
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
              </motion.div>
            )}

            {activeTab === 'about' && (
              <motion.div key="about" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
                <TabsContent value="about" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">About RailOpt AI</CardTitle>
                      <CardDescription className="text-xs">System information and version details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {/* Version info */}
                      <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 border border-border">
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 shrink-0">
                          <Settings className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">RailOpt AI</h3>
                          <p className="text-xs text-muted-foreground">AI-Powered Railway Maintenance Block Optimizer</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {[
                          { icon: Info, label: 'Version', value: '1.0.0 (MVP)' },
                          { icon: Calendar, label: 'Build Date', value: '2025-01-27' },
                          { icon: Shield, label: 'License', value: 'Indian Railways — Internal Use Only' },
                          { icon: Code2, label: 'Tech Stack', value: 'Next.js 16 · TypeScript · Tailwind CSS · Prisma' },
                          { icon: FileText, label: 'UI Framework', value: 'shadcn/ui · Radix · Framer Motion' },
                          { icon: Building2, label: 'Database', value: 'SQLite (via Prisma ORM)' },
                        ].map(({ icon: Icon, label, value }, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border border-border/50">
                            <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
                              <p className="text-xs text-foreground mt-0.5">{value}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <Separator />

                      <div className="p-3 rounded-lg border border-border/50">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Description</p>
                        <p className="text-xs text-foreground/80 leading-relaxed">
                          RailOpt AI is an intelligent maintenance block planning system for Indian Railways. 
                          It uses AI-driven optimization to recommend maintenance block schedules, detect conflicts 
                          with train timetables, and support multi-department coordination for safe and efficient 
                          railway operations.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Tabs>
      </div>

      {/* Invite User Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-primary" />
              Invite User
            </DialogTitle>
            <DialogDescription className="text-xs">
              Send an access invitation. They will set a password on first sign-in and appear in the directory below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3.5 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="invite-name" className="text-xs font-medium">Full Name <span className="text-red-500">*</span></Label>
              <Input
                id="invite-name"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="e.g. Aarav Das"
                className="text-sm h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-email" className="text-xs font-medium">Official Email <span className="text-red-500">*</span></Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="name@railway.gov.in"
                className="text-sm h-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Department</Label>
                <Select value={inviteDept} onValueChange={setInviteDept}>
                  <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planning">Planning</SelectItem>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Signal & Telecom">Signal & Telecom</SelectItem>
                    <SelectItem value="Traction Distribution">Traction Distribution</SelectItem>
                    <SelectItem value="Control Office">Control Office</SelectItem>
                    <SelectItem value="Administration">Administration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleInviteUser} className="gap-1.5">
              <UserPlus className="h-3.5 w-3.5" />
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

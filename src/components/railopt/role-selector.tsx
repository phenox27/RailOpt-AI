'use client'

import { useAppStore, type Role } from '@/store/app-store'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, Shield, FlaskConical } from 'lucide-react'

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  planner: 'Planner',
  control_office: 'Control Office',
  engineering: 'Engineering',
  snt: 'S&T',
  traction: 'Traction',
}

const ROLE_COLORS: Record<Role, string> = {
  admin: 'bg-destructive text-white',
  planner: 'bg-primary text-primary-foreground',
  control_office: 'bg-rail-info text-white',
  engineering: 'bg-rail-success text-white',
  snt: 'bg-rail-warning text-white',
  traction: 'bg-secondary text-secondary-foreground',
}

// In production, role switching is locked to the authenticated role.
// In demo/dev mode, a flag allows switching for testing.
const isDemoMode = process.env.NODE_ENV !== 'production'

export function RoleSelector() {
  const { currentRole, setCurrentRole } = useAppStore()

  // Read-only mode in production — role comes from auth session
  if (!isDemoMode) {
    return (
      <div className="w-full px-2 h-9 flex items-center gap-2 text-sm">
        <Shield className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate">Role: {ROLE_LABELS[currentRole]}</span>
        <Badge className={`${ROLE_COLORS[currentRole]} text-[10px] px-1.5 py-0 ml-auto`}>
          {ROLE_LABELS[currentRole]}
        </Badge>
      </div>
    )
  }

  // Demo mode: switchable role selector for testing
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between gap-2 px-2 h-9 text-sm"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Shield className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">Role: {ROLE_LABELS[currentRole]}</span>
          </div>
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuLabel className="flex items-center gap-1.5">
          <FlaskConical className="size-3.5 text-amber-500" />
          Select Role
          <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 ml-auto border-amber-400 text-amber-600">
            Demo
          </Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(Object.keys(ROLE_LABELS) as Role[]).map((role) => (
          <DropdownMenuItem
            key={role}
            onClick={() => setCurrentRole(role)}
            className="flex items-center justify-between gap-2"
          >
            <span>{ROLE_LABELS[role]}</span>
            {role === currentRole && (
              <Badge className={`${ROLE_COLORS[role]} text-[10px] px-1.5 py-0`}>
                Active
              </Badge>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

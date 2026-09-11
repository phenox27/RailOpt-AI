'use client'

import { useSession } from 'next-auth/react'
import { signOut } from 'next-auth/react'
import { useAppStore, type Role } from '@/store/app-store'
import { SignInForm } from './sign-in-form'
import { Loader2 } from 'lucide-react'

// Map NextAuth role to Zustand role
const ROLE_MAP: Record<string, Role> = {
  admin: 'admin',
  planner: 'planner',
  control_office: 'control_office',
  engineering: 'engineering',
  snt: 'snt',
  traction: 'traction',
}

// Map NextAuth name to display name
const NAME_MAP: Record<string, string> = {
  'user-admin': 'Dhittika',
  'user-planner': 'Jeet',
  'user-control': 'Diya',
  'user-engineering': 'Debarshi',
  'user-snt': 'Rupam',
  'user-traction': 'Alivia',
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()

  // When session loads, update the store with the user's role
  if (status === 'authenticated' && session?.user) {
    const role = (session.user as { role?: string }).role
    const id = (session.user as { id?: string }).id
    if (role && ROLE_MAP[role]) {
      // Use a microtask to avoid setState during render
      queueMicrotask(() => {
        const store = useAppStore.getState()
        if (!store.isSessionActive) {
          useAppStore.getState().setUserFromSession({
            role: ROLE_MAP[role],
            name: NAME_MAP[id || ''] || session.user.name || 'User',
            email: session.user.email || '',
            id: id || '',
          })
        }
      })
    }
  }

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#283593] mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading RailOpt AI...</p>
        </div>
      </div>
    )
  }

  // Not authenticated — show sign in form
  if (status === 'unauthenticated') {
    return <SignInForm />
  }

  // Authenticated — show the app
  return <>{children}</>
}

// Sign out helper
export function handleSignOut() {
  useAppStore.getState().clearUser()
  signOut({ callbackUrl: '/' })
}

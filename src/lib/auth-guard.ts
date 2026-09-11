import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

/**
 * Require authentication for an API route.
 * Returns the session if authenticated, or null if not.
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null
  return session
}

/**
 * Require a specific role for an API route.
 * Returns the role if allowed, or null if forbidden.
 */
export function requireRole(session: { user?: Record<string, unknown> }, allowedRoles: string[]) {
  const role = (session.user as Record<string, unknown>)?.role as string | undefined
  if (!role || !allowedRoles.includes(role)) return null
  return role
}

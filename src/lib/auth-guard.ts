import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

/**
 * Emails that belong to the fixed demo team + seeded staff accounts.
 * These rows must never be deleted or re-assigned via the /api/users
 * management endpoints — only *invited* users are fully manageable.
 */
export const PROTECTED_USER_EMAILS = new Set([
  // Demo team (sign-in screen — Dhittika, Jeet, Diya, Debarshi, Rupam, Alivia)
  'admin@railopt.ai',
  'planner@railopt.ai',
  'control@railopt.ai',
  'engineering@railopt.ai',
  'snt@railopt.ai',
  'traction@railopt.ai',
  // Seeded department staff
  'eng-anil@railopt.ai',
  'eng-ramesh@railopt.ai',
  'snt-priya@railopt.ai',
  'snt-amit@railopt.ai',
  'trac-vikram@railopt.ai',
  'trac-sunil@railopt.ai',
  'planner-rk@railopt.ai',
  'control-office@railopt.ai',
])

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

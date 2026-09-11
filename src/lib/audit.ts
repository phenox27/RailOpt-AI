import { db } from '@/lib/db'
import type { Session } from 'next-auth'

/**
 * Server-side audit logging for RailOpt AI.
 *
 * Demo session user ids (`user-admin`, `user-planner`, …) are not Prisma
 * User ids, so we resolve a real User row for attribution:
 *   1. by session email (Dhittika matches `admin@railopt.ai` directly)
 *   2. by session name  (Jeet/Diya/Debarshi/Rupam/Alivia)
 *   3. by any admin row (last-resort fallback)
 *
 * `logAudit` is fail-soft by design: an audit failure must never break the
 * main request flow. Errors are logged and swallowed.
 */

type SessionUserLike = { id?: string | null; name?: string | null; email?: string | null }

export async function resolveAuditUserId(user: SessionUserLike): Promise<string | null> {
  try {
    if (user.email) {
      const byEmail = await db.user.findFirst({ where: { email: user.email } })
      if (byEmail) return byEmail.id
    }
    if (user.name) {
      const byName = await db.user.findFirst({ where: { name: user.name } })
      if (byName) return byName.id
    }
    const fallback = await db.user.findFirst({ where: { role: 'admin' } })
    return fallback?.id ?? null
  } catch (error) {
    console.error('resolveAuditUserId error:', error)
    return null
  }
}

export interface AuditInput {
  action: string
  entityType: string
  entityId?: string | null
  details?: string | null
  planId?: string | null
  blockId?: string | null
  requestId?: string | null
}

/** Write an audit entry attributed to the current session user. Fail-soft. */
export async function logAudit(session: Session | null, input: AuditInput): Promise<void> {
  try {
    const sessionUser = (session?.user ?? {}) as SessionUserLike
    const userId = await resolveAuditUserId(sessionUser)
    if (!userId) {
      console.warn('logAudit skipped — no resolvable user for', sessionUser.email ?? sessionUser.name)
      return
    }

    // AuditLog.planId/blockId/requestId have FK constraints to the *standard*
    // Plan/Block/MaintenanceRequest tables. CustomPlan and ManualBlock rows
    // live in separate tables, so their ids would violate the FK. Verify each
    // optional link before writing; drop dangling references silently.
    const [planId, blockId, requestId] = await Promise.all([
      input.planId ? db.plan.findUnique({ where: { id: input.planId }, select: { id: true } }).then(r => r?.id ?? null).catch(() => null) : Promise.resolve(null),
      input.blockId ? db.block.findUnique({ where: { id: input.blockId }, select: { id: true } }).then(r => r?.id ?? null).catch(() => null) : Promise.resolve(null),
      input.requestId ? db.maintenanceRequest.findUnique({ where: { id: input.requestId }, select: { id: true } }).then(r => r?.id ?? null).catch(() => null) : Promise.resolve(null),
    ])

    await db.auditLog.create({
      data: {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        userId,
        userName: sessionUser.name ?? null,
        details: input.details ?? null,
        planId,
        blockId,
        requestId,
      },
    })
  } catch (error) {
    // Never let audit logging break the main flow
    console.error('logAudit error:', error)
  }
}

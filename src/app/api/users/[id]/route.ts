import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireRole, PROTECTED_USER_EMAILS } from '@/lib/auth-guard'
import { logAudit } from '@/lib/audit'

type Params = { params: Promise<{ id: string }> }

const ALLOWED_ROLES = ['admin', 'planner', 'control_office', 'engineering', 'snt', 'traction']

/**
 * PATCH /api/users/[id] — update an invited user's role / status / profile (admin).
 * Team & seeded accounts are protected and cannot be modified here.
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await requireAuth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = requireRole(session, ['admin'])
  if (!role) return NextResponse.json({ error: 'Forbidden — requires admin role' }, { status: 403 })

  try {
    const { id } = await params
    const body = await request.json()
    const existing = await db.user.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (PROTECTED_USER_EMAILS.has(existing.email)) {
      return NextResponse.json(
        { error: 'Team accounts are managed in code and cannot be modified' },
        { status: 403 }
      )
    }

    const data: Record<string, unknown> = {}
    if (typeof body?.name === 'string' && body.name.trim()) data.name = body.name.trim()
    if (typeof body?.department === 'string') data.department = body.department.trim() || null
    if (typeof body?.role === 'string') {
      if (!ALLOWED_ROLES.includes(body.role)) {
        return NextResponse.json(
          { error: `Role must be one of: ${ALLOWED_ROLES.join(', ')}` },
          { status: 400 }
        )
      }
      data.role = body.role
    }
    if (typeof body?.isActive === 'boolean') data.isActive = body.isActive

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 })
    }

    const user = await db.user.update({ where: { id }, data })

    void logAudit(session, {
      action: 'USER_UPDATED',
      entityType: 'user',
      entityId: user.id,
      details: `Updated ${user.name} (${user.email}) — fields: ${Object.keys(data).join(', ')}`,
    })

    return NextResponse.json({ data: { id: user.id, ...data } })
  } catch (error) {
    console.error('Users PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

/**
 * DELETE /api/users/[id] — remove an invited user (admin).
 * Team & seeded accounts are protected.
 */
export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await requireAuth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = requireRole(session, ['admin'])
  if (!role) return NextResponse.json({ error: 'Forbidden — requires admin role' }, { status: 403 })

  try {
    const { id } = await params
    const existing = await db.user.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (PROTECTED_USER_EMAILS.has(existing.email)) {
      return NextResponse.json(
        { error: 'Team accounts are managed in code and cannot be removed' },
        { status: 403 }
      )
    }

    await db.user.delete({ where: { id } })

    void logAudit(session, {
      action: 'USER_REMOVED',
      entityType: 'user',
      entityId: id,
      details: `Removed invited user ${existing.name} (${existing.email}, was ${existing.role})`,
    })

    return NextResponse.json({ data: { id } })
  } catch (error) {
    console.error('Users DELETE error:', error)
    return NextResponse.json({ error: 'Failed to remove user' }, { status: 500 })
  }
}

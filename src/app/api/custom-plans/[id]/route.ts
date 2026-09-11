import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireRole } from '@/lib/auth-guard'
import { logAudit } from '@/lib/audit'

type Params = { params: Promise<{ id: string }> }

/**
 * PATCH /api/custom-plans/[id] — update fields or link/unlink blocks (planner/admin)
 * DELETE /api/custom-plans/[id] — remove a custom plan (planner/admin)
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await requireAuth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = requireRole(session, ['admin', 'planner'])
  if (!role) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { id } = await params
    const body = await request.json()
    const existing = await db.customPlan.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

    const data: Record<string, unknown> = {}

    // Block link/unlink helpers: { addBlockId } / { removeBlockId } mutate blockIds
    if (typeof body?.addBlockId === 'string') {
      const ids: string[] = JSON.parse(existing.blockIds || '[]')
      if (!ids.includes(body.addBlockId)) ids.push(body.addBlockId)
      data.blockIds = JSON.stringify(ids)
    } else if (typeof body?.removeBlockId === 'string') {
      const ids: string[] = JSON.parse(existing.blockIds || '[]')
      data.blockIds = JSON.stringify(ids.filter((b) => b !== body.removeBlockId))
    } else if (Array.isArray(body?.blockIds)) {
      data.blockIds = JSON.stringify(body.blockIds)
    }

    if (typeof body?.name === 'string' && body.name.trim()) data.name = body.name.trim()
    if (typeof body?.notes === 'string') data.notes = body.notes.trim() || null
    if (typeof body?.status === 'string') data.status = body.status
    if (body?.startDate && body?.endDate && String(body.endDate) < String(body.startDate)) {
      return NextResponse.json({ error: 'End date must be on or after start date' }, { status: 400 })
    }
    if (typeof body?.startDate === 'string') data.startDate = body.startDate
    if (typeof body?.endDate === 'string') data.endDate = body.endDate

    const plan = await db.customPlan.update({ where: { id }, data })

    // Audit: distinguish block link/unlink from generic field updates
    if (typeof body?.addBlockId === 'string') {
      void logAudit(session, {
        action: 'BLOCK_ADDED_TO_PLAN',
        entityType: 'plan',
        entityId: plan.id,
        details: `Block ${body.addBlockId} linked to plan "${plan.name}" (${JSON.parse(plan.blockIds || '[]').length} blocks total)`,
      })
    } else if (typeof body?.removeBlockId === 'string') {
      void logAudit(session, {
        action: 'BLOCK_REMOVED_FROM_PLAN',
        entityType: 'plan',
        entityId: plan.id,
        details: `Block ${body.removeBlockId} unlinked from plan "${plan.name}"`,
      })
    } else {
      const changed = Object.keys(data)
      if (changed.length > 0) {
        void logAudit(session, {
          action: 'CUSTOM_PLAN_UPDATED',
          entityType: 'plan',
          entityId: plan.id,
          details: `Updated plan "${plan.name}" — fields: ${changed.join(', ')}`,
        })
      }
    }

    return NextResponse.json({ data: { ...plan, blockIds: JSON.parse(plan.blockIds || '[]'), isCustom: true } })
  } catch (error) {
    console.error('CustomPlans PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update custom plan' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await requireAuth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = requireRole(session, ['admin', 'planner'])
  if (!role) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { id } = await params
    const existing = await db.customPlan.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

    // Also unlink manual blocks pointing at this plan
    await db.manualBlock.updateMany({ where: { planId: id }, data: { planId: null } })
    await db.customPlan.delete({ where: { id } })

    void logAudit(session, {
      action: 'CUSTOM_PLAN_DELETED',
      entityType: 'plan',
      entityId: id,
      details: `Deleted custom plan "${existing.name}" (${existing.startDate} → ${existing.endDate}, ${JSON.parse(existing.blockIds || '[]').length} blocks; linked manual blocks unlinked)`,
    })

    return NextResponse.json({ data: { id } })
  } catch (error) {
    console.error('CustomPlans DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete custom plan' }, { status: 500 })
  }
}

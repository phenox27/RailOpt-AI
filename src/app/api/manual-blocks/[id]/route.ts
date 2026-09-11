import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireRole } from '@/lib/auth-guard'
import { logAudit } from '@/lib/audit'

type Params = { params: Promise<{ id: string }> }

/**
 * DELETE /api/manual-blocks/[id] — remove a manual block and unlink it from its plan
 */
export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await requireAuth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = requireRole(session, ['admin', 'planner'])
  if (!role) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { id } = await params
    const existing = await db.manualBlock.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Block not found' }, { status: 404 })

    await db.manualBlock.delete({ where: { id } })

    void logAudit(session, {
      action: 'MANUAL_BLOCK_DELETED',
      entityType: 'block',
      entityId: id,
      details: `Deleted manual block "${existing.name}" on ${existing.section} (${existing.startTime}—${existing.endTime})`,
    })

    // Unlink from the custom plan (best effort)
    if (existing.planId) {
      try {
        const plan = await db.customPlan.findUnique({ where: { id: existing.planId } })
        if (plan) {
          const ids: string[] = JSON.parse(plan.blockIds || '[]')
          await db.customPlan.update({
            where: { id: plan.id },
            data: { blockIds: JSON.stringify(ids.filter((b) => b !== id)) },
          })
        }
      } catch {
        // non-fatal
      }
    }

    return NextResponse.json({ data: { id } })
  } catch (error) {
    console.error('ManualBlocks DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete manual block' }, { status: 500 })
  }
}

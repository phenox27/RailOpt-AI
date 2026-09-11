import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireRole } from '@/lib/auth-guard'
import { logAudit } from '@/lib/audit'

type Params = { params: Promise<{ id: string }> }

/** HH:MM:SS or HH:MM part of an ISO-ish "YYYY-MM-DDTHH:MM:SS" string */
function timePart(iso: string): string {
  const t = iso.split('T')[1] || ''
  return t.slice(0, 5)
}

/**
 * PATCH /api/manual-blocks/[id] — reschedule a manual block (drag & drop or keyboard nudge).
 * Accepts { startTime, endTime, duration } and records a BLOCK_RESCHEDULED audit entry
 * with the old → new time window for the live audit trail.
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await requireAuth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = requireRole(session, ['admin', 'planner'])
  if (!role) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { id } = await params
    const existing = await db.manualBlock.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Block not found' }, { status: 404 })

    const body = await request.json()
    const { startTime, endTime, duration } = body ?? {}

    if (typeof startTime !== 'string' || typeof endTime !== 'string' || !startTime || !endTime) {
      return NextResponse.json({ error: 'startTime and endTime are required' }, { status: 400 })
    }
    const dur = Number.isFinite(duration) ? Math.max(0, Math.round(Number(duration))) : null
    if (dur === null) {
      return NextResponse.json({ error: 'duration is required' }, { status: 400 })
    }

    const oldWindow = `${timePart(existing.startTime)}–${timePart(existing.endTime)}`
    const newWindow = `${timePart(startTime)}–${timePart(endTime)}`

    const block = await db.manualBlock.update({
      where: { id },
      data: {
        startTime: String(startTime),
        endTime: String(endTime),
        duration: dur,
      },
    })

    if (oldWindow !== newWindow) {
      void logAudit(session, {
        action: 'BLOCK_RESCHEDULED',
        entityType: 'block',
        entityId: block.id,
        details: `Rescheduled "${block.name}" on ${block.section}: ${oldWindow} → ${newWindow} (${dur} min)`,
      })
    }

    return NextResponse.json({
      data: { ...block, maintenanceReqIds: JSON.parse(block.maintenanceReqIds || '[]'), isManual: true },
    })
  } catch (error) {
    console.error('ManualBlocks PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update manual block' }, { status: 500 })
  }
}

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

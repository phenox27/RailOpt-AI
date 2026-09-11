import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireRole } from '@/lib/auth-guard'

/**
 * GET /api/manual-blocks — list manually created blocks (newest first)
 * POST /api/manual-blocks — create a manual block (planner/admin)
 */
export async function GET() {
  const session = await requireAuth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const blocks = await db.manualBlock.findMany({ orderBy: { createdAt: 'desc' } })
    const data = blocks.map((b) => ({
      ...b,
      maintenanceReqIds: JSON.parse(b.maintenanceReqIds || '[]'),
      isManual: true,
    }))
    return NextResponse.json({ data, count: data.length })
  } catch (error) {
    console.error('ManualBlocks GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch manual blocks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAuth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = requireRole(session, ['admin', 'planner'])
  if (!role) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await request.json()
    const { id, name, section, stationFrom, stationTo, startTime, endTime, duration, department, status, planId, line } = body ?? {}

    if (!name || !section || !startTime || !endTime || !department) {
      return NextResponse.json({ error: 'name, section, startTime, endTime and department are required' }, { status: 400 })
    }

    const block = await db.manualBlock.create({
      data: {
        // Use the client-provided id so links (plan.blockIds) stay consistent
        id: typeof id === 'string' && id ? id : undefined,
        name: String(name),
        section: String(section),
        stationFrom: stationFrom ? String(stationFrom) : null,
        stationTo: stationTo ? String(stationTo) : null,
        startTime: String(startTime),
        endTime: String(endTime),
        duration: Number.isFinite(duration) ? Math.max(0, Math.round(Number(duration))) : 0,
        department: String(department),
        status: typeof status === 'string' ? status : 'edited',
        planId: typeof planId === 'string' && planId ? planId : null,
        line: typeof line === 'string' ? line : 'both',
        isAiRecommended: false,
        aiConfidence: null,
        aiReasoning: null,
        maintenanceReqIds: '[]',
      },
    })

    // Keep the linked custom plan's blockIds in sync (best effort)
    if (block.planId) {
      try {
        const plan = await db.customPlan.findUnique({ where: { id: block.planId } })
        if (plan) {
          const ids: string[] = JSON.parse(plan.blockIds || '[]')
          if (!ids.includes(block.id)) {
            await db.customPlan.update({
              where: { id: plan.id },
              data: { blockIds: JSON.stringify([...ids, block.id]) },
            })
          }
        }
      } catch {
        // non-fatal — plan link stays eventually consistent via PATCH
      }
    }

    return NextResponse.json(
      { data: { ...block, maintenanceReqIds: [], isManual: true } },
      { status: 201 }
    )
  } catch (error) {
    console.error('ManualBlocks POST error:', error)
    return NextResponse.json({ error: 'Failed to create manual block' }, { status: 500 })
  }
}

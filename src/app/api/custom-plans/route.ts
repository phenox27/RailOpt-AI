import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireRole } from '@/lib/auth-guard'

/**
 * GET /api/custom-plans — list user-created plans (newest first)
 * POST /api/custom-plans — create a custom plan (planner/admin)
 */
export async function GET() {
  const session = await requireAuth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const plans = await db.customPlan.findMany({
      orderBy: { createdAt: 'desc' },
    })
    // blockIds stored as JSON string — parse for the frontend
    const data = plans.map((p) => ({ ...p, blockIds: JSON.parse(p.blockIds || '[]'), isCustom: true }))
    return NextResponse.json({ data, count: data.length })
  } catch (error) {
    console.error('CustomPlans GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch custom plans' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAuth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = requireRole(session, ['admin', 'planner'])
  if (!role) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await request.json()
    const { id, name, type, startDate, endDate, status, version, createdBy, notes, blockIds } = body ?? {}

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Plan name is required' }, { status: 400 })
    }
    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Start and end dates are required' }, { status: 400 })
    }
    if (String(endDate) < String(startDate)) {
      return NextResponse.json({ error: 'End date must be on or after start date' }, { status: 400 })
    }

    const plan = await db.customPlan.create({
      data: {
        // Use the client-provided id so frontend links stay consistent
        id: typeof id === 'string' && id ? id : undefined,
        name: name.trim(),
        type: type === 'monthly' ? 'monthly' : 'weekly',
        startDate: String(startDate),
        endDate: String(endDate),
        status: typeof status === 'string' ? status : 'draft',
        version: Number.isFinite(version) ? Number(version) : 1,
        createdBy: typeof createdBy === 'string' && createdBy ? createdBy : (session.user?.name ?? 'Unknown'),
        notes: typeof notes === 'string' && notes.trim() ? notes.trim() : null,
        blockIds: JSON.stringify(Array.isArray(blockIds) ? blockIds : []),
      },
    })

    return NextResponse.json(
      { data: { ...plan, blockIds: JSON.parse(plan.blockIds || '[]'), isCustom: true } },
      { status: 201 }
    )
  } catch (error) {
    console.error('CustomPlans POST error:', error)
    return NextResponse.json({ error: 'Failed to create custom plan' }, { status: 500 })
  }
}

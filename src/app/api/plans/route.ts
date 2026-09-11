import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireRole } from '@/lib/auth-guard'

export async function GET(request: NextRequest) {
  // Auth check
  const session = await requireAuth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (type) where.type = type

    const plans = await db.plan.findMany({
      where,
      include: {
        blocks: {
          include: {
            maintenanceReqs: { select: { id: true, title: true, department: true, priority: true } },
          },
          orderBy: { startTime: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: plans, count: plans.length })
  } catch (error) {
    console.error('Plans GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Auth check: require planner or admin
  const session = await requireAuth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = requireRole(session, ['admin', 'planner'])
  if (!role) return NextResponse.json({ error: 'Forbidden — requires admin or planner role' }, { status: 403 })

  try {
    const body = await request.json()

    // Validation
    if (!body.name || !body.startDate || !body.endDate || !body.createdBy) {
      return NextResponse.json(
        { error: 'Missing required fields: name, startDate, endDate, createdBy' },
        { status: 400 }
      )
    }

    // Verify user exists
    const user = await db.user.findUnique({ where: { id: body.createdBy } })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 400 }
      )
    }

    const newPlan = await db.plan.create({
      data: {
        name: body.name,
        type: body.type || 'weekly',
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        status: 'draft',
        version: body.version ?? 1,
        createdBy: body.createdBy,
      },
      include: {
        blocks: true,
      },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'CREATE_PLAN',
        entityType: 'plan',
        entityId: newPlan.id,
        userId: body.createdBy,
        userName: user.name,
        details: `Created plan: ${body.name}`,
        planId: newPlan.id,
      },
    })

    return NextResponse.json({ data: newPlan }, { status: 201 })
  } catch (error) {
    console.error('Plans POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create plan', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

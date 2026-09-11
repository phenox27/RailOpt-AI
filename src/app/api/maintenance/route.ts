import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireRole } from '@/lib/auth-guard'

export async function GET(request: NextRequest) {
  // Auth check
  const session = await requireAuth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const department = searchParams.get('department')
    const status = searchParams.get('status')
    const severity = searchParams.get('severity')
    const section = searchParams.get('section')
    const isOverdue = searchParams.get('isOverdue')

    const where: Record<string, unknown> = {}
    if (department) where.department = department
    if (status) where.status = status
    if (severity) where.severity = severity
    if (section) where.section = section
    if (isOverdue !== null && isOverdue !== undefined && isOverdue !== '') {
      where.isOverdue = isOverdue === 'true'
    }

    const requests = await db.maintenanceRequest.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true, email: true, role: true } },
        block: { select: { id: true, name: true, status: true } },
      },
      orderBy: { priority: 'desc' },
    })

    return NextResponse.json({ data: requests, count: requests.length })
  } catch (error) {
    console.error('Maintenance GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch maintenance requests' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Auth check: require planner or admin to create
  const session = await requireAuth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = requireRole(session, ['admin', 'planner', 'engineering', 'snt', 'traction'])
  if (!role) return NextResponse.json({ error: 'Forbidden — insufficient role' }, { status: 403 })

  try {
    const body = await request.json()

    // Validation
    if (!body.title || !body.department || !body.createdBy) {
      return NextResponse.json(
        { error: 'Missing required fields: title, department, createdBy' },
        { status: 400 }
      )
    }

    const validDepartments = ['engineering', 'snt', 'traction']
    if (!validDepartments.includes(body.department)) {
      return NextResponse.json(
        { error: 'Invalid department. Must be: engineering, snt, or traction' },
        { status: 400 }
      )
    }

    const validSeverities = ['low', 'medium', 'high', 'critical']
    if (body.severity && !validSeverities.includes(body.severity)) {
      return NextResponse.json(
        { error: 'Invalid severity. Must be: low, medium, high, or critical' },
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

    const newRequest = await db.maintenanceRequest.create({
      data: {
        title: body.title,
        description: body.description || null,
        department: body.department,
        category: body.category || null,
        section: body.section || null,
        stationFrom: body.stationFrom || null,
        stationTo: body.stationTo || null,
        assetId: body.assetId || null,
        priority: body.priority ?? 0,
        severity: body.severity || 'medium',
        safetyRisk: body.safetyRisk || 'low',
        assetCriticality: body.assetCriticality || 'medium',
        trafficImpact: body.trafficImpact || 'low',
        isOverdue: body.isOverdue ?? false,
        duration: body.duration ?? 120,
        requestedDate: body.requestedDate ? new Date(body.requestedDate) : null,
        status: 'pending',
        createdBy: body.createdBy,
      },
      include: {
        creator: { select: { id: true, name: true, email: true, role: true } },
      },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'CREATE_REQUEST',
        entityType: 'request',
        entityId: newRequest.id,
        userId: body.createdBy,
        userName: user.name,
        details: `Created maintenance request: ${body.title}`,
        requestId: newRequest.id,
      },
    })

    return NextResponse.json({ data: newRequest }, { status: 201 })
  } catch (error) {
    console.error('Maintenance POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create maintenance request', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

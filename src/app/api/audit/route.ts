import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireRole } from '@/lib/auth-guard'

export async function GET(request: NextRequest) {
  // Auth check: require admin
  const session = await requireAuth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = requireRole(session, ['admin'])
  if (!role) return NextResponse.json({ error: 'Forbidden — requires admin role' }, { status: 403 })

  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const entityType = searchParams.get('entityType')
    const userId = searchParams.get('userId')
    const entityId = searchParams.get('entityId')
    const planId = searchParams.get('planId')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const where: Record<string, unknown> = {}
    if (action) where.action = action
    if (entityType) where.entityType = entityType
    if (userId) where.userId = userId
    if (entityId) where.entityId = entityId
    if (planId) where.planId = planId

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      }),
      db.auditLog.count({ where }),
    ])

    return NextResponse.json({
      data: logs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error('Audit GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Auth check: require admin
  const session = await requireAuth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = requireRole(session, ['admin'])
  if (!role) return NextResponse.json({ error: 'Forbidden — requires admin role' }, { status: 403 })

  try {
    const body = await request.json()

    if (!body.action || !body.entityType || !body.userId) {
      return NextResponse.json(
        { error: 'Missing required fields: action, entityType, userId' },
        { status: 400 }
      )
    }

    const auditLog = await db.auditLog.create({
      data: {
        action: body.action,
        entityType: body.entityType,
        entityId: body.entityId || null,
        userId: body.userId,
        userName: body.userName || null,
        details: body.details || null,
        planId: body.planId || null,
        blockId: body.blockId || null,
        requestId: body.requestId || null,
      },
    })

    return NextResponse.json({ data: auditLog }, { status: 201 })
  } catch (error) {
    console.error('Audit POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create audit log', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

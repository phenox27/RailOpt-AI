import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const severity = searchParams.get('severity')
    const type = searchParams.get('type')
    const resolved = searchParams.get('resolved')
    const blockId = searchParams.get('blockId')

    const where: Record<string, unknown> = {}
    if (severity) where.severity = severity
    if (type) where.type = type
    if (blockId) where.blockId = blockId
    if (resolved !== null && resolved !== undefined && resolved !== '') {
      where.resolved = resolved === 'true'
    }

    const conflicts = await db.conflict.findMany({
      where,
      orderBy: [
        { resolved: 'asc' }, // unresolved first
        { severity: 'desc' }, // then by severity
      ],
    })

    return NextResponse.json({ data: conflicts, count: conflicts.length })
  } catch (error) {
    console.error('Conflicts GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conflicts' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json(
        { error: 'Conflict id is required' },
        { status: 400 }
      )
    }

    const existing = await db.conflict.findUnique({ where: { id: body.id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Conflict not found' },
        { status: 404 }
      )
    }

    if (existing.resolved) {
      return NextResponse.json(
        { error: 'Conflict is already resolved' },
        { status: 400 }
      )
    }

    const updated = await db.conflict.update({
      where: { id: body.id },
      data: {
        resolved: true,
      },
    })

    // Create audit log
    if (body.resolvedBy) {
      const user = await db.user.findUnique({ where: { id: body.resolvedBy } })
      await db.auditLog.create({
        data: {
          action: 'CONFLICT_RESOLVED',
          entityType: 'conflict',
          entityId: body.id,
          userId: body.resolvedBy,
          userName: user?.name || 'System',
          details: `Resolved conflict: ${existing.description}`,
          blockId: existing.blockId,
        },
      })
    }

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('Conflicts PATCH error:', error)
    return NextResponse.json(
      { error: 'Failed to resolve conflict', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

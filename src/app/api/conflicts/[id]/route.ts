import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const conflict = await db.conflict.findUnique({
      where: { id },
    })

    if (!conflict) {
      return NextResponse.json(
        { error: 'Conflict not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: conflict })
  } catch (error) {
    console.error('Conflict [id] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conflict' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.conflict.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Conflict not found' },
        { status: 404 }
      )
    }

    if (existing.resolved && !body.unresolve) {
      return NextResponse.json(
        { error: 'Conflict is already resolved' },
        { status: 400 }
      )
    }

    const updated = await db.conflict.update({
      where: { id },
      data: { resolved: true },
    })

    // Create audit log
    if (body.resolvedBy) {
      const user = await db.user.findUnique({ where: { id: body.resolvedBy } })
      await db.auditLog.create({
        data: {
          action: 'CONFLICT_RESOLVED',
          entityType: 'conflict',
          entityId: id,
          userId: body.resolvedBy,
          userName: user?.name || 'System',
          details: `Resolved conflict: ${existing.description}`,
          blockId: existing.blockId,
        },
      })
    }

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('Conflict [id] PATCH error:', error)
    return NextResponse.json(
      { error: 'Failed to resolve conflict', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

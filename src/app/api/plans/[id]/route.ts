import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const plan = await db.plan.findUnique({
      where: { id },
      include: {
        blocks: {
          include: {
            maintenanceReqs: {
              include: {
                creator: { select: { id: true, name: true, role: true } },
              },
            },
          },
          orderBy: { startTime: 'asc' },
        },
        auditLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    })

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      )
    }

    // Compute summary stats
    const totalBlocks = plan.blocks.length
    const blocksByStatus = plan.blocks.reduce((acc, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      data: plan,
      stats: { totalBlocks, blocksByStatus },
    })
  } catch (error) {
    console.error('Plan [id] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plan' },
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

    const existing = await db.plan.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    const allowedFields = ['name', 'type', 'status', 'version', 'finalizedBy', 'approvedBy']
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    if (body.startDate) updateData.startDate = new Date(body.startDate)
    if (body.endDate) updateData.endDate = new Date(body.endDate)

    // --- Plan Status Transitions ---
    // draft → optimizing → recommended → reviewed → verified → finalized → approved
    if (body.status && body.status !== existing.status) {
      const validTransitions: Record<string, string[]> = {
        draft: ['optimizing'],
        optimizing: ['recommended', 'draft'],
        recommended: ['reviewed', 'optimizing'],
        reviewed: ['verified', 'recommended'],
        verified: ['finalized', 'reviewed'],
        finalized: ['approved', 'verified'],
        approved: [],
      }

      const allowed = validTransitions[existing.status] || []
      if (!allowed.includes(body.status)) {
        return NextResponse.json(
          { error: `Invalid status transition from ${existing.status} to ${body.status}. Allowed: ${allowed.join(', ') || 'none'}` },
          { status: 400 }
        )
      }
    }

    const updated = await db.plan.update({
      where: { id },
      data: updateData,
      include: {
        blocks: {
          orderBy: { startTime: 'asc' },
        },
      },
    })

    // Create audit log for status changes
    if (body.status && body.status !== existing.status) {
      const userId = body.updatedBy || existing.createdBy
      const user = await db.user.findUnique({ where: { id: userId } })
      await db.auditLog.create({
        data: {
          action: `PLAN_${body.status.toUpperCase()}`,
          entityType: 'plan',
          entityId: id,
          userId,
          userName: user?.name || 'System',
          details: `Plan status changed from ${existing.status} to ${body.status}: ${existing.name}`,
          planId: id,
        },
      })
    }

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('Plan [id] PATCH error:', error)
    return NextResponse.json(
      { error: 'Failed to update plan', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

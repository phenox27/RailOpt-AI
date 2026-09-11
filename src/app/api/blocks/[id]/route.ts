import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const block = await db.block.findUnique({
      where: { id },
      include: {
        plan: { select: { id: true, name: true, status: true, type: true } },
        maintenanceReqs: {
          include: {
            creator: { select: { id: true, name: true, role: true } },
          },
        },
        auditLogs: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    })

    if (!block) {
      return NextResponse.json(
        { error: 'Block not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: block })
  } catch (error) {
    console.error('Block [id] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch block' },
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

    const existing = await db.block.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Block not found' },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    const allowedFields = ['name', 'section', 'stationFrom', 'stationTo', 'department', 'status', 'planId', 'corridorId', 'line', 'conflictIds', 'aiConfidence', 'aiReasoning', 'verifiedBy', 'approvedBy']
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    // Handle date fields
    if (body.startTime) {
      updateData.startTime = new Date(body.startTime)
    }
    if (body.endTime) {
      updateData.endTime = new Date(body.endTime)
    }

    // Recalculate duration if times changed
    if (body.startTime || body.endTime) {
      const startTime = body.startTime ? new Date(body.startTime) : existing.startTime
      const endTime = body.endTime ? new Date(body.endTime) : existing.endTime
      updateData.duration = Math.round((endTime.getTime() - startTime.getTime()) / 60000)
    }

    // --- Approval Workflow Logic ---
    // Status transitions follow: recommended → edited → verified → finalized → approved / rejected
    if (body.status && body.status !== existing.status) {
      const validTransitions: Record<string, string[]> = {
        recommended: ['edited', 'verified', 'rejected'],
        edited: ['verified', 'rejected'],
        verified: ['finalized', 'rejected'],
        finalized: ['approved', 'rejected'],
        approved: [],
        rejected: ['recommended'], // can re-recommend after rejection
      }

      const allowed = validTransitions[existing.status] || []
      if (!allowed.includes(body.status)) {
        return NextResponse.json(
          { error: `Invalid status transition from ${existing.status} to ${body.status}. Allowed: ${allowed.join(', ') || 'none'}` },
          { status: 400 }
        )
      }

      // Require verifiedBy for verify action
      if (body.status === 'verified' && !body.verifiedBy && !existing.verifiedBy) {
        return NextResponse.json(
          { error: 'verifiedBy is required when verifying a block' },
          { status: 400 }
        )
      }

      // Require approvedBy for approve action
      if (body.status === 'approved' && !body.approvedBy && !existing.approvedBy) {
        return NextResponse.json(
          { error: 'approvedBy is required when approving a block' },
          { status: 400 }
        )
      }
    }

    const updated = await db.block.update({
      where: { id },
      data: updateData,
      include: {
        plan: { select: { id: true, name: true, status: true } },
        maintenanceReqs: { select: { id: true, title: true, department: true, status: true } },
      },
    })

    // Create audit log for status changes
    if (body.status && body.status !== existing.status) {
      const userId = body.updatedBy || 'system'
      const user = await db.user.findUnique({ where: { id: userId } })
      await db.auditLog.create({
        data: {
          action: `BLOCK_${body.status.toUpperCase()}`,
          entityType: 'block',
          entityId: id,
          userId,
          userName: user?.name || 'System',
          details: `Block status changed from ${existing.status} to ${body.status}: ${existing.name}`,
          blockId: id,
          planId: existing.planId,
        },
      })
    }

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('Block [id] PATCH error:', error)
    return NextResponse.json(
      { error: 'Failed to update block', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

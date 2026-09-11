import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const maintenanceRequest = await db.maintenanceRequest.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, email: true, role: true, department: true } },
        block: { select: { id: true, name: true, status: true, startTime: true, endTime: true, department: true } },
        auditLogs: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    })

    if (!maintenanceRequest) {
      return NextResponse.json(
        { error: 'Maintenance request not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: maintenanceRequest })
  } catch (error) {
    console.error('Maintenance [id] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch maintenance request' },
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

    const existing = await db.maintenanceRequest.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Maintenance request not found' },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    const allowedFields = ['title', 'description', 'category', 'section', 'stationFrom', 'stationTo', 'priority', 'severity', 'safetyRisk', 'assetCriticality', 'trafficImpact', 'isOverdue', 'duration', 'status', 'blockId']
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    // Handle requestedDate conversion
    if (body.requestedDate) {
      updateData.requestedDate = new Date(body.requestedDate)
    }

    // Validate status transitions
    if (body.status) {
      const validStatuses = ['pending', 'scored', 'assigned', 'verified', 'rejected']
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be: ${validStatuses.join(', ')}` },
          { status: 400 }
        )
      }
    }

    const updated = await db.maintenanceRequest.update({
      where: { id },
      data: updateData,
      include: {
        creator: { select: { id: true, name: true, email: true, role: true } },
        block: { select: { id: true, name: true, status: true } },
      },
    })

    // Create audit log for status changes
    if (body.status && body.status !== existing.status) {
      const userId = body.updatedBy || existing.createdBy
      const user = await db.user.findUnique({ where: { id: userId } })
      await db.auditLog.create({
        data: {
          action: `STATUS_CHANGED_${body.status.toUpperCase()}`,
          entityType: 'request',
          entityId: id,
          userId,
          userName: user?.name || 'Unknown',
          details: `Status changed from ${existing.status} to ${body.status} for: ${existing.title}`,
          requestId: id,
        },
      })
    }

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('Maintenance [id] PATCH error:', error)
    return NextResponse.json(
      { error: 'Failed to update maintenance request', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.maintenanceRequest.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Maintenance request not found' },
        { status: 404 }
      )
    }

    // Only allow deletion of pending requests
    if (existing.status !== 'pending') {
      return NextResponse.json(
        { error: 'Cannot delete a request that is not in pending status' },
        { status: 400 }
      )
    }

    await db.maintenanceRequest.delete({ where: { id } })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'DELETE_REQUEST',
        entityType: 'request',
        entityId: id,
        userId: existing.createdBy,
        userName: 'System',
        details: `Deleted maintenance request: ${existing.title}`,
      },
    })

    return NextResponse.json({ success: true, message: 'Maintenance request deleted' })
  } catch (error) {
    console.error('Maintenance [id] DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete maintenance request' },
      { status: 500 }
    )
  }
}

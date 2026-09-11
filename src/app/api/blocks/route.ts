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
    const planId = searchParams.get('planId')
    const section = searchParams.get('section')
    const isAiRecommended = searchParams.get('isAiRecommended')

    const where: Record<string, unknown> = {}
    if (department) where.department = department
    if (status) where.status = status
    if (planId) where.planId = planId
    if (section) where.section = section
    if (isAiRecommended !== null && isAiRecommended !== undefined && isAiRecommended !== '') {
      where.isAiRecommended = isAiRecommended === 'true'
    }

    const blocks = await db.block.findMany({
      where,
      include: {
        plan: { select: { id: true, name: true, status: true } },
        maintenanceReqs: { select: { id: true, title: true, department: true, priority: true, status: true } },
      },
      orderBy: { startTime: 'asc' },
    })

    return NextResponse.json({ data: blocks, count: blocks.length })
  } catch (error) {
    console.error('Blocks GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blocks' },
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
    if (!body.name || !body.department || !body.startTime || !body.endTime) {
      return NextResponse.json(
        { error: 'Missing required fields: name, department, startTime, endTime' },
        { status: 400 }
      )
    }

    const startTime = new Date(body.startTime)
    const endTime = new Date(body.endTime)

    if (endTime <= startTime) {
      return NextResponse.json(
        { error: 'endTime must be after startTime' },
        { status: 400 }
      )
    }

    const duration = body.duration ?? Math.round((endTime.getTime() - startTime.getTime()) / 60000)

    // Verify plan exists if planId provided
    if (body.planId) {
      const plan = await db.plan.findUnique({ where: { id: body.planId } })
      if (!plan) {
        return NextResponse.json(
          { error: 'Plan not found' },
          { status: 400 }
        )
      }
    }

    const newBlock = await db.block.create({
      data: {
        name: body.name,
        section: body.section || null,
        stationFrom: body.stationFrom || null,
        stationTo: body.stationTo || null,
        startTime,
        endTime,
        duration,
        department: body.department,
        status: body.status || 'recommended',
        planId: body.planId || null,
        corridorId: body.corridorId || null,
        line: body.line || null,
        isAiRecommended: body.isAiRecommended ?? false,
        aiConfidence: body.aiConfidence ?? null,
        aiReasoning: body.aiReasoning || null,
      },
      include: {
        plan: { select: { id: true, name: true, status: true } },
      },
    })

    // Link maintenance requests if provided
    if (body.maintenanceReqIds && Array.isArray(body.maintenanceReqIds)) {
      for (const reqId of body.maintenanceReqIds) {
        await db.maintenanceRequest.update({
          where: { id: reqId },
          data: { blockId: newBlock.id },
        })
      }
    }

    // Create audit log
    if (body.createdBy) {
      const user = await db.user.findUnique({ where: { id: body.createdBy } })
      await db.auditLog.create({
        data: {
          action: body.isAiRecommended ? 'BLOCK_RECOMMENDED' : 'BLOCK_CREATED',
          entityType: 'block',
          entityId: newBlock.id,
          userId: body.createdBy,
          userName: user?.name || 'Unknown',
          details: `${body.isAiRecommended ? 'AI recommended' : 'Created'} block: ${body.name}`,
          blockId: newBlock.id,
          planId: body.planId || null,
        },
      })
    }

    return NextResponse.json({ data: newBlock }, { status: 201 })
  } catch (error) {
    console.error('Blocks POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create block', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

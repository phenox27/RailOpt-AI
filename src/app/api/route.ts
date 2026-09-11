import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    name: 'RailOpt AI API',
    version: '1.0.0',
    endpoints: {
      seed: 'POST /api/seed — Seed the database with simulated data',
      maintenance: {
        list: 'GET /api/maintenance — List maintenance requests (filters: department, status, severity, section, isOverdue)',
        create: 'POST /api/maintenance — Create a maintenance request',
        get: 'GET /api/maintenance/[id] — Get a single maintenance request',
        update: 'PATCH /api/maintenance/[id] — Update a maintenance request',
        delete: 'DELETE /api/maintenance/[id] — Delete a pending maintenance request',
      },
      blocks: {
        list: 'GET /api/blocks — List blocks (filters: department, status, planId, section, isAiRecommended)',
        create: 'POST /api/blocks — Create a block',
        get: 'GET /api/blocks/[id] — Get a single block with maintenance requests',
        update: 'PATCH /api/blocks/[id] — Update a block (includes approval workflow)',
      },
      plans: {
        list: 'GET /api/plans — List plans (filters: status, type)',
        create: 'POST /api/plans — Create a plan',
        get: 'GET /api/plans/[id] — Get a plan with blocks and stats',
        update: 'PATCH /api/plans/[id] — Update a plan (status transitions)',
      },
      conflicts: {
        list: 'GET /api/conflicts — List conflicts (filters: severity, type, resolved, blockId)',
        resolve: 'PATCH /api/conflicts — Resolve a conflict by id',
        get: 'GET /api/conflicts/[id] — Get a single conflict',
        resolveSingle: 'PATCH /api/conflicts/[id] — Resolve a conflict',
      },
      audit: {
        list: 'GET /api/audit — List audit logs (filters: action, entityType, userId, entityId, planId; pagination: limit, offset)',
        create: 'POST /api/audit — Create an audit log entry',
      },
      priorityScore: 'POST /api/priority-score — Calculate AI priority score (body: { requestId })',
      optimization: 'POST /api/optimization — Run AI optimization on a plan (body: { planId, stream? })',
    },
  })
}

import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const counts = {
      users: 0,
      maintenanceRequests: 0,
      blocks: 0,
      plans: 0,
      conflicts: 0,
      auditLogs: 0,
    }

    // --- Seed Users (idempotent by email) ---
    const userData = [
      { email: 'eng-anil@railopt.ai', name: 'Debarshi', role: 'department_head', department: 'engineering' },
      { email: 'eng-ramesh@railopt.ai', name: 'Debarshi', role: 'department_staff', department: 'engineering' },
      { email: 'snt-priya@railopt.ai', name: 'Rupam', role: 'department_head', department: 'snt' },
      { email: 'snt-amit@railopt.ai', name: 'Rupam', role: 'department_staff', department: 'snt' },
      { email: 'trac-vikram@railopt.ai', name: 'Alivia', role: 'department_head', department: 'traction' },
      { email: 'trac-sunil@railopt.ai', name: 'Alivia', role: 'department_staff', department: 'traction' },
      { email: 'planner-rk@railopt.ai', name: 'Jeet', role: 'planner', department: null },
      { email: 'control-office@railopt.ai', name: 'Diya', role: 'control_office', department: null },
      { email: 'admin@railopt.ai', name: 'Dhittika', role: 'admin', department: null },
    ]

    // Map from sim-data createdBy to actual user id
    const userIdMap: Record<string, string> = {}

    for (const u of userData) {
      const user = await db.user.upsert({
        where: { email: u.email },
        update: {},
        create: u,
      })
      userIdMap[u.email.split('@')[0]] = user.id
      counts.users++
    }

    // --- Seed Plans ---
    const planIdMap: Record<string, string> = {}

    const planData = [
      {
        simId: 'plan-001',
        name: 'Weekly Block Plan — Jan 27-Feb 02, 2025',
        type: 'weekly',
        startDate: new Date('2025-01-27'),
        endDate: new Date('2025-02-02'),
        status: 'recommended',
        version: 1,
        createdBy: userIdMap['planner-rk'] || '',
      },
      {
        simId: 'plan-002',
        name: 'Monthly Block Plan — February 2025',
        type: 'monthly',
        startDate: new Date('2025-02-01'),
        endDate: new Date('2025-02-28'),
        status: 'draft',
        version: 1,
        createdBy: userIdMap['planner-rk'] || '',
      },
    ]

    for (const p of planData) {
      const existing = await db.plan.findFirst({ where: { name: p.name } })
      if (!existing) {
        const plan = await db.plan.create({
          data: {
            name: p.name,
            type: p.type,
            startDate: p.startDate,
            endDate: p.endDate,
            status: p.status,
            version: p.version,
            createdBy: p.createdBy,
          },
        })
        planIdMap[p.simId] = plan.id
        counts.plans++
      } else {
        planIdMap[p.simId] = existing.id
      }
    }

    // --- Seed Maintenance Requests ---
    const mrIdMap: Record<string, string> = {}

    const mrData = [
      { simId: 'mr-001', title: 'Track renewal between NDLS-GZB', description: 'Full track renewal required for 2km section. Rails and sleepers have exceeded service life.', department: 'engineering', category: 'Track Renewal', section: 'NDLS-GZB', stationFrom: 'New Delhi', stationTo: 'Ghaziabad', priority: 92, severity: 'critical', safetyRisk: 'high', assetCriticality: 'critical', trafficImpact: 'high', isOverdue: true, duration: 240, requestedDate: new Date('2025-01-10'), status: 'scored', createdBy: 'eng-anil' },
      { simId: 'mr-002', title: 'Signal interlocking at TDL junction', description: 'Electronic interlocking system upgrade. Current relay-based system needs replacement.', department: 'snt', category: 'Signal Upgradation', section: 'TDL-MTJ', stationFrom: 'Tundla', stationTo: 'Mathura', priority: 88, severity: 'high', safetyRisk: 'high', assetCriticality: 'high', trafficImpact: 'medium', isOverdue: true, duration: 180, requestedDate: new Date('2025-01-08'), status: 'scored', createdBy: 'snt-priya' },
      { simId: 'mr-003', title: 'OHE insulator replacement CNB-LKO', description: 'Overhead equipment insulator replacement on both UP and DOWN lines. Multiple flashover incidents reported.', department: 'traction', category: 'OHE Maintenance', section: 'CNB-LKO', stationFrom: 'Kanpur', stationTo: 'Lucknow', priority: 85, severity: 'high', safetyRisk: 'medium', assetCriticality: 'high', trafficImpact: 'medium', isOverdue: false, duration: 150, requestedDate: new Date('2025-01-15'), status: 'pending', createdBy: 'trac-vikram' },
      { simId: 'mr-004', title: 'Bridge inspection BPL-JHS section', description: 'Annual bridge inspection for 3 major bridges. One bridge reported minor settlement.', department: 'engineering', category: 'Bridge Inspection', section: 'BPL-JHS', stationFrom: 'Bhopal', stationTo: 'Jhansi', priority: 78, severity: 'medium', safetyRisk: 'medium', assetCriticality: 'high', trafficImpact: 'low', isOverdue: false, duration: 120, requestedDate: new Date('2025-01-20'), status: 'pending', createdBy: 'eng-ramesh' },
      { simId: 'mr-005', title: 'Point machine replacement at ALD', description: '5 point machines at Allahabad junction need replacement. Age > 15 years.', department: 'snt', category: 'Point Machine', section: 'ALD-MGS', stationFrom: 'Prayagraj', stationTo: 'Mughal Sarai', priority: 75, severity: 'medium', safetyRisk: 'medium', assetCriticality: 'medium', trafficImpact: 'medium', isOverdue: false, duration: 180, requestedDate: new Date('2025-01-22'), status: 'assigned', createdBy: 'snt-amit' },
      { simId: 'mr-006', title: 'Tension regulation device adjustment', description: 'Tension regulation devices on 4 spans need adjustment before summer season.', department: 'traction', category: 'TRD Maintenance', section: 'NDLS-GZB', stationFrom: 'New Delhi', stationTo: 'Ghaziabad', priority: 70, severity: 'medium', safetyRisk: 'low', assetCriticality: 'medium', trafficImpact: 'low', isOverdue: false, duration: 90, requestedDate: new Date('2025-01-25'), status: 'pending', createdBy: 'trac-sunil' },
      { simId: 'mr-007', title: 'Deep screening NDLS-AGC section', description: 'Deep screening and tamping required for 5km stretch. Track geometry index deteriorating.', department: 'engineering', category: 'Track Maintenance', section: 'NDLS-AGC', stationFrom: 'New Delhi', stationTo: 'Agra', priority: 82, severity: 'high', safetyRisk: 'medium', assetCriticality: 'high', trafficImpact: 'high', isOverdue: true, duration: 300, requestedDate: new Date('2025-01-05'), status: 'assigned', createdBy: 'eng-anil' },
      { simId: 'mr-008', title: 'Cable replacement at CNB yard', description: 'Signaling cable replacement in Kanpur yard. Frequent cable faults causing signal failures.', department: 'snt', category: 'Cable Replacement', section: 'CNB-LKO', stationFrom: 'Kanpur', stationTo: 'Lucknow', priority: 65, severity: 'medium', safetyRisk: 'low', assetCriticality: 'medium', trafficImpact: 'low', isOverdue: false, duration: 120, requestedDate: new Date('2025-01-28'), status: 'pending', createdBy: 'snt-priya' },
      { simId: 'mr-009', title: 'OHE pole foundation repair BPL', description: '3 OHE poles showing foundation settlement near Bhopal station approach.', department: 'traction', category: 'OHE Structure', section: 'BPL-JHS', stationFrom: 'Bhopal', stationTo: 'Jhansi', priority: 60, severity: 'low', safetyRisk: 'medium', assetCriticality: 'medium', trafficImpact: 'low', isOverdue: false, duration: 180, requestedDate: new Date('2025-02-01'), status: 'pending', createdBy: 'trac-vikram' },
      { simId: 'mr-010', title: 'Turnout renewal at GZB outer', description: 'Turnout renewal at Ghaziabad outer signal. Current turnout causing speed restrictions.', department: 'engineering', category: 'Turnout Renewal', section: 'NDLS-GZB', stationFrom: 'New Delhi', stationTo: 'Ghaziabad', priority: 80, severity: 'high', safetyRisk: 'medium', assetCriticality: 'high', trafficImpact: 'high', isOverdue: false, duration: 200, requestedDate: new Date('2025-01-18'), status: 'assigned', createdBy: 'eng-ramesh' },
      { simId: 'mr-011', title: 'AWS system calibration TDL-MTJ', description: 'Automatic Weather Station calibration and sensor replacement on TDL-MTJ section.', department: 'snt', category: 'AWS Calibration', section: 'TDL-MTJ', stationFrom: 'Tundla', stationTo: 'Mathura', priority: 45, severity: 'low', safetyRisk: 'low', assetCriticality: 'low', trafficImpact: 'low', isOverdue: false, duration: 60, requestedDate: new Date('2025-02-05'), status: 'pending', createdBy: 'snt-amit' },
      { simId: 'mr-012', title: 'Section insulator replacement ALD', description: 'Section insulators at Allahabad feeding post need replacement. Age > 12 years.', department: 'traction', category: 'Insulator Replacement', section: 'ALD-MGS', stationFrom: 'Prayagraj', stationTo: 'Mughal Sarai', priority: 72, severity: 'medium', safetyRisk: 'medium', assetCriticality: 'medium', trafficImpact: 'medium', isOverdue: false, duration: 100, requestedDate: new Date('2025-01-30'), status: 'assigned', createdBy: 'trac-sunil' },
    ]

    for (const mr of mrData) {
      const creatorId = userIdMap[mr.createdBy]
      if (!creatorId) continue

      const existing = await db.maintenanceRequest.findFirst({ where: { title: mr.title } })
      if (!existing) {
        const req = await db.maintenanceRequest.create({
          data: {
            title: mr.title,
            description: mr.description,
            department: mr.department,
            category: mr.category,
            section: mr.section,
            stationFrom: mr.stationFrom,
            stationTo: mr.stationTo,
            priority: mr.priority,
            severity: mr.severity,
            safetyRisk: mr.safetyRisk,
            assetCriticality: mr.assetCriticality,
            trafficImpact: mr.trafficImpact,
            isOverdue: mr.isOverdue,
            duration: mr.duration,
            requestedDate: mr.requestedDate,
            status: mr.status,
            createdBy: creatorId,
          },
        })
        mrIdMap[mr.simId] = req.id
        counts.maintenanceRequests++
      } else {
        mrIdMap[mr.simId] = existing.id
      }
    }

    // --- Seed Blocks ---
    const blockIdMap: Record<string, string> = {}

    const blockData = [
      { simId: 'blk-001', name: 'Block A1 — NDLS-GZB Engineering', section: 'NDLS-GZB', stationFrom: 'New Delhi', stationTo: 'Ghaziabad', startTime: new Date('2025-01-27T01:00:00'), endTime: new Date('2025-01-27T05:00:00'), duration: 240, department: 'engineering', status: 'recommended', planId: 'plan-001', line: 'both', isAiRecommended: true, aiConfidence: 0.89, aiReasoning: 'Low traffic window identified between 01:00-05:00. No passenger train conflicts. Compatible with ongoing S&T work at same section. Asset criticality: critical (overdue track renewal).' },
      { simId: 'blk-002', name: 'Block A2 — NDLS-GZB Combined', section: 'NDLS-GZB', stationFrom: 'New Delhi', stationTo: 'Ghaziabad', startTime: new Date('2025-01-27T01:30:00'), endTime: new Date('2025-01-27T05:30:00'), duration: 240, department: 'combined', status: 'recommended', planId: 'plan-001', line: 'down', isAiRecommended: true, aiConfidence: 0.82, aiReasoning: 'Combined block for Engineering + S&T work. Down line available. UP line remains operational. Goods train 54321 rescheduled. High priority due to overdue items.' },
      { simId: 'blk-003', name: 'Block B1 — ALD-MGS Combined', section: 'ALD-MGS', stationFrom: 'Prayagraj', stationTo: 'Mughal Sarai', startTime: new Date('2025-01-27T02:00:00'), endTime: new Date('2025-01-27T06:00:00'), duration: 240, department: 'combined', status: 'recommended', planId: 'plan-001', line: 'up', isAiRecommended: true, aiConfidence: 0.78, aiReasoning: 'Combined S&T + Traction work. UP line block with diversion via DOWN line. 2 passenger trains affected (rescheduled). Duration covers both activities.' },
      { simId: 'blk-004', name: 'Block C1 — TDL-MTJ S&T', section: 'TDL-MTJ', stationFrom: 'Tundla', stationTo: 'Mathura', startTime: new Date('2025-01-28T01:00:00'), endTime: new Date('2025-01-28T04:00:00'), duration: 180, department: 'snt', status: 'recommended', planId: 'plan-001', line: 'both', isAiRecommended: true, aiConfidence: 0.91, aiReasoning: 'Night block window. No scheduled trains. High safety risk factor (interlocking system). Prioritize to prevent signal failures.' },
      { simId: 'blk-005', name: 'Block D1 — CNB-LKO Traction', section: 'CNB-LKO', stationFrom: 'Kanpur', stationTo: 'Lucknow', startTime: new Date('2025-01-28T02:30:00'), endTime: new Date('2025-01-28T05:00:00'), duration: 150, department: 'traction', status: 'recommended', planId: 'plan-001', line: 'both', isAiRecommended: true, aiConfidence: 0.85, aiReasoning: 'OHE insulator replacement needed. Multiple flashover incidents. Night window selected to minimize traffic impact. Goods train re-routing available.' },
    ]

    for (const blk of blockData) {
      const planId = planIdMap[blk.planId]
      const existing = await db.block.findFirst({ where: { name: blk.name } })
      if (!existing) {
        const block = await db.block.create({
          data: {
            name: blk.name,
            section: blk.section,
            stationFrom: blk.stationFrom,
            stationTo: blk.stationTo,
            startTime: blk.startTime,
            endTime: blk.endTime,
            duration: blk.duration,
            department: blk.department,
            status: blk.status,
            planId: planId || null,
            line: blk.line,
            isAiRecommended: blk.isAiRecommended,
            aiConfidence: blk.aiConfidence,
            aiReasoning: blk.aiReasoning,
          },
        })
        blockIdMap[blk.simId] = block.id
        counts.blocks++
      } else {
        blockIdMap[blk.simId] = existing.id
      }
    }

    // --- Link maintenance requests to blocks ---
    const blockToMRs: Record<string, string[]> = {
      'blk-001': ['mr-001', 'mr-007'],
      'blk-002': ['mr-010'],
      'blk-003': ['mr-005', 'mr-012'],
      'blk-004': ['mr-002'],
      'blk-005': ['mr-003'],
    }

    for (const [blkSimId, mrSimIds] of Object.entries(blockToMRs)) {
      const blockId = blockIdMap[blkSimId]
      if (!blockId) continue
      for (const mrSimId of mrSimIds) {
        const mrId = mrIdMap[mrSimId]
        if (mrId) {
          await db.maintenanceRequest.update({
            where: { id: mrId },
            data: { blockId },
          })
        }
      }
    }

    // --- Seed Conflicts ---
    const conflictData = [
      { type: 'train_conflict', severity: 'critical', blockSimId: 'blk-001', trainName: '12302 Rajdhani Express', trainType: 'passenger', description: 'Rajdhani Express 12302 passes through NDLS-GZB at 03:15. Block window needs adjustment.', resolved: false },
      { type: 'department_conflict', severity: 'warning', blockSimId: 'blk-002', trainName: null, trainType: null, description: 'Engineering and S&T work overlap on DOWN line at NDLS-GZB. Resource sharing required.', resolved: false },
      { type: 'corridor_unavailable', severity: 'warning', blockSimId: 'blk-003', trainName: null, trainType: null, description: 'ALD-MGS UP corridor has scheduled freight movement at 03:00. Block start time may need shift.', resolved: false },
      { type: 'safety_violation', severity: 'critical', blockSimId: null, trainName: null, trainType: null, description: 'Proposed block at NDLS-GZB does not meet minimum 30-minute buffer with approaching Shatabdi Express.', resolved: false },
      { type: 'train_conflict', severity: 'info', blockSimId: 'blk-005', trainName: '56789 Goods Special', trainType: 'goods', description: 'Goods train 56789 can be rerouted via alternative path. Low impact conflict.', resolved: true },
    ]

    for (const c of conflictData) {
      const existing = await db.conflict.findFirst({ where: { description: c.description } })
      if (!existing) {
        await db.conflict.create({
          data: {
            type: c.type,
            severity: c.severity,
            blockId: c.blockSimId ? blockIdMap[c.blockSimId] || null : null,
            trainName: c.trainName,
            trainType: c.trainType,
            description: c.description,
            resolved: c.resolved,
          },
        })
        counts.conflicts++
      }
    }

    // --- Seed Audit Logs ---
    const auditData = [
      { action: 'RUN_OPTIMIZATION', entityType: 'plan', entityId: 'plan-001', userName: 'Jeet', userIdKey: 'planner-rk', details: 'Ran AI optimization for weekly plan Jan 27-Feb 02', planSimId: 'plan-001', blockSimId: null, mrSimId: null, timestamp: new Date('2025-01-26T14:30:00') },
      { action: 'CREATE_REQUEST', entityType: 'request', entityId: 'mr-001', userName: 'Debarshi', userIdKey: 'eng-anil', details: 'Created maintenance request: Track renewal NDLS-GZB', planSimId: null, blockSimId: null, mrSimId: 'mr-001', timestamp: new Date('2025-01-10T09:00:00') },
      { action: 'PRIORITY_SCORED', entityType: 'request', entityId: 'mr-001', userName: 'AI Engine', userIdKey: 'admin', details: 'Priority scored: 92/100. Factors: severity=critical, overdue=true, safetyRisk=high', planSimId: null, blockSimId: null, mrSimId: 'mr-001', timestamp: new Date('2025-01-26T14:31:00') },
      { action: 'CREATE_REQUEST', entityType: 'request', entityId: 'mr-002', userName: 'Rupam', userIdKey: 'snt-priya', details: 'Created S&T request: Signal interlocking at TDL junction', planSimId: null, blockSimId: null, mrSimId: 'mr-002', timestamp: new Date('2025-01-08T10:15:00') },
      { action: 'BLOCK_RECOMMENDED', entityType: 'block', entityId: 'blk-001', userName: 'AI Engine', userIdKey: 'admin', details: 'AI recommended Block A1 for NDLS-GZB Engineering work. Confidence: 89%', planSimId: null, blockSimId: 'blk-001', mrSimId: null, timestamp: new Date('2025-01-26T14:32:00') },
      { action: 'BLOCK_RECOMMENDED', entityType: 'block', entityId: 'blk-003', userName: 'AI Engine', userIdKey: 'admin', details: 'AI recommended combined block B1 for ALD-MGS S&T + Traction. Confidence: 78%', planSimId: null, blockSimId: 'blk-003', mrSimId: null, timestamp: new Date('2025-01-26T14:33:00') },
      { action: 'CONFLICT_DETECTED', entityType: 'conflict', entityId: 'conf-001', userName: 'System', userIdKey: 'admin', details: 'Critical conflict: Rajdhani Express 12302 overlaps with Block A1', planSimId: null, blockSimId: null, mrSimId: null, timestamp: new Date('2025-01-26T14:34:00') },
      { action: 'PLAN_REVIEWED', entityType: 'plan', entityId: 'plan-001', userName: 'Jeet', userIdKey: 'planner-rk', details: 'Planner reviewed AI recommendations for weekly plan', planSimId: 'plan-001', blockSimId: null, mrSimId: null, timestamp: new Date('2025-01-26T15:00:00') },
    ]

    for (const a of auditData) {
      const userId = userIdMap[a.userIdKey]
      const existing = await db.auditLog.findFirst({ where: { action: a.action, details: a.details } })
      if (!existing) {
        await db.auditLog.create({
          data: {
            action: a.action,
            entityType: a.entityType,
            entityId: a.entityId,
            userId: userId || '',
            userName: a.userName,
            details: a.details,
            planId: a.planSimId ? planIdMap[a.planSimId] || null : null,
            blockId: a.blockSimId ? blockIdMap[a.blockSimId] || null : null,
            requestId: a.mrSimId ? mrIdMap[a.mrSimId] || null : null,
            createdAt: a.timestamp,
          },
        })
        counts.auditLogs++
      }
    }

    return NextResponse.json({ success: true, counts })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: 'Failed to seed database', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

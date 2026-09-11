// Simulated railway data for the RailOpt AI MVP
// This data represents realistic Indian Railways scenarios

export interface SimMaintenanceRequest {
  id: string
  title: string
  description: string
  department: 'engineering' | 'snt' | 'traction'
  category: string
  section: string
  stationFrom: string
  stationTo: string
  priority: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  safetyRisk: 'low' | 'medium' | 'high' | 'critical'
  assetCriticality: 'low' | 'medium' | 'high' | 'critical'
  trafficImpact: 'low' | 'medium' | 'high' | 'critical'
  isOverdue: boolean
  duration: number
  requestedDate: string
  status: 'pending' | 'scored' | 'assigned' | 'verified' | 'rejected'
  createdBy: string
  blockId?: string
}

export interface SimBlock {
  id: string
  name: string
  section: string
  stationFrom: string
  stationTo: string
  startTime: string
  endTime: string
  duration: number
  department: string
  status: 'recommended' | 'edited' | 'verified' | 'finalized' | 'approved' | 'rejected'
  planId: string
  line: 'up' | 'down' | 'both'
  isAiRecommended: boolean
  aiConfidence: number
  aiReasoning: string
  maintenanceReqIds: string[]
}

export interface SimConflict {
  id: string
  type: 'train_conflict' | 'department_conflict' | 'corridor_unavailable' | 'safety_violation'
  severity: 'info' | 'warning' | 'critical'
  blockId?: string
  trainName?: string
  trainType?: 'passenger' | 'goods'
  description: string
  resolved: boolean
}

export interface SimPlan {
  id: string
  name: string
  type: 'weekly' | 'monthly'
  startDate: string
  endDate: string
  status: 'draft' | 'optimizing' | 'recommended' | 'reviewed' | 'verified' | 'finalized' | 'approved'
  version: number
  createdBy: string
  blockIds: string[]
}

export interface SimTrain {
  id: string
  name: string
  number: string
  type: 'passenger' | 'goods' | 'express'
  fromStation: string
  toStation: string
  departureTime: string
  arrivalTime: string
  daysOfRun: string[]
}

export interface SimAuditEntry {
  id: string
  action: string
  entityType: string
  entityId: string
  userName: string
  details: string
  timestamp: string
}

// --- Maintenance Requests ---
export const maintenanceRequests: SimMaintenanceRequest[] = [
  {
    id: 'mr-001',
    title: 'Track renewal between NDLS-GZB',
    description: 'Full track renewal required for 2km section. Rails and sleepers have exceeded service life.',
    department: 'engineering',
    category: 'Track Renewal',
    section: 'NDLS-GZB',
    stationFrom: 'New Delhi',
    stationTo: 'Ghaziabad',
    priority: 92,
    severity: 'critical',
    safetyRisk: 'high',
    assetCriticality: 'critical',
    trafficImpact: 'high',
    isOverdue: true,
    duration: 240,
    requestedDate: '2025-01-10',
    status: 'scored',
    createdBy: 'eng-anil',
  },
  {
    id: 'mr-002',
    title: 'Signal interlocking at TDL junction',
    description: 'Electronic interlocking system upgrade. Current relay-based system needs replacement.',
    department: 'snt',
    category: 'Signal Upgradation',
    section: 'TDL-MTJ',
    stationFrom: 'Tundla',
    stationTo: 'Mathura',
    priority: 88,
    severity: 'high',
    safetyRisk: 'high',
    assetCriticality: 'high',
    trafficImpact: 'medium',
    isOverdue: true,
    duration: 180,
    requestedDate: '2025-01-08',
    status: 'scored',
    createdBy: 'snt-priya',
  },
  {
    id: 'mr-003',
    title: 'OHE insulator replacement CNB-LKO',
    description: 'Overhead equipment insulator replacement on both UP and DOWN lines. Multiple flashover incidents reported.',
    department: 'traction',
    category: 'OHE Maintenance',
    section: 'CNB-LKO',
    stationFrom: 'Kanpur',
    stationTo: 'Lucknow',
    priority: 85,
    severity: 'high',
    safetyRisk: 'medium',
    assetCriticality: 'high',
    trafficImpact: 'medium',
    isOverdue: false,
    duration: 150,
    requestedDate: '2025-01-15',
    status: 'pending',
    createdBy: 'trac-vikram',
  },
  {
    id: 'mr-004',
    title: 'Bridge inspection BPL-JHS section',
    description: 'Annual bridge inspection for 3 major bridges. One bridge reported minor settlement.',
    department: 'engineering',
    category: 'Bridge Inspection',
    section: 'BPL-JHS',
    stationFrom: 'Bhopal',
    stationTo: 'Jhansi',
    priority: 78,
    severity: 'medium',
    safetyRisk: 'medium',
    assetCriticality: 'high',
    trafficImpact: 'low',
    isOverdue: false,
    duration: 120,
    requestedDate: '2025-01-20',
    status: 'pending',
    createdBy: 'eng-ramesh',
  },
  {
    id: 'mr-005',
    title: 'Point machine replacement at ALD',
    description: '5 point machines at Allahabad junction need replacement. Age > 15 years.',
    department: 'snt',
    category: 'Point Machine',
    section: 'ALD-MGS',
    stationFrom: 'Prayagraj',
    stationTo: 'Mughal Sarai',
    priority: 75,
    severity: 'medium',
    safetyRisk: 'medium',
    assetCriticality: 'medium',
    trafficImpact: 'medium',
    isOverdue: false,
    duration: 180,
    requestedDate: '2025-01-22',
    status: 'assigned',
    createdBy: 'snt-amit',
    blockId: 'blk-003',
  },
  {
    id: 'mr-006',
    title: 'Tension regulation device adjustment',
    description: 'Tension regulation devices on 4 spans need adjustment before summer season.',
    department: 'traction',
    category: 'TRD Maintenance',
    section: 'NDLS-GZB',
    stationFrom: 'New Delhi',
    stationTo: 'Ghaziabad',
    priority: 70,
    severity: 'medium',
    safetyRisk: 'low',
    assetCriticality: 'medium',
    trafficImpact: 'low',
    isOverdue: false,
    duration: 90,
    requestedDate: '2025-01-25',
    status: 'pending',
    createdBy: 'trac-sunil',
  },
  {
    id: 'mr-007',
    title: 'Deep screening NDLS-AGC section',
    description: 'Deep screening and tamping required for 5km stretch. Track geometry index deteriorating.',
    department: 'engineering',
    category: 'Track Maintenance',
    section: 'NDLS-AGC',
    stationFrom: 'New Delhi',
    stationTo: 'Agra',
    priority: 82,
    severity: 'high',
    safetyRisk: 'medium',
    assetCriticality: 'high',
    trafficImpact: 'high',
    isOverdue: true,
    duration: 300,
    requestedDate: '2025-01-05',
    status: 'assigned',
    createdBy: 'eng-anil',
    blockId: 'blk-001',
  },
  {
    id: 'mr-008',
    title: 'Cable replacement at CNB yard',
    description: 'Signaling cable replacement in Kanpur yard. Frequent cable faults causing signal failures.',
    department: 'snt',
    category: 'Cable Replacement',
    section: 'CNB-LKO',
    stationFrom: 'Kanpur',
    stationTo: 'Lucknow',
    priority: 65,
    severity: 'medium',
    safetyRisk: 'low',
    assetCriticality: 'medium',
    trafficImpact: 'low',
    isOverdue: false,
    duration: 120,
    requestedDate: '2025-01-28',
    status: 'pending',
    createdBy: 'snt-priya',
  },
  {
    id: 'mr-009',
    title: 'OHE pole foundation repair BPL',
    description: '3 OHE poles showing foundation settlement near Bhopal station approach.',
    department: 'traction',
    category: 'OHE Structure',
    section: 'BPL-JHS',
    stationFrom: 'Bhopal',
    stationTo: 'Jhansi',
    priority: 60,
    severity: 'low',
    safetyRisk: 'medium',
    assetCriticality: 'medium',
    trafficImpact: 'low',
    isOverdue: false,
    duration: 180,
    requestedDate: '2025-02-01',
    status: 'pending',
    createdBy: 'trac-vikram',
  },
  {
    id: 'mr-010',
    title: 'Turnout renewal at GZB outer',
    description: 'Turnout renewal at Ghaziabad outer signal. Current turnout causing speed restrictions.',
    department: 'engineering',
    category: 'Turnout Renewal',
    section: 'NDLS-GZB',
    stationFrom: 'New Delhi',
    stationTo: 'Ghaziabad',
    priority: 80,
    severity: 'high',
    safetyRisk: 'medium',
    assetCriticality: 'high',
    trafficImpact: 'high',
    isOverdue: false,
    duration: 200,
    requestedDate: '2025-01-18',
    status: 'assigned',
    createdBy: 'eng-ramesh',
    blockId: 'blk-002',
  },
  {
    id: 'mr-011',
    title: 'AWS system calibration TDL-MTJ',
    description: 'Automatic Weather Station calibration and sensor replacement on TDL-MTJ section.',
    department: 'snt',
    category: 'AWS Calibration',
    section: 'TDL-MTJ',
    stationFrom: 'Tundla',
    stationTo: 'Mathura',
    priority: 45,
    severity: 'low',
    safetyRisk: 'low',
    assetCriticality: 'low',
    trafficImpact: 'low',
    isOverdue: false,
    duration: 60,
    requestedDate: '2025-02-05',
    status: 'pending',
    createdBy: 'snt-amit',
  },
  {
    id: 'mr-012',
    title: 'Section insulator replacement ALD',
    description: 'Section insulators at Allahabad feeding post need replacement. Age > 12 years.',
    department: 'traction',
    category: 'Insulator Replacement',
    section: 'ALD-MGS',
    stationFrom: 'Prayagraj',
    stationTo: 'Mughal Sarai',
    priority: 72,
    severity: 'medium',
    safetyRisk: 'medium',
    assetCriticality: 'medium',
    trafficImpact: 'medium',
    isOverdue: false,
    duration: 100,
    requestedDate: '2025-01-30',
    status: 'assigned',
    createdBy: 'trac-sunil',
    blockId: 'blk-003',
  },
]

// --- Blocks ---
export const blocks: SimBlock[] = [
  {
    id: 'blk-001',
    name: 'Block A1 — NDLS-GZB Engineering',
    section: 'NDLS-GZB',
    stationFrom: 'New Delhi',
    stationTo: 'Ghaziabad',
    startTime: '2025-01-27T01:00:00',
    endTime: '2025-01-27T05:00:00',
    duration: 240,
    department: 'engineering',
    status: 'recommended',
    planId: 'plan-001',
    line: 'both',
    isAiRecommended: true,
    aiConfidence: 0.89,
    aiReasoning: 'Low traffic window identified between 01:00-05:00. No passenger train conflicts. Compatible with ongoing S&T work at same section. Asset criticality: critical (overdue track renewal).',
    maintenanceReqIds: ['mr-001', 'mr-007'],
  },
  {
    id: 'blk-002',
    name: 'Block A2 — NDLS-GZB Combined',
    section: 'NDLS-GZB',
    stationFrom: 'New Delhi',
    stationTo: 'Ghaziabad',
    startTime: '2025-01-27T01:30:00',
    endTime: '2025-01-27T05:30:00',
    duration: 240,
    department: 'combined',
    status: 'recommended',
    planId: 'plan-001',
    line: 'down',
    isAiRecommended: true,
    aiConfidence: 0.82,
    aiReasoning: 'Combined block for Engineering + S&T work. Down line available. UP line remains operational. Goods train 54321 rescheduled. High priority due to overdue items.',
    maintenanceReqIds: ['mr-010'],
  },
  {
    id: 'blk-003',
    name: 'Block B1 — ALD-MGS Combined',
    section: 'ALD-MGS',
    stationFrom: 'Prayagraj',
    stationTo: 'Mughal Sarai',
    startTime: '2025-01-27T02:00:00',
    endTime: '2025-01-27T06:00:00',
    duration: 240,
    department: 'combined',
    status: 'recommended',
    planId: 'plan-001',
    line: 'up',
    isAiRecommended: true,
    aiConfidence: 0.78,
    aiReasoning: 'Combined S&T + Traction work. UP line block with diversion via DOWN line. 2 passenger trains affected (rescheduled). Duration covers both activities.',
    maintenanceReqIds: ['mr-005', 'mr-012'],
  },
  {
    id: 'blk-004',
    name: 'Block C1 — TDL-MTJ S&T',
    section: 'TDL-MTJ',
    stationFrom: 'Tundla',
    stationTo: 'Mathura',
    startTime: '2025-01-28T01:00:00',
    endTime: '2025-01-28T04:00:00',
    duration: 180,
    department: 'snt',
    status: 'recommended',
    planId: 'plan-001',
    line: 'both',
    isAiRecommended: true,
    aiConfidence: 0.91,
    aiReasoning: 'Night block window. No scheduled trains. High safety risk factor (interlocking system). Prioritize to prevent signal failures.',
    maintenanceReqIds: ['mr-002'],
  },
  {
    id: 'blk-005',
    name: 'Block D1 — CNB-LKO Traction',
    section: 'CNB-LKO',
    stationFrom: 'Kanpur',
    stationTo: 'Lucknow',
    startTime: '2025-01-28T02:30:00',
    endTime: '2025-01-28T05:00:00',
    duration: 150,
    department: 'traction',
    status: 'recommended',
    planId: 'plan-001',
    line: 'both',
    isAiRecommended: true,
    aiConfidence: 0.85,
    aiReasoning: 'OHE insulator replacement needed. Multiple flashover incidents. Night window selected to minimize traffic impact. Goods train re-routing available.',
    maintenanceReqIds: ['mr-003'],
  },
]

// --- Conflicts ---
export const conflicts: SimConflict[] = [
  {
    id: 'conf-001',
    type: 'train_conflict',
    severity: 'critical',
    blockId: 'blk-001',
    trainName: '12302 Rajdhani Express',
    trainType: 'passenger',
    description: 'Rajdhani Express 12302 passes through NDLS-GZB at 03:15. Block window needs adjustment.',
    resolved: false,
  },
  {
    id: 'conf-002',
    type: 'department_conflict',
    severity: 'warning',
    blockId: 'blk-002',
    description: 'Engineering and S&T work overlap on DOWN line at NDLS-GZB. Resource sharing required.',
    resolved: false,
  },
  {
    id: 'conf-003',
    type: 'corridor_unavailable',
    severity: 'warning',
    blockId: 'blk-003',
    description: 'ALD-MGS UP corridor has scheduled freight movement at 03:00. Block start time may need shift.',
    resolved: false,
  },
  {
    id: 'conf-004',
    type: 'safety_violation',
    severity: 'critical',
    description: 'Proposed block at NDLS-GZB does not meet minimum 30-minute buffer with approaching Shatabdi Express.',
    resolved: false,
  },
  {
    id: 'conf-005',
    type: 'train_conflict',
    severity: 'info',
    blockId: 'blk-005',
    trainName: '56789 Goods Special',
    trainType: 'goods',
    description: 'Goods train 56789 can be rerouted via alternative path. Low impact conflict.',
    resolved: true,
  },
]

// --- Plans ---
export const plans: SimPlan[] = [
  {
    id: 'plan-001',
    name: 'Weekly Block Plan — Jan 27-Feb 02, 2025',
    type: 'weekly',
    startDate: '2025-01-27',
    endDate: '2025-02-02',
    status: 'recommended',
    version: 1,
    createdBy: 'planner-rk',
    blockIds: ['blk-001', 'blk-002', 'blk-003', 'blk-004', 'blk-005'],
  },
  {
    id: 'plan-002',
    name: 'Monthly Block Plan — February 2025',
    type: 'monthly',
    startDate: '2025-02-01',
    endDate: '2025-02-28',
    status: 'draft',
    version: 1,
    createdBy: 'planner-rk',
    blockIds: [],
  },
]

// --- Trains ---
export const trains: SimTrain[] = [
  { id: 'tr-001', name: 'Rajdhani Express', number: '12302', type: 'express', fromStation: 'New Delhi', toStation: 'Howrah', departureTime: '03:15', arrivalTime: '12:20', daysOfRun: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
  { id: 'tr-002', name: 'Shatabdi Express', number: '12002', type: 'express', fromStation: 'New Delhi', toStation: 'Bhopal', departureTime: '06:00', arrivalTime: '14:15', daysOfRun: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] },
  { id: 'tr-003', name: 'Duronto Express', number: '12260', type: 'express', fromStation: 'New Delhi', toStation: 'Sealdah', departureTime: '20:40', arrivalTime: '06:15', daysOfRun: ['Mon', 'Wed', 'Fri'] },
  { id: 'tr-004', name: 'Garib Rath', number: '12256', type: 'passenger', fromStation: 'New Delhi', toStation: 'Kanpur', departureTime: '22:30', arrivalTime: '06:30', daysOfRun: ['Tue', 'Thu', 'Sat'] },
  { id: 'tr-005', name: 'Goods Special', number: '56789', type: 'goods', fromStation: 'Tundla', toStation: 'Mughal Sarai', departureTime: '01:30', arrivalTime: '08:00', daysOfRun: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
  { id: 'tr-006', name: 'Vande Bharat', number: '22436', type: 'express', fromStation: 'New Delhi', toStation: 'Varanasi', departureTime: '06:00', arrivalTime: '14:00', daysOfRun: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
  { id: 'tr-007', name: 'Freight Express', number: '54321', type: 'goods', fromStation: 'Kanpur', toStation: 'Lucknow', departureTime: '02:00', arrivalTime: '05:00', daysOfRun: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
]

// --- Audit Log ---
export const auditEntries: SimAuditEntry[] = [
  { id: 'al-001', action: 'RUN_OPTIMIZATION', entityType: 'plan', entityId: 'plan-001', userName: 'Jeet', details: 'Ran AI optimization for weekly plan Jan 27-Feb 02', timestamp: '2025-01-26T14:30:00' },
  { id: 'al-002', action: 'CREATE_REQUEST', entityType: 'request', entityId: 'mr-001', userName: 'Debarshi', details: 'Created maintenance request: Track renewal NDLS-GZB', timestamp: '2025-01-10T09:00:00' },
  { id: 'al-003', action: 'PRIORITY_SCORED', entityType: 'request', entityId: 'mr-001', userName: 'AI Engine', details: 'Priority scored: 92/100. Factors: severity=critical, overdue=true, safetyRisk=high', timestamp: '2025-01-26T14:31:00' },
  { id: 'al-004', action: 'CREATE_REQUEST', entityType: 'request', entityId: 'mr-002', userName: 'Rupam', details: 'Created S&T request: Signal interlocking at TDL junction', timestamp: '2025-01-08T10:15:00' },
  { id: 'al-005', action: 'BLOCK_RECOMMENDED', entityType: 'block', entityId: 'blk-001', userName: 'AI Engine', details: 'AI recommended Block A1 for NDLS-GZB Engineering work. Confidence: 89%', timestamp: '2025-01-26T14:32:00' },
  { id: 'al-006', action: 'BLOCK_RECOMMENDED', entityType: 'block', entityId: 'blk-003', userName: 'AI Engine', details: 'AI recommended combined block B1 for ALD-MGS S&T + Traction. Confidence: 78%', timestamp: '2025-01-26T14:33:00' },
  { id: 'al-007', action: 'CONFLICT_DETECTED', entityType: 'conflict', entityId: 'conf-001', userName: 'System', details: 'Critical conflict: Rajdhani Express 12302 overlaps with Block A1', timestamp: '2025-01-26T14:34:00' },
  { id: 'al-008', action: 'PLAN_REVIEWED', entityType: 'plan', entityId: 'plan-001', userName: 'Jeet', details: 'Planner reviewed AI recommendations for weekly plan', timestamp: '2025-01-26T15:00:00' },
]

// --- KPI data ---
export const kpiData = {
  totalRequests: 12,
  pendingRequests: 6,
  overdueRequests: 3,
  criticalConflicts: 2,
  totalBlocks: 5,
  approvedBlocks: 0,
  combinedBlocks: 2,
  assetAvailability: 87.3,
  blockUtilization: 72.5,
  trainDisruption: 4,
  activePlans: 2,
  verifiedBlocks: 0,
}

// Department summary
export const departmentSummary = [
  { department: 'Engineering', code: 'engineering', requests: 4, assigned: 3, color: '#2563EB' },
  { department: 'Signal & Telecom', code: 'snt', requests: 4, assigned: 2, color: '#0EA5A4' },
  { department: 'Traction Distribution', code: 'traction', requests: 4, assigned: 2, color: '#B77900' },
]

// Section/Corridor data
export const corridors = [
  { id: 'cor-1', name: 'NDLS-GZB', fullName: 'New Delhi — Ghaziabad', lineKm: 28, blocks: 2, availability: 82 },
  { id: 'cor-2', name: 'TDL-MTJ', fullName: 'Tundla — Mathura', lineKm: 65, blocks: 1, availability: 91 },
  { id: 'cor-3', name: 'CNB-LKO', fullName: 'Kanpur — Lucknow', lineKm: 72, blocks: 1, availability: 88 },
  { id: 'cor-4', name: 'ALD-MGS', fullName: 'Prayagraj — Mughal Sarai', lineKm: 95, blocks: 1, availability: 75 },
  { id: 'cor-5', name: 'BPL-JHS', fullName: 'Bhopal — Jhansi', lineKm: 180, blocks: 0, availability: 95 },
  { id: 'cor-6', name: 'NDLS-AGC', fullName: 'New Delhi — Agra', lineKm: 195, blocks: 0, availability: 90 },
]

// Railway Network Map corridor data (NDLS–CSMT North-South corridor)
export interface NetworkCorridor {
  id: string
  from: string
  to: string
  fromFull: string
  toFull: string
  availability: number
  activeBlocks: number
  lineKm: number
}

export const networkCorridors: NetworkCorridor[] = [
  { id: 'nc-1', from: 'NDLS', to: 'AGC', fromFull: 'New Delhi', toFull: 'Agra', availability: 87, activeBlocks: 1, lineKm: 195 },
  { id: 'nc-2', from: 'AGC', to: 'BPL', fromFull: 'Agra', toFull: 'Bhopal', availability: 92, activeBlocks: 0, lineKm: 405 },
  { id: 'nc-3', from: 'BPL', to: 'NGP', fromFull: 'Bhopal', toFull: 'Nagpur', availability: 78, activeBlocks: 1, lineKm: 350 },
  { id: 'nc-4', from: 'NGP', to: 'SC', fromFull: 'Nagpur', toFull: 'Secunderabad', availability: 85, activeBlocks: 0, lineKm: 500 },
  { id: 'nc-5', from: 'SC', to: 'CSMT', fromFull: 'Secunderabad', toFull: 'Mumbai CSMT', availability: 95, activeBlocks: 0, lineKm: 710 },
]

import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireRole, PROTECTED_USER_EMAILS } from '@/lib/auth-guard'
import { logAudit } from '@/lib/audit'

const ALLOWED_ROLES = ['admin', 'planner', 'control_office', 'engineering', 'snt', 'traction']

function serializeUser(u: {
  id: string
  email: string
  name: string
  role: string
  department: string | null
  isActive: boolean
  createdAt: Date
}) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    department: u.department ?? 'Operations',
    status: u.isActive ? 'active' : 'inactive',
    invited: true,
    createdAt: u.createdAt,
  }
}

/**
 * GET /api/users — list invited (non-team) users for the Settings → Users tab (admin).
 * Team/seed accounts are managed in code and are never returned here.
 */
export async function GET() {
  const session = await requireAuth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = requireRole(session, ['admin'])
  if (!role) return NextResponse.json({ error: 'Forbidden — requires admin role' }, { status: 403 })

  try {
    const users = await db.user.findMany({
      where: { email: { notIn: [...PROTECTED_USER_EMAILS] } },
      orderBy: { createdAt: 'desc' },
    })
    const data = users.map(serializeUser)
    return NextResponse.json({ data, count: data.length })
  } catch (error) {
    console.error('Users GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

/**
 * POST /api/users — invite a user (admin). Creates a durable Prisma User row
 * and writes a USER_INVITED audit entry.
 */
export async function POST(request: NextRequest) {
  const session = await requireAuth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = requireRole(session, ['admin'])
  if (!role) return NextResponse.json({ error: 'Forbidden — requires admin role' }, { status: 403 })

  try {
    const body = await request.json()
    const { name, email, role: userRole, department } = body ?? {}

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase())) {
      return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 })
    }
    if (userRole && !ALLOWED_ROLES.includes(userRole)) {
      return NextResponse.json(
        { error: `Role must be one of: ${ALLOWED_ROLES.join(', ')}` },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()
    const existing = await db.user.findUnique({ where: { email: normalizedEmail } })
    if (existing) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      )
    }

    const user = await db.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        role: typeof userRole === 'string' && userRole ? userRole : 'planner',
        department: typeof department === 'string' && department.trim() ? department.trim() : 'Operations',
        isActive: true,
      },
    })

    void logAudit(session, {
      action: 'USER_INVITED',
      entityType: 'user',
      entityId: user.id,
      details: `Invited ${user.name} (${user.email}) as ${userRole ?? 'planner'}${department ? ` · ${department}` : ''}`,
    })

    return NextResponse.json({ data: serializeUser(user) }, { status: 201 })
  } catch (error) {
    console.error('Users POST error:', error)
    return NextResponse.json({ error: 'Failed to invite user' }, { status: 500 })
  }
}

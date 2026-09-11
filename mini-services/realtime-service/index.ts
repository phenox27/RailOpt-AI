import { Server } from 'socket.io'

const PORT = 3003

const io = new Server(PORT, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})

// Track connected users
interface ConnectedUser {
  id: string
  name: string
  role: string
  rooms: Set<string>
}
const connectedUsers = new Map<string, ConnectedUser>()

// Simulated data for periodic events
const BLOCK_NAMES = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2']
const CORRIDORS = ['NDLS-AGC', 'AGC-BRC', 'BRC-ADI', 'NDLS-MGS', 'MGS-HWH']
const STATUSES = ['approved', 'rejected', 'optimizing', 'pending']
const PLAN_STATUSES = ['draft', 'under_review', 'approved', 'executing', 'completed']

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

io.on('connection', (socket) => {
  console.log(`[connect] socket=${socket.id}`)

  // Initialize user entry
  connectedUsers.set(socket.id, { id: socket.id, name: '', role: '', rooms: new Set() })

  // User joins with their identity
  socket.on('user-join', (data: { role: string; name: string }) => {
    const user = connectedUsers.get(socket.id)
    if (user) {
      user.name = data.name || 'Unknown'
      user.role = data.role || 'unknown'
    }
    console.log(`[user-join] socket=${socket.id} name=${data.name} role=${data.role}`)

    // Notify others that a new user joined
    socket.broadcast.emit('notification', {
      type: 'notification',
      payload: { message: `${data.name} (${data.role}) joined the session` },
      from: { userId: socket.id, userName: data.name, role: data.role },
      timestamp: new Date().toISOString(),
    })
  })

  // User leaves
  socket.on('user-leave', (data: { role: string; name: string }) => {
    console.log(`[user-leave] socket=${socket.id} name=${data.name} role=${data.role}`)
  })

  // Join a room (e.g., a corridor or section)
  socket.on('join-room', (roomId: string) => {
    socket.join(roomId)
    const user = connectedUsers.get(socket.id)
    if (user) {
      user.rooms.add(roomId)
    }
    console.log(`[join-room] socket=${socket.id} room=${roomId}`)
    // Notify room members
    socket.to(roomId).emit('notification', {
      type: 'notification',
      payload: { message: `${user?.name || 'A user'} joined room ${roomId}` },
      from: { userId: socket.id, userName: user?.name || '', role: user?.role || '' },
      timestamp: new Date().toISOString(),
    })
  })

  // Leave a room
  socket.on('leave-room', (roomId: string) => {
    socket.leave(roomId)
    const user = connectedUsers.get(socket.id)
    if (user) {
      user.rooms.delete(roomId)
    }
    console.log(`[leave-room] socket=${socket.id} room=${roomId}`)
  })

  // Block update event
  socket.on('block-update', (data: {
    type: string
    payload: Record<string, unknown>
    from: { userId: string; userName: string; role: string }
    timestamp: string
  }) => {
    console.log(`[block-update] from=${data.from.userName} block=${data.payload.blockId}`)
    // Broadcast to all clients (including sender for confirmation)
    io.emit('block-update', data)
  })

  // Conflict detected event
  socket.on('conflict-detected', (data: {
    type: string
    payload: Record<string, unknown>
    from: { userId: string; userName: string; role: string }
    timestamp: string
  }) => {
    console.log(`[conflict-detected] from=${data.from.userName} corridor=${data.payload.corridor}`)
    io.emit('conflict-detected', data)
  })

  // Plan update event
  socket.on('plan-update', (data: {
    type: string
    payload: Record<string, unknown>
    from: { userId: string; userName: string; role: string }
    timestamp: string
  }) => {
    console.log(`[plan-update] from=${data.from.userName} planId=${data.payload.planId}`)
    io.emit('plan-update', data)
  })

  // Maintenance update event
  socket.on('maintenance-update', (data: {
    type: string
    payload: Record<string, unknown>
    from: { userId: string; userName: string; role: string }
    timestamp: string
  }) => {
    console.log(`[maintenance-update] from=${data.from.userName} requestId=${data.payload.requestId}`)
    io.emit('maintenance-update', data)
  })

  // Notification event (target specific roles or broadcast)
  socket.on('notification', (data: {
    type: string
    payload: Record<string, unknown>
    from: { userId: string; userName: string; role: string }
    timestamp: string
    targetRole?: string
  }) => {
    console.log(`[notification] from=${data.from.userName} targetRole=${data.targetRole || 'all'}`)
    if (data.targetRole) {
      // Send to users with the target role only
      for (const [sid, user] of connectedUsers) {
        if (user.role === data.targetRole && sid !== socket.id) {
          io.to(sid).emit('notification', data)
        }
      }
    } else {
      // Broadcast to all
      io.emit('notification', data)
    }
  })

  // Typing event (collaborative editing awareness)
  socket.on('typing', (data: {
    type: string
    payload: Record<string, unknown>
    from: { userId: string; userName: string; role: string }
    timestamp: string
  }) => {
    // Broadcast to room members or everyone else
    const user = connectedUsers.get(socket.id)
    const roomId = data.payload.roomId as string | undefined
    if (roomId) {
      socket.to(roomId).emit('typing', data)
    } else {
      socket.broadcast.emit('typing', data)
    }
  })

  // Handle disconnection
  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id)
    console.log(`[disconnect] socket=${socket.id} name=${user?.name} role=${user?.role}`)
    if (user) {
      // Notify others
      socket.broadcast.emit('notification', {
        type: 'notification',
        payload: { message: `${user.name} (${user.role}) left the session` },
        from: { userId: socket.id, userName: user.name, role: user.role },
        timestamp: new Date().toISOString(),
      })
    }
    connectedUsers.delete(socket.id)
  })
})

// Periodic simulated events — every 30 seconds: random notification
setInterval(() => {
  const block = randomItem(BLOCK_NAMES)
  const corridor = randomItem(CORRIDORS)
  const messages = [
    `Block ${block} optimization complete on ${corridor}`,
    `New conflict detected on ${corridor} corridor`,
    `Block ${block} status changed to ${randomItem(STATUSES)}`,
    `Maintenance window available on ${corridor}`,
  ]
  const message = randomItem(messages)
  const isConflict = message.includes('conflict')

  io.emit(isConflict ? 'conflict-detected' : 'notification', {
    type: isConflict ? 'conflict-detected' : 'notification',
    payload: {
      message,
      description: isConflict ? `Conflict on ${corridor} — please review timetable` : message,
      blockId: block,
      corridor,
    },
    from: { userId: 'system', userName: 'System', role: 'system' },
    timestamp: new Date().toISOString(),
  })

  console.log(`[simulated] ${isConflict ? 'conflict-detected' : 'notification'}: ${message}`)
}, 30_000)

// Every 60 seconds: random plan-update
setInterval(() => {
  const planId = `PLAN-${String(Math.floor(Math.random() * 5) + 1).padStart(3, '0')}`
  const newStatus = randomItem(PLAN_STATUSES)

  io.emit('plan-update', {
    type: 'plan-update',
    payload: {
      planId,
      newStatus,
      message: `Plan ${planId} status changed to ${newStatus}`,
    },
    from: { userId: 'system', userName: 'System', role: 'system' },
    timestamp: new Date().toISOString(),
  })

  console.log(`[simulated] plan-update: ${planId} → ${newStatus}`)
}, 60_000)

console.log(`🚀 RailOpt AI Real-Time Service running on port ${PORT}`)

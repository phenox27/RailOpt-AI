'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAppStore } from '@/store/app-store'
import { toast } from 'sonner'

// Real-time event types
export interface RealtimeEvent {
  type: 'block-update' | 'conflict-detected' | 'plan-update' | 'maintenance-update' | 'notification' | 'typing'
  payload: Record<string, unknown>
  from: { userId: string; userName: string; role: string }
  timestamp: string
}

export function useRealtime() {
  const { currentRole, currentUserName } = useAppStore()
  const socketRef = useRef<Socket | null>(null)
  const listenersRef = useRef<Map<string, Set<(event: RealtimeEvent) => void>>>(new Map())
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const socket = io('/?XTransformPort=3003', {
      transports: ['websocket'],
      autoConnect: true,
    })

    socket.on('connect', () => {
      setIsConnected(true)
      socket.emit('user-join', { role: currentRole, name: currentUserName })
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    socket.on('notification', (data: RealtimeEvent) => {
      // Show toast for important notifications
      if (data.from.userId === 'system') {
        // System-generated notifications
        if (data.type === 'conflict-detected') {
          toast.error('New Conflict Detected', {
            description: String(data.payload.description || 'Check timetable view'),
          })
        } else if (data.type === 'notification') {
          toast.info('Real-Time Update', {
            description: String(data.payload.message || 'New update received'),
          })
        }
      }
    })

    socket.on('conflict-detected', (data: RealtimeEvent) => {
      if (data.from.userId === 'system') {
        toast.error('New Conflict Detected', {
          description: String(data.payload.description || 'Check timetable view'),
        })
      }
    })

    socket.on('plan-update', (data: RealtimeEvent) => {
      if (data.from.userId === 'system') {
        toast.info('Plan Update', {
          description: String(data.payload.message || 'Plan status changed'),
        })
      }
    })

    // Dispatch events to all registered listeners
    const eventTypes = [
      'block-update',
      'conflict-detected',
      'plan-update',
      'maintenance-update',
      'notification',
      'typing',
    ] as const

    eventTypes.forEach((type) => {
      socket.on(type, (data: RealtimeEvent) => {
        const listeners = listenersRef.current.get(type)
        if (listeners) {
          listeners.forEach((fn) => fn(data))
        }
      })
    })

    socketRef.current = socket

    return () => {
      socket.emit('user-leave', { role: currentRole, name: currentUserName })
      socket.disconnect()
      setIsConnected(false)
    }
  }, [currentRole, currentUserName])

  const subscribe = useCallback(
    (eventType: string, callback: (event: RealtimeEvent) => void) => {
      if (!listenersRef.current.has(eventType)) {
        listenersRef.current.set(eventType, new Set())
      }
      listenersRef.current.get(eventType)!.add(callback)
      return () => {
        listenersRef.current.get(eventType)?.delete(callback)
      }
    },
    []
  )

  const joinRoom = useCallback((roomId: string) => {
    socketRef.current?.emit('join-room', roomId)
  }, [])

  const leaveRoom = useCallback((roomId: string) => {
    socketRef.current?.emit('leave-room', roomId)
  }, [])

  const emitEvent = useCallback(
    (type: string, payload: Record<string, unknown>) => {
      socketRef.current?.emit(type, {
        type,
        payload,
        from: { userId: 'current', userName: currentUserName, role: currentRole },
        timestamp: new Date().toISOString(),
      })
    },
    [currentRole, currentUserName]
  )

  return { subscribe, joinRoom, leaveRoom, emitEvent, isConnected }
}

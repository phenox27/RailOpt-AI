// Offline Sync Engine for RailOpt AI
// Manages local storage persistence and conflict resolution

export interface PendingChange {
  id: string
  type: 'create' | 'update' | 'delete'
  entityType: 'maintenanceRequest' | 'block' | 'plan' | 'conflict'
  entityId: string
  data: Record<string, unknown>
  timestamp: string
  synced: boolean
}

export interface SyncConflict {
  id: string
  entityType: string
  entityId: string
  localData: Record<string, unknown>
  serverData: Record<string, unknown>
  localTimestamp: string
  serverTimestamp: string
  resolved: boolean
  resolution?: 'keep_local' | 'keep_server' | 'merged'
  mergedData?: Record<string, unknown>
}

export interface OfflineState {
  lastSyncTime: string | null
  pendingChanges: PendingChange[]
  conflicts: SyncConflict[]
  isSyncing: boolean
}

const STORAGE_KEY = 'railopt-offline-sync'
const STATE_KEY = 'railopt-offline-state'

// Generate a unique ID for changes
function generateId(): string {
  return `chg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// ---- Local Storage Manager ----

export function saveToLocalStorage(key: string, data: unknown): void {
  try {
    localStorage.setItem(`${STORAGE_KEY}-${key}`, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save to localStorage:', e)
  }
}

export function loadFromLocalStorage<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(`${STORAGE_KEY}-${key}`)
    return item ? JSON.parse(item) : null
  } catch {
    return null
  }
}

export function removeFromLocalStorage(key: string): void {
  try {
    localStorage.removeItem(`${STORAGE_KEY}-${key}`)
  } catch {
    // ignore
  }
}

// ---- Offline State Management ----

export function getOfflineState(): OfflineState {
  try {
    const state = localStorage.getItem(STATE_KEY)
    if (state) return JSON.parse(state)
  } catch {
    // ignore
  }
  return {
    lastSyncTime: null,
    pendingChanges: [],
    conflicts: [],
    isSyncing: false,
  }
}

export function setOfflineState(state: OfflineState): void {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state))
  } catch (e) {
    console.error('Failed to save offline state:', e)
  }
}

// ---- Pending Change Queue ----

export function queueChange(
  type: PendingChange['type'],
  entityType: PendingChange['entityType'],
  entityId: string,
  data: Record<string, unknown>
): PendingChange {
  const change: PendingChange = {
    id: generateId(),
    type,
    entityType,
    entityId,
    data,
    timestamp: new Date().toISOString(),
    synced: false,
  }

  const state = getOfflineState()
  state.pendingChanges.push(change)
  setOfflineState(state)

  return change
}

export function getPendingChanges(): PendingChange[] {
  return getOfflineState().pendingChanges.filter((c) => !c.synced)
}

export function getPendingChangeCount(): number {
  return getPendingChanges().length
}

export function markChangeSynced(changeId: string): void {
  const state = getOfflineState()
  const change = state.pendingChanges.find((c) => c.id === changeId)
  if (change) {
    change.synced = true
    setOfflineState(state)
  }
}

export function clearSyncedChanges(): void {
  const state = getOfflineState()
  state.pendingChanges = state.pendingChanges.filter((c) => !c.synced)
  setOfflineState(state)
}

export function clearAllPendingChanges(): void {
  const state = getOfflineState()
  state.pendingChanges = []
  setOfflineState(state)
}

// ---- Sync Engine ----

export interface SyncResult {
  success: boolean
  syncedCount: number
  conflictCount: number
  errors: string[]
}

export async function syncPendingChanges(): Promise<SyncResult> {
  const state = getOfflineState()
  const pending = state.pendingChanges.filter((c) => !c.synced)

  if (pending.length === 0) {
    return { success: true, syncedCount: 0, conflictCount: 0, errors: [] }
  }

  // Mark as syncing
  state.isSyncing = true
  setOfflineState(state)

  let syncedCount = 0
  let conflictCount = 0
  const errors: string[] = []

  for (const change of pending) {
    try {
      // Determine API endpoint based on entity type
      const endpoint = getApiEndpoint(change.entityType, change.entityId)
      const method = change.type === 'create' ? 'POST' : change.type === 'delete' ? 'DELETE' : 'PATCH'

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: change.type === 'delete' ? undefined : JSON.stringify(change.data),
      })

      if (res.ok) {
        markChangeSynced(change.id)
        syncedCount++
      } else if (res.status === 409) {
        // Conflict detected — compare server data with local data
        const serverData = await res.json()
        const conflict: SyncConflict = {
          id: `conf-${generateId()}`,
          entityType: change.entityType,
          entityId: change.entityId,
          localData: change.data,
          serverData: serverData.data || serverData,
          localTimestamp: change.timestamp,
          serverTimestamp: serverData.updatedAt || new Date().toISOString(),
          resolved: false,
        }
        state.conflicts.push(conflict)
        conflictCount++
      } else {
        errors.push(`Failed to sync ${change.type} ${change.entityType}/${change.entityId}: ${res.status}`)
      }
    } catch (err) {
      errors.push(`Network error syncing ${change.entityType}/${change.entityId}`)
    }
  }

  // Update state
  const finalState = getOfflineState()
  finalState.isSyncing = false
  finalState.lastSyncTime = new Date().toISOString()
  if (conflictCount > 0) {
    finalState.conflicts = state.conflicts
  }
  setOfflineState(finalState)
  clearSyncedChanges()

  return {
    success: errors.length === 0,
    syncedCount,
    conflictCount,
    errors,
  }
}

function getApiEndpoint(entityType: string, entityId: string): string {
  switch (entityType) {
    case 'maintenanceRequest':
      return `/api/maintenance/${entityId}`
    case 'block':
      return `/api/blocks/${entityId}`
    case 'plan':
      return `/api/plans/${entityId}`
    case 'conflict':
      return `/api/conflicts/${entityId}`
    default:
      return `/api/${entityType}/${entityId}`
  }
}

// ---- Conflict Resolution ----

export function resolveConflict(
  conflictId: string,
  resolution: 'keep_local' | 'keep_server' | 'merged',
  mergedData?: Record<string, unknown>
): void {
  const state = getOfflineState()
  const conflict = state.conflicts.find((c) => c.id === conflictId)

  if (!conflict) return

  conflict.resolved = true
  conflict.resolution = resolution
  conflict.mergedData = mergedData

  if (resolution === 'keep_local') {
    // Re-queue the local change for syncing
    queueChange('update', conflict.entityType as PendingChange['entityType'], conflict.entityId, conflict.localData)
  } else if (resolution === 'merged' && mergedData) {
    // Queue the merged data for syncing
    queueChange('update', conflict.entityType as PendingChange['entityType'], conflict.entityId, mergedData)
  }
  // 'keep_server' means we discard the local change — nothing to queue

  setOfflineState(state)
}

export function getUnresolvedConflicts(): SyncConflict[] {
  return getOfflineState().conflicts.filter((c) => !c.resolved)
}

export function clearResolvedConflicts(): void {
  const state = getOfflineState()
  state.conflicts = state.conflicts.filter((c) => !c.resolved)
  setOfflineState(state)
}

// ---- Save current app state for offline ----

export function saveCurrentState(stateKey: string, data: unknown): void {
  saveToLocalStorage(`state-${stateKey}`, {
    data,
    timestamp: new Date().toISOString(),
  })
}

export function loadCurrentState<T>(stateKey: string): { data: T; timestamp: string } | null {
  return loadFromLocalStorage<{ data: T; timestamp: string }>(`state-${stateKey}`)
}

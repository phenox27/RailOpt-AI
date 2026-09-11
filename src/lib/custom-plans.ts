'use client'

import type { SimBlock, SimPlan } from '@/data/simulated-data'

/**
 * Custom plans created by users in the Plans view.
 * Persisted to localStorage so they survive reloads on this device.
 * The Planning view reads the same store so manual blocks can be
 * linked to a custom plan (blockIds grow as blocks are added).
 */
export interface CustomPlan extends SimPlan {
  isCustom: boolean
}

export const CUSTOM_PLANS_KEY = 'railopt-custom-plans'

export function loadCustomPlans(): CustomPlan[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CUSTOM_PLANS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CustomPlan[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function persistCustomPlans(list: CustomPlan[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CUSTOM_PLANS_KEY, JSON.stringify(list))
  } catch {
    // storage unavailable — plans stay in memory for this session
  }
}

/** Link a block to a custom plan (adds blockId if missing) and persist. */
export function addBlockToCustomPlan(planId: string, blockId: string): CustomPlan[] {
  const plans = loadCustomPlans()
  const updated = plans.map((p) =>
    p.id === planId && !p.blockIds.includes(blockId)
      ? { ...p, blockIds: [...p.blockIds, blockId] }
      : p
  )
  persistCustomPlans(updated)
  return updated
}

/**
 * Manual blocks created in the Planning view.
 * Persisted so the Plans view can count them inside custom plans.
 */
export interface ManualBlock extends SimBlock {
  isManual: true
}

export const MANUAL_BLOCKS_KEY = 'railopt-manual-blocks'

export function loadManualBlocks(): ManualBlock[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(MANUAL_BLOCKS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ManualBlock[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function persistManualBlocks(list: ManualBlock[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(MANUAL_BLOCKS_KEY, JSON.stringify(list))
  } catch {
    // storage unavailable — blocks stay in memory for this session
  }
}

/**
 * Server sync (Prisma + SQLite). localStorage remains the instant cache /
 * offline fallback; the DB is the durable source of truth shared across
 * browsers. All helpers fail soft (return false / []) so the demo keeps
 * working when the API is unavailable.
 */

// ---- Custom plans ----

export async function fetchServerCustomPlans(): Promise<CustomPlan[]> {
  try {
    const res = await fetch('/api/custom-plans', { cache: 'no-store' })
    if (!res.ok) return []
    const json = await res.json()
    return Array.isArray(json?.data) ? (json.data as CustomPlan[]) : []
  } catch {
    return []
  }
}

export async function createServerCustomPlan(plan: CustomPlan): Promise<boolean> {
  try {
    const res = await fetch('/api/custom-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plan),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function deleteServerCustomPlan(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/custom-plans/${encodeURIComponent(id)}`, { method: 'DELETE' })
    return res.ok
  } catch {
    return false
  }
}

export async function linkServerCustomPlanBlock(planId: string, blockId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/custom-plans/${encodeURIComponent(planId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addBlockId: blockId }),
    })
    return res.ok
  } catch {
    return false
  }
}

/** Push localStorage-only plans to the DB (id-diffed; POSTs only missing) and return the merged list. */
export async function migrateLocalCustomPlans(local: CustomPlan[]): Promise<CustomPlan[]> {
  const server = await fetchServerCustomPlans()
  const serverIds = new Set(server.map((p) => p.id))
  const missing = local.filter((p) => !serverIds.has(p.id))
  if (missing.length === 0) return server
  const results = await Promise.all(missing.map((p) => createServerCustomPlan(p)))
  const failed = missing.filter((_, i) => !results[i])
  return [...server, ...failed]
}

// ---- Manual blocks ----

export async function fetchServerManualBlocks(): Promise<ManualBlock[]> {
  try {
    const res = await fetch('/api/manual-blocks', { cache: 'no-store' })
    if (!res.ok) return []
    const json = await res.json()
    return Array.isArray(json?.data) ? (json.data as ManualBlock[]) : []
  } catch {
    return []
  }
}

export async function createServerManualBlock(block: ManualBlock): Promise<boolean> {
  try {
    const res = await fetch('/api/manual-blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(block),
    })
    return res.ok
  } catch {
    return false
  }
}

/** Patch a manual block on the server (used by drag-and-drop rescheduling). */
export async function updateServerManualBlock(
  id: string,
  patch: { startTime: string; endTime: string; duration: number }
): Promise<boolean> {
  try {
    const res = await fetch(`/api/manual-blocks/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    return res.ok
  } catch {
    return false
  }
}

/** Immutable local (localStorage) time update for a manual block. Returns the updated list. */
export function updateLocalManualBlock(
  id: string,
  patch: { startTime: string; endTime: string; duration: number }
): ManualBlock[] {
  const list = loadManualBlocks().map((b) => (b.id === id ? { ...b, ...patch } : b))
  persistManualBlocks(list)
  return list
}

export async function migrateLocalManualBlocks(local: ManualBlock[]): Promise<ManualBlock[]> {
  const server = await fetchServerManualBlocks()
  const serverIds = new Set(server.map((b) => b.id))
  const missing = local.filter((b) => !serverIds.has(b.id))
  if (missing.length === 0) return server
  const results = await Promise.all(missing.map((b) => createServerManualBlock(b)))
  const failed = missing.filter((_, i) => !results[i])
  return [...server, ...failed]
}

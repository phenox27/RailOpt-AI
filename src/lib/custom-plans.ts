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

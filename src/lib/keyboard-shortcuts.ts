import { useEffect, useCallback } from 'react'
import { useAppStore, NAV_ITEMS, type ViewId } from '@/store/app-store'

/**
 * Keyboard shortcuts hook for RailOpt AI.
 * - Ctrl/Cmd+1-8: Navigate to views
 * - Ctrl/Cmd+Enter: Run Optimization (in Planning)
 * - Ctrl/Cmd+Shift+K: Toggle AI Chat panel
 * - Escape: Close dialogs (handled by radix)
 * - ?: Show shortcuts help (dispatched as custom event)
 */

const VIEW_ORDER: ViewId[] = ['dashboard', 'maintenance', 'planning', 'timetable', 'approvals', 'plans', 'audit', 'settings']

interface KeyboardShortcutsOptions {
  onToggleChat?: () => void
}

export function useKeyboardShortcuts(options?: KeyboardShortcutsOptions) {
  const { currentRole, setActiveView } = useAppStore()

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const mod = e.metaKey || e.ctrlKey

    // Ctrl+Shift+K: Toggle AI Chat
    if (mod && e.shiftKey && e.key === 'K') {
      e.preventDefault()
      options?.onToggleChat?.()
      return
    }

    // Ctrl+1-8: Navigate to view
    if (mod && e.key >= '1' && e.key <= '8') {
      e.preventDefault()
      const index = parseInt(e.key) - 1
      if (index < VIEW_ORDER.length) {
        const viewId = VIEW_ORDER[index]
        const navItem = NAV_ITEMS.find(n => n.id === viewId)
        // Only navigate if role has access
        if (navItem && navItem.roles.includes(currentRole)) {
          setActiveView(viewId)
        }
      }
    }

    // Ctrl+Enter: Jump to Planning for optimization
    if (mod && e.key === 'Enter') {
      e.preventDefault()
      setActiveView('planning')
    }

    // "?" key (without modifier, not in input): Show shortcuts help
    if (e.key === '?' && !mod && !e.shiftKey) {
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
      if (!isInput) {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('show-shortcuts-help'))
      }
    }
  }, [currentRole, setActiveView, options])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

/** Shortcut definitions for the help dialog */
export const SHORTCUT_DEFINITIONS = [
  { keys: '⌘K', description: 'Open command palette' },
  { keys: '⌘⇧K', description: 'Toggle AI Chat panel' },
  { keys: '⌘1–8', description: 'Navigate to views' },
  { keys: '⌘Enter', description: 'Run AI Optimization' },
  { keys: '?', description: 'Show keyboard shortcuts' },
  { keys: 'Esc', description: 'Close dialogs / panels' },
] as const

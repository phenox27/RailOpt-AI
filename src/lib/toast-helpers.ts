import { toast } from 'sonner'

/**
 * Typed toast notification helpers for RailOpt AI.
 * Use these instead of raw `toast()` for consistent styling.
 */

export const railToast = {
  success: (title: string, description?: string) => {
    toast.success(title, { description })
  },

  error: (title: string, description?: string) => {
    toast.error(title, { description })
  },

  warning: (title: string, description?: string) => {
    toast.warning(title, { description })
  },

  info: (title: string, description?: string) => {
    toast.info(title, { description })
  },

  /** Special AI-themed toast */
  ai: (title: string, description?: string) => {
    toast.message(title, {
      description,
      style: {
        borderLeft: '3px solid #0d9488',
      },
    })
  },
}

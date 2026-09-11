'use client'

import { Button } from '@/components/ui/button'
import { type LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className ?? ''}`}>
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground/60" />
      </div>
      <p className="text-sm font-medium text-foreground mb-1">{title}</p>
      <p className="text-xs text-muted-foreground max-w-[280px]">{description}</p>
      {action && (
        <Button
          variant="outline"
          size="sm"
          className="mt-4 h-9 min-h-[44px] sm:h-8 text-xs gap-1.5"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}

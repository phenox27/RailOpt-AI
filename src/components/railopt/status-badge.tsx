'use client'

import { Badge } from '@/components/ui/badge'

export type MaintenanceStatus = 'pending' | 'scored' | 'assigned' | 'verified' | 'rejected'

const STATUS_CONFIG: Record<MaintenanceStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-muted text-foreground/80 border-border hover:bg-muted',
  },
  scored: {
    label: 'Scored',
    className: 'bg-[#e8eaf6] text-[#0d47a1] border-[#9fa8da] hover:bg-[#e8eaf6]',
  },
  assigned: {
    label: 'Assigned',
    className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50',
  },
  verified: {
    label: 'Verified',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-50',
  },
}

interface StatusBadgeProps {
  status: MaintenanceStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  return (
    <Badge
      variant="outline"
      className={`rounded-full text-[12px] font-medium px-2.5 py-0.5 ${config.className} ${className ?? ''}`}
    >
      {config.label}
    </Badge>
  )
}

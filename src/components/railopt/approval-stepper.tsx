'use client'

import { CheckCircle2, Circle, XCircle, Loader2 } from 'lucide-react'

export type StepStatus = 'completed' | 'current' | 'pending' | 'rejected'

export interface WorkflowStep {
  label: string
  role: string
  status: StepStatus
  isAuto?: boolean
}

interface ApprovalStepperProps {
  steps: WorkflowStep[]
  className?: string
}

const STATUS_STYLES: Record<StepStatus, { circle: string; line: string; label: string; icon: typeof CheckCircle2 }> = {
  completed: {
    circle: 'bg-emerald-500 text-white border-emerald-500',
    line: 'bg-emerald-500',
    label: 'text-emerald-700',
    icon: CheckCircle2,
  },
  current: {
    circle: 'bg-blue-500 text-white border-blue-500',
    line: 'bg-border',
    label: 'text-blue-700 font-semibold',
    icon: Loader2,
  },
  pending: {
    circle: 'bg-muted text-muted-foreground/60 border-border',
    line: 'bg-border',
    label: 'text-muted-foreground/60',
    icon: Circle,
  },
  rejected: {
    circle: 'bg-red-500 text-white border-red-500',
    line: 'bg-border',
    label: 'text-red-600',
    icon: XCircle,
  },
}

export function ApprovalStepper({ steps, className }: ApprovalStepperProps) {
  return (
    <div className={`flex items-start w-full overflow-x-auto ${className ?? ''}`}>
      {steps.map((step, idx) => {
        const style = STATUS_STYLES[step.status]
        const IconComp = style.icon
        const isLast = idx === steps.length - 1

        return (
          <div key={idx} className="flex items-start min-w-0 flex-1">
            {/* Step node */}
            <div className="flex flex-col items-center gap-1.5 min-w-[80px]">
              {/* Circle with icon */}
              <div
                className={`flex items-center justify-center w-9 h-9 rounded-full border-2 transition-all ${style.circle}`}
              >
                {step.status === 'current' ? (
                  <IconComp className="w-4 h-4 animate-spin" />
                ) : step.status === 'pending' ? (
                  <IconComp className="w-4 h-4" />
                ) : (
                  <IconComp className="w-4 h-4" />
                )}
              </div>

              {/* Step label */}
              <span className={`text-[11px] text-center leading-tight ${style.label}`}>
                {step.label}
              </span>

              {/* Role label */}
              <span className="text-[10px] text-center text-muted-foreground leading-tight">
                {step.isAuto ? '🤖 Auto' : step.role}
              </span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div className="flex-1 flex items-center pt-4 min-w-[16px]">
                <div className={`h-0.5 w-full ${style.line}`} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Pre-defined workflow steps for blocks and plans
export function getBlockWorkflowSteps(blockStatus: string): WorkflowStep[] {
  const statusMap: Record<string, number> = {
    recommended: 1,
    edited: 2,
    verified: 3,
    finalized: 4,
    approved: 6,
    rejected: -1,
  }

  const currentStep = statusMap[blockStatus] ?? 0
  const isRejected = blockStatus === 'rejected'

  return [
    {
      label: 'AI Recommendation',
      role: 'AI Engine',
      status: currentStep >= 1 ? 'completed' : 'pending',
      isAuto: true,
    },
    {
      label: 'Planner Review',
      role: 'Planner',
      status: isRejected && currentStep <= 2 ? 'rejected' : currentStep >= 2 ? 'completed' : currentStep === 1 ? 'current' : 'pending',
    },
    {
      label: 'Dept. Verification',
      role: 'Department',
      status: currentStep >= 3 ? 'completed' : currentStep === 2 ? 'current' : 'pending',
    },
    {
      label: 'Planner Finalization',
      role: 'Planner',
      status: currentStep >= 4 ? 'completed' : currentStep === 3 ? 'current' : 'pending',
    },
    {
      label: 'Control Office Review',
      role: 'Control Office',
      status: currentStep >= 5 ? 'completed' : currentStep === 4 ? 'current' : 'pending',
    },
    {
      label: 'Operational Approval',
      role: 'Control Office',
      status: currentStep >= 6 ? 'completed' : currentStep === 5 ? 'current' : 'pending',
    },
  ]
}

export function getPlanWorkflowSteps(planStatus: string): WorkflowStep[] {
  const statusMap: Record<string, number> = {
    draft: 0,
    optimizing: 0,
    recommended: 1,
    reviewed: 2,
    verified: 3,
    finalized: 4,
    approved: 6,
  }

  const currentStep = statusMap[planStatus] ?? 0

  return [
    {
      label: 'AI Recommendation',
      role: 'AI Engine',
      status: currentStep >= 1 ? 'completed' : currentStep === 0 ? 'current' : 'pending',
      isAuto: true,
    },
    {
      label: 'Planner Review',
      role: 'Planner',
      status: currentStep >= 2 ? 'completed' : currentStep === 1 ? 'current' : 'pending',
    },
    {
      label: 'Dept. Verification',
      role: 'Department',
      status: currentStep >= 3 ? 'completed' : currentStep === 2 ? 'current' : 'pending',
    },
    {
      label: 'Planner Finalization',
      role: 'Planner',
      status: currentStep >= 4 ? 'completed' : currentStep === 3 ? 'current' : 'pending',
    },
    {
      label: 'Control Office Review',
      role: 'Control Office',
      status: currentStep >= 5 ? 'completed' : currentStep === 4 ? 'current' : 'pending',
    },
    {
      label: 'Operational Approval',
      role: 'Control Office',
      status: currentStep >= 6 ? 'completed' : currentStep === 5 ? 'current' : 'pending',
    },
  ]
}

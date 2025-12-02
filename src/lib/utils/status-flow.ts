import { ServiceRequestStatus } from '@/constants/status'

export const statusFlow: Record<ServiceRequestStatus, ServiceRequestStatus[]> = {
  [ServiceRequestStatus.OPEN]: [ServiceRequestStatus.IN_PROGRESS],
  [ServiceRequestStatus.IN_PROGRESS]: [ServiceRequestStatus.APPROVED, ServiceRequestStatus.OPEN],
  [ServiceRequestStatus.APPROVED]: [ServiceRequestStatus.RESOLVED],
  [ServiceRequestStatus.RESOLVED]: [ServiceRequestStatus.CLOSED],
  [ServiceRequestStatus.CLOSED]: [],
}

// Required fields for transitioning to a target status
export const requiredFieldsForTarget: Partial<Record<ServiceRequestStatus, string[]>> = {
  [ServiceRequestStatus.APPROVED]: ['assignedTo', 'actionNote'],
  [ServiceRequestStatus.RESOLVED]: ['assignedTo'],
  [ServiceRequestStatus.CLOSED]: ['assignedTo', 'actionNote'],
}

export function getAllowedTransitions(from: ServiceRequestStatus) {
  return statusFlow[from] ?? []
}

export function canTransition(
  from: ServiceRequestStatus,
  to: ServiceRequestStatus,
  ctx: { assignedTo?: string | null; actionNote?: string | null; hasPermission?: boolean }
) {
  if (!ctx.hasPermission) return false
  const allowed = getAllowedTransitions(from)
  if (!allowed.includes(to)) return false
  const required = requiredFieldsForTarget[to] ?? []
  for (const f of required) {
    if (f === 'assignedTo' && !ctx.assignedTo) return false
    if (f === 'actionNote' && !ctx.actionNote) return false
  }
  return true
}

const statusFlowUtils = {
  statusFlow,
  getAllowedTransitions,
  canTransition,
}

export default statusFlowUtils

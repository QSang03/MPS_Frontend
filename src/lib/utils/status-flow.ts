import { ServiceRequestStatus, PurchaseRequestStatus } from '@/constants/status'

export const statusFlow: Record<ServiceRequestStatus, ServiceRequestStatus[]> = {
  [ServiceRequestStatus.OPEN]: [ServiceRequestStatus.APPROVED, ServiceRequestStatus.CANCELLED],
  [ServiceRequestStatus.APPROVED]: [
    ServiceRequestStatus.IN_PROGRESS,
    ServiceRequestStatus.CANCELLED,
  ],
  [ServiceRequestStatus.IN_PROGRESS]: [ServiceRequestStatus.RESOLVED],
  [ServiceRequestStatus.RESOLVED]: [ServiceRequestStatus.CLOSED],
  [ServiceRequestStatus.CLOSED]: [],
  [ServiceRequestStatus.CANCELLED]: [],
}

export const purchaseRequestStatusFlow: Record<PurchaseRequestStatus, PurchaseRequestStatus[]> = {
  [PurchaseRequestStatus.PENDING]: [
    PurchaseRequestStatus.APPROVED,
    PurchaseRequestStatus.CANCELLED,
  ],
  [PurchaseRequestStatus.APPROVED]: [
    PurchaseRequestStatus.ORDERED,
    PurchaseRequestStatus.CANCELLED,
  ],
  [PurchaseRequestStatus.ORDERED]: [PurchaseRequestStatus.IN_TRANSIT],
  [PurchaseRequestStatus.IN_TRANSIT]: [PurchaseRequestStatus.RECEIVED],
  [PurchaseRequestStatus.RECEIVED]: [],
  [PurchaseRequestStatus.CANCELLED]: [],
}

// Required fields for transitioning to a target status
export const requiredFieldsForTarget: Partial<Record<ServiceRequestStatus, string[]>> = {
  [ServiceRequestStatus.APPROVED]: ['assignedTo'],
  [ServiceRequestStatus.RESOLVED]: ['assignedTo'],
  [ServiceRequestStatus.CLOSED]: ['assignedTo', 'actionNote'],
}

export function getAllowedTransitions(from: ServiceRequestStatus) {
  return statusFlow[from] ?? []
}

export function getAllowedPurchaseTransitions(from: PurchaseRequestStatus) {
  return purchaseRequestStatusFlow[from] ?? []
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
  purchaseRequestStatusFlow,
  getAllowedTransitions,
  getAllowedPurchaseTransitions,
  canTransition,
}

export default statusFlowUtils

'use client'

import { Button } from '@/components/ui/button'
import { useLocale } from '@/components/providers/LocaleProvider'
import { PURCHASE_REQUEST_STATUS_DISPLAY } from '@/constants/status'
import { getAllowedPurchaseTransitions } from '@/lib/utils/status-flow'
import type { PurchaseRequestStatus } from '@/constants/status'

interface Props {
  current: PurchaseRequestStatus
  hasPermission?: boolean
  onSelect: (status: PurchaseRequestStatus) => void
  showAssignmentWarning?: boolean
  assignedTo?: string | null
}

export function PurchaseStatusButtonGrid({
  current,
  hasPermission = true,
  onSelect,
  showAssignmentWarning = false,
  assignedTo,
}: Props) {
  const allowed = getAllowedPurchaseTransitions(current)
  const { t } = useLocale()

  if (allowed.length === 0) {
    return (
      <div className="text-muted-foreground rounded-lg border border-gray-200 bg-gray-50 p-3 text-center text-sm">
        {t('purchase_request.status.no_next')}
      </div>
    )
  }

  // Check if any button is disabled due to missing assignment
  const hasDisabledDueToAssignment =
    showAssignmentWarning &&
    allowed.some(() => {
      // For now, no purchase request status requires assignment, but this logic is ready for future use
      const requiresAssigned = false // ['APPROVED', 'ORDERED'].includes(s) - example for future use
      return requiresAssigned && !Boolean(assignedTo) && hasPermission
    })

  return (
    <div className="space-y-2">
      <div className={allowed.length === 1 ? 'grid grid-cols-1 gap-2' : 'grid grid-cols-2 gap-2'}>
        {allowed.map((s) => {
          const disp = PURCHASE_REQUEST_STATUS_DISPLAY[s]
          const enabled = hasPermission
          return (
            <Button
              key={s}
              className="h-auto justify-start py-3"
              variant={enabled ? 'secondary' : 'outline'}
              onClick={() => enabled && onSelect(s)}
              disabled={!enabled}
              aria-label={t('purchase_request.status.change_to', {
                label: disp.labelKey ? t(disp.labelKey) : disp.label,
              })}
            >
              <div className="flex w-full flex-col text-left">
                <span className="text-xs font-semibold">
                  {t('purchase_request.status.change_arrow', {
                    label: disp.labelKey ? t(disp.labelKey) : disp.label,
                  })}
                </span>
                <span className="text-muted-foreground text-xs">{s}</span>
              </div>
            </Button>
          )
        })}
      </div>
      {hasDisabledDueToAssignment && (
        <div className="text-xs text-amber-600">
          <div className="flex items-center gap-1">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {t('purchase_request.assignment_required_warning')}
          </div>
        </div>
      )}
    </div>
  )
}

export default PurchaseStatusButtonGrid

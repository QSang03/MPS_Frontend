'use client'

import { Button } from '@/components/ui/button'
import { SERVICE_REQUEST_STATUS_DISPLAY } from '@/constants/status'
import { useLocale } from '@/components/providers/LocaleProvider'
import { getAllowedTransitions } from '@/lib/utils/status-flow'
import type { ServiceRequestStatus } from '@/constants/status'

interface Props {
  current: ServiceRequestStatus
  assignedTo?: string | null
  hasPermission?: boolean
  onSelect: (status: ServiceRequestStatus) => void
  showAssignmentWarning?: boolean
}

export function StatusButtonGrid({
  current,
  assignedTo,
  hasPermission = true,
  onSelect,
  showAssignmentWarning = true,
}: Props) {
  const { t } = useLocale()
  const allowed = getAllowedTransitions(current)

  // Check if any button is disabled due to missing assignment
  const hasDisabledDueToAssignment =
    showAssignmentWarning &&
    allowed.some((s) => {
      const requiresAssigned = ['APPROVED', 'RESOLVED', 'CLOSED'].includes(s)
      return requiresAssigned && !Boolean(assignedTo) && hasPermission
    })

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {allowed.map((s) => {
          const disp = SERVICE_REQUEST_STATUS_DISPLAY[s]
          // For button enabling we only enforce assignment & permission here.
          const requiresAssigned = ['APPROVED', 'RESOLVED', 'CLOSED'].includes(s)
          const enabled = hasPermission && (!requiresAssigned || Boolean(assignedTo))
          return (
            <Button
              key={s}
              className="justify-start"
              variant={enabled ? 'secondary' : 'outline'}
              onClick={() => enabled && onSelect(s)}
              disabled={!enabled}
              aria-label={t('service_request.aria.change_to', {
                label: disp.labelKey ? t(disp.labelKey) : disp.label,
              })}
            >
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold">
                  {t('service_request.change_to_arrow')}{' '}
                  {disp.labelKey ? t(disp.labelKey) : disp.label}
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
            {t('service_request.assignment_required_warning')}
          </div>
        </div>
      )}
    </div>
  )
}

export default StatusButtonGrid

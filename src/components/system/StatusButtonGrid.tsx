'use client'

import { Button } from '@/components/ui/button'
import { SERVICE_REQUEST_STATUS_DISPLAY } from '@/constants/status'
import { getAllowedTransitions } from '@/lib/utils/status-flow'
import type { ServiceRequestStatus } from '@/constants/status'

interface Props {
  current: ServiceRequestStatus
  assignedTo?: string | null
  hasPermission?: boolean
  onSelect: (status: ServiceRequestStatus) => void
}

export function StatusButtonGrid({ current, assignedTo, hasPermission = true, onSelect }: Props) {
  const allowed = getAllowedTransitions(current)

  return (
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
            variant={enabled ? 'secondary' : 'ghost'}
            onClick={() => enabled && onSelect(s)}
            disabled={!enabled}
            aria-label={`Chuyển sang ${disp.label}`}
          >
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold">Chuyển → {disp.label}</span>
              <span className="text-muted-foreground text-xs">{s}</span>
            </div>
          </Button>
        )
      })}
    </div>
  )
}

export default StatusButtonGrid

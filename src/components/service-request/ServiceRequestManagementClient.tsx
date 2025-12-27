'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { useLocale } from '@/components/providers/LocaleProvider'
import { serviceRequestsClientService } from '@/lib/api/services/service-requests-client.service'
import { ServiceRequestStatus } from '@/constants/status'
import { Loader2 } from 'lucide-react'
import { ActionGuard } from '@/components/shared/ActionGuard'

interface Props {
  requestId: string
  initialStatus: ServiceRequestStatus
  assignedTo?: string | null
  onStatusChange?: (newStatus: ServiceRequestStatus) => void
}

const STATUS_TRANSITIONS: Partial<Record<ServiceRequestStatus, ServiceRequestStatus[]>> = {
  [ServiceRequestStatus.OPEN]: [ServiceRequestStatus.APPROVED, ServiceRequestStatus.CANCELLED],
  [ServiceRequestStatus.APPROVED]: [ServiceRequestStatus.IN_PROGRESS],
  [ServiceRequestStatus.IN_PROGRESS]: [ServiceRequestStatus.RESOLVED],
  [ServiceRequestStatus.RESOLVED]: [ServiceRequestStatus.CLOSED],
}

/**
 * Client component for managing service request status updates
 */
export default function ServiceRequestManagementClient({
  requestId,
  initialStatus,
  assignedTo,
  onStatusChange,
}: Props) {
  const { t } = useLocale()
  const queryClient = useQueryClient()
  const [selectedStatus, setSelectedStatus] = useState<ServiceRequestStatus | ''>('')
  const [currentStatus, setCurrentStatus] = useState<ServiceRequestStatus>(initialStatus)

  const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || []

  const updateStatus = useMutation({
    mutationFn: (newStatus: ServiceRequestStatus) =>
      serviceRequestsClientService.updateStatus(requestId, newStatus),
    onSuccess: (_, newStatus) => {
      queryClient.invalidateQueries({ queryKey: ['service-requests', requestId] })
      toast.success(t('service_request.status_updated'))
      setCurrentStatus(newStatus)
      onStatusChange?.(newStatus)
      setSelectedStatus('')
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : t('service_request.status_update_error')
      toast.error(msg)
    },
  })

  if (allowedTransitions.length === 0) {
    return (
      <div className="text-muted-foreground text-sm">
        {assignedTo && (
          <p>
            {t('user_service_request.management.assigned_to')}: {assignedTo}
          </p>
        )}
        <p>{t('service_request.no_actions_available')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {assignedTo && (
        <p className="text-muted-foreground text-sm">
          {t('user_service_request.management.assigned_to')}: {assignedTo}
        </p>
      )}
      <ActionGuard pageId="user-my-requests" actionId="update-service-status">
        <div className="flex items-center gap-2">
          <Select
            value={selectedStatus}
            onValueChange={(value) => setSelectedStatus(value as ServiceRequestStatus)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('service_request.select_status')} />
            </SelectTrigger>
            <SelectContent>
              {allowedTransitions.map((status) => (
                <SelectItem key={status} value={status}>
                  {t(`service_request.status.${status.toLowerCase()}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            size="sm"
            disabled={!selectedStatus || updateStatus.isPending}
            onClick={() => selectedStatus && updateStatus.mutate(selectedStatus)}
          >
            {updateStatus.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('service_request.update_status')}
          </Button>
        </div>
      </ActionGuard>
    </div>
  )
}

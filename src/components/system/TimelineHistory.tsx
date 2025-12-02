'use client'

import type { ServiceRequest } from '@/types/models'
import { formatDateTime } from '@/lib/utils/formatters'

interface Props {
  request: Partial<ServiceRequest>
}

export function TimelineHistory({ request }: Props) {
  const entries = [
    {
      label: request.customerClosedReason,
      time: request.customerClosedAt,
      by: request.customerClosedByName,
    },
    {
      label: request.resolvedAt ? 'Đã xử lý' : null,
      time: request.resolvedAt,
      by: request.resolvedByName,
    },
    {
      label: request.approvedAt ? 'Đã duyệt' : null,
      time: request.approvedAt,
      by: request.approvedByName,
    },
    { label: 'Mới mở', time: request.createdAt, by: request.createdByName ?? request.createdBy },
  ]

  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold">Lịch sử thay đổi trạng thái</div>
      <div className="space-y-3">
        {entries
          .filter((e) => e.time)
          .map((e, idx) => (
            <div key={idx} className="rounded-md border p-2">
              <div className="text-xs font-medium">{e.label}</div>
              <div className="text-muted-foreground text-xs">{formatDateTime(e.time!)}</div>
              {e.by && <div className="text-muted-foreground text-xs">Bởi: {e.by}</div>}
            </div>
          ))}
      </div>
    </div>
  )
}

export default TimelineHistory

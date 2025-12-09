'use client'

import type { ServiceRequest } from '@/types/models'
import { formatDateTime } from '@/lib/utils/formatters'
import { useLocale } from '@/components/providers/LocaleProvider'

interface Props {
  request: Partial<ServiceRequest>
}

export function TimelineHistory({ request }: Props) {
  const { t } = useLocale()
  const entries = [
    {
      label: request.customerClosedReason,
      time: request.customerClosedAt,
      by: request.customerClosedByName,
    },
    {
      label: request.resolvedAt ? t('timeline.resolved') : null,
      time: request.resolvedAt,
      by: request.resolvedByName,
    },
    {
      label: request.approvedAt ? t('timeline.approved') : null,
      time: request.approvedAt,
      by: request.approvedByName,
    },
    {
      label: t('timeline.opened'),
      time: request.createdAt,
      by: request.createdByName ?? request.createdBy,
    },
  ]

  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold">{t('timeline.title')}</div>
      <div className="space-y-3">
        {entries
          .filter((e) => e.time)
          .map((e, idx) => (
            <div key={idx} className="rounded-md border p-2">
              <div className="text-xs font-medium">{e.label}</div>
              <div className="text-muted-foreground text-xs">{formatDateTime(e.time!)}</div>
              {e.by && (
                <div className="text-muted-foreground text-xs">
                  {t('timeline.by')}: {e.by}
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  )
}

export default TimelineHistory

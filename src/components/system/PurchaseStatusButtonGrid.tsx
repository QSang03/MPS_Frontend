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
}

export function PurchaseStatusButtonGrid({ current, hasPermission = true, onSelect }: Props) {
  const allowed = getAllowedPurchaseTransitions(current)
  const { t } = useLocale()

  if (allowed.length === 0) {
    return (
      <div className="text-muted-foreground rounded-lg border border-gray-200 bg-gray-50 p-3 text-center text-sm">
        {t('purchase_request.status.no_next')}
      </div>
    )
  }

  return (
    <div className={allowed.length === 1 ? 'grid grid-cols-1 gap-2' : 'grid grid-cols-2 gap-2'}>
      {allowed.map((s) => {
        const disp = PURCHASE_REQUEST_STATUS_DISPLAY[s]
        const enabled = hasPermission
        return (
          <Button
            key={s}
            className="h-auto justify-start py-3"
            variant={enabled ? 'secondary' : 'ghost'}
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
  )
}

export default PurchaseStatusButtonGrid

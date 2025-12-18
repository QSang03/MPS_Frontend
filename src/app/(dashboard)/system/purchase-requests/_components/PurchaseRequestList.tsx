'use client'

import { useState } from 'react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatRelativeTime } from '@/lib/utils/formatters'
import { PurchaseRequestStatus, Priority } from '@/constants/status'
import {
  Check,
  X,
  Clock,
  Truck,
  PackageCheck,
  AlertCircle,
  DollarSign,
  Layers,
  Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface PurchaseRequestListProps {
  customerId: string
  status?: PurchaseRequestStatus
}

// Mock data (giữ nguyên để demo)
const mockRequests = [
  {
    id: '1',
    itemName: 'HP 58A Toner Cartridge',
    quantity: 10,
    estimatedCost: 850,
    priority: Priority.NORMAL,
    status: PurchaseRequestStatus.PENDING,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    itemName: 'A4 Paper (500 sheets)',
    quantity: 50,
    estimatedCost: 250,
    priority: Priority.HIGH,
    status: PurchaseRequestStatus.APPROVED,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    itemName: 'Maintenance Kit',
    quantity: 5,
    estimatedCost: 1200,
    priority: Priority.NORMAL,
    status: PurchaseRequestStatus.ORDERED,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    itemName: 'Cleaning Supplies',
    quantity: 15,
    estimatedCost: 150,
    priority: Priority.LOW,
    status: PurchaseRequestStatus.RECEIVED,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

const getStatusConfig = (t: (key: string) => string) => ({
  [PurchaseRequestStatus.PENDING]: {
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    icon: Clock,
    label: t('purchase_request.status.pending'),
  },
  [PurchaseRequestStatus.APPROVED]: {
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    icon: Check,
    label: t('purchase_request.status.approved'),
  },
  [PurchaseRequestStatus.ORDERED]: {
    color: 'text-[var(--brand-600)] bg-[var(--brand-50)] border-[var(--brand-200)]',
    icon: Truck,
    label: t('purchase_request.status.ordered'),
  },
  [PurchaseRequestStatus.IN_TRANSIT]: {
    color: 'text-[var(--brand-600)] bg-[var(--brand-50)] border-[var(--brand-200)]',
    icon: Truck,
    label: t('purchase_request.status.in_transit'),
  },
  [PurchaseRequestStatus.RECEIVED]: {
    color: 'text-slate-600 bg-slate-50 border-slate-200',
    icon: PackageCheck,
    label: t('purchase_request.status.received'),
  },
  [PurchaseRequestStatus.CANCELLED]: {
    color: 'text-rose-600 bg-rose-50 border-rose-200',
    icon: X,
    label: t('purchase_request.status.cancelled'),
  },
})

const getPriorityConfig = (t: (key: string) => string) => ({
  [Priority.LOW]: { color: 'text-slate-600', label: t('priority.low') },
  [Priority.NORMAL]: { color: 'text-[var(--brand-600)]', label: t('priority.normal') },
  [Priority.HIGH]: { color: 'text-orange-600', label: t('priority.high') },
  [Priority.URGENT]: { color: 'text-red-600', label: t('priority.urgent') },
})

export function PurchaseRequestList({ status: initialStatus }: PurchaseRequestListProps) {
  const { t } = useLocale()
  // Nếu component được dùng làm danh sách có filter nội bộ thì dùng state,
  // nếu chỉ hiển thị static theo props thì có thể bỏ state này.
  const [filterStatus, setFilterStatus] = useState<PurchaseRequestStatus | 'ALL'>(
    initialStatus || 'ALL'
  )

  const filteredRequests = mockRequests.filter(
    (r) => filterStatus === 'ALL' || r.status === filterStatus
  )

  const translatedStatusConfig = getStatusConfig(t)
  const translatedPriorityConfig = getPriorityConfig(t)

  return (
    <div className="space-y-4">
      {/* Filter Tabs (Optional: Nếu muốn có filter ngay trên list) */}
      {!initialStatus && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={filterStatus === 'ALL' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('ALL')}
            className="h-8 rounded-full"
          >
            {t('common.all')}
          </Button>
          {Object.values(PurchaseRequestStatus).map((s) => (
            <Button
              key={s}
              variant={filterStatus === s ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus(s)}
              className={cn(
                'h-8 rounded-full text-xs',
                filterStatus === s && 'bg-muted font-medium'
              )}
            >
              {translatedStatusConfig[s].label}
            </Button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {filteredRequests.map((request) => {
          const StatusIcon = translatedStatusConfig[request.status].icon
          const isPending = request.status === PurchaseRequestStatus.PENDING

          return (
            <Card
              key={request.id}
              className="group hover:border-primary/20 overflow-hidden transition-all hover:shadow-md"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Status Icon Column */}
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border',
                      translatedStatusConfig[request.status].color
                    )}
                  >
                    <StatusIcon className="h-5 w-5" />
                  </div>

                  {/* Main Info */}
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-foreground/90 leading-none font-semibold tracking-tight">
                          {request.itemName}
                        </h3>
                        <div className="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                          <span className="flex items-center gap-1">
                            <Layers className="h-3.5 w-3.5" />
                            SL: {request.quantity}
                          </span>
                          <span className="text-muted-foreground/40">•</span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3.5 w-3.5" />
                            {formatCurrency(
                              request.estimatedCost,
                              (request as { currency?: { code?: string }; currencyId?: string })
                                .currency?.code ||
                                (request as { currency?: { code?: string }; currencyId?: string })
                                  .currencyId ||
                                undefined
                            )}
                          </span>
                          <span className="text-muted-foreground/40">•</span>
                          <span
                            className={cn(
                              'flex items-center gap-1 text-xs font-medium',
                              translatedPriorityConfig[request.priority].color
                            )}
                          >
                            <AlertCircle className="h-3.5 w-3.5" />
                            {translatedPriorityConfig[request.priority].label}
                          </span>
                        </div>
                      </div>

                      {/* Status Badge (Mobile/Compact view) */}
                      <Badge
                        variant="outline"
                        className={cn(
                          'hidden text-[10px] tracking-wider whitespace-nowrap uppercase sm:flex',
                          translatedStatusConfig[request.status].color
                        )}
                      >
                        {translatedStatusConfig[request.status].label}
                      </Badge>
                    </div>

                    {/* Footer Info */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="text-muted-foreground flex items-center gap-1 text-xs">
                        <Calendar className="h-3 w-3" />
                        {formatRelativeTime(request.createdAt)}
                      </div>

                      {/* Action Buttons - Only visible for PENDING or specific roles */}
                      {isPending && (
                        <div className="flex gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-7 w-7 border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {t('purchase_request.actions.approve')}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-7 w-7 border-[var(--color-error-200)] text-[var(--color-error-500)] hover:bg-[var(--color-error-50)] hover:text-[var(--color-error-600)]"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {t('purchase_request.actions.reject')}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredRequests.length === 0 && (
        <div className="bg-muted/10 animate-in fade-in-50 flex min-h-[180px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
            <PackageCheck className="text-muted-foreground/60 h-6 w-6" />
          </div>
          <h3 className="mt-3 text-sm font-semibold">{t('purchase_request.list.empty.title')}</h3>
          <p className="text-muted-foreground mt-1 max-w-[200px] text-xs">
            {filterStatus === 'ALL'
              ? t('purchase_request.list.empty.no_requests')
              : t('purchase_request.list.empty.no_requests_filtered', {
                  status:
                    translatedStatusConfig[filterStatus as PurchaseRequestStatus]?.label ||
                    filterStatus,
                })}
          </p>
        </div>
      )}
    </div>
  )
}

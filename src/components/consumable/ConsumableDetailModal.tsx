'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  User,
  Info,
  Server,
  Box,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { consumablesClientService } from '@/lib/api/services/consumables-client.service'
import { toast } from 'sonner'
import { useLocale } from '@/components/providers/LocaleProvider'
import { differenceInDays, format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { enUS } from 'date-fns/locale'

export default function ConsumableDetailModal({
  open,
  onOpenChange,
  consumableId,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  consumableId?: string
}) {
  const [loading, setLoading] = useState(false)
  const { t, locale } = useLocale()
  const [item, setItem] = useState<Record<string, unknown> | null>(null)

  // Narrowed runtime view of the consumable item to satisfy TypeScript checks
  interface ConsumableDetail {
    consumableType?: {
      unit?: string
      imageUrl?: string
      name?: string
      partNumber?: string
      capacity?: number | string
      description?: string
      compatibleMachineLine?: string
      compatibleDeviceModels?: Array<{ id?: string; name?: string }>
    }
    expiryDate?: string
    deviceCount?: number | string
    activeDeviceIds?: string[]
    deviceConsumables?: { deviceId?: string; installedAt?: string; removedAt?: string }[]
    serialNumber?: string
    createdAt?: string
    status?: string
    customer?: { name?: string; contactPerson?: string; contactPhone?: string }
    returnReason?: string
    returnNotes?: string
    price?: number | null
    currencyId?: string | null
    currency?: {
      id?: string
      code?: string
      name?: string
      symbol?: string
    } | null
  }

  const typedItem = item as ConsumableDetail | null

  useEffect(() => {
    if (!open || !consumableId) return
    const load = async () => {
      setLoading(true)
      try {
        const data = await consumablesClientService.getById(consumableId)
        setItem(data ?? null)
      } catch (err) {
        console.error('Load consumable detail failed', err)
        toast.error(t('consumable.detail.load_error'))
        setItem(null)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [open, consumableId, t])

  const fmtDate = (v: unknown) =>
    v
      ? format(new Date(String(v)), 'dd/MM/yyyy HH:mm', {
          locale: locale === 'vi' ? vi : enUS,
        })
      : '-'

  const getStatusBadge = (status: string) => {
    if (status === 'ACTIVE') {
      return (
        <Badge className="bg-emerald-500 text-white hover:bg-emerald-600">
          <CheckCircle className="mr-1 h-3 w-3" />
          ACTIVE
        </Badge>
      )
    }
    if (status === 'INACTIVE') {
      return (
        <Badge variant="secondary" className="bg-slate-200 text-slate-700 hover:bg-slate-300">
          <XCircle className="mr-1 h-3 w-3" />
          INACTIVE
        </Badge>
      )
    }
    return <Badge variant="outline">{status}</Badge>
  }

  const getExpiryInfo = (dateStr?: string) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    const daysLeft = differenceInDays(date, new Date())
    const isNear = daysLeft < 30 && daysLeft >= 0
    const isExpired = daysLeft < 0

    return (
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${
                  isExpired
                    ? 'bg-[var(--color-error-50)] text-[var(--color-error-500)]'
                    : isNear
                      ? 'bg-[var(--warning-50)] text-[var(--warning-500)]'
                      : 'bg-[var(--brand-50)] text-[var(--brand-700)]'
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                {isExpired
                  ? t('consumable.expired')
                  : isNear
                    ? t('consumable.expires_in', { days: daysLeft })
                    : t('consumable.expires_in', { days: daysLeft })}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('consumable.expiry_on', { date: format(date, 'dd/MM/yyyy') })}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-full max-w-3xl overflow-y-auto p-0">
        <DialogHeader className="border-b bg-slate-50/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900">
                {t('consumable.detail.title')}
              </DialogTitle>
              <DialogDescription className="mt-1 font-mono text-xs text-slate-500">
                ID: {consumableId ?? '—'}
              </DialogDescription>
            </div>
            {typedItem && getStatusBadge(String(typedItem.status ?? ''))}
          </div>
        </DialogHeader>

        <div className="p-3 sm:p-4 md:p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
              <p className="mt-4 text-sm text-slate-500">{t('loading.default')}</p>
            </div>
          ) : !item ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Package className="mb-4 h-12 w-12 opacity-20" />
              <p>{t('consumable.detail.not_found')}</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4 md:space-y-6">
              {/* Top Summary */}
              <div className="flex flex-col gap-6 md:flex-row">
                {typedItem?.consumableType?.imageUrl ? (
                  <div className="flex-shrink-0">
                    <Image
                      src={String(typedItem!.consumableType!.imageUrl)}
                      alt={String(typedItem?.consumableType?.name ?? '')}
                      width={128}
                      height={128}
                      className="h-32 w-32 rounded-xl border border-slate-200 object-cover shadow-sm"
                    />
                  </div>
                ) : (
                  <div className="flex h-32 w-32 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-300">
                    <Package className="h-12 w-12" />
                  </div>
                )}

                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      {String(typedItem?.consumableType?.name ?? 'Unknown Item')}
                    </h3>
                    <p className="text-sm font-medium text-slate-500">
                      Part Number: {String(typedItem?.consumableType?.partNumber ?? '-')}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {getExpiryInfo(typedItem?.expiryDate as string | undefined)}
                    <div className="flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                      <Box className="h-3.5 w-3.5" />
                      Serial: {String(typedItem?.serialNumber ?? '-')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* General Info */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Info className="h-4 w-4 text-[var(--brand-500)]" />
                    <h4 className="font-semibold text-slate-900">
                      {t('consumable.detail.general_info')}
                    </h4>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">{t('consumable.detail.unit')}</span>
                      <span className="font-medium text-slate-900">
                        {String(typedItem?.consumableType?.unit ?? '-')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">
                        {t('consumable.detail.compatible_line')}
                      </span>
                      <span className="font-medium text-slate-900">
                        {typedItem?.consumableType?.compatibleMachineLine ||
                          (typedItem?.consumableType?.compatibleDeviceModels
                            ? typedItem?.consumableType?.compatibleDeviceModels
                                .map((m) => m.name)
                                .filter(Boolean)
                                .join(', ')
                            : '-')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{t('consumable.detail.capacity')}</span>
                      <span className="font-medium text-slate-900">
                        {typedItem?.consumableType?.capacity
                          ? `${Number(typedItem.consumableType.capacity as number).toLocaleString()} ${t('consumable.pages')}`
                          : '-'}
                      </span>
                    </div>
                    {typedItem?.price !== undefined && typedItem?.price !== null && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">{t('consumable.detail.price')}</span>
                        <span className="font-medium text-slate-900">
                          {typedItem.currency?.symbol || typedItem.currency?.code || 'USD'}{' '}
                          {Number(typedItem.price).toLocaleString('en-US')}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">{t('consumable.detail.created_at')}</span>
                      <span className="font-medium text-slate-900">
                        {fmtDate(typedItem?.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Installation Info */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Server className="h-4 w-4 text-emerald-500" />
                    <h4 className="font-semibold text-slate-900">
                      {t('consumable.detail.installation')}
                    </h4>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">
                        {t('consumable.detail.install_status')}
                      </span>
                      {Number(typedItem?.deviceCount ?? 0) > 0 ? (
                        <span className="flex items-center gap-1.5 font-medium text-emerald-600">
                          <CheckCircle className="h-3.5 w-3.5" />
                          {t('consumable.detail.installed', {
                            count: Number(typedItem?.deviceCount ?? 0),
                          })}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 font-medium text-slate-500">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {t('consumable.detail.not_installed')}
                        </span>
                      )}
                    </div>
                    {Number(typedItem?.deviceCount ?? 0) > 0 &&
                      Array.isArray(typedItem?.deviceConsumables) &&
                      (typedItem.deviceConsumables as { installedAt?: string }[]).length > 0 && (
                        <div className="mt-2 rounded-lg bg-slate-50 p-2 text-xs">
                          <span className="mb-1 block font-medium text-slate-500">
                            {t('consumable.detail.installed_date_label')}
                          </span>
                          <div className="flex flex-col gap-1">
                            {(typedItem.deviceConsumables as { installedAt?: string }[]).map(
                              (dc, i) => (
                                <div key={i} className="text-slate-700">
                                  {fmtDate(dc.installedAt)}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                </div>

                {/* Customer Info */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:col-span-2">
                  <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
                    <User className="h-4 w-4 text-[var(--brand-600)]" />
                    <h4 className="font-semibold text-slate-900">
                      {t('consumable.detail.customer_notes')}
                    </h4>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="block text-xs text-slate-500">
                          {t('consumable.detail.customer_label')}
                        </span>
                        <span className="font-medium text-slate-900">
                          {String(typedItem?.customer?.name ?? '-')}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs text-slate-500">
                          {t('consumable.detail.contact')}
                        </span>
                        <span className="text-slate-700">
                          {String(typedItem?.customer?.contactPerson ?? '-')}
                          {typedItem?.customer?.contactPhone
                            ? ` (${String(typedItem.customer.contactPhone)})`
                            : ''}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="block text-xs text-slate-500">
                          {t('consumable.detail.return_reason')}
                        </span>
                        <span className="text-slate-700">
                          {String(typedItem?.returnReason ?? '-')}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs text-slate-500">
                          {t('consumable.detail.notes')}
                        </span>
                        <p className="text-slate-700">{String(typedItem?.returnNotes ?? '-')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t bg-slate-50/50 px-6 py-4">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-between">
            <div className="flex gap-2"></div>
            <Button onClick={() => onOpenChange(false)}>{t('button.close')}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

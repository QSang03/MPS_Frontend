'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { contractsClientService } from '@/lib/api/services/contracts-client.service'
import type { ContractDevice } from '@/types/models/contract-device'
import { formatCurrencyWithSymbol } from '@/lib/utils/formatters'
import { toast } from 'sonner'
import { useLocale } from '@/components/providers/LocaleProvider'
import {
  MonitorSmartphone,
  Plug2,
  Calendar,
  DollarSign,
  Trash2,
  Plus,
  TrendingUp,
} from 'lucide-react'
import { useActionPermission } from '@/lib/hooks/useActionPermission'
import { ActionGuard } from '@/components/shared/ActionGuard'

interface Props {
  contractId?: string | null
  onRequestOpenAttach?: () => void
  attachedDevices?: ContractDevice[]
}

export default function ContractDevicesSection({
  contractId,
  onRequestOpenAttach,
  attachedDevices,
}: Props) {
  const queryClient = useQueryClient()
  const { t, locale } = useLocale()
  const [page] = useState(1)
  const [limit] = useState(50)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const { can: canContractAction } = useActionPermission('customers')
  const canAttachDevices = canContractAction('contract-attach-devices')
  const canDetachDevices = canContractAction('contract-detach-devices')

  const canManage = !!contractId

  const { data: listResp, isLoading } = useQuery({
    queryKey: ['contract-devices', contractId, page, limit],
    enabled: !!contractId && !attachedDevices,
    queryFn: async () =>
      await contractsClientService.listDevices(contractId as string, { page, limit }),
    select: (r) => r,
  })

  const devices: ContractDevice[] = attachedDevices ?? listResp?.data ?? []

  // Declare mutation hooks unconditionally (hooks must run in same order)
  const detachMutation = useMutation({
    mutationFn: (deviceIds: string[]) =>
      contractsClientService.detachDevices(contractId as string, { deviceIds }),
    onSuccess: () => {
      toast.success(t('contracts.detach_success'))
      queryClient.invalidateQueries({ queryKey: ['contract-devices', contractId] })
      setSelectedIds([])
    },
    onError: (err) => {
      console.error('detach error', err)
      toast.error(t('contracts.detach_error'))
    },
  })

  if (!canManage) {
    return (
      <div className="rounded-xl border-2 border-dashed border-[var(--brand-200)] bg-gradient-to-br from-[var(--brand-50)]/60 via-[var(--brand-50)]/40 to-white p-8 shadow-sm">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="rounded-full bg-[var(--brand-50)] p-3">
            <Plug2 className="h-6 w-6 text-[var(--brand-600)]" />
          </div>
          <p className="text-base font-medium text-[var(--brand-700)]">
            {t('contract_devices.section.save_contract_first.title')}
          </p>
          <p className="text-sm text-[var(--brand-500)]">
            {t('contract_devices.section.save_contract_first.description')}
          </p>
        </div>
      </div>
    )
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === devices.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(devices.map((d) => d.deviceId))
    }
  }

  const handleDetach = async () => {
    if (!contractId) return
    if (selectedIds.length === 0) {
      toast.error(t('contracts.detach.select_one'))
      return
    }
    await detachMutation.mutateAsync(selectedIds)
  }

  const openAttachDialog = () => {
    if (typeof onRequestOpenAttach === 'function') onRequestOpenAttach()
  }

  const formatDate = (date?: string | null) => {
    if (!date) return '—'
    try {
      return new Date(date).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US')
    } catch {
      return date.slice(0, 10)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 rounded-xl bg-gradient-to-r from-[var(--brand-50)] via-[var(--brand-50)] to-[var(--brand-50)] p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-[var(--brand-50)] p-2">
            <MonitorSmartphone className="h-5 w-5 text-[var(--brand-700)]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--brand-900)]">
              {t('contracts.devices.title')}
            </h3>
            <p className="text-sm text-[var(--brand-600)]">
              {devices.length > 0
                ? t('contracts.devices.count', { count: devices.length })
                : t('contracts.devices.empty')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canAttachDevices && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  onClick={openAttachDialog}
                  className="cursor-pointer gap-2 bg-gradient-to-r from-[var(--brand-600)] to-[var(--brand-700)] font-semibold text-white shadow-md transition-all hover:from-[var(--brand-700)] hover:to-[var(--brand-700)] hover:shadow-lg"
                >
                  <Plus className="h-4 w-4" />
                  {t('contract_devices.section.add_device')}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('contract_devices.section.add_device')}</p>
              </TooltipContent>
            </Tooltip>
          )}
          {canDetachDevices && selectedIds.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  onClick={handleDetach}
                  disabled={detachMutation.isPending}
                  className="cursor-pointer gap-2 bg-gradient-to-r from-red-500 to-pink-600 font-semibold text-white shadow-md transition-all hover:from-red-600 hover:to-pink-700 hover:shadow-lg"
                >
                  <Trash2 className="h-4 w-4" />
                  {t('contract_devices.section.detach_devices', { count: selectedIds.length })}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('contract_devices.section.detach_devices', { count: selectedIds.length })}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-hidden rounded-xl border border-[var(--brand-100)] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-[var(--brand-50)] via-[var(--brand-50)] to-[var(--brand-50)]">
              <tr>
                <th className="px-4 py-3 text-left">
                  {devices.length > 0 && (
                    <input
                      type="checkbox"
                      checked={selectedIds.length === devices.length && devices.length > 0}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 cursor-pointer rounded border-[var(--brand-300)] text-[var(--brand-600)] focus:ring-2 focus:ring-[var(--brand-500)]"
                    />
                  )}
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold tracking-wide text-[var(--brand-900)] uppercase">
                  {t('contract_devices.section.table.serial')}
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold tracking-wide text-[var(--brand-900)] uppercase">
                  {t('contract_devices.section.table.model')}
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold tracking-wide text-indigo-900 uppercase">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    {t('contract_devices.section.table.monthly_rent')}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold tracking-wide text-orange-900 uppercase">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    {t('contract_devices.section.table.operating_cost')}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold tracking-wide text-indigo-900 uppercase">
                  {t('contract_devices.section.table.bw_price')}
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold tracking-wide text-indigo-900 uppercase">
                  {t('contract_devices.section.table.color_price')}
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold tracking-wide text-indigo-900 uppercase">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {t('contract_devices.section.table.start_date')}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold tracking-wide text-indigo-900 uppercase">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {t('contract_devices.section.table.end_date')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--brand-50)]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--brand-200)] border-t-[var(--brand-600)]"></div>
                      <p className="text-sm text-[var(--brand-500)]">{t('common.loading')}</p>
                    </div>
                  </td>
                </tr>
              ) : devices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="rounded-full bg-[var(--brand-50)] p-4">
                        <MonitorSmartphone className="h-8 w-8 text-[var(--brand-300)]" />
                      </div>
                      <p className="text-sm font-medium text-[var(--brand-700)]">
                        {t('contract_devices.section.empty.title')}
                      </p>
                      <p className="text-xs text-[var(--brand-500)]">
                        {t('contract_devices.section.empty.description')}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                devices.map((d) => (
                  <tr key={d.id} className="group transition-colors hover:bg-[var(--brand-50)]/50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(d.deviceId)}
                        onChange={() => toggleSelect(d.deviceId)}
                        className="h-4 w-4 cursor-pointer rounded border-[var(--brand-200)] text-[var(--brand-600)] focus:ring-2 focus:ring-[var(--brand-500)]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2 rounded-md bg-[var(--brand-50)] px-2.5 py-1 font-mono text-sm font-medium text-[var(--brand-900)] group-hover:bg-[var(--brand-100)]">
                        {d.device?.serialNumber ?? d.deviceId}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ActionGuard pageId="customers" actionId="view-contract-devices">
                        <span className="text-sm font-medium text-gray-900">
                          {d.device?.id ? (
                            <Link
                              href={`/system/devices/${d.device.id}`}
                              className="text-[var(--brand-600)] hover:underline"
                            >
                              {d.device?.deviceModel?.name ?? d.device?.model ?? '—'}
                            </Link>
                          ) : (
                            (d.device?.deviceModel?.name ?? d.device?.model ?? '—')
                          )}
                        </span>
                      </ActionGuard>
                    </td>
                    <td className="px-4 py-3">
                      <ActionGuard pageId="customers" actionId="device-contract-rent-view">
                        <span className="text-sm font-semibold whitespace-nowrap text-[var(--brand-700)]">
                          {d.monthlyRent != null
                            ? formatCurrencyWithSymbol(d.monthlyRent, d.currency)
                            : '—'}
                        </span>
                      </ActionGuard>
                    </td>
                    <td className="px-4 py-3">
                      <ActionGuard pageId="customers" actionId="device-contract-rent-view">
                        <span className="text-sm font-semibold whitespace-nowrap text-orange-700">
                          {d.monthlyRentCogs != null
                            ? formatCurrencyWithSymbol(d.monthlyRentCogs, d.currency)
                            : '—'}
                        </span>
                      </ActionGuard>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm whitespace-nowrap text-gray-700">
                        {d.pricePerBWPage != null
                          ? formatCurrencyWithSymbol(d.pricePerBWPage, d.currency)
                          : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm whitespace-nowrap text-gray-700">
                        {d.pricePerColorPage != null
                          ? formatCurrencyWithSymbol(d.pricePerColorPage, d.currency)
                          : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">{formatDate(d.activeFrom)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">{formatDate(d.activeTo)}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Info */}
      {devices.length > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-[var(--brand-50)]/50 px-4 py-3">
          <p className="text-sm text-[var(--brand-700)]">
            {t('contract_devices.section.footer.total', { count: devices.length })}
          </p>
          {selectedIds.length > 0 && (
            <p className="text-sm text-[var(--brand-600)]">
              {t('contract_devices.section.footer.selected', { count: selectedIds.length })}
            </p>
          )}
        </div>
      )}

      <Separator />
    </div>
  )
}

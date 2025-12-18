'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Separator } from '@/components/ui/separator'
import { contractsClientService } from '@/lib/api/services/contracts-client.service'
import type { ContractDevice } from '@/types/models/contract-device'
import { formatCurrencyWithSymbol } from '@/lib/utils/formatters'
import { MonitorSmartphone, Plug2 } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'

interface Props {
  contractId?: string | null
  // onRequestOpenAttach: optional callback to request opening attach dialog
  // kept optional because user view may be read-only
  onRequestOpenAttach?: () => void
  attachedDevices?: ContractDevice[] // Truyền danh sách thiết bị đã gán
}
export default function ContractDevicesSection({ contractId, attachedDevices }: Props) {
  const [page] = useState(1)
  const [limit] = useState(50)
  // attach/detach actions removed for user contracts (managed only by admin)
  const { t } = useLocale()

  const canManage = !!contractId

  const { data: listResp, isLoading } = useQuery({
    queryKey: ['contract-devices', contractId, page, limit],
    enabled: !!contractId && !attachedDevices, // Chỉ fetch nếu không có attachedDevices từ props
    queryFn: async () =>
      await contractsClientService.listDevices(contractId as string, { page, limit }),
    select: (r) => r,
  })

  // Ưu tiên sử dụng attachedDevices từ props, nếu không có thì dùng data từ query
  const devices: ContractDevice[] = attachedDevices ?? listResp?.data ?? []

  // attach/detach functionality removed for user view — read-only list

  if (!canManage) {
    return (
      <div className="rounded-lg border bg-gradient-to-br from-[var(--brand-50)]/80 to-white p-6">
        <div className="text-muted-foreground flex items-center gap-2 text-base">
          <Plug2 className="h-5 w-5" />
          {t('contract_devices.section.save_contract_first.title')}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-lg font-bold text-[var(--brand-700)]">
          <MonitorSmartphone className="h-5 w-5" />
          {t('contract_devices.modal.title')}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* No device management actions for users */}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border-2 border-[var(--brand-100)] shadow">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-[var(--brand-50)] via-[var(--brand-50)] to-white text-[var(--brand-700)]">
            <tr>
              <th className="px-3 py-2 text-left text-sm font-bold">
                {t('contract_devices.section.table.serial')}
              </th>
              <th className="px-3 py-2 text-left text-sm font-bold">
                {t('contract_devices.section.table.model')}
              </th>
              <th className="px-3 py-2 text-left text-sm font-bold">
                {t('contract_devices.section.table.monthly_rent')}
              </th>
              <th className="px-3 py-2 text-left text-sm font-bold">
                {t('contract_devices.section.table.bw_price')}
              </th>
              <th className="px-3 py-2 text-left text-sm font-bold">
                {t('contract_devices.section.table.color_price')}
              </th>
              <th className="px-3 py-2 text-left text-sm font-bold">
                {t('contract_devices.section.table.start_date')}
              </th>
              <th className="px-3 py-2 text-left text-sm font-bold">
                {t('contract_devices.section.table.end_date')}
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-7 text-center text-base text-[var(--brand-400)]">
                  {t('common.loading')}
                </td>
              </tr>
            ) : devices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-base text-[var(--brand-400)]">
                  {t('contract_devices.section.empty.title')}
                </td>
              </tr>
            ) : (
              devices.map((d) => (
                <tr
                  key={d.id}
                  className="transition even:bg-[var(--brand-50)]/30 hover:bg-[var(--brand-100)]"
                >
                  <td className="px-3 py-2 font-mono text-base text-[var(--brand-900)]">
                    {d.device?.serialNumber ?? d.deviceId}
                  </td>
                  <td className="px-3 py-2">
                    {d.device?.deviceModel?.name ?? d.device?.model ?? '—'}
                  </td>
                  <td className="px-3 py-2">
                    {d.monthlyRent != null
                      ? formatCurrencyWithSymbol(d.monthlyRent, d.currency)
                      : '—'}
                  </td>
                  <td className="px-3 py-2">
                    {d.pricePerBWPage != null
                      ? formatCurrencyWithSymbol(d.pricePerBWPage, d.currency)
                      : '—'}
                  </td>
                  <td className="px-3 py-2">
                    {d.pricePerColorPage != null
                      ? formatCurrencyWithSymbol(d.pricePerColorPage, d.currency)
                      : '—'}
                  </td>
                  <td className="px-3 py-2">{d.activeFrom ? d.activeFrom.slice(0, 10) : '—'}</td>
                  <td className="px-3 py-2">{d.activeTo ? d.activeTo.slice(0, 10) : '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Separator />

      {/* Attach dialog is handled by parent modal */}
    </div>
  )
}

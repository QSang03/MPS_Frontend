'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Separator } from '@/components/ui/separator'
import { contractsClientService } from '@/lib/api/services/contracts-client.service'
import type { ContractDevice } from '@/types/models/contract-device'
import { MonitorSmartphone, Plug2 } from 'lucide-react'

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
      <div className="rounded-lg border bg-gradient-to-br from-indigo-50/80 to-white p-6">
        <div className="text-muted-foreground flex items-center gap-2 text-base">
          <Plug2 className="h-5 w-5" />
          Lưu hợp đồng trước khi quản lý thiết bị.
        </div>
      </div>
    )
  }

  const formatPrice = (
    value?: number | null,
    currency?: { symbol?: string; code?: string } | null
  ) => {
    if (value === undefined || value === null) return '—'
    if (typeof value !== 'number') return String(value)
    const currencySymbol = currency?.symbol || (currency?.code ? currency.code : '$')
    // keep up to 5 decimal places, then remove unnecessary trailing zeros
    // e.g. 0.50000 -> "0.5", 2.00000 -> "2", 1.234567 -> "1.23457"
    const formatted = value
      .toFixed(5)
      .replace(/(?:\.0+|(?<=\.[0-9]*?)0+)$/, '')
      .replace(/\.$/, '')
    return `${currencySymbol} ${formatted}`
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-lg font-bold text-indigo-700">
          <MonitorSmartphone className="h-5 w-5" />
          Thiết bị của hợp đồng
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* No device management actions for users */}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border-2 border-indigo-100 shadow">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-indigo-50 via-blue-50 to-white text-indigo-700">
            <tr>
              <th className="px-3 py-2 text-left text-sm font-bold">Serial</th>
              <th className="px-3 py-2 text-left text-sm font-bold">Model</th>
              <th className="px-3 py-2 text-left text-sm font-bold">Giá thuê/tháng</th>
              <th className="px-3 py-2 text-left text-sm font-bold">Giá trang B/W</th>
              <th className="px-3 py-2 text-left text-sm font-bold">Giá trang màu</th>
              <th className="px-3 py-2 text-left text-sm font-bold">Bắt đầu</th>
              <th className="px-3 py-2 text-left text-sm font-bold">Kết thúc</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-7 text-center text-base text-indigo-400">
                  Đang tải...
                </td>
              </tr>
            ) : devices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-base text-indigo-400">
                  Chưa có thiết bị nào được gắn
                </td>
              </tr>
            ) : (
              devices.map((d) => (
                <tr key={d.id} className="transition even:bg-indigo-50/30 hover:bg-indigo-100">
                  <td className="px-3 py-2 font-mono text-base text-indigo-900">
                    {d.device?.serialNumber ?? d.deviceId}
                  </td>
                  <td className="px-3 py-2">
                    {d.device?.deviceModel?.name ?? d.device?.model ?? '—'}
                  </td>
                  <td className="px-3 py-2">{formatPrice(d.monthlyRent)}</td>
                  <td className="px-3 py-2">{formatPrice(d.pricePerBWPage)}</td>
                  <td className="px-3 py-2">{formatPrice(d.pricePerColorPage)}</td>
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

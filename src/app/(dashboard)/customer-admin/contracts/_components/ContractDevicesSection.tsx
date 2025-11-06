'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { contractsClientService } from '@/lib/api/services/contracts-client.service'
import type { ContractDevice } from '@/types/models/contract-device'
import { toast } from 'sonner'
import { MonitorSmartphone, Plug2 } from 'lucide-react'

interface Props {
  contractId?: string | null
  onRequestOpenAttach?: () => void
}

export default function ContractDevicesSection({ contractId, onRequestOpenAttach }: Props) {
  const queryClient = useQueryClient()
  const [page] = useState(1)
  const [limit] = useState(50)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  // attach dialog is lifted to parent modal; request parent to open when needed
  // local inputs were removed - attach dialog is lifted to parent

  const canManage = !!contractId

  const { data: listResp, isLoading } = useQuery({
    queryKey: ['contract-devices', contractId, page, limit],
    enabled: !!contractId,
    queryFn: async () =>
      await contractsClientService.listDevices(contractId as string, { page, limit }),
    select: (r) => r,
  })

  const devices: ContractDevice[] = listResp?.data ?? []

  const detachMutation = useMutation({
    mutationFn: (deviceIds: string[]) =>
      contractsClientService.detachDevices(contractId as string, { deviceIds }),
    onSuccess: () => {
      toast.success('Gỡ thiết bị thành công')
      queryClient.invalidateQueries({ queryKey: ['contract-devices', contractId] })
      setSelectedIds([])
    },
    onError: (err) => {
      console.error('detach error', err)
      toast.error('Gỡ thiết bị thất bại')
    },
  })

  // attach dialog is handled by parent modal

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
  }
  // attach dialog selection handled by parent

  const handleDetach = async () => {
    if (!contractId) return
    if (selectedIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 thiết bị để gỡ')
      return
    }
    await detachMutation.mutateAsync(selectedIds)
  }
  // attach action handled by parent
  const openAttachDialog = () => {
    if (typeof onRequestOpenAttach === 'function') onRequestOpenAttach()
  }

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-lg font-bold text-indigo-700">
          <MonitorSmartphone className="h-5 w-5" />
          Thiết bị của hợp đồng
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="bg-gradient-to-r from-blue-100 to-indigo-100 font-bold text-indigo-700"
            onClick={openAttachDialog}
          >
            + Thêm thiết bị
          </Button>
          <Button
            size="sm"
            onClick={handleDetach}
            disabled={selectedIds.length === 0}
            className="bg-gradient-to-r from-red-400 to-pink-400 font-semibold text-white"
          >
            Gỡ thiết bị
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border-2 border-indigo-100 shadow">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-indigo-50 via-blue-50 to-white text-indigo-700">
            <tr>
              <th className="px-3 py-2 text-left text-sm font-bold"> </th>
              <th className="px-3 py-2 text-left text-sm font-bold">Serial</th>
              <th className="px-3 py-2 text-left text-sm font-bold">Model</th>
              <th className="px-3 py-2 text-left text-sm font-bold">Giá thuê/tháng</th>
              <th className="px-3 py-2 text-left text-sm font-bold">Bắt đầu</th>
              <th className="px-3 py-2 text-left text-sm font-bold">Kết thúc</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-7 text-center text-base text-indigo-400">
                  Đang tải...
                </td>
              </tr>
            ) : devices.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-base text-indigo-400">
                  Chưa có thiết bị nào được gắn
                </td>
              </tr>
            ) : (
              devices.map((d) => (
                <tr key={d.id} className="transition even:bg-indigo-50/30 hover:bg-indigo-100">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(d.deviceId)}
                      onChange={() => toggleSelect(d.deviceId)}
                      className="h-4 w-4 accent-indigo-600"
                    />
                  </td>
                  <td className="px-3 py-2 font-mono text-base text-indigo-900">
                    {d.device?.serialNumber ?? d.deviceId}
                  </td>
                  <td className="px-3 py-2">
                    {d.device?.deviceModel?.name ?? d.device?.model ?? '—'}
                  </td>
                  <td className="px-3 py-2">{d.monthlyRent ?? '—'}</td>
                  <td className="px-3 py-2">{d.activeFrom ? d.activeFrom.slice(0, 10) : '—'}</td>
                  <td className="px-3 py-2">{d.activeTo ? d.activeTo.slice(0, 10) : '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Separator />

      {/* Attach Dialog */}
      {/* Attach dialog is lifted to parent modal; request parent to open it */}
    </div>
  )
}

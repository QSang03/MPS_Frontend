'use client'

import ContractDevicesSection from './ContractDevicesSection'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Dialog } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  MonitorSmartphone,
  CheckCircle2,
  Circle,
  Search,
  Calendar,
  AlertCircle,
  Loader2,
  X,
  Info,
} from 'lucide-react'
import { useState, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { contractsClientService } from '@/lib/api/services/contracts-client.service'
import { devicesClientService } from '@/lib/api/services/devices-client.service'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useLocale } from '@/components/providers/LocaleProvider'
import { cn } from '@/lib/utils'
import { ActionGuard } from '@/components/shared/ActionGuard'

import type { ContractDevice } from '@/types/models/contract-device'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  contractId?: string | null
  contractNumber?: string | null
  attachedDevices?: ContractDevice[]
  allContracts?: Array<{
    id: string
    contractNumber: string
    contractDevices?: Array<{ deviceId?: string }>
  }>
}

// Định nghĩa type cho device đơn giản dùng trong list chọn
type SimpleDevice = {
  id: string
  serialNumber?: string | null
  deviceModel?: { name?: string } | null
  model?: string | null
}

// Định nghĩa type cho filter status để tránh dùng any
type FilterStatus = 'all' | 'attached' | 'unattached' | 'other'

export default function ContractDevicesModal({
  open,
  onOpenChange,
  contractId,
  contractNumber,
  attachedDevices = [],
  allContracts = [],
}: Props) {
  const { t } = useLocale()
  const [attachOpen, setAttachOpen] = useState(false)
  const [hideOuter, setHideOuter] = useState(false)
  const [selectedToAttach, setSelectedToAttach] = useState<string[]>([])
  const [activeFrom, setActiveFrom] = useState<string>('')
  const [activeTo, setActiveTo] = useState<string>('')
  const [monthlyRent, setMonthlyRent] = useState<string>('')
  const [monthlyRentCogs, setMonthlyRentCogs] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')

  // Sử dụng type FilterStatus thay vì string chung chung
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')

  const queryClient = useQueryClient()

  const { data: contract } = useQuery({
    queryKey: ['contract', contractId],
    queryFn: async () => (contractId ? await contractsClientService.getById(contractId) : null),
    enabled: !!contractId,
  })

  const { data: allDevicesResp, isLoading: devicesLoading } = useQuery({
    queryKey: ['devices', { page: 1, limit: 200, customerId: contract?.customerId }],
    queryFn: () =>
      devicesClientService
        .getAll({ page: 1, limit: 200, customerId: contract?.customerId })
        .then((r: { data: SimpleDevice[] }) => r.data),
    enabled: attachOpen,
  })

  // FIX 1: Memoize allDevices để mảng này không bị tạo mới mỗi lần render
  const allDevices = useMemo(() => (allDevicesResp ?? []) as SimpleDevice[], [allDevicesResp])

  // FIX 2: Memoize attachedDeviceIds.
  // Nếu không có useMemo, Set này sẽ là object mới sau mỗi render, phá vỡ logic của filteredDevices bên dưới
  const attachedDeviceIds = useMemo(() => {
    return new Set(attachedDevices.map((d) => d.deviceId))
  }, [attachedDevices])

  const deviceToOtherContractMap = useMemo(() => {
    const map = new Map<string, { contractNumber: string; contractId: string }>()
    if (!contractId || !allContracts.length) return map

    allContracts.forEach((contractItem) => {
      if (contractItem.id === contractId) return

      contractItem.contractDevices?.forEach((cd) => {
        if (cd.deviceId) {
          map.set(cd.deviceId, {
            contractNumber: contractItem.contractNumber,
            contractId: contractItem.id,
          })
        }
      })
    })
    return map
  }, [allContracts, contractId])

  // Filter and search devices
  // filteredDevices giờ sẽ hoạt động hiệu quả vì các dependencies (allDevices, attachedDeviceIds) đã ổn định
  const filteredDevices = useMemo(() => {
    return allDevices.filter((device) => {
      const matchesSearch =
        device.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.deviceModel?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.model?.toLowerCase().includes(searchTerm.toLowerCase())

      const isAttached = attachedDeviceIds.has(device.id)
      const hasOtherContract = deviceToOtherContractMap.has(device.id)

      const matchesFilter =
        filterStatus === 'all' ||
        (filterStatus === 'attached' && isAttached) ||
        (filterStatus === 'unattached' && !isAttached && !hasOtherContract) ||
        (filterStatus === 'other' && hasOtherContract)

      return matchesSearch && matchesFilter
    })
  }, [allDevices, searchTerm, filterStatus, attachedDeviceIds, deviceToOtherContractMap])

  const hasAttachedDevicesSelected = selectedToAttach.some((id) => attachedDeviceIds.has(id))

  const attachMutation = useMutation({
    mutationFn: (
      items: Array<{
        deviceId: string
        monthlyRent?: number
        monthlyRentCogs?: number
        activeFrom?: string | null
        activeTo?: string | null
      }>
    ) => contractsClientService.attachDevices(contractId as string, { items }),
    onSuccess: () => {
      const hasUpdates = selectedToAttach.some((id) => attachedDeviceIds.has(id))
      toast.success(hasUpdates ? t('device.update_success') : t('device.attach_success'))
      setAttachOpen(false)
      setHideOuter(false)
      setSelectedToAttach([])
      setActiveFrom('')
      setActiveTo('')
      setMonthlyRent('')
      setMonthlyRentCogs('')
      setSearchTerm('')
      setFilterStatus('all')
      queryClient.invalidateQueries({ queryKey: ['contract-devices', contractId] })
    },
    onError: (err) => {
      console.error('attach error', err)
      const apiMessage =
        (
          err as {
            response?: { data?: { error?: string; message?: string } }
            message?: string
          }
        )?.response?.data?.error ||
        (
          err as {
            response?: { data?: { error?: string; message?: string } }
            message?: string
          }
        )?.response?.data?.message ||
        (err as { message?: string })?.message ||
        t('device.attach_error')

      if (
        apiMessage.includes(
          'Cannot attach devices that are already attached to an active contract'
        ) &&
        apiMessage.includes('Conflicting devices:')
      ) {
        const conflictingDevicesMatch = apiMessage.match(/Conflicting devices: (.+)$/)
        if (conflictingDevicesMatch && conflictingDevicesMatch[1]) {
          const conflictingDevicesStr = conflictingDevicesMatch[1]
          const deviceMatches = conflictingDevicesStr.match(/([^(]+)\s*\([^)]+\)/g)
          if (deviceMatches && deviceMatches.length > 0) {
            const serialNumbers = deviceMatches
              .map((match) => {
                const serialMatch = match.match(/([^(]+)/)
                return serialMatch && serialMatch[1] ? serialMatch[1].trim() : match.trim()
              })
              .filter(Boolean)
            if (serialNumbers.length > 0) {
              toast.error(
                `Không thể gán thiết bị vì đã được gán cho hợp đồng active khác: ${serialNumbers.join(', ')}`,
                {
                  duration: 5000,
                }
              )
              return
            }
          }
        }
      }

      toast.error(apiMessage)
    },
  })

  const toggleSelectAttach = (id: string) => {
    setSelectedToAttach((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const handleAttach = async () => {
    if (!contractId) return
    if (selectedToAttach.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 thiết bị để đính kèm')
      return
    }

    const items = selectedToAttach.map((deviceId) => ({
      deviceId,
      monthlyRent: monthlyRent && monthlyRent.trim() ? parseFloat(monthlyRent.trim()) : undefined,
      monthlyRentCogs:
        monthlyRentCogs && monthlyRentCogs.trim() ? parseFloat(monthlyRentCogs.trim()) : undefined,
      activeFrom: activeFrom && activeFrom.trim() ? activeFrom.trim() : null,
      activeTo: activeTo && activeTo.trim() ? activeTo.trim() : null,
    }))

    await attachMutation.mutateAsync(items)
  }

  // Stats
  const stats = useMemo(() => {
    const attached = allDevices.filter((d) => attachedDeviceIds.has(d.id)).length
    const other = allDevices.filter((d) => deviceToOtherContractMap.has(d.id)).length
    const unattached = allDevices.length - attached - other
    return { total: allDevices.length, attached, other, unattached }
  }, [allDevices, attachedDeviceIds, deviceToOtherContractMap])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SystemModalLayout
        title="Quản lý thiết bị của hợp đồng"
        description={
          contractNumber
            ? `Mã hợp đồng: ${contractNumber}`
            : 'Danh sách thiết bị được quản lý theo hợp đồng'
        }
        icon={MonitorSmartphone}
        variant="view"
        maxWidth={`${hideOuter ? 'hidden' : '!max-w-[80vw]'}`}
        footer={
          <Button variant="outline" onClick={() => onOpenChange(false)} className="min-w-[100px]">
            Đóng
          </Button>
        }
      >
        <ContractDevicesSection
          contractId={contractId}
          onRequestOpenAttach={() => {
            setHideOuter(true)
            setActiveFrom(contract?.startDate ? String(contract.startDate).slice(0, 10) : '')
            setActiveTo(contract?.endDate ? String(contract.endDate).slice(0, 10) : '')
            setAttachOpen(true)
          }}
        />

        {/* Attach Dialog */}
        <Dialog
          open={attachOpen}
          onOpenChange={(v) => {
            setAttachOpen(v)
            if (!v) {
              setHideOuter(false)
              setSelectedToAttach([])
              setSearchTerm('')
              setFilterStatus('all')
            }
          }}
        >
          <SystemModalLayout
            title="Thêm và Cập nhật thiết bị"
            description="Chọn các thiết bị để đính kèm vào hợp đồng"
            icon={MonitorSmartphone}
            variant="create"
            maxWidth="!max-w-[85vw]"
            footer={
              <>
                <Button
                  variant="outline"
                  onClick={() => setAttachOpen(false)}
                  disabled={attachMutation.status === 'pending'}
                >
                  {t('cancel')}
                </Button>
                <Button
                  onClick={handleAttach}
                  disabled={attachMutation.status === 'pending' || selectedToAttach.length === 0}
                  className="gap-2 bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)] shadow-sm hover:bg-[var(--btn-primary-hover)] hover:shadow-md"
                >
                  {attachMutation.status === 'pending' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('button.processing')}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      {hasAttachedDevicesSelected
                        ? t('button.update')
                        : t('contract.device.attach')}
                      {selectedToAttach.length > 0 && ` (${selectedToAttach.length})`}
                    </>
                  )}
                </Button>
              </>
            }
          >
            <div className="space-y-5">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-3 shadow-sm"
                >
                  <div className="text-xs font-medium text-slate-500">Tổng thiết bị</div>
                  <div className="mt-1 text-2xl font-bold text-slate-900">{stats.total}</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="rounded-lg border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-3 shadow-sm"
                >
                  <div className="text-xs font-medium text-amber-700">Đã gán (HĐ này)</div>
                  <div className="mt-1 text-2xl font-bold text-amber-900">{stats.attached}</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-lg border border-[var(--brand-200)] bg-gradient-to-br from-[var(--brand-50)] to-[var(--brand-50)] p-3 shadow-sm"
                >
                  <div className="text-xs font-medium text-blue-700">HĐ khác</div>
                  <div className="mt-1 text-2xl font-bold text-blue-900">{stats.other}</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="rounded-lg border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 p-3 shadow-sm"
                >
                  <div className="text-xs font-medium text-emerald-700">Chưa gán</div>
                  <div className="mt-1 text-2xl font-bold text-emerald-900">{stats.unattached}</div>
                </motion.div>
              </div>

              {/* Warning for attached devices */}
              <AnimatePresence>
                {hasAttachedDevicesSelected && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden rounded-lg border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-amber-100 p-2">
                        <AlertCircle className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-amber-900">Cập nhật thiết bị đã gán</p>
                        <p className="mt-1 text-sm text-amber-700">
                          Một số thiết bị đã được gán vào hợp đồng này. Chọn lại sẽ cập nhật thông
                          tin thời gian của chúng.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Search and Filter */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Tìm theo serial hoặc model..."
                      className="pl-9"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('')
                      setFilterStatus('all')
                    }}
                    disabled={!searchTerm && filterStatus === 'all'}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Xóa
                  </Button>
                </div>

                {/* Filter Chips */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-slate-600">Lọc nhanh:</span>
                  {[
                    { value: 'all', label: 'Tất cả', count: stats.total },
                    { value: 'unattached', label: 'Chưa gán', count: stats.unattached },
                    { value: 'attached', label: 'Đã gán (HĐ này)', count: stats.attached },
                    { value: 'other', label: 'HĐ khác', count: stats.other },
                  ].map((filter) => (
                    <Button
                      key={filter.value}
                      variant="outline"
                      size="sm"
                      // FIX 3: Ép kiểu về FilterStatus thay vì any
                      onClick={() => setFilterStatus(filter.value as FilterStatus)}
                      className={cn(
                        'h-8 gap-1.5 px-3 text-xs transition-all',
                        filterStatus === filter.value
                          ? 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100'
                          : 'hover:border-slate-300'
                      )}
                    >
                      {filter.label}
                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                        {filter.count}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Devices Table */}
              <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                {devicesLoading ? (
                  <div className="flex flex-col items-center justify-center space-y-3 p-12">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                    <p className="text-sm text-slate-600">{t('page.user_devices.loading')}</p>
                  </div>
                ) : filteredDevices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center space-y-3 p-12">
                    <div className="rounded-full bg-slate-100 p-4">
                      <Search className="h-8 w-8 text-slate-400" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-slate-700">Không tìm thấy thiết bị</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Thử điều chỉnh bộ lọc hoặc tìm kiếm khác
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto">
                    <table className="w-full">
                      <thead className="sticky top-0 z-10 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100/50">
                        <tr>
                          <th className="w-12 px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-blue-600"
                              checked={
                                filteredDevices.length > 0 &&
                                filteredDevices
                                  .filter((d) => !deviceToOtherContractMap.has(d.id))
                                  .every((d) => selectedToAttach.includes(d.id))
                              }
                              onChange={(e) => {
                                if (e.target.checked) {
                                  const selectableIds = filteredDevices
                                    .filter((d) => !deviceToOtherContractMap.has(d.id))
                                    .map((d) => d.id)
                                  setSelectedToAttach(selectableIds)
                                } else {
                                  setSelectedToAttach([])
                                }
                              }}
                            />
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-600 uppercase">
                            Serial Number
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-600 uppercase">
                            Model
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-600 uppercase">
                            Trạng thái
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredDevices.map((device, idx) => {
                          const isAttached = attachedDeviceIds.has(device.id)
                          const otherContract = deviceToOtherContractMap.get(device.id)
                          const isDisabled = !!otherContract
                          const isSelected = selectedToAttach.includes(device.id)

                          return (
                            <motion.tr
                              key={device.id}
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.02 }}
                              className={cn(
                                'group transition-all duration-200',
                                isDisabled && 'cursor-not-allowed opacity-60',
                                isSelected && 'bg-blue-50',
                                !isDisabled && !isSelected && 'hover:bg-slate-50',
                                isAttached && 'border-l-4 border-l-amber-400 bg-amber-50/40',
                                otherContract && 'border-l-4 border-l-blue-400 bg-blue-50/40'
                              )}
                            >
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    if (!isDisabled) {
                                      toggleSelectAttach(device.id)
                                    }
                                  }}
                                  disabled={isDisabled}
                                  className={cn(
                                    'h-4 w-4 accent-blue-600 transition-all',
                                    isDisabled && 'cursor-not-allowed opacity-50'
                                  )}
                                  title={
                                    isDisabled
                                      ? `Thiết bị đã được gán cho hợp đồng ${otherContract?.contractNumber}`
                                      : ''
                                  }
                                />
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {isAttached ? (
                                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-amber-600" />
                                  ) : otherContract ? (
                                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-blue-600" />
                                  ) : (
                                    <Circle className="h-4 w-4 flex-shrink-0 text-slate-300" />
                                  )}
                                  <span
                                    className={cn(
                                      'font-mono text-sm font-medium',
                                      isAttached && 'text-amber-700',
                                      otherContract && 'text-blue-700',
                                      !isAttached && !otherContract && 'text-slate-800'
                                    )}
                                  >
                                    {device.serialNumber}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-700">
                                <ActionGuard pageId="customers" actionId="view-contract-devices">
                                  {device.id ? (
                                    <Link
                                      href={`/system/devices/${device.id}`}
                                      className="text-sky-600 hover:underline"
                                    >
                                      {device.deviceModel?.name ?? device.model ?? '—'}
                                    </Link>
                                  ) : (
                                    (device.deviceModel?.name ?? device.model ?? '—')
                                  )}
                                </ActionGuard>
                              </td>
                              <td className="px-4 py-3">
                                {isAttached ? (
                                  <Badge
                                    variant="outline"
                                    className="border-amber-300 bg-amber-100 text-xs font-medium text-amber-700"
                                  >
                                    <CheckCircle2 className="mr-1 h-3 w-3" />
                                    Đã gán (HĐ này)
                                  </Badge>
                                ) : otherContract ? (
                                  <Badge
                                    variant="outline"
                                    className="border-blue-300 bg-blue-100 text-xs font-medium text-blue-700"
                                  >
                                    <Info className="mr-1 h-3 w-3" />
                                    {otherContract.contractNumber}
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="border-slate-300 bg-slate-100 text-xs text-slate-600"
                                  >
                                    Chưa gán
                                  </Badge>
                                )}
                              </td>
                            </motion.tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Date Range Inputs */}
              <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-600" />
                  <h4 className="text-sm font-semibold text-slate-700">Thời gian hiệu lực</h4>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">
                      Từ ngày
                    </label>
                    <Input
                      type="date"
                      value={activeFrom}
                      onChange={(e) => setActiveFrom(e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">
                      Đến ngày
                    </label>
                    <Input
                      type="date"
                      value={activeTo}
                      onChange={(e) => setActiveTo(e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Nếu để trống, hệ thống sẽ sử dụng thời gian của hợp đồng
                </p>
              </div>

              {/* Pricing Inputs */}
              <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Info className="h-4 w-4 text-slate-600" />
                  <h4 className="text-sm font-semibold text-slate-700">Thông tin giá</h4>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">
                      Giá thuê/tháng (VNĐ)
                    </label>
                    <Input
                      type="number"
                      value={monthlyRent}
                      onChange={(e) => setMonthlyRent(e.target.value)}
                      className="h-10"
                      placeholder="Ví dụ: 500000"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">
                      Chi phí vận hành/tháng (VNĐ)
                    </label>
                    <Input
                      type="number"
                      value={monthlyRentCogs}
                      onChange={(e) => setMonthlyRentCogs(e.target.value)}
                      className="h-10"
                      placeholder="Ví dụ: 300000"
                    />
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Để trống nếu không muốn cập nhật giá. Giá sẽ được áp dụng cho tất cả thiết bị đã
                  chọn.
                </p>
              </div>

              {/* Selected Count */}
              {selectedToAttach.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-[var(--brand-200)] bg-gradient-to-br from-[var(--brand-50)] to-[var(--brand-50)] p-3 text-center"
                >
                  <p className="text-sm font-medium text-blue-900">
                    Đã chọn <span className="text-lg font-bold">{selectedToAttach.length}</span>{' '}
                    thiết bị
                  </p>
                </motion.div>
              )}
            </div>
          </SystemModalLayout>
        </Dialog>
      </SystemModalLayout>
    </Dialog>
  )
}

'use client'

import ContractDevicesSection from './ContractDevicesSection'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { MonitorSmartphone, Sparkles, CheckCircle2, Circle } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { contractsClientService } from '@/lib/api/services/contracts-client.service'
import { devicesClientService } from '@/lib/api/services/devices-client.service'
import { DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useLocale } from '@/components/providers/LocaleProvider'

import type { ContractDevice } from '@/types/models/contract-device'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  contractId?: string | null
  contractNumber?: string | null
  attachedDevices?: ContractDevice[] // Truyền danh sách thiết bị đã gán từ component cha
  allContracts?: Array<{
    id: string
    contractNumber: string
    contractDevices?: Array<{ deviceId?: string }>
  }> // Danh sách tất cả hợp đồng để kiểm tra thiết bị đã gán cho hợp đồng khác
}

export default function ContractDevicesModal({
  open,
  onOpenChange,
  contractId,
  contractNumber,
  attachedDevices = [], // Nhận danh sách thiết bị đã gán từ props
  allContracts = [], // Danh sách tất cả hợp đồng
}: Props) {
  const { t } = useLocale()
  const [attachOpen, setAttachOpen] = useState(false)
  const [hideOuter, setHideOuter] = useState(false)
  const [selectedToAttach, setSelectedToAttach] = useState<string[]>([])
  const [activeFrom, setActiveFrom] = useState<string>('')
  const [activeTo, setActiveTo] = useState<string>('')

  type SimpleDevice = {
    id: string
    serialNumber?: string | null
    deviceModel?: { name?: string } | null
    model?: string | null
  }

  const queryClient = useQueryClient()

  const { data: contract } = useQuery({
    queryKey: ['contract', contractId],
    queryFn: async () => (contractId ? await contractsClientService.getById(contractId) : null),
    enabled: !!contractId,
  })

  const { data: allDevicesResp } = useQuery({
    queryKey: ['devices', { page: 1, limit: 200, customerId: contract?.customerId }],
    queryFn: () =>
      devicesClientService
        .getAll({ page: 1, limit: 200, customerId: contract?.customerId })
        .then((r: { data: SimpleDevice[] }) => r.data),
    enabled: attachOpen,
  })

  // Sử dụng danh sách thiết bị đã gán từ props, không cần fetch lại
  const allDevices: SimpleDevice[] = (allDevicesResp ?? []) as SimpleDevice[]
  const attachedDeviceIds = new Set(attachedDevices.map((d) => d.deviceId))

  // Tạo Map để lưu thông tin thiết bị đã gán cho hợp đồng khác
  const deviceToOtherContractMap = useMemo(() => {
    const map = new Map<string, { contractNumber: string; contractId: string }>()
    if (!contractId || !allContracts.length) return map

    allContracts.forEach((contract) => {
      // Bỏ qua hợp đồng hiện tại
      if (contract.id === contractId) return

      // Duyệt qua các thiết bị của hợp đồng khác
      contract.contractDevices?.forEach((cd) => {
        if (cd.deviceId) {
          map.set(cd.deviceId, {
            contractNumber: contract.contractNumber,
            contractId: contract.id,
          })
        }
      })
    })
    return map
  }, [allContracts, contractId])

  // Kiểm tra xem có thiết bị đã gán nào được chọn không
  const hasAttachedDevicesSelected = selectedToAttach.some((id) => attachedDeviceIds.has(id))

  const attachMutation = useMutation({
    mutationFn: (
      items: Array<{
        deviceId: string
        monthlyRent?: number
        activeFrom?: string | null
        activeTo?: string | null
      }>
    ) => contractsClientService.attachDevices(contractId as string, { items }),
    onSuccess: () => {
      const hasUpdates = selectedToAttach.some((id) => attachedDeviceIds.has(id))
      toast.success(hasUpdates ? t('device.update_success') : t('device.attach_success'))
      setAttachOpen(false)
      // un-hide outer modal content and refresh parent list
      setHideOuter(false)
      setSelectedToAttach([])
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

      // Kiểm tra nếu là lỗi conflict với hợp đồng active khác
      if (
        apiMessage.includes(
          'Cannot attach devices that are already attached to an active contract'
        ) &&
        apiMessage.includes('Conflicting devices:')
      ) {
        // Extract danh sách thiết bị conflict từ error message
        // Format: "Cannot attach devices that are already attached to an active contract. Conflicting devices: SN12345678900 (019a9537-ab27-75a2-864e-771e3cb523cb), sn123456789 (019a6c06-eb7b-7485-8409-eb1b62fa7ac9)"
        const conflictingDevicesMatch = apiMessage.match(/Conflicting devices: (.+)$/)
        if (conflictingDevicesMatch && conflictingDevicesMatch[1]) {
          const conflictingDevicesStr = conflictingDevicesMatch[1]
          // Parse danh sách: "SN12345678900 (id), sn123456789 (id)"
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
                t('contract_devices.attach.error.conflicting').replace(
                  '{serialNumbers}',
                  serialNumbers.join(', ')
                ),
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
      toast.error(t('contract_devices.attach.error.select_at_least_one'))
      return
    }

    const items = selectedToAttach.map((deviceId) => ({
      deviceId,
      // Backend yêu cầu activeFrom và activeTo, nếu không có thì truyền null
      activeFrom: activeFrom && activeFrom.trim() ? activeFrom.trim() : null,
      activeTo: activeTo && activeTo.trim() ? activeTo.trim() : null,
    }))

    await attachMutation.mutateAsync(items)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${hideOuter ? 'hidden' : '!max-w-[75vw]'} rounded-2xl border-0 p-0 shadow-2xl`}
      >
        {/* Gradient header */}
        <DialogHeader className="relative overflow-hidden bg-gradient-to-r from-[var(--brand-600)] via-[var(--brand-500)] to-[var(--brand-400)] p-0">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 h-32 w-32 translate-x-1/2 -translate-y-1/2 rounded-full bg-white"></div>
            <div className="absolute bottom-0 left-0 h-20 w-20 -translate-x-1/2 translate-y-1/2 rounded-full bg-white"></div>
          </div>
          <div className="relative z-10 flex items-center gap-4 px-7 py-6 text-white">
            <div className="rounded-xl border border-white/30 bg-white/20 p-2.5 backdrop-blur-lg">
              <MonitorSmartphone className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                {t('contract_devices.modal.title')}
              </DialogTitle>
              <DialogDescription className="mt-1 flex items-center gap-2 text-white/90">
                <Sparkles className="h-4 w-4" />
                {contractNumber ? (
                  <span>{t('contract_devices.modal.description', { contractNumber })}</span>
                ) : (
                  t('contract_devices.modal.description_no_contract')
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Content section */}
        <div className="bg-gradient-to-br from-white via-[var(--brand-50)]/30 to-white px-8 py-6">
          <ContractDevicesSection
            contractId={contractId}
            onRequestOpenAttach={() => {
              // Hide outer modal content (keep component mounted) then open attach dialog
              setHideOuter(true)
              // set defaults from contract dates (YYYY-MM-DD)
              setActiveFrom(contract?.startDate ? String(contract.startDate).slice(0, 10) : '')
              setActiveTo(contract?.endDate ? String(contract.endDate).slice(0, 10) : '')
              setAttachOpen(true)
            }}
          />
        </div>

        <Separator className="my-0" />

        {/* Attach Dialog (lifted here so it can open while parent is closed) */}
        <Dialog
          open={attachOpen}
          onOpenChange={(v) => {
            setAttachOpen(v)
            if (!v) {
              // when child attach dialog closes, un-hide the outer modal content
              setHideOuter(false)
            }
          }}
        >
          <DialogContent className="!max-w-[75vw] rounded-xl border-0 p-0 shadow-xl">
            <DialogHeader className="relative overflow-hidden bg-gradient-to-r from-[var(--brand-700)] via-[var(--brand-600)] to-[var(--brand-500)] p-0">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 right-0 h-24 w-24 translate-x-1/2 -translate-y-1/2 rounded-full bg-white"></div>
              </div>
              <div className="relative z-10 flex items-center gap-4 px-6 py-5 text-white">
                <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                  {t('contract_devices.attach.title')}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  {t('contract_devices.attach.description')}
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="space-y-4 rounded-b-xl bg-gradient-to-br from-white via-[var(--brand-50)] to-white p-4">
              <div className="mb-2 space-y-1">
                <div className="text-sm font-semibold text-[var(--brand-700)]">
                  {t('contract_devices.attach.description')}
                </div>
                {hasAttachedDevicesSelected && (
                  <div className="text-xs font-medium text-amber-600">
                    ⚠️ {t('contract_devices.warning.attached.description')}
                  </div>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto rounded border border-[var(--brand-100)]">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-[var(--brand-50)] to-[var(--brand-50)] text-[var(--brand-700)]">
                    <tr>
                      <th className="px-3 py-2 text-left text-sm font-bold"> </th>
                      <th className="px-3 py-2 text-left text-sm font-bold">
                        {t('contract_devices.table.serial_number')}
                      </th>
                      <th className="px-3 py-2 text-left text-sm font-bold">
                        {t('contract_devices.table.model')}
                      </th>
                      <th className="px-3 py-2 text-left text-sm font-bold">
                        {t('contract_devices.table.status')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {allDevices.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-7 text-center text-[var(--brand-400)]">
                          {t('contract_devices.empty.title')}
                        </td>
                      </tr>
                    ) : (
                      allDevices.map((ad: SimpleDevice) => {
                        const isAttached = attachedDeviceIds.has(ad.id)
                        const otherContract = deviceToOtherContractMap.get(ad.id)
                        const isDisabled = !!otherContract
                        return (
                          <tr
                            key={ad.id}
                            className={`transition even:bg-[var(--brand-50)]/40 ${isDisabled ? 'cursor-not-allowed opacity-60' : 'hover:bg-[var(--brand-100)]'} ${
                              isAttached
                                ? 'border-l-4 border-l-amber-400 bg-amber-50/60'
                                : otherContract
                                  ? 'border-l-4 border-l-[var(--brand-400)] bg-[var(--brand-50)]/60'
                                  : ''
                            }`}
                          >
                            <td className="px-3 py-2">
                              <input
                                type="checkbox"
                                checked={selectedToAttach.includes(ad.id)}
                                onChange={() => {
                                  if (!isDisabled) {
                                    toggleSelectAttach(ad.id)
                                  }
                                }}
                                disabled={isDisabled}
                                className={`h-4 w-4 accent-[var(--brand-600)] ${isDisabled ? 'cursor-not-allowed opacity-50' : ''}`}
                                title={
                                  isDisabled
                                    ? t('contract_devices.device.attached_to_contract', {
                                        contractNumber: otherContract?.contractNumber ?? '',
                                      })
                                    : ''
                                }
                              />
                            </td>
                            <td className="px-3 py-2 font-mono text-sm">
                              <div className="flex items-center gap-2">
                                {isAttached ? (
                                  <CheckCircle2 className="h-4 w-4 text-amber-600" />
                                ) : otherContract ? (
                                  <CheckCircle2 className="h-4 w-4 text-[var(--brand-600)]" />
                                ) : (
                                  <Circle className="h-4 w-4 text-slate-300" />
                                )}
                                <span
                                  className={
                                    isAttached
                                      ? 'font-medium text-amber-700'
                                      : otherContract
                                        ? 'font-medium text-[var(--brand-700)]'
                                        : 'text-slate-800'
                                  }
                                >
                                  {ad.serialNumber}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-sm">
                              {ad.deviceModel?.name ?? ad.model}
                            </td>
                            <td className="px-3 py-2">
                              {isAttached ? (
                                <Badge
                                  variant="outline"
                                  className="border-amber-300 bg-amber-100 text-xs font-semibold text-amber-700"
                                >
                                  <CheckCircle2 className="mr-1 h-3 w-3" />
                                  {t('contract_devices.status.attached')}
                                </Badge>
                              ) : otherContract ? (
                                <Badge
                                  variant="outline"
                                  className="border-[var(--brand-200)] bg-[var(--brand-50)] text-xs font-semibold text-[var(--brand-700)]"
                                >
                                  <CheckCircle2 className="mr-1 h-3 w-3" />
                                  {t('contract_devices.status.attached_other', {
                                    contractNumber: otherContract.contractNumber,
                                  })}
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="border-slate-300 bg-slate-100 text-xs text-slate-600"
                                >
                                  {t('contract_devices.status.unattached')}
                                </Badge>
                              )}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Input
                  type="date"
                  value={activeFrom}
                  onChange={(e) => setActiveFrom(e.target.value)}
                  className="h-11"
                  placeholder={t('contract_devices.date_range.from')}
                />
                <Input
                  type="date"
                  value={activeTo}
                  onChange={(e) => setActiveTo(e.target.value)}
                  className="h-11"
                  placeholder={t('contract_devices.date_range.to')}
                />
              </div>
            </div>

            <DialogFooter className="flex w-full justify-end gap-2 rounded-b-xl bg-gradient-to-r from-transparent via-indigo-50 to-transparent px-6 pb-6">
              <Button variant="outline" onClick={() => setAttachOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleAttach}
                disabled={attachMutation.status === 'pending'}
                className="bg-[var(--btn-primary)] px-6 font-bold text-[var(--btn-primary-foreground)] shadow"
              >
                {attachMutation.status === 'pending'
                  ? t('common.sending')
                  : hasAttachedDevicesSelected
                    ? t('common.update')
                    : t('contract.device.attach')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="flex justify-end gap-2 rounded-b-2xl bg-gradient-to-r from-transparent via-blue-50 to-transparent p-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="font-semibold">
            {t('common.close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

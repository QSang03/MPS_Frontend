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
import { MonitorSmartphone, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { contractsClientService } from '@/lib/api/services/contracts-client.service'
import { devicesClientService } from '@/lib/api/services/devices-client.service'
import { DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  contractId?: string | null
  contractNumber?: string | null
}

export default function ContractDevicesModal({
  open,
  onOpenChange,
  contractId,
  contractNumber,
}: Props) {
  const [attachOpen, setAttachOpen] = useState(false)
  const [hideOuter, setHideOuter] = useState(false)
  const [selectedToAttach, setSelectedToAttach] = useState<string[]>([])
  // store inputs as strings (easier to bind to <Input />). We'll convert on submit.
  // Support VND/USD + exchangeRate like other modals: monthlyRent in USD will be computed
  const [monthlyRentVNDRaw, setMonthlyRentVNDRaw] = useState<string>('')
  const [monthlyRentUSDRaw, setMonthlyRentUSDRaw] = useState<string>('')
  const [exchangeRateRaw, setExchangeRateRaw] = useState<string>('')
  const [activeFrom, setActiveFrom] = useState<string>('')
  const [activeTo, setActiveTo] = useState<string>('')

  type SimpleDevice = {
    id: string
    serialNumber?: string | null
    deviceModel?: { name?: string } | null
    model?: string | null
  }

  const attachMutation = useMutation({
    mutationFn: (
      items: Array<{
        deviceId: string
        monthlyRent?: number
        activeFrom?: string
        activeTo?: string
      }>
    ) => contractsClientService.attachDevices(contractId as string, { items }),
    onSuccess: () => {
      toast.success('Đính kèm thiết bị thành công')
      setAttachOpen(false)
      // un-hide outer modal content and refresh parent list
      setHideOuter(false)
      setSelectedToAttach([])
      queryClient.invalidateQueries({ queryKey: ['contract-devices', contractId] })
    },
    onError: (err) => {
      console.error('attach error', err)
      toast.error('Đính kèm thiết bị thất bại')
    },
  })

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
        .then((r) => r.data),
    enabled: attachOpen,
  })

  const allDevices: SimpleDevice[] = (allDevicesResp ?? []) as SimpleDevice[]

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
    // compute monthly rent (USD) from inputs
    const parseInput = (s: string) => {
      if (typeof s !== 'string') return NaN
      const normalized = s.replace(/,/g, '.').trim()
      return Number(normalized)
    }

    let monthlyRentNum: number | undefined = undefined
    if (monthlyRentVNDRaw) {
      if (!exchangeRateRaw) {
        toast.error('Vui lòng nhập tỷ giá khi nhập giá bằng VND')
        return
      }
      const v = parseInput(monthlyRentVNDRaw)
      const ex = parseInput(exchangeRateRaw)
      if (!Number.isFinite(v) || !Number.isFinite(ex) || ex === 0) {
        toast.error('Giá hoặc tỷ giá không hợp lệ')
        return
      }
      monthlyRentNum = v / ex
    } else if (monthlyRentUSDRaw) {
      const v = parseInput(monthlyRentUSDRaw)
      if (!Number.isFinite(v)) {
        toast.error('Giá USD không hợp lệ')
        return
      }
      monthlyRentNum = v
    }

    const items = selectedToAttach.map((deviceId) => ({
      deviceId,
      monthlyRent: monthlyRentNum === undefined ? undefined : monthlyRentNum,
      activeFrom: activeFrom || undefined,
      activeTo: activeTo || undefined,
    }))

    await attachMutation.mutateAsync(items)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${hideOuter ? 'hidden' : '!max-w-[75vw]'} rounded-2xl border-0 p-0 shadow-2xl`}
      >
        {/* Gradient header */}
        <DialogHeader className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-0">
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
                Quản lý thiết bị của hợp đồng
              </DialogTitle>
              <DialogDescription className="mt-1 flex items-center gap-2 text-white/90">
                <Sparkles className="h-4 w-4" />
                {contractNumber ? (
                  <span>
                    Mã hợp đồng: <span className="font-semibold">{contractNumber}</span>
                  </span>
                ) : (
                  'Danh sách thiết bị được quản lý theo hợp đồng'
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Content section */}
        <div className="bg-gradient-to-br from-white via-indigo-50/30 to-white px-8 py-6">
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
            <DialogHeader className="relative overflow-hidden bg-gradient-to-r from-indigo-700 via-blue-500 to-cyan-500 p-0">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 right-0 h-24 w-24 translate-x-1/2 -translate-y-1/2 rounded-full bg-white"></div>
              </div>
              <div className="relative z-10 flex items-center gap-4 px-6 py-5 text-white">
                <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                  Thêm thiết bị vào hợp đồng
                </DialogTitle>
              </div>
            </DialogHeader>

            <div className="space-y-4 rounded-b-xl bg-gradient-to-br from-white via-indigo-50 to-white p-4">
              <div className="mb-2 text-sm font-semibold text-indigo-700">
                Chọn các thiết bị để đính kèm
              </div>
              <div className="max-h-64 overflow-y-auto rounded border border-indigo-100">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-indigo-50 to-cyan-50 text-indigo-700">
                    <tr>
                      <th className="px-3 py-2 text-left text-sm font-bold"> </th>
                      <th className="px-3 py-2 text-left text-sm font-bold">Serial</th>
                      <th className="px-3 py-2 text-left text-sm font-bold">Model</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allDevices.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-5 py-7 text-center text-indigo-400">
                          Không có thiết bị
                        </td>
                      </tr>
                    ) : (
                      allDevices.map((ad: SimpleDevice) => (
                        <tr
                          key={ad.id}
                          className="transition even:bg-indigo-50/40 hover:bg-indigo-100"
                        >
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={selectedToAttach.includes(ad.id)}
                              onChange={() => toggleSelectAttach(ad.id)}
                              className="h-4 w-4 accent-indigo-600"
                            />
                          </td>
                          <td className="px-3 py-2 font-mono">{ad.serialNumber}</td>
                          <td className="px-3 py-2">{ad.deviceModel?.name ?? ad.model}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Giá (VND)"
                      value={monthlyRentVNDRaw}
                      onChange={(e) => {
                        setMonthlyRentVNDRaw(e.target.value)
                        // if user types VND, clear USD field to avoid confusion
                        if (e.target.value) setMonthlyRentUSDRaw('')
                      }}
                      className="h-11"
                    />
                    <Input
                      placeholder="Giá (USD)"
                      value={monthlyRentUSDRaw}
                      onChange={(e) => {
                        setMonthlyRentUSDRaw(e.target.value)
                        if (e.target.value) setMonthlyRentVNDRaw('')
                      }}
                      className="h-11"
                    />
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Input
                      placeholder="Tỉ giá"
                      value={exchangeRateRaw}
                      onChange={(e) => setExchangeRateRaw(e.target.value)}
                      className="h-9 w-36"
                    />
                    {/* Preview converted USD when VND + rate present */}
                    {monthlyRentVNDRaw && exchangeRateRaw ? (
                      <div className="text-muted-foreground text-sm">
                        ≈ ${' '}
                        {(() => {
                          const v = Number(monthlyRentVNDRaw.toString().replace(/,/g, '.'))
                          const ex = Number(exchangeRateRaw.toString().replace(/,/g, '.'))
                          if (!Number.isFinite(v) || !Number.isFinite(ex) || ex === 0) return '-'
                          return (v / ex).toFixed(2)
                        })()}
                      </div>
                    ) : null}
                  </div>
                </div>
                <Input
                  type="date"
                  value={activeFrom}
                  onChange={(e) => setActiveFrom(e.target.value)}
                  className="h-11"
                  placeholder="Từ ngày"
                />
                <Input
                  type="date"
                  value={activeTo}
                  onChange={(e) => setActiveTo(e.target.value)}
                  className="h-11"
                  placeholder="Đến ngày"
                />
              </div>
            </div>

            <DialogFooter className="flex w-full justify-end gap-2 rounded-b-xl bg-gradient-to-r from-transparent via-indigo-50 to-transparent px-6 pb-6">
              <Button variant="outline" onClick={() => setAttachOpen(false)}>
                Hủy
              </Button>
              <Button
                onClick={handleAttach}
                disabled={attachMutation.status === 'pending'}
                className="bg-gradient-to-r from-indigo-600 to-cyan-600 px-6 font-bold text-white shadow"
              >
                {attachMutation.status === 'pending' ? 'Đang gửi...' : 'Đính kèm'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="flex justify-end gap-2 rounded-b-2xl bg-gradient-to-r from-transparent via-blue-50 to-transparent p-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="font-semibold">
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

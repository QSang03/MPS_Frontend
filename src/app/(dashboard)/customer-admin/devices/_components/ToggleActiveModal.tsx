'use client'

import { useEffect, useState } from 'react'
import type { Device } from '@/types/models/device'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { devicesClientService } from '@/lib/api/services/devices-client.service'
import { DEVICE_STATUS } from '@/constants/status'
import { CheckCircle2, XCircle } from 'lucide-react'

interface Props {
  device?: Device | null
  targetActive: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (updated: Device) => void
}

export default function ToggleActiveModal({
  device,
  targetActive,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<string>('')
  const [inactiveReasonOption, setInactiveReasonOption] = useState<string>('')
  const [inactiveReasonText, setInactiveReasonText] = useState<string>('')

  useEffect(() => {
    if (!device) return
    setStatus(String(device.status ?? ''))
    setInactiveReasonOption(String(device.inactiveReason ?? ''))
    setInactiveReasonText(String(device.inactiveReason ?? ''))
  }, [device, targetActive])

  const handleConfirm = async () => {
    if (!device || !device.id) return
    if (!targetActive) {
      const chosen = inactiveReasonOption === '__other' ? inactiveReasonText : inactiveReasonOption
      if (!chosen || chosen.trim() === '') {
        toast.error('Vui lòng cung cấp lý do khi tắt hoạt động')
        return
      }
    }

    setSubmitting(true)
    const chosenStatus = String(
      status ||
        device.status ||
        (targetActive ? DEVICE_STATUS.ACTIVE : DEVICE_STATUS.DECOMMISSIONED)
    ).toUpperCase()

    const payload: Record<string, unknown> = {
      isActive: targetActive,
      status: chosenStatus,
      inactiveReason: !targetActive
        ? inactiveReasonOption === '__other'
          ? inactiveReasonText
          : inactiveReasonOption
        : undefined,
    }

    try {
      const updated = (await devicesClientService.update(
        String(device.id),
        payload as unknown as Record<string, unknown>
      )) as Device
      toast.success('Cập nhật trạng thái thiết bị thành công')
      onSuccess?.(updated)
      onOpenChange(false)
    } catch (err) {
      console.error('Toggle device active error', err)
      toast.error('Không thể cập nhật trạng thái thiết bị')
    } finally {
      setSubmitting(false)
    }
  }

  if (!device) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border-0 p-0 shadow-2xl">
        <DialogHeader className="relative overflow-hidden bg-gradient-to-r from-green-600 to-teal-600 p-0">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10 flex items-center gap-3 px-6 py-5 text-white">
            {targetActive ? (
              <CheckCircle2 className="h-7 w-7 text-green-300" />
            ) : (
              <XCircle className="h-7 w-7 text-red-400" />
            )}
            <div>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                {targetActive ? 'Bật thiết bị' : 'Tắt thiết bị'}
              </DialogTitle>
              <DialogDescription className="mt-1 text-white/90">
                {targetActive
                  ? 'Kích hoạt thiết bị để sử dụng bình thường'
                  : 'Tắt thiết bị và cung cấp lý do'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleConfirm()
          }}
          className="space-y-6 bg-white p-6"
        >
          <div>
            <Label className="text-sm font-semibold">Thiết bị</Label>
            <div className="mt-1 truncate text-sm font-medium text-gray-900">
              {String(device?.serialNumber ?? device?.id ?? '')}
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold">Trạng thái</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {targetActive ? (
                  <>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                    <SelectItem value="ERROR">Error</SelectItem>
                    <SelectItem value="OFFLINE">Offline</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="DECOMMISSIONED">Decommissioned</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {!targetActive && (
            <div>
              <Label className="text-sm font-semibold">Lý do</Label>
              <Select value={inactiveReasonOption} onValueChange={setInactiveReasonOption}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Chọn lý do" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tạm dừng do lỗi">Tạm dừng do lỗi</SelectItem>
                  <SelectItem value="Hủy HĐ">Hủy HĐ</SelectItem>
                  <SelectItem value="Hoàn tất HĐ">Hoàn tất HĐ</SelectItem>
                  <SelectItem value="__other">Khác</SelectItem>
                </SelectContent>
              </Select>

              {inactiveReasonOption === '__other' && (
                <Input
                  value={inactiveReasonText}
                  onChange={(e) => setInactiveReasonText(e.target.value)}
                  placeholder="Nhập lý do..."
                  className="mt-2 h-11"
                  autoFocus
                />
              )}
            </div>
          )}

          <DialogFooter className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Hủy
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Đang xử lý...' : targetActive ? 'Bật' : 'Tắt'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

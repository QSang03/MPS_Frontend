'use client'

import { useEffect, useState } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import internalApiClient from '@/lib/api/internal-client'
import type { Device } from '@/types/models/device'

interface Props {
  device?: Device | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

export default function A4EquivalentModal({ device, open, onOpenChange, onSaved }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [totalPageCountA4, setTotalPageCountA4] = useState<string>('')
  const [totalColorPagesA4, setTotalColorPagesA4] = useState<string>('')
  const [totalBlackWhitePagesA4, setTotalBlackWhitePagesA4] = useState<string>('')
  const [recordedAt, setRecordedAt] = useState<string>('')
  const [updateLatest, setUpdateLatest] = useState<boolean>(false)

  useEffect(() => {
    if (!device) return
    // Reset form when device changes / modal toggled open
    setTotalPageCountA4('')
    setTotalColorPagesA4('')
    setTotalBlackWhitePagesA4('')
    setRecordedAt('')
    setUpdateLatest(false)
  }, [device, open])

  if (!device) return null

  const handleSubmit = async () => {
    // basic validation: require at least one of the counts and recordedAt
    if (!totalPageCountA4.trim() && !totalColorPagesA4.trim() && !totalBlackWhitePagesA4.trim()) {
      toast.error('Vui lòng nhập ít nhất một giá trị trang (A4)')
      return
    }

    if (!recordedAt) {
      toast.error('Vui lòng chọn thời gian ghi nhận')
      return
    }

    // parse numeric inputs (if present)
    const total = totalPageCountA4.trim() ? Number(totalPageCountA4) : undefined
    const color = totalColorPagesA4.trim() ? Number(totalColorPagesA4) : undefined
    const bw = totalBlackWhitePagesA4.trim() ? Number(totalBlackWhitePagesA4) : undefined

    // basic numeric validation
    const invalidNumber = [total, color, bw].some(
      (v) => v !== undefined && (Number.isNaN(v) || v < 0)
    )
    if (invalidNumber) {
      toast.error('Các giá trị trang phải là số nguyên không âm')
      return
    }

    // If total is provided, try to ensure color + bw equals total.
    // - If both color and bw provided but sum !== total -> stop with message
    // - If one of color/bw missing -> compute it as total - provided (if valid)
    let finalTotal = total
    let finalColor = color
    let finalBw = bw

    if (finalTotal !== undefined) {
      if (finalColor !== undefined && finalBw !== undefined) {
        if (finalColor + finalBw !== finalTotal) {
          toast.error(
            `Tổng trang màu (${finalColor}) + đen trắng (${finalBw}) phải bằng tổng (${finalTotal})`
          )
          return
        }
      } else if (finalColor !== undefined && finalBw === undefined) {
        const computedBw = finalTotal - finalColor
        if (computedBw < 0) {
          toast.error('Giá trị trang không hợp lệ: trang màu lớn hơn tổng trang')
          return
        }
        finalBw = computedBw
        // show a gentle info so user knows we computed it
        toast('Tự động điền Tổng trang đen trắng = ' + computedBw)
      } else if (finalBw !== undefined && finalColor === undefined) {
        const computedColor = finalTotal - finalBw
        if (computedColor < 0) {
          toast.error('Giá trị trang không hợp lệ: trang đen trắng lớn hơn tổng trang')
          return
        }
        finalColor = computedColor
        toast('Tự động điền Tổng trang màu = ' + computedColor)
      }
    } else {
      // total not provided. If color and bw provided, set total to sum so backend gets full info.
      if (finalColor !== undefined && finalBw !== undefined) {
        finalTotal = finalColor + finalBw
      }
    }

    const body: Record<string, unknown> = {
      deviceId: device.id,
      recordedAt: new Date(recordedAt).toISOString(),
      updateLatest,
    }

    if (finalTotal !== undefined) body.totalPageCountA4 = finalTotal
    if (finalColor !== undefined) body.totalColorPagesA4 = finalColor
    if (finalBw !== undefined) body.totalBlackWhitePagesA4 = finalBw

    setSubmitting(true)
    try {
      await internalApiClient.post('/api/reports/usage/a4-equivalent', body)
      toast.success('Lưu snapshot A4 thành công')
      onSaved?.()
      onOpenChange(false)
    } catch (err: unknown) {
      console.error('Failed to save a4-equivalent snapshot', err)
      // Narrow the error type to extract common fields without using `any`
      const maybeErr = err as
        | { response?: { data?: { error?: string } }; message?: unknown }
        | undefined
      const msg = maybeErr?.response?.data?.error ?? (maybeErr?.message as string | undefined)
      toast.error(msg ? String(msg) : 'Không thể lưu dữ liệu A4')
    } finally {
      setSubmitting(false)
    }
  }

  // helpers for live auto-fill behavior
  const parseNum = (s: string) => {
    if (!s?.trim()) return undefined
    const n = Number(s)
    return Number.isNaN(n) ? undefined : n
  }

  const handleColorChange = (v: string) => {
    setTotalColorPagesA4(v)
    const colorNum = parseNum(v)
    const bwNum = parseNum(totalBlackWhitePagesA4)

    // If both color and bw are filled, auto-compute total = color + bw
    if (colorNum !== undefined && bwNum !== undefined) {
      setTotalPageCountA4(String(colorNum + bwNum))
    }
  }

  const handleBwChange = (v: string) => {
    setTotalBlackWhitePagesA4(v)
    const bwNum = parseNum(v)
    const colorNum = parseNum(totalColorPagesA4)

    // If both color and bw are filled, auto-compute total = color + bw
    if (colorNum !== undefined && bwNum !== undefined) {
      setTotalPageCountA4(String(colorNum + bwNum))
    }
  }

  const handleTotalChange = (v: string) => {
    setTotalPageCountA4(v)
    const totalNum = parseNum(v)
    const colorNum = parseNum(totalColorPagesA4)
    const bwNum = parseNum(totalBlackWhitePagesA4)

    // If total is filled and one of color/bw is filled, compute the missing one
    if (totalNum !== undefined) {
      if (colorNum !== undefined && bwNum === undefined) {
        const computedBw = totalNum - colorNum
        if (computedBw >= 0) setTotalBlackWhitePagesA4(String(computedBw))
      } else if (bwNum !== undefined && colorNum === undefined) {
        const computedColor = totalNum - bwNum
        if (computedColor >= 0) setTotalColorPagesA4(String(computedColor))
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SystemModalLayout
        title="Ghi nhật ký A4 cho thiết bị"
        description={`Thiết bị: ${device.serialNumber || device.id}`}
        icon={FileText}
        variant="create"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="min-w-[100px]"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              form="a4-form"
              disabled={submitting}
              className="min-w-[120px] bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              {submitting ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </>
        }
      >
        <form
          id="a4-form"
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit()
          }}
          className="space-y-4"
        >
          <div>
            <Label className="text-sm font-semibold">Tổng trang màu (A4)</Label>
            <Input
              value={totalColorPagesA4}
              onChange={(e) => handleColorChange(e.target.value)}
              placeholder="Ví dụ: 2000"
              className="mt-2 h-11"
              type="number"
              min={0}
            />
          </div>

          <div>
            <Label className="text-sm font-semibold">Tổng trang đen trắng (A4)</Label>
            <Input
              value={totalBlackWhitePagesA4}
              onChange={(e) => handleBwChange(e.target.value)}
              placeholder="Ví dụ: 8000"
              className="mt-2 h-11"
              type="number"
              min={0}
            />
          </div>

          <div>
            <Label className="text-sm font-semibold">Tổng số trang (A4)</Label>
            <Input
              value={totalPageCountA4}
              onChange={(e) => handleTotalChange(e.target.value)}
              placeholder="Ví dụ: 10000"
              className="mt-2 h-11"
              type="number"
              min={0}
            />
          </div>

          <div>
            <Label className="text-sm font-semibold">Thời gian ghi nhận</Label>
            <Input
              value={recordedAt}
              onChange={(e) => setRecordedAt(e.target.value)}
              className="mt-2 h-11"
              type="datetime-local"
            />
          </div>

          <div className="flex items-center gap-3">
            <Checkbox checked={updateLatest} onCheckedChange={(v) => setUpdateLatest(Boolean(v))} />
            <Label className="text-sm">Cập nhật bản ghi mới nhất (updateLatest)</Label>
          </div>
        </form>
      </SystemModalLayout>
    </Dialog>
  )
}

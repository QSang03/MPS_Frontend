'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Loader2, Edit, Tag, Sparkles } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { devicesClientService } from '@/lib/api/services/devices-client.service'

interface Props {
  device?: any
  onSaved?: () => void
  compact?: boolean
}

function isoToLocalDatetimeInput(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  const YYYY = d.getFullYear()
  const MM = pad(d.getMonth() + 1)
  const DD = pad(d.getDate())
  const hh = pad(d.getHours())
  const mm = pad(d.getMinutes())
  return `${YYYY}-${MM}-${DD}T${hh}:${mm}`
}

function localInputToIso(v?: string) {
  if (!v) return undefined
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toISOString()
}

export default function DevicePricingModal({ device, onSaved, compact = false }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<any>({
    pricePerBWPage: '',
    pricePerColorPage: '',
    effectiveFrom: '',
    effectiveTo: '',
  })
  const [focused, setFocused] = useState<{ bw: boolean; color: boolean }>({
    bw: false,
    color: false,
  })

  useEffect(() => {
    if (!open || !device?.id) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const at = new Date().toISOString()
        const res = await devicesClientService.getActivePricing(device.id, at)
        const data = res || null
        if (cancelled) return
        if (data && (data.pricePerBWPage !== undefined || data.pricePerColorPage !== undefined)) {
          const bw =
            data.pricePerBWPage !== undefined && data.pricePerBWPage !== null
              ? String(data.pricePerBWPage)
              : ''
          const color =
            data.pricePerColorPage !== undefined && data.pricePerColorPage !== null
              ? String(data.pricePerColorPage)
              : ''
          setForm({
            pricePerBWPage: bw,
            pricePerColorPage: color,
            effectiveFrom: isoToLocalDatetimeInput(data.effectiveFrom),
            effectiveTo: isoToLocalDatetimeInput(data.effectiveTo),
          })
        } else {
          setForm({ pricePerBWPage: '', pricePerColorPage: '', effectiveFrom: '', effectiveTo: '' })
        }
      } catch (err) {
        console.error('Failed to load active pricing', err)
        toast.error('Không thể tải thông tin giá hiện hành')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, device])

  const parseNum = (v: string) => {
    if (typeof v !== 'string') return NaN
    const normalized = v.replace(/,/g, '.').trim()
    if (normalized === '') return NaN
    return Number(normalized)
  }

  const formatNumberDisplay = (v: string) => {
    if (v === '' || v === undefined || v === null) return ''
    const normalized = String(v).replace(/,/g, '.').trim()
    if (normalized === '') return ''
    const num = Number(normalized)
    if (!Number.isFinite(num)) return String(v)
    const idx = normalized.indexOf('.')
    const fracDigits = idx >= 0 ? Math.min(normalized.length - idx - 1, 4) : 0
    const nf = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: fracDigits,
    })
    return nf.format(num)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!device?.id) return
    setSubmitting(true)
    try {
      const payload: any = {}
      if (form.pricePerBWPage !== '') payload.pricePerBWPage = parseNum(form.pricePerBWPage)
      if (form.pricePerColorPage !== '')
        payload.pricePerColorPage = parseNum(form.pricePerColorPage)
      const MAX_ABS = 1_000_000
      if (
        payload.pricePerBWPage !== undefined &&
        (!Number.isFinite(payload.pricePerBWPage) || Math.abs(payload.pricePerBWPage) >= MAX_ABS)
      ) {
        toast.error('Giá B/W không hợp lệ hoặc quá lớn')
        setSubmitting(false)
        return
      }
      if (
        payload.pricePerColorPage !== undefined &&
        (!Number.isFinite(payload.pricePerColorPage) ||
          Math.abs(payload.pricePerColorPage) >= MAX_ABS)
      ) {
        toast.error('Giá màu không hợp lệ hoặc quá lớn')
        setSubmitting(false)
        return
      }
      const ef = localInputToIso(form.effectiveFrom)
      const et = localInputToIso(form.effectiveTo)
      if (ef) payload.effectiveFrom = ef
      if (et) payload.effectiveTo = et
      if (payload.effectiveFrom && payload.effectiveTo) {
        const from = new Date(payload.effectiveFrom)
        const to = new Date(payload.effectiveTo)
        if (isNaN(from.getTime()) || isNaN(to.getTime()) || from.getTime() >= to.getTime()) {
          toast.error('Khoảng thời gian hiệu lực không hợp lệ (effectiveFrom < effectiveTo)')
          setSubmitting(false)
          return
        }
      }
      await devicesClientService.upsertPricing(device.id, payload)
      toast.success('Cập nhật giá thiết bị thành công')
      setOpen(false)
      onSaved?.()
    } catch (err) {
      console.error('Upsert pricing error', err)
      try {
        const e = err as any
        const body = e?.response?.data
        if (body?.message) toast.error(String(body.message))
        else toast.error('Không thể cập nhật giá thiết bị')
      } catch {
        toast.error('Không thể cập nhật giá thiết bị')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {compact ? (
        <Tooltip>
          <TooltipContent sideOffset={4}>Gán giá</TooltipContent>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 rounded-full p-0"
                  aria-label="Gán giá"
                >
                  <Tag className="h-4 w-4" />
                </Button>
              </div>
            </DialogTrigger>
          </TooltipTrigger>
        </Tooltip>
      ) : (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Edit className="h-4 w-4" />
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="max-w-[520px] overflow-hidden rounded-2xl border-0 p-0 shadow-2xl">
        {/* Gradient Header */}
        <DialogHeader className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 p-0">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 h-20 w-20 translate-x-1/2 -translate-y-1/2 rounded-full bg-white"></div>
          </div>
          <div className="relative z-10 flex items-center gap-3 px-6 py-5 text-white">
            <div className="rounded-xl border border-white/30 bg-white/20 p-2.5 backdrop-blur-lg">
              <Tag className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                Cập nhật giá thiết bị
              </DialogTitle>
              <DialogDescription className="mt-1 flex items-center gap-2 text-white/80">
                <Sparkles className="h-4 w-4" /> Gán giá / trang đen trắng & màu, hiệu lực theo thời
                gian
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="bg-white">
          <div className="space-y-4 px-6 py-6">
            {loading ? (
              <div className="flex items-center gap-2 font-medium text-indigo-700">
                <Loader2 className="h-4 w-4 animate-spin" /> Đang tải giá hiện hành...
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label>Giá mỗi trang trắng đen</Label>
                    <Input
                      inputMode="decimal"
                      value={
                        focused.bw ? form.pricePerBWPage : formatNumberDisplay(form.pricePerBWPage)
                      }
                      onFocus={() => setFocused((s) => ({ ...s, bw: true }))}
                      onBlur={() => setFocused((s) => ({ ...s, bw: false }))}
                      onChange={(e) =>
                        setForm((s: any) => ({ ...s, pricePerBWPage: e.target.value }))
                      }
                      placeholder="0.2"
                      className="h-11 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Giá mỗi trang màu</Label>
                    <Input
                      inputMode="decimal"
                      value={
                        focused.color
                          ? form.pricePerColorPage
                          : formatNumberDisplay(form.pricePerColorPage)
                      }
                      onFocus={() => setFocused((s) => ({ ...s, color: true }))}
                      onBlur={() => setFocused((s) => ({ ...s, color: false }))}
                      onChange={(e) =>
                        setForm((s: any) => ({ ...s, pricePerColorPage: e.target.value }))
                      }
                      placeholder="1.5"
                      className="h-11 text-base"
                    />
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label>Hiệu lực từ</Label>
                    <Input
                      type="datetime-local"
                      value={form.effectiveFrom}
                      onChange={(e) =>
                        setForm((s: any) => ({ ...s, effectiveFrom: e.target.value }))
                      }
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hiệu lực đến</Label>
                    <Input
                      type="datetime-local"
                      value={form.effectiveTo}
                      onChange={(e) => setForm((s: any) => ({ ...s, effectiveTo: e.target.value }))}
                      className="h-11"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="border-t bg-gray-50 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 font-bold text-white shadow"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang lưu...
                </>
              ) : (
                <>Lưu giá</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

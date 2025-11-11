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
  })
  // Support VND/USD entry per-page + exchange rate similar to consumable edit modal
  const [pricePerBWPageVND, setPricePerBWPageVND] = useState<number | ''>('')
  const [pricePerBWPageVNDRaw, setPricePerBWPageVNDRaw] = useState<string>('')
  const [pricePerBWPageUSDRaw, setPricePerBWPageUSDRaw] = useState<string>('')
  const [pricePerColorPageVND, setPricePerColorPageVND] = useState<number | ''>('')
  const [pricePerColorPageVNDRaw, setPricePerColorPageVNDRaw] = useState<string>('')
  const [pricePerColorPageUSDRaw, setPricePerColorPageUSDRaw] = useState<string>('')
  const [exchangeRate, setExchangeRate] = useState<number | ''>('')
  const [exchangeRateRaw, setExchangeRateRaw] = useState<string>('')
  // store current effectiveFrom from backend (ISO) to enforce new > old
  const [currentEffectiveFromISO, setCurrentEffectiveFromISO] = useState<string | null>(null)

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
          // Populate USD fields from existing active pricing (backend stores USD prices)
          setForm({
            pricePerBWPage: bw,
            pricePerColorPage: color,
            effectiveFrom: isoToLocalDatetimeInput(data.effectiveFrom),
          })
          setPricePerBWPageUSDRaw(
            data.pricePerBWPage !== undefined && data.pricePerBWPage !== null
              ? String(data.pricePerBWPage)
              : ''
          )
          setPricePerColorPageUSDRaw(
            data.pricePerColorPage !== undefined && data.pricePerColorPage !== null
              ? String(data.pricePerColorPage)
              : ''
          )
          setPricePerBWPageVND('')
          setPricePerColorPageVND('')
          setExchangeRate((data as any)?.exchangeRate ?? '')
          setExchangeRateRaw(
            ((data as any)?.exchangeRate ?? '') === ''
              ? ''
              : String((data as any)?.exchangeRate ?? '')
          )
          setCurrentEffectiveFromISO((data as any)?.effectiveFrom ?? null)
        } else {
          setForm({ pricePerBWPage: '', pricePerColorPage: '', effectiveFrom: '' })
          setPricePerBWPageVND('')
          setPricePerBWPageVNDRaw('')
          setPricePerBWPageUSDRaw('')
          setPricePerColorPageVND('')
          setPricePerColorPageVNDRaw('')
          setPricePerColorPageUSDRaw('')
          setExchangeRate('')
          setExchangeRateRaw('')
          setCurrentEffectiveFromISO(null)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!device?.id) return
    setSubmitting(true)
    try {
      const payload: any = {}

      // Helper: validate decimal places (after dot) <= 8
      const validateDecimals = (raw: string) => {
        const idx = raw.indexOf('.')
        if (idx === -1) return true
        const decimals = raw.length - idx - 1
        return decimals <= 8
      }

      // Validate and compute B/W price
      if (pricePerBWPageVNDRaw) {
        if (!validateDecimals(pricePerBWPageVNDRaw)) {
          toast.error('Số chữ số sau dấu thập phân cho VND phải ≤ 8')
          setSubmitting(false)
          return
        }
        const v = Number(pricePerBWPageVNDRaw)
        if (!Number.isFinite(v) || Math.abs(v) > 250000) {
          toast.error('Giá VND không hợp lệ hoặc vượt quá 250000')
          setSubmitting(false)
          return
        }
        if (!exchangeRateRaw) {
          toast.error('Vui lòng nhập tỷ giá khi nhập giá bằng VND')
          setSubmitting(false)
          return
        }
        if (!validateDecimals(exchangeRateRaw)) {
          toast.error('Số chữ số sau dấu thập phân cho tỷ giá phải ≤ 8')
          setSubmitting(false)
          return
        }
        const ex = Number(exchangeRateRaw)
        payload.pricePerBWPage = v / ex
        payload.exchangeRate = ex
      } else if (pricePerBWPageUSDRaw) {
        if (!validateDecimals(pricePerBWPageUSDRaw)) {
          toast.error('Số chữ số sau dấu thập phân cho USD phải ≤ 8')
          setSubmitting(false)
          return
        }
        const v = Number(pricePerBWPageUSDRaw)
        if (!Number.isFinite(v) || Math.abs(v) > 10) {
          toast.error('Giá USD không hợp lệ hoặc vượt quá 10')
          setSubmitting(false)
          return
        }
        payload.pricePerBWPage = v
      } else if (form.pricePerBWPage !== '') {
        payload.pricePerBWPage = parseNum(form.pricePerBWPage)
      }

      // Validate and compute Color price
      if (pricePerColorPageVNDRaw) {
        if (!validateDecimals(pricePerColorPageVNDRaw)) {
          toast.error('Số chữ số sau dấu thập phân cho VND phải ≤ 8')
          setSubmitting(false)
          return
        }
        const v = Number(pricePerColorPageVNDRaw)
        if (!Number.isFinite(v) || Math.abs(v) > 250000) {
          toast.error('Giá VND không hợp lệ hoặc vượt quá 250000')
          setSubmitting(false)
          return
        }
        if (!exchangeRateRaw) {
          toast.error('Vui lòng nhập tỷ giá khi nhập giá bằng VND')
          setSubmitting(false)
          return
        }
        if (!validateDecimals(exchangeRateRaw)) {
          toast.error('Số chữ số sau dấu thập phân cho tỷ giá phải ≤ 8')
          setSubmitting(false)
          return
        }
        const ex = Number(exchangeRateRaw)
        payload.pricePerColorPage = v / ex
        payload.exchangeRate = ex
      } else if (pricePerColorPageUSDRaw) {
        if (!validateDecimals(pricePerColorPageUSDRaw)) {
          toast.error('Số chữ số sau dấu thập phân cho USD phải ≤ 8')
          setSubmitting(false)
          return
        }
        const v = Number(pricePerColorPageUSDRaw)
        if (!Number.isFinite(v) || Math.abs(v) > 10) {
          toast.error('Giá USD không hợp lệ hoặc vượt quá 10')
          setSubmitting(false)
          return
        }
        payload.pricePerColorPage = v
      } else if (form.pricePerColorPage !== '') {
        payload.pricePerColorPage = parseNum(form.pricePerColorPage)
      }

      // effectiveFrom validation: if backend had existing effectiveFrom, new one must be greater
      const ef = localInputToIso(form.effectiveFrom)
      if (ef) {
        if (currentEffectiveFromISO) {
          const oldTs = new Date(currentEffectiveFromISO).getTime()
          const newTs = new Date(ef).getTime()
          if (isNaN(oldTs) || isNaN(newTs) || newTs <= oldTs) {
            toast.error('Nếu đã có giá cũ thì effectiveFrom mới phải lớn hơn giá hiện tại')
            setSubmitting(false)
            return
          }
        }
        payload.effectiveFrom = ef
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
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        inputMode="decimal"
                        value={pricePerBWPageVNDRaw}
                        onChange={(e) => {
                          const raw = e.target.value
                          setPricePerBWPageVNDRaw(raw)
                          const v = raw ? Number(raw) : ''
                          setPricePerBWPageVND(v)
                          if (v) {
                            setPricePerBWPageUSDRaw('')
                          }
                        }}
                        placeholder="VND"
                        className="h-11 text-base"
                      />
                      <Input
                        inputMode="decimal"
                        value={pricePerBWPageUSDRaw}
                        onChange={(e) => {
                          const raw = e.target.value
                          setPricePerBWPageUSDRaw(raw)
                          if (raw) {
                            setPricePerBWPageVND('')
                            setPricePerBWPageVNDRaw('')
                            setExchangeRate('')
                            setExchangeRateRaw('')
                          }
                        }}
                        placeholder="USD"
                        className="h-11 text-base"
                        disabled={!!pricePerBWPageVND}
                      />
                    </div>
                    {exchangeRate && pricePerBWPageVND ? (
                      <p className="mt-1 text-sm font-medium text-emerald-600">
                        💵 Giá B/W sau quy đổi: $ {(pricePerBWPageVND / exchangeRate).toFixed(2)}{' '}
                        USD
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label>Giá mỗi trang màu</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        inputMode="decimal"
                        value={pricePerColorPageVNDRaw}
                        onChange={(e) => {
                          const raw = e.target.value
                          setPricePerColorPageVNDRaw(raw)
                          const v = raw ? Number(raw) : ''
                          setPricePerColorPageVND(v)
                          if (v) {
                            setPricePerColorPageUSDRaw('')
                          }
                        }}
                        placeholder="VND"
                        className="h-11 text-base"
                      />
                      <Input
                        inputMode="decimal"
                        value={pricePerColorPageUSDRaw}
                        onChange={(e) => {
                          const raw = e.target.value
                          setPricePerColorPageUSDRaw(raw)
                          if (raw) {
                            setPricePerColorPageVND('')
                            setPricePerColorPageVNDRaw('')
                            setExchangeRate('')
                            setExchangeRateRaw('')
                          }
                        }}
                        placeholder="USD"
                        className="h-11 text-base"
                        disabled={!!pricePerColorPageVND}
                      />
                    </div>
                    {exchangeRate && pricePerColorPageVND ? (
                      <p className="mt-1 text-sm font-medium text-emerald-600">
                        💵 Giá Color sau quy đổi: ${' '}
                        {(pricePerColorPageVND / exchangeRate).toFixed(2)} USD
                      </p>
                    ) : null}
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
                    <Label>Tỷ giá (nếu nhập VND)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={exchangeRateRaw}
                      onChange={(e) => {
                        const raw = e.target.value
                        setExchangeRateRaw(raw)
                        setExchangeRate(raw ? Number(raw) : '')
                      }}
                      placeholder="25000"
                      className="h-11"
                    />
                    {(exchangeRate || pricePerBWPageVND || pricePerColorPageVND) && (
                      <p className="text-muted-foreground mt-2 text-sm">
                        Nếu nhập giá bằng VND, giá sẽ được quy đổi sang USD bằng tỷ giá trên.
                      </p>
                    )}
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

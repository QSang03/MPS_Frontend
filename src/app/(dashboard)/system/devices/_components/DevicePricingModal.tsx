'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import type { Device } from '@/types/models/device'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { Input } from '@/components/ui/input'
import DateTimeLocalPicker from '@/components/ui/DateTimeLocalPicker'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Loader2, Edit, Tag } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { devicesClientService } from '@/lib/api/services/devices-client.service'
import { useLocale } from '@/components/providers/LocaleProvider'
import { CurrencySelector } from '@/components/currency/CurrencySelector'
import { validateDecimal3010 } from '@/lib/utils/decimal-validation'

interface DevicePricingForm {
  pricePerBWPage: string
  pricePerColorPage: string
  monthlyRent: string
  effectiveFrom: string
  effectiveFromISO?: string | null | undefined
}

interface Props {
  device?: Device
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
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<DevicePricingForm>({
    pricePerBWPage: '',
    pricePerColorPage: '',
    monthlyRent: '',
    effectiveFrom: '',
    effectiveFromISO: undefined,
  })
  const [currencyId, setCurrencyId] = useState<string | null>(null)
  // store current effectiveFrom from backend (ISO) to enforce new > old
  const [currentEffectiveFromISO, setCurrentEffectiveFromISO] = useState<string | null>(null)
  const [canEditMonthlyRent, setCanEditMonthlyRent] = useState(false)
  const [contractRentError, setContractRentError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !device?.id) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const at = new Date().toISOString()
        const [pricingRes, contractRentResult] = await Promise.all([
          devicesClientService.getActivePricing(device.id, at),
          devicesClientService
            .getContractMonthlyRent(device.id)
            .then((data) => ({ data, error: null as null | unknown }))
            .catch((error) => ({ data: null, error })),
        ])
        if (cancelled) return

        const data = pricingRes || null
        if (
          data &&
          (data.pricePerBWPage !== undefined ||
            data.pricePerColorPage !== undefined ||
            data.monthlyRent !== undefined)
        ) {
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
            monthlyRent: '',
            effectiveFrom: isoToLocalDatetimeInput(data.effectiveFrom),
          })
          // Set currency from response if available
          if (data.currencyId || (data as { currency?: { id?: string } }).currency?.id) {
            setCurrencyId(
              data.currencyId || (data as { currency?: { id?: string } }).currency?.id || null
            )
          }
          // Defensive typed access to an external API response
          const pricingData = data as { effectiveFrom?: string | null } | null
          setCurrentEffectiveFromISO(pricingData?.effectiveFrom ?? null)
        } else {
          setForm({ pricePerBWPage: '', pricePerColorPage: '', monthlyRent: '', effectiveFrom: '' })
          setCurrencyId(null)
          setCurrentEffectiveFromISO(null)
        }

        // Handle contract monthly rent info
        const contractRentRes = contractRentResult.data
        let contractRentErrMessage: string | null = null
        if (contractRentResult.error) {
          const errObj = contractRentResult.error as {
            response?: { data?: { error?: string; message?: string }; status?: number }
            message?: string
          }
          if (errObj?.response?.status === 404) {
            contractRentErrMessage =
              'Thiết bị chưa có hợp đồng hoạt động hoặc chưa cấu hình giá thuê.'
          } else {
            contractRentErrMessage =
              errObj?.response?.data?.error ||
              errObj?.response?.data?.message ||
              errObj?.message ||
              'Không thể tải giá thuê hàng tháng từ hợp đồng.'
          }
        }

        if (contractRentRes && contractRentRes.monthlyRent !== undefined) {
          setForm((prev) => ({
            ...prev,
            monthlyRent: String(contractRentRes.monthlyRent),
          }))
          setCanEditMonthlyRent(true)
          setContractRentError(null)
          // Set currency from response
          // Use contract rent currency if pricing currency is not set
          if ((contractRentRes.currencyId || contractRentRes.currency?.id) && !currencyId) {
            setCurrencyId(contractRentRes.currencyId || contractRentRes.currency?.id || null)
          }
        } else {
          setForm((prev) => ({ ...prev, monthlyRent: '' }))
          setCanEditMonthlyRent(false)
          setContractRentError(
            contractRentErrMessage ||
              'Thiết bị chưa có hợp đồng hoạt động hoặc chưa cấu hình giá thuê. Không thể chỉnh sửa mục này.'
          )
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, device])

  const parseNum = (v: string): number => {
    if (typeof v !== 'string') return NaN
    const normalized = v.replace(/,/g, '').trim()
    if (normalized === '') return NaN
    return Number(normalized)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!device?.id) return
    setSubmitting(true)
    try {
      const payload: {
        pricePerBWPage?: number
        pricePerColorPage?: number
        monthlyRent?: number
        currencyId?: string
        effectiveFrom?: string
      } = {}

      // Validate and set B/W price
      if (form.pricePerBWPage !== '') {
        const validationError = validateDecimal3010(form.pricePerBWPage)
        if (validationError) {
          toast.error(validationError)
          setSubmitting(false)
          return
        }
        const parsed = parseNum(form.pricePerBWPage)
        if (!Number.isFinite(parsed) || parsed < 0) {
          toast.error('Giá không hợp lệ')
          setSubmitting(false)
          return
        }
        payload.pricePerBWPage = parsed
        if (currencyId) payload.currencyId = currencyId
      }

      // Validate and set Color price
      if (form.pricePerColorPage !== '') {
        const validationError = validateDecimal3010(form.pricePerColorPage)
        if (validationError) {
          toast.error(validationError)
          setSubmitting(false)
          return
        }
        const parsed = parseNum(form.pricePerColorPage)
        if (!Number.isFinite(parsed) || parsed < 0) {
          toast.error('Giá không hợp lệ')
          setSubmitting(false)
          return
        }
        payload.pricePerColorPage = parsed
        if (currencyId) payload.currencyId = currencyId
      }

      // Validate and set monthlyRent if provided
      let monthlyRentValue: number | undefined = undefined
      if (canEditMonthlyRent && form.monthlyRent !== '') {
        const validationError = validateDecimal3010(form.monthlyRent)
        if (validationError) {
          toast.error(validationError)
          setSubmitting(false)
          return
        }
        const parsed = parseNum(form.monthlyRent)
        if (!Number.isFinite(parsed) || parsed < 0) {
          toast.error('Giá thuê hàng tháng không hợp lệ')
          setSubmitting(false)
          return
        }
        monthlyRentValue = parsed
      }

      // effectiveFrom validation: if backend had existing effectiveFrom, new one must be greater
      // Validate effectiveFrom if user provided a value - require full datetime
      if (form.effectiveFrom && !localInputToIso(form.effectiveFrom)) {
        toast.error('Thời gian hiệu lực không hợp lệ hoặc thiếu giờ:phút')
        return
      }
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

      // Update pricing first
      await devicesClientService.upsertPricing(device.id, payload)

      // Then update monthlyRent on active contract via dedicated endpoint
      if (canEditMonthlyRent && monthlyRentValue !== undefined) {
        try {
          const updatePayload: {
            monthlyRent: number
            currencyId?: string
            currencyCode?: string
          } = {
            monthlyRent: monthlyRentValue,
          }
          if (currencyId) {
            updatePayload.currencyId = currencyId
            // Try to get currency code from currency selector if available
            // (This is optional, backend can resolve from currencyId)
          }
          await devicesClientService.updateContractMonthlyRent(device.id, updatePayload)
        } catch (err) {
          console.error('Failed to update monthlyRent', err)
          // Don't fail the whole operation if monthlyRent update fails
          toast.warning(t('devices.pricing.update_partial_success'))
        }
      }

      toast.success(t('devices.pricing.update_success'))
      setOpen(false)
      onSaved?.()
    } catch (err: unknown) {
      console.error('Upsert pricing error', err)
      try {
        if (axios.isAxiosError(err)) {
          const body = err.response?.data as { message?: string } | undefined
          if (body?.message) toast.error(String(body.message))
          else toast.error('Không thể cập nhật giá thiết bị')
        } else {
          const e = err as { message?: string } | undefined
          if (e?.message) toast.error(String(e.message))
          else toast.error('Không thể cập nhật giá thiết bị')
        }
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
                  aria-label={t('devices.pricing.assign')}
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

      <SystemModalLayout
        title={t('devices.pricing.title')}
        description={t('devices.pricing.description')}
        icon={Tag}
        variant="edit"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
              className="min-w-[100px]"
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              form="device-pricing-form"
              disabled={submitting}
              className="min-w-[120px] bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)] hover:bg-[var(--btn-primary-hover)]"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('devices.pricing.saving')}
                </>
              ) : (
                <>{t('devices.pricing.save')}</>
              )}
            </Button>
          </>
        }
      >
        <form id="device-pricing-form" onSubmit={handleSubmit} className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 font-medium text-[var(--brand-700)]">
              <Loader2 className="h-4 w-4 animate-spin" /> {t('devices.pricing.loading')}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label>{t('devices.pricing.price_bw')}</Label>
                  <Input
                    type="number"
                    step="any"
                    inputMode="decimal"
                    value={form.pricePerBWPage}
                    onChange={(e) => setForm((s) => ({ ...s, pricePerBWPage: e.target.value }))}
                    placeholder="Nhập giá"
                    className="h-11 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('devices.pricing.price_color')}</Label>
                  <Input
                    type="number"
                    step="any"
                    inputMode="decimal"
                    value={form.pricePerColorPage}
                    onChange={(e) => setForm((s) => ({ ...s, pricePerColorPage: e.target.value }))}
                    placeholder="Nhập giá"
                    className="h-11 text-base"
                  />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label className={!canEditMonthlyRent ? 'text-muted-foreground' : ''}>
                  {t('devices.pricing.monthly_rent')}
                </Label>
                {!canEditMonthlyRent && (
                  <p className="text-xs text-amber-600">
                    {contractRentError ||
                      'Thiết bị chưa có hợp đồng hoạt động hoặc chưa cấu hình giá thuê. Không thể chỉnh sửa mục này.'}
                  </p>
                )}
                <Input
                  type="number"
                  step="any"
                  inputMode="decimal"
                  value={form.monthlyRent}
                  onChange={(e) => setForm((s) => ({ ...s, monthlyRent: e.target.value }))}
                  placeholder="Nhập giá thuê hàng tháng"
                  className="h-11 text-base"
                  disabled={!canEditMonthlyRent}
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <CurrencySelector
                  label="Tiền tệ"
                  value={currencyId}
                  onChange={(value) => setCurrencyId(value)}
                  optional
                  placeholder="Chọn tiền tệ (mặc định: USD)"
                  customerId={device?.customerId}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('devices.pricing.effective_from')}</Label>
                <DateTimeLocalPicker
                  id="device-pricing-effectiveFrom"
                  value={form.effectiveFrom}
                  onChange={(v) => setForm((s: DevicePricingForm) => ({ ...s, effectiveFrom: v }))}
                  onISOChange={(iso) =>
                    setForm((s: DevicePricingForm) => ({ ...s, effectiveFromISO: iso }))
                  }
                  className="h-11"
                />
              </div>
            </>
          )}
        </form>
      </SystemModalLayout>
    </Dialog>
  )
}

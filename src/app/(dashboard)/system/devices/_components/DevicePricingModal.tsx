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
  monthlyRentCogs: string
  effectiveFrom: string
  effectiveFromISO?: string | null | undefined
  costPerBWPage: string
  costPerColorPage: string
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
    monthlyRentCogs: '',
    effectiveFrom: '',
    effectiveFromISO: undefined,
    costPerBWPage: '',
    costPerColorPage: '',
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
        const [pricingRes, contractRentResult, pagePrintingCostRes] = await Promise.all([
          devicesClientService.getActivePricing(device.id, at),
          devicesClientService
            .getContractMonthlyRent(device.id)
            .then((data) => ({ data, error: null as null | unknown }))
            .catch((error) => ({ data: null, error })),
          devicesClientService
            .getActivePagePrintingCost(device.id, at)
            .then((data) => ({ data, error: null as null | unknown }))
            .catch((error) => ({ data: null, error })),
        ])
        if (cancelled) return

        // Build form state object first, then set once
        const formUpdates: Partial<DevicePricingForm> = {}
        let newCurrencyId: string | null = null
        let newCurrentEffectiveFromISO: string | null = null

        // Handle pricing data
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
          formUpdates.pricePerBWPage = bw
          formUpdates.pricePerColorPage = color
          formUpdates.monthlyRent = ''
          formUpdates.monthlyRentCogs = ''
          formUpdates.effectiveFrom = isoToLocalDatetimeInput(data.effectiveFrom)

          // Set currency from response if available
          if (data.currencyId || (data as { currency?: { id?: string } }).currency?.id) {
            newCurrencyId =
              data.currencyId || (data as { currency?: { id?: string } }).currency?.id || null
          }
          // Defensive typed access to an external API response
          const pricingData = data as { effectiveFrom?: string | null } | null
          newCurrentEffectiveFromISO = pricingData?.effectiveFrom ?? null
        } else {
          formUpdates.pricePerBWPage = ''
          formUpdates.pricePerColorPage = ''
          formUpdates.monthlyRent = ''
          formUpdates.monthlyRentCogs = ''
          formUpdates.effectiveFrom = ''
          newCurrencyId = null
          newCurrentEffectiveFromISO = null
        }

        // Handle page printing cost
        const pagePrintingCostData = pagePrintingCostRes.data
        if (pagePrintingCostData) {
          const costBw =
            pagePrintingCostData.costPerBWPage !== undefined &&
            pagePrintingCostData.costPerBWPage !== null
              ? String(pagePrintingCostData.costPerBWPage)
              : '0'
          const costColor =
            pagePrintingCostData.costPerColorPage !== undefined &&
            pagePrintingCostData.costPerColorPage !== null
              ? String(pagePrintingCostData.costPerColorPage)
              : '0'
          formUpdates.costPerBWPage = costBw
          formUpdates.costPerColorPage = costColor

          // Use cost currency if pricing currency is not set
          if (
            (pagePrintingCostData.currencyId ||
              (pagePrintingCostData as { currency?: { id?: string } }).currency?.id) &&
            !newCurrencyId
          ) {
            newCurrencyId =
              pagePrintingCostData.currencyId ||
              (pagePrintingCostData as { currency?: { id?: string } }).currency?.id ||
              null
          }
          // Use cost effectiveFrom if pricing effectiveFrom is not set
          const costData = pagePrintingCostData as { effectiveFrom?: string | null } | null
          if (costData?.effectiveFrom && !newCurrentEffectiveFromISO) {
            newCurrentEffectiveFromISO = costData.effectiveFrom
          }
        } else {
          // Default to 0 if no cost data
          formUpdates.costPerBWPage = '0'
          formUpdates.costPerColorPage = '0'
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
            contractRentErrMessage = t('devices.pricing.contract_rent_missing')
          } else {
            contractRentErrMessage =
              errObj?.response?.data?.error ||
              errObj?.response?.data?.message ||
              errObj?.message ||
              t('devices.pricing.error.contract_rent_load_failed')
          }
        }

        if (contractRentRes && contractRentRes.monthlyRent !== undefined) {
          formUpdates.monthlyRent = String(contractRentRes.monthlyRent)
          formUpdates.monthlyRentCogs =
            contractRentRes.monthlyRentCogs !== undefined &&
            contractRentRes.monthlyRentCogs !== null
              ? String(contractRentRes.monthlyRentCogs)
              : ''
          setCanEditMonthlyRent(true)
          setContractRentError(null)
          // Set currency from response
          // Use contract rent currency if pricing currency is not set
          if ((contractRentRes.currencyId || contractRentRes.currency?.id) && !newCurrencyId) {
            newCurrencyId = contractRentRes.currencyId || contractRentRes.currency?.id || null
          }
        } else {
          if (!formUpdates.monthlyRent) formUpdates.monthlyRent = ''
          if (!formUpdates.monthlyRentCogs) formUpdates.monthlyRentCogs = ''
          setCanEditMonthlyRent(false)
          setContractRentError(
            contractRentErrMessage || t('devices.pricing.contract_rent_missing_edit_blocked')
          )
        }

        // Set all form state in one batch
        setForm((prev) => ({ ...prev, ...formUpdates }))
        setCurrencyId(newCurrencyId)
        setCurrentEffectiveFromISO(newCurrentEffectiveFromISO)
      } catch (err) {
        console.error('Failed to load active pricing', err)
        toast.error(t('devices.pricing.error.load_failed'))
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
        monthlyRentCogs?: number
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
          toast.error(t('devices.pricing.error.invalid_price'))
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
          toast.error(t('devices.pricing.error.invalid_price'))
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
          toast.error(t('devices.pricing.error.invalid_monthly_rent'))
          setSubmitting(false)
          return
        }
        monthlyRentValue = parsed
      }

      // Validate and set monthlyRentCogs if provided
      let monthlyRentCogsValue: number | undefined = undefined
      if (canEditMonthlyRent && form.monthlyRentCogs !== '') {
        const validationError = validateDecimal3010(form.monthlyRentCogs)
        if (validationError) {
          toast.error(validationError)
          setSubmitting(false)
          return
        }
        const parsed = parseNum(form.monthlyRentCogs)
        if (!Number.isFinite(parsed) || parsed < 0) {
          toast.error(t('devices.pricing.error.invalid_price'))
          setSubmitting(false)
          return
        }
        monthlyRentCogsValue = parsed
      }

      // effectiveFrom validation: if backend had existing effectiveFrom, new one must be greater
      // Validate effectiveFrom if user provided a value - require full datetime
      if (form.effectiveFrom && !localInputToIso(form.effectiveFrom)) {
        toast.error(t('devices.pricing.error.invalid_effective_from'))
        return
      }
      const ef = localInputToIso(form.effectiveFrom)
      if (ef) {
        if (currentEffectiveFromISO) {
          const oldTs = new Date(currentEffectiveFromISO).getTime()
          const newTs = new Date(ef).getTime()
          if (isNaN(oldTs) || isNaN(newTs) || newTs <= oldTs) {
            toast.error(t('devices.pricing.error.effective_from_not_greater'))
            setSubmitting(false)
            return
          }
        }
        payload.effectiveFrom = ef
      }

      // Update pricing first
      await devicesClientService.upsertPricing(device.id, payload)

      // Then update monthlyRent on active contract via dedicated endpoint
      if (
        canEditMonthlyRent &&
        (monthlyRentValue !== undefined || monthlyRentCogsValue !== undefined)
      ) {
        if (monthlyRentValue === undefined) {
          toast.error(t('devices.pricing.error.invalid_monthly_rent'))
          setSubmitting(false)
          return
        }
        try {
          const updatePayload: {
            monthlyRent: number
            monthlyRentCogs?: number
            currencyId?: string
            currencyCode?: string
          } = {
            monthlyRent: monthlyRentValue,
          }
          if (monthlyRentCogsValue !== undefined) {
            updatePayload.monthlyRentCogs = monthlyRentCogsValue
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

      // Validate and update page printing cost
      const costPayload: {
        costPerBWPage?: number
        costPerColorPage?: number
        currencyId?: string
        currencyCode?: string
        effectiveFrom?: string
      } = {}

      // Validate and set B/W cost
      if (form.costPerBWPage !== '' && form.costPerBWPage !== '0') {
        const validationError = validateDecimal3010(form.costPerBWPage)
        if (validationError) {
          toast.error(validationError)
          setSubmitting(false)
          return
        }
        const parsed = parseNum(form.costPerBWPage)
        if (!Number.isFinite(parsed) || parsed < 0) {
          toast.error(t('devices.pricing.error.invalid_cost'))
          setSubmitting(false)
          return
        }
        costPayload.costPerBWPage = parsed
        if (currencyId) costPayload.currencyId = currencyId
      } else if (form.costPerBWPage === '0') {
        costPayload.costPerBWPage = 0
        if (currencyId) costPayload.currencyId = currencyId
      }

      // Validate and set Color cost
      if (form.costPerColorPage !== '' && form.costPerColorPage !== '0') {
        const validationError = validateDecimal3010(form.costPerColorPage)
        if (validationError) {
          toast.error(validationError)
          setSubmitting(false)
          return
        }
        const parsed = parseNum(form.costPerColorPage)
        if (!Number.isFinite(parsed) || parsed < 0) {
          toast.error(t('devices.pricing.error.invalid_cost'))
          setSubmitting(false)
          return
        }
        costPayload.costPerColorPage = parsed
        if (currencyId) costPayload.currencyId = currencyId
      } else if (form.costPerColorPage === '0') {
        costPayload.costPerColorPage = 0
        if (currencyId) costPayload.currencyId = currencyId
      }

      // Use the same effectiveFrom as pricing (already validated above)
      if (ef) {
        costPayload.effectiveFrom = ef
      }

      // Upsert page printing cost if we have any cost data
      if (
        costPayload.costPerBWPage !== undefined ||
        costPayload.costPerColorPage !== undefined ||
        costPayload.effectiveFrom !== undefined
      ) {
        try {
          await devicesClientService.upsertPagePrintingCost(device.id, costPayload)
        } catch (err) {
          console.error('Failed to update page printing cost', err)
          // Don't fail the whole operation if cost update fails
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
          else toast.error(t('devices.pricing.error.update_failed'))
        } else {
          const e = err as { message?: string } | undefined
          if (e?.message) toast.error(String(e.message))
          else toast.error(t('devices.pricing.error.update_failed'))
        }
      } catch {
        toast.error(t('devices.pricing.error.update_failed'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {compact ? (
        <Tooltip>
          <TooltipContent sideOffset={4}>{t('devices.pricing.tooltip.assign')}</TooltipContent>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 w-8 cursor-pointer rounded-full p-0"
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
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer gap-2"
            title={t('devices.pricing.assign')}
          >
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
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={submitting}
                  className="min-w-[100px] cursor-pointer"
                >
                  {t('cancel')}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('cancel')}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="submit"
                  form="device-pricing-form"
                  disabled={submitting}
                  className="min-w-[120px] cursor-pointer bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)] hover:bg-[var(--btn-primary-hover)]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{' '}
                      {t('devices.pricing.saving')}
                    </>
                  ) : (
                    <>{t('devices.pricing.save')}</>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('devices.pricing.save')}</p>
              </TooltipContent>
            </Tooltip>
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5">
                <div className="space-y-2">
                  <Label>{t('devices.pricing.price_bw')}</Label>
                  <Input
                    type="number"
                    step="any"
                    inputMode="decimal"
                    value={form.pricePerBWPage}
                    onChange={(e) => setForm((s) => ({ ...s, pricePerBWPage: e.target.value }))}
                    placeholder={t('devices.pricing.placeholder.price')}
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
                    placeholder={t('devices.pricing.placeholder.price')}
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
                    {contractRentError || t('devices.pricing.contract_rent_missing')}
                  </p>
                )}
                <Input
                  type="number"
                  step="any"
                  inputMode="decimal"
                  value={form.monthlyRent}
                  onChange={(e) => setForm((s) => ({ ...s, monthlyRent: e.target.value }))}
                  placeholder={t('devices.pricing.placeholder.monthly_rent')}
                  className="h-11 text-base"
                  disabled={!canEditMonthlyRent}
                />
                <div className="space-y-2">
                  <Label className={!canEditMonthlyRent ? 'text-muted-foreground' : ''}>
                    {t('device_pricing.form.monthly_operating_cost')}
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    inputMode="decimal"
                    value={form.monthlyRentCogs}
                    onChange={(e) => setForm((s) => ({ ...s, monthlyRentCogs: e.target.value }))}
                    placeholder={t('device_pricing.form.monthly_operating_cost_placeholder')}
                    className="h-11 text-base"
                    disabled={!canEditMonthlyRent}
                  />
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-semibold">
                    {t('devices.pricing.cost_label')}
                  </Label>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {t('devices.pricing.cost_description')}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5">
                  <div className="space-y-2">
                    <Label>{t('devices.pricing.cost_bw')}</Label>
                    <Input
                      type="number"
                      step="any"
                      inputMode="decimal"
                      value={form.costPerBWPage}
                      onChange={(e) => setForm((s) => ({ ...s, costPerBWPage: e.target.value }))}
                      placeholder={t('devices.pricing.placeholder.price')}
                      className="h-11 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('devices.pricing.cost_color')}</Label>
                    <Input
                      type="number"
                      step="any"
                      inputMode="decimal"
                      value={form.costPerColorPage}
                      onChange={(e) => setForm((s) => ({ ...s, costPerColorPage: e.target.value }))}
                      placeholder={t('devices.pricing.placeholder.price')}
                      className="h-11 text-base"
                    />
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <CurrencySelector
                  label={t('currency.label')}
                  value={currencyId}
                  onChange={(value) => setCurrencyId(value)}
                  optional
                  placeholder={t('currency.select.placeholder_with_default')}
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

'use client'

import { useEffect, useRef, useState } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import DateTimeLocalPicker from '@/components/ui/DateTimeLocalPicker'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import internalApiClient from '@/lib/api/internal-client'
import type { Device } from '@/types/models/device'
import { useLocale } from '@/components/providers/LocaleProvider'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, Scan } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

interface Props {
  // Accept any device-like object which must include `id` and optionally `serialNumber`.
  // This lets the modal be used across different pages where slightly different device types are used
  // (e.g., Device, CustomerOverviewContractDevice).
  device?: { id: string; serialNumber?: string } | Device | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

export default function A4EquivalentModal({ device, open, onOpenChange, onSaved }: Props) {
  const { t, locale } = useLocale()
  const [submitting, setSubmitting] = useState(false)
  const [totalPageCountA4, setTotalPageCountA4] = useState<string>('')
  const [totalColorPagesA4, setTotalColorPagesA4] = useState<string>('')
  const [totalBlackWhitePagesA4, setTotalBlackWhitePagesA4] = useState<string>('')
  const [recordedAt, setRecordedAt] = useState<string>('') // local value
  const [recordedAtISO, setRecordedAtISO] = useState<string | null>(null) // ISO
  const [updateLatest, setUpdateLatest] = useState<boolean>(false)
  const [scanLoading, setScanLoading] = useState(false)
  const [scanResult, setScanResult] = useState<{
    totalPageCount?: number | null
    totalPageCountA4?: number | null
    message?: string | null
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!device) return
    // Reset form when device changes / modal toggled open
    // New backend logic: when creating a snapshot, always send A4-equivalent values.
    // Standard counters are always sent as 0 (agent updates standard separately).
    setTotalPageCountA4('')
    setTotalColorPagesA4('')
    setTotalBlackWhitePagesA4('')
    setRecordedAt('')
    setUpdateLatest(false)
    setScanResult(null)
  }, [device, open])

  if (!device) return null

  const handleSubmit = async () => {
    // basic validation: require at least one A4 counter and recordedAt
    if (!totalPageCountA4.trim() && !totalColorPagesA4.trim() && !totalBlackWhitePagesA4.trim()) {
      toast.error(t('device.a4.error.require_counter'))
      return
    }

    if (!recordedAtISO) {
      toast.error(t('device.a4.error.require_recorded_at'))
      return
    }

    // parse numeric inputs (if present)
    const totalA4 = totalPageCountA4.trim() ? Number(totalPageCountA4) : undefined
    const colorA4 = totalColorPagesA4.trim() ? Number(totalColorPagesA4) : undefined
    const bwA4 = totalBlackWhitePagesA4.trim() ? Number(totalBlackWhitePagesA4) : undefined

    // basic numeric validation
    const invalidNumber = [totalA4, colorA4, bwA4].some(
      (v) => v !== undefined && (Number.isNaN(v) || v < 0)
    )
    if (invalidNumber) {
      toast.error(t('device.a4.error.invalid_counter_values'))
      return
    }

    // A4 final values
    let finalTotalA4 = totalA4
    let finalColorA4 = colorA4
    let finalBwA4 = bwA4

    // Same validations/auto-compute for A4 numbers
    if (finalTotalA4 !== undefined) {
      if (finalColorA4 !== undefined && finalBwA4 !== undefined) {
        if (finalColorA4 + finalBwA4 !== finalTotalA4) {
          toast.error(
            t('device.a4.validation.total_mismatch_a4', {
              color: finalColorA4,
              bw: finalBwA4,
              total: finalTotalA4,
            })
          )
          return
        }
      } else if (finalColorA4 !== undefined && finalBwA4 === undefined) {
        const computedBw = finalTotalA4 - finalColorA4
        if (computedBw < 0) {
          toast.error(t('device.a4.error.color_exceeds_total_a4'))
          return
        }
        finalBwA4 = computedBw
        toast(t('device.a4.auto_fill_bw_a4', { value: computedBw }))
      } else if (finalBwA4 !== undefined && finalColorA4 === undefined) {
        const computedColor = finalTotalA4 - finalBwA4
        if (computedColor < 0) {
          toast.error(t('device.a4.error.bw_exceeds_total_a4'))
          return
        }
        finalColorA4 = computedColor
        toast(t('device.a4.auto_fill_color_a4', { value: computedColor }))
      }
    } else {
      // A4 total not provided. If color and bw provided, set total to sum so backend gets full info.
      if (finalColorA4 !== undefined && finalBwA4 !== undefined) {
        finalTotalA4 = finalColorA4 + finalBwA4
      }
    }

    const body: Record<string, unknown> = {
      deviceId: device.id,
      recordedAt: recordedAtISO,
      updateLatest,
      // Always send standard counters as 0
      totalPageCount: 0,
      totalColorPages: 0,
      totalBlackWhitePages: 0,
    }

    // attach A4-equivalent values when present
    if (finalTotalA4 !== undefined) body.totalPageCountA4 = finalTotalA4
    if (finalColorA4 !== undefined) body.totalColorPagesA4 = finalColorA4
    if (finalBwA4 !== undefined) body.totalBlackWhitePagesA4 = finalBwA4

    setSubmitting(true)
    try {
      await internalApiClient.post('/api/reports/usage/a4-equivalent', body)
      toast.success(t('device.a4.save_success'))
      onSaved?.()
      onOpenChange(false)
    } catch (err: unknown) {
      console.error('Failed to save a4-equivalent snapshot', err)
      // Narrow the error type to extract common fields without using `any`
      const maybeErr = err as
        | { response?: { data?: { error?: string } }; message?: unknown }
        | undefined
      const msg = maybeErr?.response?.data?.error ?? (maybeErr?.message as string | undefined)
      toast.error(msg ? String(msg) : t('a4_modal.error.save_failed'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleScanPdf = async (file: File) => {
    if (!device?.id) return
    const fd = new FormData()
    fd.append('file', file)
    const effectiveAt = recordedAtISO ?? new Date().toISOString()
    fd.append('at', effectiveAt)
    if (!recordedAtISO) {
      setRecordedAtISO(effectiveAt)
      setRecordedAt(effectiveAt.slice(0, 16))
    }
    const params: Record<string, string> = {
      deviceId: device.id,
      lang: locale === 'en' ? 'en' : 'vi',
    }
    const customerId =
      (device as Device)?.customerId || (device as { customerId?: string })?.customerId
    if (customerId) params.customerId = customerId

    setScanLoading(true)
    setScanResult(null)
    try {
      const resp = await internalApiClient.post('/api/reports/usage/scan-pdf', fd, {
        params,
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const data = resp?.data?.data || {}
      const total = data.totalPageCountA4 ?? data.totalPageCount ?? 0
      setScanResult({
        totalPageCount: data.totalPageCount,
        totalPageCountA4: data.totalPageCountA4,
        message: resp?.data?.message,
      })

      setTotalPageCountA4(total !== null && total !== undefined ? String(total) : '')

      toast.success(t('a4_modal.success.pdf_analyzed'))
    } catch (err: unknown) {
      const maybe = err as { response?: { data?: { message?: string; error?: string } } }
      const msg = maybe?.response?.data?.message || maybe?.response?.data?.error
      toast.error(msg || t('a4_modal.error.pdf_analysis_failed'))
    } finally {
      setScanLoading(false)
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
        title={t('device.a4.log_title')}
        description={`${t('device.form.status')}: ${device.serialNumber || device.id}`}
        icon={FileText}
        variant="create"
        footer={
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={submitting}
                  className="min-w-[100px] cursor-pointer"
                >
                  {t('a4_modal.button.cancel')}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('a4_modal.button.cancel')}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="submit"
                  form="a4-form"
                  disabled={submitting}
                  className="min-w-[120px] cursor-pointer bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)] hover:bg-[var(--btn-primary-hover)]"
                >
                  {submitting ? t('button.saving') : t('button.update')}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('button.update')}</p>
              </TooltipContent>
            </Tooltip>
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
          <div className="flex flex-wrap items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={scanLoading}
                  className="cursor-pointer gap-2"
                >
                  {scanLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Scan className="h-4 w-4" />
                  )}
                  {scanLoading ? t('a4_modal.button.analyzing') : t('a4_modal.button.analyze_pdf')}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('a4_modal.button.analyze_pdf')}</p>
              </TooltipContent>
            </Tooltip>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  void handleScanPdf(file)
                  // allow re-selecting same file
                  e.target.value = ''
                }
              }}
            />
            <p className="text-muted-foreground text-xs">{t('a4_modal.info.pdf_only')}</p>
          </div>

          {scanResult && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTitle>{t('a4_modal.result.title')}</AlertTitle>
              <AlertDescription className="text-sm">
                {t('a4_modal.result.description', {
                  total: scanResult.totalPageCount ?? '—',
                  a4: scanResult.totalPageCountA4 ?? '—',
                })}
              </AlertDescription>
            </Alert>
          )}

          {/* A4 fields (always) */}
          <>
            <div>
              <Label className="text-sm font-semibold">{t('device.a4.total_color_a4')}</Label>
              <Input
                value={totalColorPagesA4}
                onChange={(e) => handleColorChange(e.target.value)}
                placeholder={t('device.a4.example', { value: '2000' })}
                className="mt-2 h-11"
                type="number"
                min={0}
              />
            </div>

            <div>
              <Label className="text-sm font-semibold">{t('device.a4.total_bw_a4')}</Label>
              <Input
                value={totalBlackWhitePagesA4}
                onChange={(e) => handleBwChange(e.target.value)}
                placeholder={t('device.a4.example', { value: '8000' })}
                className="mt-2 h-11"
                type="number"
                min={0}
              />
            </div>

            <div>
              <Label className="text-sm font-semibold">{t('device.a4.total_a4')}</Label>
              <Input
                value={totalPageCountA4}
                onChange={(e) => handleTotalChange(e.target.value)}
                placeholder={t('device.a4.example', { value: '10000' })}
                className="mt-2 h-11"
                type="number"
                min={0}
              />
            </div>
          </>

          <div>
            <Label className="text-sm font-semibold">{t('device.a4.recorded_at_time')}</Label>
            <DateTimeLocalPicker
              id="a4-recordedAt"
              value={recordedAt}
              onChange={(v) => setRecordedAt(v)}
              onISOChange={(iso) => setRecordedAtISO(iso)}
            />
          </div>

          <div className="flex items-center gap-3">
            <Checkbox checked={updateLatest} onCheckedChange={(v) => setUpdateLatest(Boolean(v))} />
            <Label className="text-sm">{t('device.a4.update_latest_label')}</Label>
          </div>
        </form>
      </SystemModalLayout>
    </Dialog>
  )
}

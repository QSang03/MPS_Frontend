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
  // New non-A4 fields
  const [totalPageCount, setTotalPageCount] = useState<string>('')
  const [totalColorPages, setTotalColorPages] = useState<string>('')
  const [totalBlackWhitePages, setTotalBlackWhitePages] = useState<string>('')
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

  const rawA4 = (device as Device | null)?.deviceModel?.useA4Counter as unknown
  const useA4 = rawA4 === true || rawA4 === 'true' || rawA4 === 1 || rawA4 === '1'

  useEffect(() => {
    if (!device) return
    // Reset form when device changes / modal toggled open
    // If the device model uses A4 counters only, prefill standard counters with 0 to avoid confusion
    if (useA4) {
      setTotalPageCount('0')
      setTotalColorPages('0')
      setTotalBlackWhitePages('0')
      setTotalPageCountA4('')
      setTotalColorPagesA4('')
      setTotalBlackWhitePagesA4('')
    } else {
      // If the device model uses standard counters (non-A4), prefill A4 counters with 0
      setTotalPageCount('')
      setTotalColorPages('')
      setTotalBlackWhitePages('')
      setTotalPageCountA4('0')
      setTotalColorPagesA4('0')
      setTotalBlackWhitePagesA4('0')
    }
    setRecordedAt('')
    setUpdateLatest(false)
    setScanResult(null)
  }, [device, open, useA4])

  if (!device) return null

  const handleSubmit = async () => {
    // basic validation: require at least one of the counts (either non-A4 or A4) and recordedAt
    if (
      // If device uses A4, require A4 counts; otherwise require non-A4 counts. If model not specified, allow either.
      useA4
        ? !totalPageCountA4.trim() && !totalColorPagesA4.trim() && !totalBlackWhitePagesA4.trim()
        : !totalPageCount.trim() && !totalColorPages.trim() && !totalBlackWhitePages.trim()
    ) {
      toast.error(t('device.a4.error.require_counter'))
      return
    }

    if (!recordedAtISO) {
      toast.error(t('device.a4.error.require_recorded_at'))
      return
    }

    // parse numeric inputs (if present)
    // parse numeric inputs (if present) for both A4 and non-A4 variants
    const totalA4 = totalPageCountA4.trim() ? Number(totalPageCountA4) : undefined
    const colorA4 = totalColorPagesA4.trim() ? Number(totalColorPagesA4) : undefined
    const bwA4 = totalBlackWhitePagesA4.trim() ? Number(totalBlackWhitePagesA4) : undefined

    const total = totalPageCount.trim() ? Number(totalPageCount) : undefined
    const color = totalColorPages.trim() ? Number(totalColorPages) : undefined
    const bw = totalBlackWhitePages.trim() ? Number(totalBlackWhitePages) : undefined

    // basic numeric validation
    const invalidNumber = [total, color, bw, totalA4, colorA4, bwA4].some(
      (v) => v !== undefined && (Number.isNaN(v) || v < 0)
    )
    if (invalidNumber) {
      toast.error(t('device.a4.error.invalid_counter_values'))
      return
    }

    // If total is provided, try to ensure color + bw equals total.
    // - If both color and bw provided but sum !== total -> stop with message
    // - If one of color/bw missing -> compute it as total - provided (if valid)
    let finalTotal = total
    let finalColor = color
    let finalBw = bw

    // A4 final values
    let finalTotalA4 = totalA4
    let finalColorA4 = colorA4
    let finalBwA4 = bwA4

    if (finalTotal !== undefined) {
      if (finalColor !== undefined && finalBw !== undefined) {
        if (finalColor + finalBw !== finalTotal) {
          toast.error(
            t('device.a4.validation.total_mismatch', {
              color: finalColor,
              bw: finalBw,
              total: finalTotal,
            })
          )
          return
        }
      } else if (finalColor !== undefined && finalBw === undefined) {
        const computedBw = finalTotal - finalColor
        if (computedBw < 0) {
          toast.error(t('device.a4.error.color_exceeds_total'))
          return
        }
        finalBw = computedBw
        // show a gentle info so user knows we computed it
        toast(t('device.a4.auto_fill_bw', { value: computedBw }))
      } else if (finalBw !== undefined && finalColor === undefined) {
        const computedColor = finalTotal - finalBw
        if (computedColor < 0) {
          toast.error(t('device.a4.error.bw_exceeds_total'))
          return
        }
        finalColor = computedColor
        toast(t('device.a4.auto_fill_color', { value: computedColor }))
      }
    }

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

    // If non-A4 total not provided but color and bw provided -> fill total
    if (finalTotal === undefined) {
      if (finalColor !== undefined && finalBw !== undefined) {
        finalTotal = finalColor + finalBw
      }
    }

    const body: Record<string, unknown> = {
      deviceId: device.id,
      recordedAt: recordedAtISO,
      updateLatest,
    }

    // attach non-A4 values when present
    if (finalTotal !== undefined) body.totalPageCount = finalTotal
    if (finalColor !== undefined) body.totalColorPages = finalColor
    if (finalBw !== undefined) body.totalBlackWhitePages = finalBw

    // attach A4-equivalent values when present
    if (finalTotalA4 !== undefined) body.totalPageCountA4 = finalTotalA4
    if (finalColorA4 !== undefined) body.totalColorPagesA4 = finalColorA4
    if (finalBwA4 !== undefined) body.totalBlackWhitePagesA4 = finalBwA4

    // If device uses A4 counters, ensure non-A4 fields are explicitly set to 0 in case backend expects them
    if (useA4) {
      if (body.totalPageCount === undefined) body.totalPageCount = 0
      if (body.totalColorPages === undefined) body.totalColorPages = 0
      if (body.totalBlackWhitePages === undefined) body.totalBlackWhitePages = 0
    }

    // If device uses standard counters, ensure A4 fields are set to 0
    if (!useA4) {
      if (body.totalPageCountA4 === undefined) body.totalPageCountA4 = 0
      if (body.totalColorPagesA4 === undefined) body.totalColorPagesA4 = 0
      if (body.totalBlackWhitePagesA4 === undefined) body.totalBlackWhitePagesA4 = 0
    }

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
      const total = data.totalPageCount ?? data.totalPageCountA4 ?? 0
      setScanResult({
        totalPageCount: data.totalPageCount,
        totalPageCountA4: data.totalPageCountA4,
        message: resp?.data?.message,
      })

      if (useA4) {
        setTotalPageCountA4(total !== null && total !== undefined ? String(total) : '')
        // clear non-A4 to avoid confusion
        setTotalPageCount('0')
        setTotalColorPages('0')
        setTotalBlackWhitePages('0')
      } else {
        setTotalPageCount(total !== null && total !== undefined ? String(total) : '')
        setTotalPageCountA4('0')
        setTotalColorPagesA4('0')
        setTotalBlackWhitePagesA4('0')
      }

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

  // non-A4 helpers (live auto-fill behavior)
  const handleColorChangeNonA4 = (v: string) => {
    setTotalColorPages(v)
    const colorNum = parseNum(v)
    const bwNum = parseNum(totalBlackWhitePages)

    if (colorNum !== undefined && bwNum !== undefined) {
      setTotalPageCount(String(colorNum + bwNum))
    }
  }

  const handleBwChangeNonA4 = (v: string) => {
    setTotalBlackWhitePages(v)
    const bwNum = parseNum(v)
    const colorNum = parseNum(totalColorPages)

    if (colorNum !== undefined && bwNum !== undefined) {
      setTotalPageCount(String(colorNum + bwNum))
    }
  }

  const handleTotalChangeNonA4 = (v: string) => {
    setTotalPageCount(v)
    const totalNum = parseNum(v)
    const colorNum = parseNum(totalColorPages)
    const bwNum = parseNum(totalBlackWhitePages)

    if (totalNum !== undefined) {
      if (colorNum !== undefined && bwNum === undefined) {
        const computedBw = totalNum - colorNum
        if (computedBw >= 0) setTotalBlackWhitePages(String(computedBw))
      } else if (bwNum !== undefined && colorNum === undefined) {
        const computedColor = totalNum - bwNum
        if (computedColor >= 0) setTotalColorPages(String(computedColor))
      }
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

          {/* non-A4 fields (regular counters) */}
          {!useA4 && (
            <>
              <div>
                <Label className="text-sm font-semibold">{t('device.a4.total_color')}</Label>
                <Input
                  value={totalColorPages}
                  onChange={(e) => handleColorChangeNonA4(e.target.value)}
                  placeholder={t('device.a4.example', { value: '2000' })}
                  className="mt-2 h-11"
                  type="number"
                  min={0}
                />
              </div>

              <div>
                <Label className="text-sm font-semibold">{t('device.a4.total_bw')}</Label>
                <Input
                  value={totalBlackWhitePages}
                  onChange={(e) => handleBwChangeNonA4(e.target.value)}
                  placeholder={t('device.a4.example', { value: '8000' })}
                  className="mt-2 h-11"
                  type="number"
                  min={0}
                />
              </div>

              <div>
                <Label className="text-sm font-semibold">{t('device.a4.total')}</Label>
                <Input
                  value={totalPageCount}
                  onChange={(e) => handleTotalChangeNonA4(e.target.value)}
                  placeholder={t('device.a4.example', { value: '10000' })}
                  className="mt-2 h-11"
                  type="number"
                  min={0}
                />
              </div>
            </>
          )}

          {/* A4 fields */}
          {useA4 && (
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
          )}

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

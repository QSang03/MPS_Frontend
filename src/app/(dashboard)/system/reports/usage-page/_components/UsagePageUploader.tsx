'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { AlertCircle, CheckCircle, Loader2, RefreshCw, Save, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useLocale } from '@/components/providers/LocaleProvider'
import usagePageService, { type UsagePageDeviceInfo } from '@/lib/api/services/usage-page.service'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type Step = 'upload' | 'review'

type FormState = {
  deviceId: string
  serialNumber: string
  totalPageCount: string
  totalColorPages: string
  totalBlackWhitePages: string
  recordedAt: string
  deviceInfo: UsagePageDeviceInfo | null
}

const initialForm: FormState = {
  deviceId: '',
  serialNumber: '',
  totalPageCount: '0',
  totalColorPages: '0',
  totalBlackWhitePages: '0',
  recordedAt: '',
  deviceInfo: null,
}

export function UsagePageUploader() {
  const { t } = useLocale()
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [step, setStep] = useState<Step>('upload')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState<FormState>(initialForm)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(selectedFile)
    setPreviewUrl(URL.createObjectURL(selectedFile))
    setError('')
    setSuccess('')
  }

  const handleProcess = async () => {
    if (!file) return
    setIsProcessing(true)
    setError('')
    setSuccess('')
    try {
      const res = await usagePageService.process(file)
      const payload = res?.data
      const device: UsagePageDeviceInfo | null | undefined = payload?.device

      setFormData({
        deviceId: payload?.deviceId || '',
        serialNumber: payload?.serialNumber || device?.serialNumber || 'Unknown Serial',
        totalPageCount: payload?.totalPageCount?.toString() ?? '0',
        totalColorPages: payload?.totalColorPages?.toString() ?? '0',
        totalBlackWhitePages: payload?.totalBlackWhitePages?.toString() ?? '0',
        recordedAt: payload?.recordedAt || new Date().toISOString().slice(0, 10), // default yyyy-mm-dd
        deviceInfo: device ?? null,
      })
      setStep('review')
      toast.success(t('usage_page_uploader.process_success'))
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message ||
        t('usagePageUploader.process_error') ||
        t('usage_page_uploader.process_error')
      setError(message)
      toast.error(message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleApprove = async () => {
    if (!formData.deviceId) {
      const msg =
        t('usagePageUploader.device_not_found_save') || t('usage_page_uploader.device_not_found')
      setError(msg)
      toast.error(msg)
      return
    }
    setIsApproving(true)
    setError('')
    try {
      await usagePageService.approve({
        deviceId: formData.deviceId,
        totalPageCount: Number(formData.totalPageCount),
        totalColorPages: Number(formData.totalColorPages),
        totalBlackWhitePages: Number(formData.totalBlackWhitePages),
        recordedAt: formData.recordedAt,
      })
      const msg = t('usage_page_uploader.approve_success')
      setSuccess(msg)
      toast.success(msg)
      setTimeout(() => {
        handleReset()
      }, 1200)
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message ||
        t('usagePageUploader.approve_error') ||
        t('usage_page_uploader.save_error')
      setError(message)
      toast.error(message)
    } finally {
      setIsApproving(false)
    }
  }

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null)
    setPreviewUrl(null)
    setStep('upload')
    setFormData(initialForm)
    setError('')
    setSuccess('')
  }

  const canApprove = useMemo(
    () => Boolean(formData.deviceId && !isApproving && !isProcessing),
    [formData.deviceId, isApproving, isProcessing]
  )

  const showApproveButton = step === 'review'

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>{t('usage_page_uploader.title')}</CardTitle>
        <CardDescription>
          {t('usagePageUploader.subtitle') || t('usage_page_uploader.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        ) : null}
        {success ? (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span>{success}</span>
          </div>
        ) : null}

        <div className="grid gap-3 sm:gap-4 md:gap-6 lg:grid-cols-2">
          {/* Left column: upload & preview */}
          <div className="flex flex-col gap-4">
            <div
              className={cn(
                'bg-muted/40 relative flex h-[420px] flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed',
                file ? 'border-blue-500' : 'border-muted-foreground/30 hover:border-blue-400'
              )}
            >
              {!previewUrl ? (
                <label className="text-muted-foreground flex h-full w-full cursor-pointer flex-col items-center justify-center px-4 text-center">
                  <Upload className="mb-3 h-10 w-10 opacity-60" />
                  <span className="text-sm">{t('usage_page_uploader.upload_prompt')}</span>
                  <Input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              ) : (
                <div className="relative h-full w-full bg-white">
                  <Image
                    src={previewUrl as string}
                    alt={t('usagePageUploader.preview_alt') || 'Preview'}
                    fill
                    unoptimized
                    style={{ objectFit: 'contain' }}
                    className="rounded-xl"
                  />
                </div>
              )}

              {previewUrl && step === 'upload' ? (
                <Button
                  type="button"
                  size="icon-sm"
                  variant="secondary"
                  onClick={handleReset}
                  className="text-destructive absolute top-3 right-3 rounded-full bg-white/80 shadow-sm"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              ) : null}
            </div>

            {step === 'upload' ? (
              <Button
                type="button"
                onClick={handleProcess}
                disabled={!file || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('usage_page_uploader.processing')}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    {t('usage_page_uploader.process_cta')}
                  </>
                )}
              </Button>
            ) : null}
          </div>

          {/* Right column: review form */}
          <div className="flex flex-col gap-4">
            {step === 'review' ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                  <p className="mb-2 text-xs font-semibold text-blue-800 uppercase">
                    {t('usage_page_uploader.device_info')}
                  </p>
                  {formData.deviceInfo ? (
                    <div className="space-y-1 text-sm text-blue-900">
                      <p>
                        <span className="font-semibold">Model:</span>{' '}
                        {formData.deviceInfo.deviceModel?.name}
                      </p>
                      <p>
                        <span className="font-semibold">Serial:</span> {formData.serialNumber}
                      </p>
                      <p>
                        <span className="font-semibold">{t('usage_page_uploader.customer')}:</span>{' '}
                        {formData.deviceInfo.customer?.name}
                      </p>
                      <p>
                        <span className="font-semibold">{t('usage_page_uploader.location')}:</span>{' '}
                        {formData.deviceInfo.location}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>
                        {t('usagePageUploader.device_not_found') ||
                          t('usage_page_uploader.device_not_found_in_image')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="recordedAt">{t('usage_page_uploader.recorded_at')}</Label>
                    <Input
                      id="recordedAt"
                      type="date"
                      name="recordedAt"
                      value={formData.recordedAt}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="totalColorPages">
                        {t('usagePageUploader.total_color') || 'Total Color'}
                      </Label>
                      <Input
                        id="totalColorPages"
                        type="number"
                        name="totalColorPages"
                        value={formData.totalColorPages}
                        onChange={handleInputChange}
                        min={0}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="totalBlackWhitePages">
                        {t('usagePageUploader.total_bw') || 'Total B/W'}
                      </Label>
                      <Input
                        id="totalBlackWhitePages"
                        type="number"
                        name="totalBlackWhitePages"
                        value={formData.totalBlackWhitePages}
                        onChange={handleInputChange}
                        min={0}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="totalPageCount" className="font-semibold">
                      {t('usage_page_uploader.total_page')}
                    </Label>
                    <Input
                      id="totalPageCount"
                      type="number"
                      name="totalPageCount"
                      value={formData.totalPageCount}
                      onChange={handleInputChange}
                      min={0}
                      className="bg-muted/50 text-lg font-semibold"
                    />
                    <p className="text-muted-foreground text-xs">
                      {t('usage_page_uploader.validation_note')}
                    </p>
                  </div>
                </div>

                {showApproveButton ? (
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={handleReset}
                      disabled={isProcessing || isApproving}
                    >
                      {t('usage_page_uploader.reset')}
                    </Button>
                    <Button
                      type="button"
                      className="flex-1"
                      onClick={handleApprove}
                      disabled={!canApprove}
                    >
                      {isApproving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t('usage_page_uploader.approving')}
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          {t('usage_page_uploader.approve')}
                        </>
                      )}
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="border-muted-foreground/20 bg-muted/30 text-muted-foreground flex h-full flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center">
                <Upload className="mb-4 h-12 w-12 opacity-40" />
                <p className="text-sm">{t('usage_page_uploader.upload_instruction')}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default UsagePageUploader

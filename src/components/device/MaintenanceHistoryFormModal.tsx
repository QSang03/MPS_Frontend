'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Loader2, Plus, Edit, Upload, X, Star } from 'lucide-react'
import { toast } from 'sonner'
import { useLocale } from '@/components/providers/LocaleProvider'
import { maintenanceHistoriesService } from '@/lib/api/services/maintenance-histories.service'
import type {
  MaintenanceHistory,
  CreateMaintenanceHistoryDto,
  UpdateMaintenanceHistoryDto,
} from '@/types/models'

interface Props {
  mode?: 'create' | 'edit'
  maintenanceHistory?: MaintenanceHistory | null
  deviceId: string
  onSaved?: () => void
  compact?: boolean
  trigger?: React.ReactNode
}

const buildInitialForm = (deviceId: string) => ({
  deviceId,
  maintenanceDate: new Date().toISOString().split('T')[0],
  description: '',
  staffName: '',
  attachmentUrls: [] as string[],
  satisfactionScore: 5,
  customerFeedback: '',
})

export function MaintenanceHistoryFormModal({
  mode = 'create',
  maintenanceHistory = null,
  deviceId,
  onSaved,
  compact = false,
  trigger,
}: Props) {
  const { t } = useLocale()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState(() => buildInitialForm(deviceId))

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && maintenanceHistory) {
        setFormData({
          deviceId: maintenanceHistory.deviceId,
          maintenanceDate: maintenanceHistory.maintenanceDate
            ? new Date(maintenanceHistory.maintenanceDate).toISOString().split('T')[0]
            : '',
          description: maintenanceHistory.description,
          staffName: maintenanceHistory.staffName,
          attachmentUrls: maintenanceHistory.attachmentUrls,
          satisfactionScore: maintenanceHistory.satisfactionScore,
          customerFeedback: maintenanceHistory.customerFeedback || '',
        })
      } else {
        setFormData(buildInitialForm(deviceId))
      }
    }
  }, [open, mode, maintenanceHistory, deviceId])

  const createMutation = useMutation({
    mutationFn: (data: CreateMaintenanceHistoryDto) =>
      maintenanceHistoriesService.createByDeviceId(deviceId, data),
    onSuccess: () => {
      toast.success(t('maintenance_history.create_success'))
      queryClient.invalidateQueries({ queryKey: ['maintenance-histories', deviceId] })
      setOpen(false)
      onSaved?.()
    },
    onError: () => {
      toast.error(t('maintenance_history.create_error'))
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMaintenanceHistoryDto }) =>
      maintenanceHistoriesService.update(id, data),
    onSuccess: () => {
      toast.success(t('maintenance_history.update_success'))
      queryClient.invalidateQueries({ queryKey: ['maintenance-histories', deviceId] })
      setOpen(false)
      onSaved?.()
    },
    onError: () => {
      toast.error(t('maintenance_history.update_error'))
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const submitData = {
        deviceId,
        maintenanceDate: formData.maintenanceDate
          ? new Date(formData.maintenanceDate).toISOString()
          : new Date().toISOString(),
        description: formData.description.trim(),
        staffName: formData.staffName.trim(),
        attachmentUrls: formData.attachmentUrls,
        satisfactionScore: formData.satisfactionScore,
        customerFeedback: formData.customerFeedback.trim() || undefined,
      }

      if (mode === 'create') {
        await createMutation.mutateAsync(submitData)
      } else if (maintenanceHistory) {
        await updateMutation.mutateAsync({
          id: maintenanceHistory.id,
          data: submitData,
        })
      }
    } catch {
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      // For now, just simulate file upload. In real implementation, upload to server first
      const urls = Array.from(files).map((file) => `/public/uploads/images/${file.name}`)
      setFormData((prev) => ({
        ...prev,
        attachmentUrls: [...prev.attachmentUrls, ...urls],
      }))
    }
  }

  const removeAttachment = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      attachmentUrls: prev.attachmentUrls.filter((_, i) => i !== index),
    }))
  }

  const renderStars = (score: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < score ? 'fill-current text-yellow-400' : 'text-gray-300'}`}
      />
    ))
  }

  const isSubmitting = submitting || createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant={mode === 'create' ? 'default' : 'outline'}
            size={compact ? 'icon' : 'default'}
          >
            {compact ? (
              mode === 'create' ? (
                <Plus className="h-4 w-4" />
              ) : (
                <Edit className="h-4 w-4" />
              )
            ) : (
              <>
                {mode === 'create' ? (
                  <Plus className="mr-2 h-4 w-4" />
                ) : (
                  <Edit className="mr-2 h-4 w-4" />
                )}
                {mode === 'create' ? t('button.create') : t('button.edit')}
              </>
            )}
          </Button>
        )}
      </DialogTrigger>

      <SystemModalLayout
        title={
          mode === 'create'
            ? t('maintenance_history.create_title')
            : t('maintenance_history.edit_title')
        }
        variant={mode === 'create' ? 'create' : 'edit'}
        className="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Maintenance Date */}
            <div className="space-y-2">
              <Label htmlFor="maintenanceDate">
                {t('maintenance_history.date')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="maintenanceDate"
                type="date"
                value={formData.maintenanceDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, maintenanceDate: e.target.value }))
                }
                required
              />
            </div>

            {/* Staff Name */}
            <div className="space-y-2">
              <Label htmlFor="staffName">
                {t('maintenance_history.staff_name')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="staffName"
                value={formData.staffName}
                onChange={(e) => setFormData((prev) => ({ ...prev, staffName: e.target.value }))}
                placeholder={t('placeholder.enter_staff_name')}
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              {t('maintenance_history.description')} <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder={t('placeholder.enter_description')}
              rows={3}
              required
            />
          </div>

          {/* Satisfaction Score */}
          <div className="space-y-2">
            <Label>
              {t('maintenance_history.satisfaction_score')} <span className="text-red-500">*</span>
            </Label>
            <Select
              value={String(formData.satisfactionScore)}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, satisfactionScore: Number(value) }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 4, 3, 2, 1].map((score) => (
                  <SelectItem key={score} value={String(score)}>
                    <div className="flex items-center gap-2">
                      <div className="flex">{renderStars(score)}</div>
                      <span>{t(`maintenance_history.satisfaction_score_${score}`)}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Customer Feedback */}
          <div className="space-y-2">
            <Label htmlFor="customerFeedback">{t('maintenance_history.customer_feedback')}</Label>
            <Textarea
              id="customerFeedback"
              value={formData.customerFeedback}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, customerFeedback: e.target.value }))
              }
              placeholder={t('placeholder.optional')}
              rows={2}
            />
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <Label>{t('maintenance_history.attachments')}</Label>
            <div className="space-y-2">
              <Input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <Label htmlFor="file-upload" className="cursor-pointer">
                <div className="hover:bg-muted/50 flex items-center gap-2 rounded-lg border border-dashed p-3">
                  <Upload className="h-4 w-4" />
                  <span>{t('button.upload_images')}</span>
                </div>
              </Label>

              {formData.attachmentUrls.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {t('maintenance_history.view_attachments')}:
                  </Label>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                    {formData.attachmentUrls.map((url, index) => (
                      <div key={index} className="group relative overflow-hidden rounded border">
                        <Image
                          src={url}
                          alt={`Attachment ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 z-10 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={() => removeAttachment(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t pt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t('button.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? t('button.create') : t('button.save')}
            </Button>
          </div>
        </form>
      </SystemModalLayout>
    </Dialog>
  )
}

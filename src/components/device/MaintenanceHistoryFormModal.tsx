'use client'

import { useEffect, useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Plus, Edit, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { useLocale } from '@/components/providers/LocaleProvider'
import { maintenanceHistoriesClientService } from '@/lib/api/services/maintenance-histories-client.service'
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
  attachmentFiles: [] as File[],
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
  const attachmentFilesRef = useRef<File[]>([])

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && maintenanceHistory) {
        // For edit mode, we don't have files, only URLs. Files are only for new uploads.
        const newFiles: File[] = []
        setFormData({
          deviceId: maintenanceHistory.deviceId,
          maintenanceDate: maintenanceHistory.maintenanceDate
            ? new Date(maintenanceHistory.maintenanceDate).toISOString().split('T')[0]
            : '',
          description: maintenanceHistory.description,
          staffName: maintenanceHistory.staffName,
          attachmentFiles: newFiles,
        })
        attachmentFilesRef.current = newFiles
      } else {
        const newFiles = buildInitialForm(deviceId).attachmentFiles
        setFormData(buildInitialForm(deviceId))
        attachmentFilesRef.current = newFiles
      }
    }
  }, [open, mode, maintenanceHistory, deviceId])

  const createMutation = useMutation({
    mutationFn: (data: CreateMaintenanceHistoryDto | FormData) =>
      maintenanceHistoriesClientService.createByDeviceId(deviceId, data),
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
    mutationFn: ({ id, data }: { id: string; data: UpdateMaintenanceHistoryDto | FormData }) =>
      maintenanceHistoriesClientService.update(id, data),
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
      // Create FormData for multipart upload
      const formDataToSend = new FormData()

      // Add basic fields
      formDataToSend.append('deviceId', deviceId)
      formDataToSend.append(
        'maintenanceDate',
        formData.maintenanceDate
          ? new Date(formData.maintenanceDate).toISOString()
          : new Date().toISOString()
      )
      formDataToSend.append('description', formData.description.trim())
      formDataToSend.append('staffName', formData.staffName.trim())

      // Add files with field name 'images'
      formData.attachmentFiles.forEach((file) => {
        formDataToSend.append('images', file)
      })

      if (mode === 'create') {
        await createMutation.mutateAsync(formDataToSend)
      } else if (maintenanceHistory) {
        await updateMutation.mutateAsync({
          id: maintenanceHistory.id,
          data: formDataToSend,
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
      const newFiles = Array.from(files)

      setFormData((prev) => {
        const updatedFiles = [...prev.attachmentFiles, ...newFiles]
        attachmentFilesRef.current = updatedFiles
        return {
          ...prev,
          attachmentFiles: updatedFiles,
        }
      })
    }
  }

  const removeAttachment = (index: number) => {
    setFormData((prev) => {
      const newFiles = prev.attachmentFiles.filter((_, i) => i !== index)
      attachmentFilesRef.current = newFiles
      return {
        ...prev,
        attachmentFiles: newFiles,
      }
    })
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
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 md:space-y-6">
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

              {formData.attachmentFiles.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {t('maintenance_history.view_attachments')}:
                  </Label>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                    {formData.attachmentFiles.map((file, index) => {
                      const previewUrl = URL.createObjectURL(file)
                      return (
                        <div key={index} className="group relative overflow-hidden rounded border">
                          <Image
                            src={previewUrl}
                            alt={`Attachment ${index + 1}`}
                            width={96}
                            height={96}
                            className="h-24 w-full object-cover"
                            unoptimized
                            onLoad={() => URL.revokeObjectURL(previewUrl)}
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
                      )
                    })}
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

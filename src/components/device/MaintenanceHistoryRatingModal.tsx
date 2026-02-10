'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Star, Edit } from 'lucide-react'
import { toast } from 'sonner'
import { useLocale } from '@/components/providers/LocaleProvider'
import { maintenanceHistoriesClientService } from '@/lib/api/services/maintenance-histories-client.service'
import type { MaintenanceHistory, RateMaintenanceHistoryDto } from '@/types/models'

interface Props {
  maintenanceHistory: MaintenanceHistory | null
  onRated?: () => void
  compact?: boolean
  trigger?: React.ReactNode
}

export function MaintenanceHistoryRatingModal({
  maintenanceHistory,
  onRated,
  compact = false,
  trigger,
}: Props) {
  const { t } = useLocale()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState<RateMaintenanceHistoryDto>({
    satisfactionScore: 5,
    customerFeedback: '',
  })

  // Reset form when modal opens
  useEffect(() => {
    if (open && maintenanceHistory) {
      setFormData({
        satisfactionScore: maintenanceHistory.satisfactionScore || 5,
        customerFeedback: maintenanceHistory.customerFeedback || '',
      })
    }
  }, [open, maintenanceHistory])

  const rateMutation = useMutation({
    mutationFn: (data: RateMaintenanceHistoryDto) =>
      maintenanceHistoriesClientService.rate(maintenanceHistory!.id, data),
    onSuccess: () => {
      toast.success(t('maintenance_history.rating_success'))
      queryClient.invalidateQueries({ queryKey: ['maintenance-histories'] })
      setOpen(false)
      onRated?.()
    },
    onError: () => {
      toast.error(t('maintenance_history.rating_error'))
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!maintenanceHistory) return

    setSubmitting(true)

    try {
      await rateMutation.mutateAsync({
        satisfactionScore: formData.satisfactionScore,
        customerFeedback: formData.customerFeedback?.trim() || undefined,
      })
    } catch {
      // Error handled by mutation
    } finally {
      setSubmitting(false)
    }
  }

  const renderStars = (score: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-6 w-6 cursor-pointer transition-colors ${
          i < score ? 'fill-current text-yellow-400' : 'text-gray-300 hover:text-yellow-200'
        }`}
        onClick={() => setFormData((prev) => ({ ...prev, satisfactionScore: i + 1 }))}
      />
    ))
  }

  const isSubmitting = submitting || rateMutation.isPending

  if (!maintenanceHistory) return null

  const hasBeenRated = maintenanceHistory.satisfactionScore > 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant={hasBeenRated ? 'outline' : 'default'}
            size={compact ? 'icon' : 'default'}
          >
            {compact ? (
              <Edit className="h-4 w-4" />
            ) : (
              <>
                <Star className="mr-2 h-4 w-4" />
                {hasBeenRated
                  ? t('maintenance_history.edit_rating')
                  : t('maintenance_history.rate')}
              </>
            )}
          </Button>
        )}
      </DialogTrigger>

      <SystemModalLayout
        title={
          hasBeenRated
            ? t('maintenance_history.edit_rating_title')
            : t('maintenance_history.rating_title')
        }
        variant="edit"
        className="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 md:space-y-6">
          {/* Current rating info */}
          <div className="rounded-lg bg-gray-50 p-4">
            <h4 className="font-medium text-gray-900">
              {t('maintenance_history.maintenance_info')}
            </h4>
            <p className="mt-1 text-sm text-gray-600">
              {t('maintenance_history.date')}:{' '}
              {new Date(maintenanceHistory.maintenanceDate).toLocaleDateString()}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              {t('maintenance_history.staff_name')}: {maintenanceHistory.staffName}
            </p>
            <p className="mt-1 line-clamp-2 text-sm text-gray-600">
              {t('maintenance_history.description')}: {maintenanceHistory.description}
            </p>
          </div>

          {/* Satisfaction Score */}
          <div className="space-y-3">
            <Label className="text-base font-medium">
              {t('maintenance_history.satisfaction_score')} <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">{renderStars(formData.satisfactionScore)}</div>
              <span className="ml-2 text-sm text-gray-600">
                {t(`maintenance_history.satisfaction_score_${formData.satisfactionScore}`)}
              </span>
            </div>
            <p className="text-sm text-gray-500">{t('maintenance_history.rating_help')}</p>
          </div>

          {/* Customer Feedback */}
          <div className="space-y-2">
            <Label htmlFor="customerFeedback" className="text-base font-medium">
              {t('maintenance_history.customer_feedback')}
            </Label>
            <Textarea
              id="customerFeedback"
              value={formData.customerFeedback}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, customerFeedback: e.target.value }))
              }
              placeholder={t('maintenance_history.feedback_placeholder')}
              rows={3}
              className="resize-none"
            />
            <p className="text-sm text-gray-500">{t('maintenance_history.feedback_help')}</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t pt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t('button.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {hasBeenRated
                ? t('maintenance_history.update_rating')
                : t('maintenance_history.submit_rating')}
            </Button>
          </div>
        </form>
      </SystemModalLayout>
    </Dialog>
  )
}

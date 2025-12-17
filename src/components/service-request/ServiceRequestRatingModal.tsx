'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Star } from 'lucide-react'
import { toast } from 'sonner'
import { useLocale } from '@/components/providers/LocaleProvider'
import { serviceRequestsClientService } from '@/lib/api/services/service-requests-client.service'
import type { ServiceRequest, RateServiceRequestDto } from '@/types/models'
import { ServiceRequestStatus } from '@/constants/status'

interface Props {
  serviceRequest: ServiceRequest | null
  onRated?: () => void
  compact?: boolean
  trigger?: React.ReactNode
}

export function ServiceRequestRatingModal({
  serviceRequest,
  onRated,
  compact = false,
  trigger,
}: Props) {
  const { t } = useLocale()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState<RateServiceRequestDto>({
    satisfactionScore: 5,
    customerFeedback: '',
  })

  // Reset form when modal opens
  useEffect(() => {
    if (open && serviceRequest) {
      setFormData({
        satisfactionScore: serviceRequest.satisfactionScore || 5,
        customerFeedback: serviceRequest.customerFeedback || '',
      })
    }
  }, [open, serviceRequest])

  const rateMutation = useMutation({
    mutationFn: (data: RateServiceRequestDto) =>
      serviceRequestsClientService.updateRating(serviceRequest!.id, data),
    onSuccess: () => {
      toast.success(t('requests.service.rating.success'))
      queryClient.invalidateQueries({ queryKey: ['service-requests'] })
      setOpen(false)
      onRated?.()
    },
    onError: () => {
      toast.error(t('requests.service.rating.error'))
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!serviceRequest) return

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

  if (!serviceRequest) return null

  // Only allow rating for RESOLVED or CLOSED requests
  const canRate =
    serviceRequest.status === ServiceRequestStatus.RESOLVED ||
    serviceRequest.status === ServiceRequestStatus.CLOSED

  if (!canRate) return null

  const hasBeenRated = (serviceRequest.satisfactionScore ?? 0) > 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant={hasBeenRated ? 'outline' : 'default'}
            size={compact ? 'icon' : 'default'}
          >
            {compact ? (
              <Star className="h-4 w-4" />
            ) : (
              <>
                <Star className="mr-2 h-4 w-4" />
                {hasBeenRated
                  ? t('requests.service.rating.edit')
                  : t('requests.service.rating.rate')}
              </>
            )}
          </Button>
        )}
      </DialogTrigger>

      <SystemModalLayout
        title={
          hasBeenRated
            ? t('requests.service.rating.edit_title')
            : t('requests.service.rating.title')
        }
        variant="edit"
        className="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Service Request Info */}
          <div className="rounded-lg bg-gray-50 p-4">
            <h4 className="font-medium text-gray-900">
              {t('requests.service.rating.request_info')}
            </h4>
            <p className="mt-1 text-sm text-gray-600">
              {t('requests.service.table.request_number')}:{' '}
              {serviceRequest.requestNumber || serviceRequest.id.slice(0, 8)}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              {t('requests.service.table.title')}: {serviceRequest.title}
            </p>
            {serviceRequest.assignedToName && (
              <p className="mt-1 text-sm text-gray-600">
                {t('requests.service.rating.assigned_to')}: {serviceRequest.assignedToName}
              </p>
            )}
            <p className="mt-1 line-clamp-2 text-sm text-gray-600">
              {t('requests.service.table.description')}: {serviceRequest.description}
            </p>
          </div>

          {/* Satisfaction Score */}
          <div className="space-y-3">
            <Label className="text-base font-medium">
              {t('requests.service.rating.satisfaction_score')}{' '}
              <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">{renderStars(formData.satisfactionScore)}</div>
              <span className="ml-2 text-sm text-gray-600">
                {t(`requests.service.rating.score_${formData.satisfactionScore}`)}
              </span>
            </div>
            <p className="text-sm text-gray-500">{t('requests.service.rating.help')}</p>
          </div>

          {/* Customer Feedback */}
          <div className="space-y-2">
            <Label htmlFor="customerFeedback" className="text-base font-medium">
              {t('requests.service.rating.customer_feedback')}
            </Label>
            <Textarea
              id="customerFeedback"
              value={formData.customerFeedback}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, customerFeedback: e.target.value }))
              }
              placeholder={t('requests.service.rating.feedback_placeholder')}
              rows={3}
              className="resize-none"
            />
            <p className="text-sm text-gray-500">{t('requests.service.rating.feedback_help')}</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t pt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t('button.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {hasBeenRated
                ? t('requests.service.rating.update')
                : t('requests.service.rating.submit')}
            </Button>
          </div>
        </form>
      </SystemModalLayout>
    </Dialog>
  )
}

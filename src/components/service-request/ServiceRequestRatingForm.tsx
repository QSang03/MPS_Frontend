'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocale } from '@/components/providers/LocaleProvider'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Star, Loader2 } from 'lucide-react'
import { serviceRequestsClientService } from '@/lib/api/services/service-requests-client.service'
import type { RateServiceRequestDto } from '@/types/models'

interface ServiceRequestRatingFormProps {
  serviceRequestId: string
  onRated?: () => void
}

export function ServiceRequestRatingForm({
  serviceRequestId,
  onRated,
}: ServiceRequestRatingFormProps) {
  const { t } = useLocale()
  const queryClient = useQueryClient()
  const [rating, setRating] = useState<number>(0)
  const [feedback, setFeedback] = useState('')
  const [hoveredRating, setHoveredRating] = useState<number>(0)

  const ratingMutation = useMutation({
    mutationFn: (payload: RateServiceRequestDto) =>
      serviceRequestsClientService.updateRating(serviceRequestId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests', 'detail', serviceRequestId] })
      toast.success(t('requests.service.rating.success'))
      onRated?.()
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : t('requests.service.rating.error')
      toast.error(message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      toast.error(t('requests.service.rating.please_select_rating'))
      return
    }

    const payload: RateServiceRequestDto = {
      satisfactionScore: rating,
      customerFeedback: feedback.trim() || undefined,
    }

    ratingMutation.mutate(payload)
  }

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => {
      const starValue = i + 1
      const isActive = starValue <= (hoveredRating || rating)

      return (
        <button
          key={i}
          type="button"
          className="p-1 transition-transform hover:scale-110"
          onMouseEnter={() => setHoveredRating(starValue)}
          onMouseLeave={() => setHoveredRating(0)}
          onClick={() => setRating(starValue)}
        >
          <Star
            className={`h-8 w-8 ${
              isActive ? 'fill-current text-yellow-400' : 'text-gray-300 hover:text-yellow-300'
            }`}
          />
        </button>
      )
    })
  }

  const getRatingLabel = (score: number) => {
    if (score === 0) return t('requests.service.rating.select_rating')
    return t(`requests.service.rating.score_${score}`)
  }

  return (
    <Card className="border-2 border-dashed border-[var(--brand-200)] bg-[var(--brand-50)] dark:border-[var(--brand-800)] dark:bg-[var(--brand-950)]">
      <CardHeader className="pb-4 text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-lg">
          <Star className="h-5 w-5 text-yellow-500" />
          {t('requests.service.rating.title')}
        </CardTitle>
        <CardDescription>{t('requests.service.rating.description')}</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 md:space-y-6">
          {/* Star Rating */}
          <div className="space-y-3">
            <Label className="text-base font-medium">
              {t('requests.service.rating.satisfaction_score')}{' '}
              <span className="text-red-500">*</span>
            </Label>
            <div className="flex justify-center gap-1">{renderStars()}</div>
            <div className="text-muted-foreground text-center text-sm">
              {getRatingLabel(hoveredRating || rating)}
            </div>
          </div>

          {/* Feedback */}
          <div className="space-y-2">
            <Label htmlFor="feedback">{t('requests.service.rating.customer_feedback')}</Label>
            <Textarea
              id="feedback"
              placeholder={t('requests.service.rating.feedback_placeholder')}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              maxLength={1000}
              className="resize-none"
            />
            <div className="text-muted-foreground text-right text-xs">{feedback.length}/1000</div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-4">
            <Button
              type="submit"
              size="lg"
              disabled={rating === 0 || ratingMutation.isPending}
              className="min-w-[200px]"
            >
              {ratingMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('button.processing')}
                </>
              ) : (
                <>
                  <Star className="mr-2 h-4 w-4" />
                  {t('requests.service.rating.submit')}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

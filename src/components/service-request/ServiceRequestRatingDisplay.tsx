'use client'

import { useLocale } from '@/components/providers/LocaleProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface ServiceRequestRatingDisplayProps {
  satisfactionScore: number
  customerFeedback?: string
}

export function ServiceRequestRatingDisplay({
  satisfactionScore,
  customerFeedback,
}: ServiceRequestRatingDisplayProps) {
  const { t } = useLocale()

  const renderStars = (score: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn('h-5 w-5', i < score ? 'fill-current text-yellow-400' : 'text-gray-300')}
      />
    ))
  }

  const getRatingLabel = (score: number) => {
    return t(`requests.service.rating.score_${score}`)
  }

  const getRatingColor = (score: number) => {
    if (score >= 4) return 'bg-green-50 text-green-700 border-green-200'
    if (score >= 3) return 'bg-yellow-50 text-yellow-700 border-yellow-200'
    return 'bg-red-50 text-red-700 border-red-200'
  }

  return (
    <Card className="border-green-200 bg-gradient-to-r from-green-50 to-blue-50 dark:border-green-800 dark:from-green-950 dark:to-blue-950">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-medium text-green-700 dark:text-green-300">
            <Star className="h-4 w-4" />
            {t('requests.service.rating.title')}
          </CardTitle>
          <Badge
            variant="outline"
            className={cn('border font-medium', getRatingColor(satisfactionScore))}
          >
            {satisfactionScore}/5
          </Badge>
        </div>
        <CardDescription className="text-green-600 dark:text-green-400">
          {t('requests.service.rating.thank_you')}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Rating Stars */}
        <div className="flex items-center gap-3">
          <div className="flex gap-1">{renderStars(satisfactionScore)}</div>
          <span className="text-sm font-medium text-green-700 dark:text-green-300">
            {getRatingLabel(satisfactionScore)}
          </span>
        </div>

        {/* Customer Feedback */}
        {customerFeedback && (
          <div className="space-y-2">
            <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
              <MessageSquare className="h-4 w-4" />
              {t('requests.service.rating.your_feedback')}
            </div>
            <div className="rounded-lg bg-white/50 p-3 text-sm leading-relaxed dark:bg-black/20">
              {customerFeedback}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
